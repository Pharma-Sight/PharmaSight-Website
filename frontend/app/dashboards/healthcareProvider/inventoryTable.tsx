"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Search, 
  AlertCircle, 
  Loader2, 
  ShoppingCart, 
  Info, 
  History, 
  Package, 
  ThermometerSnowflake, 
  X 
} from "lucide-react";
import { Badge } from "@/components/ui/badge"; // Using UI component, not Lucide icon [cite: 157]
import { apiRequest } from '@/lib/api';

interface Supplier {
  _id: string;
  name: string;
}

// --- Types ---
type Batch = {
  batch_no: string;
  expiry_date: string;
  qty: string | number;
};

interface Drug {
  _id?: string;
  id?: string;
  name?: string;
  drug?: string;
  stock?: number;
  counted_stock?: number;
  usageHistory?: number[];
  daily_usage?: number[];
  hospitalType?: 'rural' | 'urban';
  hospital_type?: 'rural' | 'urban';
  coldChainIntact?: boolean;
  cold_chain_intact?: boolean;
  region?: string;
  batches: Batch[];
}

interface Prediction {
  drugId: any;
  days_left: number;
  risk_level: 'HIGH' | 'MEDIUM' | 'LOW';
  confidence_score: number;
}

export const InventoryTable = ({ 
  drugs: initialDrugs = [], 
  predictions: initialPredictions = [], 
  handleApprove 
}: { 
  drugs: Drug[], 
  predictions: Prediction[], 
  handleApprove: (name: string) => void 
}) => {
  const [liveDrugs, setLiveDrugs] = useState<Drug[]>(initialDrugs);
  const [livePredictions, setLivePredictions] = useState<Prediction[]>(initialPredictions);
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("ALL");
  const [isLoading, setIsLoading] = useState(false);
  
  // Modal States
  const [selectedDrug, setSelectedDrug] = useState<Drug | null>(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [orderQuantity, setOrderQuantity] = useState("");
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState("");


  useEffect(() => {
    const fetchInventory = async () => {
      if (initialDrugs.length > 0) return;
      setIsLoading(true);
      try {
        const response = await apiRequest("/api/drugs", "GET");
        const drugData = Array.isArray(response) ? response : response.data || [];
        setLiveDrugs(drugData);
      } catch (error) {
        console.error("Critical: Inventory fetch failed", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInventory();
  }, [initialDrugs]);

  // Fetch verified suppliers when modal opens
useEffect(() => {
  if (isOrderModalOpen) {
    const fetchSuppliers = async () => {
      try {
        // Since apiRequest usually parses JSON, 'response' is the actual array 
        const response = await apiRequest("/api/organizations/suppliers", "GET");
        
        // Fix: Check if response is the array itself 
        const supplierData = Array.isArray(response) ? response : response.data || [];
        setSuppliers(supplierData);
      } catch (error) {
        console.error("Failed to fetch suppliers", error);
        setSuppliers([]); // Reset on error to prevent mapping undefined
      }
    };
    fetchSuppliers();
  }
}, [isOrderModalOpen]);

  const filteredData = liveDrugs.filter((item) => {
    const name = item.name || item.drug || "";
    const matchesSearch = name.toLowerCase().includes(search.toLowerCase());
    const drugId = item._id || item.id;
    const pred = livePredictions.find((p) => 
      (typeof p.drugId === 'string' ? p.drugId === drugId : p.drugId?._id === drugId)
    );
    const risk = pred?.risk_level || "LOW";
    return riskFilter === "ALL" ? matchesSearch : matchesSearch && risk === riskFilter;
  });

const handlePlaceOrder = async () => {
  if (!selectedDrug || !orderQuantity || !selectedSupplierId) return;

  try {
    const orderData = {
      drugName: selectedDrug.name || selectedDrug.drug,
      quantity: Number(orderQuantity),
      supplierId: selectedSupplierId, // This ID routes the order to the specific supplier
    };

    await apiRequest("/api/orders", "POST", orderData);
    setIsOrderModalOpen(false);
    // Add success notification/toast here
  } catch (error) {
    console.error("Order placement failed", error);
  }
};

  return (
    <div className="space-y-4">
      {/* Header & Search */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Inventory Intelligence</h2>
          <p className="text-slate-500 text-sm">Real-time supply chain forecasting [cite: 123]</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search drug..."
              className="pl-9 pr-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-sm w-64 outline-none focus:ring-2 ring-blue-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      <Card className="overflow-hidden border-slate-200">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Drug Information</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Stock</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">AI Assessment</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredData.map((item) => {
              const name = item.name || item.drug || "Unknown";
              const stock = item.stock ?? item.counted_stock ?? 0;
              const drugId = item._id || item.id;
              const pred = livePredictions.find((p) => 
                (typeof p.drugId === 'string' ? p.drugId === drugId : p.drugId?._id === drugId)
              );
              const risk = pred?.risk_level || (stock < 50 ? "HIGH" : "LOW"); // Fallback logic [cite: 132]

              return (
                <tr key={drugId || name} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-900">{name}</div>
                    <div className="text-xs text-slate-500 uppercase tracking-wider">{item.hospitalType || "General"}</div>
                  </td>
                  <td className="px-6 py-4 font-medium">{stock} units</td>
                  <td className="px-6 py-4">
                    <Badge variant={risk === "HIGH" ? "destructive" : "secondary"}>
                      {risk} RISK
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSelectedDrug(item)}
                    >
                      <Info className="h-4 w-4 mr-1" />
                      Details
                    </Button>
                    {(risk === "HIGH" || risk === "MEDIUM") && (
                      <Button 
                        variant="default" 
                        size="sm" 
                        className="bg-blue-600 hover:bg-blue-700"
                        onClick={() => {
                          setSelectedDrug(item);
                          setIsOrderModalOpen(true);
                        }}
                      >
                        <ShoppingCart className="h-4 w-4 mr-1" />
                        Request Order
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      {/* --- DRUG DETAILS MODAL --- */}
      {selectedDrug && !isOrderModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-slate-900">{selectedDrug.name || selectedDrug.drug}</h3>
                <p className="text-sm text-slate-500">Inventory ID: {selectedDrug._id || "N/A"}</p>
              </div>
              <button onClick={() => setSelectedDrug(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>
            
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Vital Stats */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <div className="p-2 bg-blue-100 text-blue-600 rounded-md"><Package className="h-5 w-5" /></div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-bold">Current Stock</p>
                    <p className="text-lg font-semibold">{selectedDrug.stock ?? selectedDrug.counted_stock} Units</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <div className="p-2 bg-orange-100 text-orange-600 rounded-md"><History className="h-5 w-5" /></div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-bold">Average Usage</p>
                    <p className="text-lg font-semibold">
                      {((selectedDrug.usageHistory?.reduce((a, b) => a + b, 0) || 0) / (selectedDrug.usageHistory?.length || 1)).toFixed(1)} / day
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <div className="p-2 bg-emerald-100 text-emerald-600 rounded-md"><ThermometerSnowflake className="h-5 w-5" /></div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-bold">Storage Condition</p>
                    <p className="text-lg font-semibold">{selectedDrug.coldChainIntact ? "Cold Chain Required" : "Ambient"}</p>
                  </div>
                </div>
              </div>

              {/* Batch Info */}
              <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/50">
                <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" /> Active Batches
                </h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {selectedDrug.batches?.length > 0 ? selectedDrug.batches.map((batch, idx) => (
                    <div key={idx} className="flex justify-between text-sm p-2 bg-white border border-slate-200 rounded-md">
                      <span className="font-mono text-xs">{batch.batch_no}</span>
                      <span className="text-slate-500">{batch.qty} units</span>
                      <span className="text-red-500 font-medium">{new Date(batch.expiry_date).toLocaleDateString()}</span>
                    </div>
                  )) : (
                    <p className="text-xs text-slate-400 italic">No batch data available</p>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setSelectedDrug(null)}>Close</Button>
              <Button onClick={() => setIsOrderModalOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                Order Restock
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Request Order Modal */}
      {isOrderModalOpen && selectedDrug && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-6 bg-white animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold mb-4">Request New Order</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Drug</label>
                <div className="p-2 bg-slate-100 rounded-md font-medium">
                  {selectedDrug.name || selectedDrug.drug}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Quantity Required</label>
                <input 
                  type="number" 
                  className="w-full p-2 border border-slate-200 rounded-md mt-1 outline-none focus:ring-2 ring-blue-500"
                  placeholder="Enter amount..."
                  value={orderQuantity}
                  onChange={(e) => setOrderQuantity(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Select Verified Supplier</label>
                <select 
                  className="w-full p-2 border border-slate-200 rounded-md mt-1 outline-none focus:ring-2 ring-blue-500"
                  value={selectedSupplierId}
                  onChange={(e) => setSelectedSupplierId(e.target.value)}
                >
                  <option value="">Select a supplier...</option>
                  {suppliers.map(s => (
                    <option key={s._id} value={s._id}>
                      {s.name}
                    </option>
                    ))}
                </select>
              </div>

              <div className="flex gap-2 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => setIsOrderModalOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white" 
                  disabled={!orderQuantity || !selectedSupplierId}
                  onClick={handlePlaceOrder}
                >
                  Place Request
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};