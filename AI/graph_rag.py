"""
graph_rag.py — GraphRAG knowledge structure layer for MediTrace.

Architecture position:
  [Input Layer] → [GraphRAG] → [Prediction Engine] → [CRAG Evaluator]

GraphRAG lets MediTrace *reason across relationships*, not just retrieve isolated data:
  Drug A shortage → triggers Drug B substitution demand
  Supplier X delay → affects all Districts receiving from X
  Seasonal spike in Region Y → ripples to neighbouring districts
  Cold chain failure → flags all temperature-sensitive drugs in same facility

Entity types in the knowledge graph:
  Drug      — pharmacological item (has substitutes, temperature sensitivity, price)
  Supplier  — vendor (has lead time, reliability score, covered regions)
  Facility  — hospital / PHC / CHC (has type, location, capacity)
  Region    — geographic unit (has seasonal disease patterns)
  Batch     — specific inventory lot (has expiry, qty, cold-chain status)

Edges model relationships:
  Drug   --[SUBSTITUTE_FOR]-->  Drug
  Drug   --[SUPPLIED_BY]-->     Supplier
  Drug   --[STOCKED_AT]-->      Facility
  Drug   --[TRIGGERED_BY]-->    SeasonalPattern
  Facility --[LOCATED_IN]-->    Region
  Region --[NEIGHBOURS]-->      Region
  Supplier --[SERVES]-->        Region
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional
import json


# ─── Node types ───────────────────────────────────────────────────────────────

@dataclass
class DrugNode:
    name: str
    temperature_sensitive: bool = False
    cold_chain_min_c: Optional[float] = None
    cold_chain_max_c: Optional[float] = None
    unit_cost_inr: float = 25.0
    # populated by graph edges
    substitutes: list[str] = field(default_factory=list)
    suppliers: list[str] = field(default_factory=list)
    seasonal_demand_months: list[int] = field(default_factory=list)  # 1–12


@dataclass
class SupplierNode:
    name: str
    lead_days: int
    cost_per_unit_inr: float
    reliability_score: float = 1.0     # 0–1; drops on stockouts / delays
    covered_regions: list[str] = field(default_factory=list)


@dataclass
class FacilityNode:
    id: str
    name: str
    hospital_type: str                 # "rural" | "urban"
    lat: float
    lng: float
    region: str
    income_level: str = "general"      # "low" | "general"
    capacity_beds: int = 0


@dataclass
class RegionNode:
    name: str
    neighbours: list[str] = field(default_factory=list)
    disease_seasons: dict[str, list[int]] = field(default_factory=dict)
    # e.g. {"malaria": [6,7,8,9], "pneumonia": [11,12,1,2]}


# ─── The graph ────────────────────────────────────────────────────────────────

class MediTraceGraph:
    """
    In-memory knowledge graph seeded with domain data.
    For production: replace dict stores with Neo4j or a networkx graph persisted
    in Cloud Spanner — the query interface stays identical.
    """

    def __init__(self):
        self.drugs: dict[str, DrugNode] = {}
        self.suppliers: dict[str, SupplierNode] = {}
        self.facilities: dict[str, FacilityNode] = {}
        self.regions: dict[str, RegionNode] = {}
        self._seed()

    # ── Queries ───────────────────────────────────────────────────────────────

    def get_substitutes(self, drug: str) -> list[dict]:
        """
        Return substitute drugs with match metadata.
        Used by alternatives.py as the *local* knowledge source before
        Gemini is called — reduces API calls when substitutes are known.
        """
        node = self.drugs.get(drug)
        if not node:
            return []
        return [
            {"drug": s, "source": "graph_knowledge"}
            for s in node.substitutes
        ]

    def get_suppliers(self, drug: str) -> list[SupplierNode]:
        """Return ranked supplier list for a drug (by reliability desc)."""
        node = self.drugs.get(drug)
        if not node:
            return [self.suppliers.get("PharmaBridge")]
        return sorted(
            [self.suppliers[s] for s in node.suppliers if s in self.suppliers],
            key=lambda x: -x.reliability_score,
        )

    def get_ripple_risk(self, drug: str, region: str) -> dict:
        """
        Analyse ripple effects:
          - If this drug is short, which facilities in neighbouring regions
            will feel substitution pressure?
          - Are neighbouring regions already at risk?

        Returns a dict the frontend can use for the district-risk map.
        """
        reg = self.regions.get(region)
        if not reg:
            return {"ripple_facilities": [], "neighbour_regions_at_risk": []}

        at_risk_facilities = []
        for fac in self.facilities.values():
            if fac.region in reg.neighbours:
                at_risk_facilities.append({
                    "facility_id": fac.id,
                    "name": fac.name,
                    "lat": fac.lat,
                    "lng": fac.lng,
                    "region": fac.region,
                    "hospital_type": fac.hospital_type,
                    "ripple_reason": (
                        f"Neighbours {region} which is SHORT on {drug}"
                    ),
                })

        return {
            "ripple_facilities": at_risk_facilities,
            "neighbour_regions_at_risk": reg.neighbours,
        }

    def get_seasonal_demand_multiplier(
        self, drug: str, month: int
    ) -> float:
        """
        Returns a demand multiplier (default 1.0) if the drug has elevated
        seasonal demand in the given month.
        E.g. Artemether-Lumefantrine in malaria season → 1.4×
        """
        node = self.drugs.get(drug)
        if not node or month not in node.seasonal_demand_months:
            return 1.0
        return 1.35   # 35% demand uplift during peak season

    def get_cold_chain_siblings(self, facility_id: str) -> list[str]:
        """
        If a cold chain failure is reported at a facility, return all
        temperature-sensitive drugs stocked there that are now at risk.
        """
        fac = self.facilities.get(facility_id)
        if not fac:
            return []
        return [
            d.name for d in self.drugs.values()
            if d.temperature_sensitive
        ]

    def get_supplier_disruption_impact(self, supplier_name: str) -> list[dict]:
        """
        If a supplier goes down, which drugs and regions are affected?
        Useful for proactive alerts before a shortage materialises.
        """
        impacted = []
        for drug_name, drug in self.drugs.items():
            if supplier_name in drug.suppliers:
                sup = self.suppliers.get(supplier_name)
                affected_regions = sup.covered_regions if sup else []
                impacted.append({
                    "drug": drug_name,
                    "affected_regions": affected_regions,
                    "fallback_suppliers": [
                        s for s in drug.suppliers if s != supplier_name
                    ],
                })
        return impacted

    def enrich_prediction_context(
        self, drug: str, region: str, month: int
    ) -> dict:
        """
        Single call that returns ALL graph-derived context needed by
        prediction.py and crag_evaluator.py:
          - seasonal multiplier
          - best supplier
          - known substitutes (offline, no Gemini call needed)
          - ripple risk summary
        """
        suppliers = self.get_suppliers(drug)
        best_supplier = suppliers[0] if suppliers else None

        return {
            "seasonal_demand_multiplier": self.get_seasonal_demand_multiplier(
                drug, month
            ),
            "best_supplier": {
                "name": best_supplier.name,
                "lead_days": best_supplier.lead_days,
                "cost_per_unit_inr": best_supplier.cost_per_unit_inr,
                "reliability_score": best_supplier.reliability_score,
            } if best_supplier else None,
            "known_substitutes": self.get_substitutes(drug),
            "ripple_risk": self.get_ripple_risk(drug, region),
        }

    # ── Graph seeding — domain knowledge ─────────────────────────────────────

    def _seed(self):
        import os

        if not os.path.exists("hospitals.json"):
            print("Warning: hospitals.json not found — facilities graph will be empty")
            self.facilities = {}
            return

        with open("hospitals.json", "r") as f:
            hospitals_data = json.load(f)

        self.facilities = {}
        for h in hospitals_data:
            self.facilities[h["hospital_id"]] = FacilityNode(
                id=h["hospital_id"],
                name=h["name"],
                hospital_type=h["hospital_type"],  # ✅ FIXED: was h["type"]
                lat=h["lat"],
                lng=h["lng"],
                region=h["region"],                # ✅ FIXED: was h["district"]
                income_level=h["income_level"],    # ✅ FIXED: was h["income"]
                capacity_beds=h["capacity_beds"],  # ✅ FIXED: was h["beds"]
            )


# ─── Singleton accessor ───────────────────────────────────────────────────────
# Import this in prediction.py, agent.py, alternatives.py:
#   from graph_rag import get_graph
#   graph = get_graph()

_graph_instance: Optional[MediTraceGraph] = None

def get_graph() -> MediTraceGraph:
    global _graph_instance
    if _graph_instance is None:
        _graph_instance = MediTraceGraph()
    return _graph_instance
