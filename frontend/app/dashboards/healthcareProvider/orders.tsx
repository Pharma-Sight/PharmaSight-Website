// OrdersSection Component - Displays recent orders and their tracking status for healthcare providers

"use client";
import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Package, Truck, CheckCircle2, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/api"; // Ensure this matches your project structure
import { Dispatch, SetStateAction } from 'react';

// Update the interface to include setOrders
interface OrdersSectionProps {
  orders: any[];
  setOrders: Dispatch<SetStateAction<any[]>>; 
}
// Helper component for the tracking steps
const TrackingStep = ({ label, icon: Icon, isActive, isCompleted }: any) => (
  <div className="flex flex-col items-center flex-1">
    <div className={`relative flex items-center justify-center w-8 h-8 rounded-full border-2 mb-1 z-10 
      ${isCompleted ? "bg-blue-600 border-blue-600 text-white" : 
        isActive ? "bg-white border-blue-600 text-blue-600 shadow-md" : "bg-white border-slate-200 text-slate-300"}`}>
      <Icon size={14} />
    </div>
    <span className={`text-[10px] font-semibold uppercase tracking-tight ${isActive || isCompleted ? "text-slate-800" : "text-slate-400"}`}>
      {label}
    </span>
  </div>
);

export const OrdersSection = ({ orders, setOrders }: OrdersSectionProps) => {
  const [loading, setLoading] = useState(true);

  // Fetch orders from the backend API [cite: 1, 8]
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        // Calls the backend route configured for healthcare providers 
        const data = await apiRequest("/api/orders", "GET");
        setOrders(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to fetch orders:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "PENDING": return { step: 1, percent: 12.5 };
      case "APPROVED": return { step: 2, percent: 37.5 };
      case "DISPATCHED": return { step: 3, percent: 62.5 };
      case "DELIVERED": return { step: 4, percent: 100 };
      default: return { step: 1, percent: 0 };
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-6">
      <div className="flex items-center gap-3 border-b pb-4 border-slate-100">
        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
          <ShoppingCart size={24} />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Recent Orders & Tracking</h2>
      </div>

      <div className="grid gap-6">
        {orders.length === 0 ? (
          <div className="text-center py-10 text-slate-400 border-2 border-dashed rounded-xl">
            No active orders found.
          </div>
        ) : (
          orders.map((order) => {
            const { step, percent } = getStatusConfig(order.status);
            // Uses populated supplier data [cite: 11]
            const supplierName = order.supplierId?.name || "Standard Supplier";

            return (
              <Card key={order._id} className="p-5 border-slate-200 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-6">
                  <div className="space-y-1">
                    <h3 className="font-bold text-slate-900 text-lg">{order.drugName}</h3>
                    <div className="flex gap-4 text-sm">
                      <span className="text-slate-500 font-medium">
                        Supplier: <span className="text-slate-900">{supplierName}</span>
                      </span>
                      <span className="text-slate-500 font-medium">
                        Qty: <span className="text-slate-900">{order.quantity} units</span>
                      </span>
                    </div>
                  </div>
                  <Badge className={
                    order.status === "DELIVERED" ? "bg-emerald-100 text-emerald-700" :
                    order.status === "PENDING" ? "bg-amber-100 text-amber-700" :
                    "bg-blue-100 text-blue-700"
                  }>
                    {order.status}
                  </Badge>
                </div>

                <div className="relative mt-8 px-2">
                  <div className="absolute top-4 left-0 w-full h-[3px] bg-slate-100 rounded-full" />
                  <div 
                    className="absolute top-4 left-0 h-[3px] bg-blue-600 rounded-full transition-all duration-700" 
                    style={{ width: `${percent}%` }}
                  />
                  <div className="relative flex justify-between">
                    <TrackingStep label="Placed" icon={ShoppingCart} isActive={step === 1} isCompleted={step > 1} />
                    <TrackingStep label="Approved" icon={Package} isActive={step === 2} isCompleted={step > 2} />
                    <TrackingStep label="In Transit" icon={Truck} isActive={step === 3} isCompleted={step > 3} />
                    <TrackingStep label="Arrived" icon={CheckCircle2} isActive={step === 4} isCompleted={step > 4} />
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};