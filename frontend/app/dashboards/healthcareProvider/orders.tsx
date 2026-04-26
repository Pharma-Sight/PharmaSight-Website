// OrdersSection Component - Displays recent orders and their tracking status for healthcare providers

"use client";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress"; // For order tracking 
import { Badge } from "@/components/ui/badge";

export const OrdersSection = ({ orders }: { orders: any[] }) => {
  return (
    <div className="mt-8 space-y-4">
      <h2 className="text-xl font-bold text-slate-800">Recent Orders & Tracking</h2>
      <div className="grid gap-4">
        {orders.map((order) => (
          <Card key={order._id} className="p-4 border-l-4 border-blue-500 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-semibold text-lg">{order.drugName}</h3>
                <p className="text-sm text-slate-500">Supplier ID: {order.supplierId}</p>
                <p className="text-xs text-slate-400">Qty: {order.quantity} units</p>
              </div>
              <Badge variant={order.status === "PENDING" ? "outline" : "default"}>
                {order.status}
              </Badge>
            </div>

            {/* Tracking Bar Functionality  */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-medium">
                <span>Requested</span>
                <span className={order.status !== "PENDING" ? "text-blue-600" : "text-slate-400"}>
                  Dispatched
                </span>
                <span className={order.status === "DELIVERED" ? "text-green-600" : "text-slate-400"}>
                  Delivered
                </span>
              </div>
              <Progress 
                value={order.status === "PENDING" ? 33 : order.status === "APPROVED" ? 66 : 100} 
                className="h-2" 
              />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};