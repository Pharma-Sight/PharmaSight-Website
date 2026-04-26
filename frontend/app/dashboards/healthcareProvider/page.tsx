"use client";

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  AlertTriangle, ShoppingCart, 
  TrendingUp, ShieldCheck, Activity, Plus, Info, CheckCircle2, X, Loader2, Building2, MapPin
} from 'lucide-react';
import { apiRequest } from '@/lib/api'; 
import { InventoryTable } from './inventoryTable';
import { AddDrugModal } from './aiModal';
import { DashboardCharts } from './DashboardCharts';

import { OrdersSection } from './orders'; 
import Papa from 'papaparse';

// --- STAGE 1: FULLY TYPED INTERFACES ---
interface Drug {
  _id: string;
  name: string;
  stock: number;
  dailyUsage: number;
  usageHistory: number[];
  hospitalType: 'rural' | 'urban';
  organizationId: string;
  coldChainIntact: boolean;
  region?: string;
  batches: Batch[];
}

interface Prediction {
  drugId: Drug;
  days_left: number;  
  risk_level: 'HIGH' | 'MEDIUM' | 'LOW';
  confidence_score: number;
  procurement_suggestion?: {
    quantity: number;
    supplier: string;
  };
}

type Batch = {
  batch_no: string;
  expiry_date: string;
  qty: string;
};

// --- STAGE 2: ROBUST UI COMPONENTS ---
const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden ${className}`}>{children}</div>
);

const Badge = ({ children, className = "", variant = "default" }: { children: React.ReactNode; className?: string; variant?: "default" | "outline" }) => (
  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase ${variant === "outline" ? "border bg-transparent" : ""} ${className}`}>{children}</span>
);

