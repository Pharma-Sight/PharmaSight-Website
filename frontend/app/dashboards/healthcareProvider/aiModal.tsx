
import React, { useState, useMemo, useRef } from 'react';
import { 
  ShieldCheck,Plus, X, Loader2,
  Trash2
} from 'lucide-react';
import { apiRequest } from '@/lib/api'; // Ensure this path is correct

type Batch = {
  batch_no: string;
  expiry_date: string;
  qty: string;
};

type FormData = {
  name: string;
  stock: string;
  usable_stock: string;
  verified_stock: string;
  usageHistory: [number, number, number];
  hospitalType: "urban" | "rural";
  coldChainIntact: boolean;
  region: string;
  hospital_id: string;
  batches: Batch[];
};

export const AddDrugModal = ({
  isOpen,
  onClose,
  onSuccess
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) => {
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    name: "",
    stock: "",
    usable_stock: "",
    verified_stock: "",
    usageHistory: [0, 0, 0],
    hospitalType: "rural",
    coldChainIntact: true,
    region: "",
    hospital_id: "",
    batches: [
      {
        batch_no: "",
        expiry_date: "",
        qty: ""
      }
    ]
  });

  if (!isOpen) return null;

  const updateField = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const updateUsage = (index: number, value: string) => {
    const next = [...formData.usageHistory] as [number, number, number];
    next[index] = Number(value || 0);

    setFormData((prev) => ({
      ...prev,
      usageHistory: next
    }));
  };

  const addBatchRow = () => {
    setFormData((prev) => ({
      ...prev,
      batches: [
        ...prev.batches,
        {
          batch_no: "",
          expiry_date: "",
          qty: ""
        }
      ]
    }));
  };

  const removeBatchRow = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      batches:
        prev.batches.length === 1
          ? prev.batches
          : prev.batches.filter((_, i) => i !== index)
    }));
  };

  const updateBatch = (
    index: number,
    field: keyof Batch,
    value: string
  ) => {
    const next = [...formData.batches];
    next[index] = {
      ...next[index],
      [field]: value
    };

    setFormData((prev) => ({
      ...prev,
      batches: next
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        drug: formData.name.trim(),

        counted_stock: Number(formData.stock),
        usable_stock: Number(formData.usable_stock),
        verified_stock: Number(formData.verified_stock),

        daily_usage: formData.usageHistory.map(Number),

        hospital_type: formData.hospitalType,
        cold_chain_intact: formData.coldChainIntact,

        region: formData.region.trim(),
        hospital_id: formData.hospital_id.trim(),

        batches: formData.batches.map((batch) => ({
          batch_no: batch.batch_no.trim(),
          expiry_date: batch.expiry_date,
          qty: Number(batch.qty)
        }))
      };

      await apiRequest("/api/drugs", "POST", payload);

      onSuccess();
      onClose();
    } catch (error: any) {
      alert(`Sync Failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900 sticky top-0 z-10">
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              Log AI Inventory
            </h2>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
              PharmaSight Forecasting Engine
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>

        {/* Body */}
        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-6 overflow-y-auto"
        >
          {/* Identity */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">
                Drug Name
              </label>
              <input
                required
                value={formData.name}
                onChange={(e) =>
                  updateField("name", e.target.value)
                }
                placeholder="e.g. Insulin"
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 ring-blue-500 text-sm"
              />
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">
                Hospital ID
              </label>
              <input
                required
                value={formData.hospital_id}
                onChange={(e) =>
                  updateField("hospital_id", e.target.value)
                }
                placeholder="Enter hospital ID"
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 ring-blue-500 text-sm"
              />
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">
                Region
              </label>
              <input
                required
                value={formData.region}
                onChange={(e) =>
                  updateField("region", e.target.value)
                }
                placeholder="Enter region"
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 ring-blue-500 text-sm"
              />
            </div>
          </div>

          {/* Stock Audit */}
          <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-4">
              Stock Audit (Units)
            </label>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <span className="text-[9px] font-bold text-slate-500 block mb-1">
                  TOTAL COUNT
                </span>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.stock}
                  onChange={(e) =>
                    updateField("stock", e.target.value)
                  }
                  className="w-full px-4 py-2 rounded-lg bg-white dark:bg-slate-900 border text-sm"
                />
              </div>

              <div>
                <span className="text-[9px] font-bold text-slate-500 block mb-1">
                  USABLE
                </span>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.usable_stock}
                  onChange={(e) =>
                    updateField("usable_stock", e.target.value)
                  }
                  className="w-full px-4 py-2 rounded-lg bg-white dark:bg-slate-900 border text-sm"
                />
              </div>

              <div>
                <span className="text-[9px] font-bold text-slate-500 block mb-1">
                  VERIFIED
                </span>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.verified_stock}
                  onChange={(e) =>
                    updateField(
                      "verified_stock",
                      e.target.value
                    )
                  }
                  className="w-full px-4 py-2 rounded-lg bg-white dark:bg-slate-900 border text-sm"
                />
              </div>
            </div>
          </div>

          {/* Usage Trend */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
              Daily Usage Trend (Last 3 Days)
            </label>

            <div className="grid grid-cols-3 gap-4">
              {[0, 1, 2].map((i) => (
                <div key={i} className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">
                    D-{3 - i}
                  </span>

                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.usageHistory[i]}
                    onChange={(e) =>
                      updateUsage(i, e.target.value)
                    }
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 ring-blue-500 text-sm"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Environment */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">
                Facility Environment
              </label>

              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                {["urban", "rural"].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() =>
                      updateField(
                        "hospitalType",
                        type as "urban" | "rural"
                      )
                    }
                    className={`py-2 rounded-lg text-xs font-bold capitalize transition-all ${
                      formData.hospitalType === type
                        ? "bg-white dark:bg-slate-700 text-blue-600 shadow-sm"
                        : "text-slate-500"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-blue-700 dark:text-blue-400">
                  Cold Chain Integrity
                </span>
                <span className="text-[9px] text-blue-500/70">
                  Verify sensor logs before sync
                </span>
              </div>

              <input
                type="checkbox"
                checked={formData.coldChainIntact}
                onChange={(e) =>
                  updateField(
                    "coldChainIntact",
                    e.target.checked
                  )
                }
                className="w-6 h-6 accent-blue-600 cursor-pointer"
              />
            </div>
          </div>

          {/* Batches */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Active Batches
              </label>

              <button
                type="button"
                onClick={addBatchRow}
                className="text-[10px] font-bold text-blue-600 flex items-center gap-1 hover:underline"
              >
                <Plus className="h-3 w-3" />
                Add New Batch
              </button>
            </div>

            {formData.batches.map((batch, index) => (
              <div
                key={index}
                className="grid grid-cols-12 gap-2 items-center bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800"
              >
                <div className="col-span-4">
                  <input
                    placeholder="Batch #"
                    value={batch.batch_no}
                    onChange={(e) =>
                      updateBatch(
                        index,
                        "batch_no",
                        e.target.value
                      )
                    }
                    className="w-full bg-transparent text-xs border-b outline-none"
                  />
                </div>

                <div className="col-span-4">
                  <input
                    type="date"
                    value={batch.expiry_date}
                    onChange={(e) =>
                      updateBatch(
                        index,
                        "expiry_date",
                        e.target.value
                      )
                    }
                    className="w-full bg-transparent text-xs border-b outline-none"
                  />
                </div>

                <div className="col-span-3">
                  <input
                    type="number"
                    min="0"
                    placeholder="Qty"
                    value={batch.qty}
                    onChange={(e) =>
                      updateBatch(
                        index,
                        "qty",
                        e.target.value
                      )
                    }
                    className="w-full bg-transparent text-xs border-b outline-none"
                  />
                </div>

                <div className="col-span-1 text-right">
                  {formData.batches.length > 1 && (
                    <button
                      type="button"
                      onClick={() =>
                        removeBatchRow(index)
                      }
                    >
                      <Trash2 className="h-4 w-4 text-red-400" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-xl shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Analyzing Microservice Data...
              </>
            ) : (
              <>
                <ShieldCheck className="h-5 w-5" />
                Generate AI Forecasting
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