const Button = ({ children, onClick, className = "", variant = "primary", disabled = false }: any) => (
  <button 
    onClick={onClick}
    disabled={disabled}
    className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
      variant === "primary" ? "bg-blue-600 text-white hover:bg-blue-700 shadow-md" : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
    } ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${className}`}
  >
    {children}
  </button>
);

// --- STAGE 4: MAIN DASHBOARD ---
export default function PharmaSightDashboard({ drugs = [], predictions = [] }: { drugs: Drug[], predictions: Prediction[] }) {
  const [liveDrugs, setLiveDrugs] = useState<Drug[]>([]);
  const [livePredictions, setLivePredictions] = useState<Prediction[]>([]);
  const [orders, setOrders] = useState<any[]>([]); // State for the Orders Section [cite: 217]
  const [search, setSearch] = useState<string>("");
  const [riskFilter, setRiskFilter] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{show: boolean, msg: string}>({ show: false, msg: "" });
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchInventory = async () => {
  const drugResponse = await apiRequest("/api/drugs", "GET");
  console.log(drugResponse);
  const drugData = Array.isArray(drugResponse)
    ? drugResponse
    : drugResponse.data || [];

  setLiveDrugs(drugData);
};

const fetchPredictions = async () => {
  const predResponse = await apiRequest("/api/predictions", "GET");
  console.log(predResponse);
  const predData = Array.isArray(predResponse)
    ? predResponse
    : predResponse.data || [];

  setLivePredictions(predData);
};

  // Fetch Inventory and Orders Data
  // useEffect(() => {
  //   const loadData = async () => {
  //     try {
  //       setLoading(true);
  //       // Fetch Drugs
  //       const drugResponse = await apiRequest("/api/drugs", "GET");
  //       const drugData = Array.isArray(drugResponse) ? drugResponse : drugResponse.data || [];
  //       setLiveDrugs(drugData);

  //       // Fetch Orders [cite: 217]
  //       const orderResponse = await apiRequest("/api/orders", "GET");
  //       setOrders(Array.isArray(orderResponse) ? orderResponse : []);
        
  //     } catch (err) {
  //       console.error("Failed to load dashboard data:", err);
  //     } finally {
  //       setLoading(false);
  //     }
  //   };
    
  //   loadData();
  // }, []);

  useEffect(() => {
  const loadData = async () => {
    try {
      setLoading(true);

      await fetchInventory();
      await fetchPredictions();

      const orderResponse = await apiRequest("/api/orders", "GET");
      setOrders(Array.isArray(orderResponse) ? orderResponse : []);

    } catch (err) {
      console.error("FETCH FAILED", err);
    } finally {
      setLoading(false);
    }
  };

  loadData();
}, []);

  const criticalPred = useMemo(() => 
    livePredictions.length > 0 
      ? [...livePredictions].sort((a, b) => a.days_left - b.days_left)[0] 
      : predictions.length > 0 
        ? [...predictions].sort((a, b) => a.days_left - b.days_left)[0] 
        : null
  , [livePredictions, predictions]);

  const handleApprove = (drugName: string) => {
    setToast({ show: true, msg: `Order Placed: ${drugName} (Status: APPROVED)` });
    setTimeout(() => setToast({ show: false, msg: "" }), 4000);
  };

  const getAlertStatus = (days: number) => {
    if (days < 3) return { label: "CRITICAL", color: "text-red-600", border: "border-red-500", bg: "bg-red-50", icon: <AlertTriangle className="h-5 w-5" /> };
    if (days < 7) return { label: "WARNING", color: "text-orange-600", border: "border-orange-500", bg: "bg-orange-50", icon: <Activity className="h-5 w-5" /> };
    return { label: "MONITOR", color: "text-blue-600", border: "border-blue-500", bg: "bg-blue-50", icon: <Info className="h-5 w-5" /> };
  };
  // You may need to install papaparse: npm install papaparse


const handleCSVUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  const inputElement = event.target; // Store reference to clear later

  if (file && (file.type === "text/csv" || file.name.endsWith('.csv'))) {
    setToast({ show: true, msg: `Processing ${file.name}... Inventory updating.` });

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        // Fix 1: Type assertion to handle 'unknown' type errors 
        const drugs = results.data as Array<Record<string, any>>;
        let successCount = 0;

        for (const drugData of drugs) {
          try {
            // Fix 2: Clean data types (numbers/bools) before sending to backend 
            const payload = {
              name: drugData.name || drugData.drug,
              stock: Number(drugData.stock || 0),
              dailyUsage: Number(drugData.dailyUsage || 1),
              usageHistory: drugData.usageHistory ? JSON.parse(drugData.usageHistory) : [0, 0, 0],
              hospitalType: drugData.hospitalType || "rural",
              coldChainIntact: String(drugData.coldChainIntact).toLowerCase() === 'true',
              region: drugData.region || "Default Region",
              batches: drugData.batches ? JSON.parse(drugData.batches) : []
            };

            await apiRequest("/api/drugs", "POST", payload);
            successCount++;
          } catch (err) {
            console.error("Failed to upload drug from CSV:", drugData.name, err);
          }
        }

        setToast({ show: true, msg: `Successfully added ${successCount} drugs!` });

        // Fix 3: Manually trigger the inventory refresh logic from your useEffect 
        const refreshData = async () => {
          try {
            const response = await apiRequest("/api/drugs", "GET");
            const drugData = Array.isArray(response) ? response : response.data || [];
            setLiveDrugs(drugData); // Updates the table state 
          } catch (err) {
            console.error("Manual refresh failed:", err);
          }
        };
        
        await refreshData();
        inputElement.value = ""; // Clear input safely 
      }
    });
  } else if (file) {
    alert("Please upload a valid CSV file.");
  }
};
  return (
    <div className="p-6 lg:p-10 bg-[#F8FAFC] min-h-screen font-sans text-slate-900">
      {toast.show && (
        <div className="fixed top-5 right-5 z-[110] animate-in fade-in slide-in-from-top-4">
          <div className="bg-slate-900 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-slate-700">
            <CheckCircle2 className="text-emerald-400 h-5 w-5" />
            <span className="font-medium text-sm">{toast.msg}</span>
          </div>
        </div>
      )}

      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="bg-blue-600 p-1.5 rounded-lg"><Activity className="text-white h-5 w-5" /></div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">PharmaSight <span className="text-blue-600">Command</span></h1>
          </div>
          <p className="text-slate-500 text-sm font-medium italic">Healthcare Provider Control Center</p>
        </div>

        <div className="flex gap-3">
           <input type="file" ref={fileInputRef} onChange={handleCSVUpload} accept=".csv" className="hidden" />
           <Button variant="secondary" onClick={() => setIsAddModalOpen(true)}>
             <Plus className="h-4 w-4" /> Add Drug
           </Button>
           <Button onClick={() => fileInputRef.current?.click()}>
             <Plus className="h-4 w-4" /> Upload CSV
           </Button>
         </div>
      </header>

      {/* Hero Section - Professional Healthcare Provider Identity */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-10">
        <Card className={`md:col-span-8 p-8 border-l-8 ${getAlertStatus(criticalPred?.days_left || 15).border} bg-white shadow-xl relative`}>
          <div className="flex justify-between items-start">
            <div className="space-y-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-slate-500 mb-2">
                  <Building2 className="h-4 w-4" />
                  <span className="text-xs font-bold uppercase tracking-widest">Main General Hospital - {liveDrugs[0]?.hospitalType || "Urban"} Facility</span>
                </div>
                <Badge className={`${getAlertStatus(criticalPred?.days_left || 15).bg} ${getAlertStatus(criticalPred?.days_left || 15).color} border-none`}>
                  High Urgency Prediction
                </Badge>
                <h2 className="text-4xl font-black text-slate-900">{criticalPred?.drugId.name || "System Stabilized"}</h2>
              </div>
            </div>
            <div className={`p-4 rounded-2xl ${getAlertStatus(criticalPred?.days_left || 15).bg}`}>
              {getAlertStatus(criticalPred?.days_left || 15).icon}
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-10">
            <div>
              <p className="text-slate-400 text-xs font-bold uppercase mb-1">Stock-out in</p>
              <p className="text-3xl font-black text-slate-900">{criticalPred?.days_left || "--"} Days</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs font-bold uppercase mb-1">AI Confidence</p>
              <p className="text-3xl font-black text-slate-900">{criticalPred ? (criticalPred.confidence_score * 100).toFixed(0) : "0"}%</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs font-bold uppercase mb-1">Trend</p>
              <div className="flex items-center gap-2 text-red-600 font-bold">
                <TrendingUp className="h-5 w-5" />
                <span>+12% spike</span>
              </div>
            </div>
            <div className="flex items-end">
              <Button onClick={() => handleApprove(criticalPred?.drugId.name || "Stock")} className="w-full" disabled={!criticalPred}>Resolve Now</Button>
            </div>
          </div>
        </Card>

        {/* Fairness Indicator */}
        <Card className="md:col-span-4 p-8 bg-white border-emerald-100 shadow-xl relative overflow-hidden group">
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-6">
              <div className="p-3 bg-emerald-50 rounded-xl"><ShieldCheck className="text-emerald-600 h-6 w-6" /></div>
              <Badge className="bg-emerald-100 text-emerald-700 border-none">Compliance: active</Badge>
            </div>
            <h3 className="text-xl font-bold mb-1 text-slate-900">Hospital Fairness: 0.92</h3>
            <p className="text-slate-500 text-xs mb-6 font-medium flex items-center gap-1">
              <MapPin className="h-3 w-3" /> Region: {liveDrugs[0]?.region || "Global"}
            </p>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-black tracking-widest text-slate-400">
                  <span>RURAL PRIORITY INDEX</span>
                  <span className="text-emerald-600">HIGH (0.87)</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5">
                  <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: '87%' }}></div>
                </div>
              </div>
              <p className="text-[10px] text-slate-600 leading-relaxed italic">"Currently prioritizing emergency vaccine stock for rural outreach."</p>
            </div>
          </div>
          <ShieldCheck className="absolute -bottom-6 -right-6 h-32 w-32 text-emerald-500/10 pointer-events-none group-hover:scale-110 transition-transform" />
        </Card>
      </div>

      {/* Analytics Charts */}
      <div className="mb-10">
        <DashboardCharts drugs={liveDrugs} />
      </div>

      {/* NEW: Orders Section - Tracking functionality [cite: 151, 217]
      <div className="mb-10">
        <OrdersSection orders={orders} />
      </div> */}

      
      <AddDrugModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onSuccess={async () => {
          await fetchInventory();
          await fetchPredictions();
          setIsAddModalOpen(false);
        }} 
      />

      {/* Inventory Management */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <ShoppingCart className="h-5 w-5 text-blue-600" /> 
          Inventory Intelligence
        </h2>
        <InventoryTable 
          drugs={liveDrugs.length > 0 ? liveDrugs : drugs} 
          predictions={livePredictions.length > 0 ? livePredictions : predictions} 
          handleApprove={(name) => handleApprove(name)} 
        />
      </div>
    </div>
  );
}
