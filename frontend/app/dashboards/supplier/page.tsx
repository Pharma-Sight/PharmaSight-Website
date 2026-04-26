"use client"

import React, { useState, useEffect } from 'react'
import { apiRequest } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { MapPin, Scale, Truck, Loader2, CheckCircle } from "lucide-react"
import { Button } from '@/components/ui/button'
import { toast } from "sonner"

export default function SupplierDashboard() {
  const [loading, setLoading] = useState(true)
  const [fairnessMetrics, setFairnessMetrics] = useState({ score: 0, rural: 0, urban: 0 })
  // In your SupplierDashboard component
  const [districtData, setDistrictData] = useState<any[]>([]); // FIX: Use empty array [cite: 439]
  const [orders, setOrders] = useState<any[]>([]); // Ensure orders also start as an empty array
  const fetchSupplierData = async () => {
    try {
      setLoading(true)
      // Fetch orders specifically assigned to this supplier
      const response = await apiRequest("/api/orders/supplier", "GET")
      const ordersData = Array.isArray(response) ? response : response.data || []
      setOrders(ordersData)
      setDistrictData([]) // Initialize district data
      calculateFairness(ordersData)
    } catch (error:any) {
      // // console.error("Failed to fetch supplier data", error)
      if (error.message.includes("404")) {
        toast.info("No data available. Please check back later.")
      setOrders([]);
      setDistrictData([]);
      // We don't call toast.error or console.error here
    } else {
      // For other errors (500, Network issue), you might still want to know
      console.error("Fetch error:", error.message);
      toast.error("Failed to load data.");
    }
    } finally {
      setLoading(false)
    }
  }

  const calculateFairness = (data: any[]) => {
    const dispatched = data.filter(o => o.status === "DISPATCHED" || o.status === "DELIVERED")
    if (dispatched.length === 0) return

    const rural = dispatched.filter(o => o.hospitalId?.hospitalType === 'rural').length
    const urban = dispatched.filter(o => o.hospitalId?.hospitalType === 'urban').length
    
    // Simple fairness ratio: percentage of orders going to rural areas
    const score = (rural / dispatched.length) * 100
    setFairnessMetrics({ score, rural, urban })
  }

  const handleDispatch = async (orderId: string) => {
    try {
      await apiRequest(`/api/orders/${orderId}/dispatch`, "PATCH" as "GET" | "POST" | "PATCH" | "DELETE", {
        trackingId: `PHARMA-${Math.random().toString(36).toUpperCase().substring(2, 9)}`
      })
      toast.success("Order Dispatched Successfully")
      fetchSupplierData() // Refresh list
    } catch (error) {
      toast.error("Dispatch failed")
    }
  }

  useEffect(() => {
    fetchSupplierData()
  }, [])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Logistics Hub</h1>
          <p className="text-muted-foreground">Manage incoming medical supply requests</p>
        </div>
        
        <Card className="w-64 border-orange-200 bg-orange-50">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium flex items-center gap-2">
                <Scale className="h-4 w-4 text-orange-600" /> Fairness Score
              </span>
              <span className="text-orange-700 font-bold">{fairnessMetrics.score.toFixed(0)}%</span>
            </div>
            <Progress value={fairnessMetrics.score} className="h-2" />
            <p className="text-[10px] mt-2 text-orange-600 uppercase font-bold tracking-wider">
              Target: Equitable Rural Distribution
            </p>
          </CardContent>
        </Card>
      </header>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Incoming Inventory Requests</CardTitle>
            <CardDescription>Orders requiring verification and dispatch</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-slate-100">
                  <tr>
                    <th className="px-4 py-3">Hospital</th>
                    <th className="px-4 py-3">Drug & Quantity</th>
                    {/* <th className="px-4 py-3">Type</th> */}
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order._id} className="border-b hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-4 font-medium">
                        {order.hospitalId?.name || "Unknown Hospital"}
                        <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {order.hospitalId?.location?.city || "Remote"}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-bold">{order.drugName}</div>
                        <div className="text-xs text-slate-500">{order.quantity} Units</div>
                      </td>
                      <td className="px-4 py-4">
                        <Badge variant={order.hospitalId?.hospitalType === 'rural' ? 'default' : 'secondary'}>
                          {order.hospitalId?.hospitalType || 'urban'}
                        </Badge>
                      </td>
                      <td className="px-4 py-4">
                        <Badge className={
                          order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : 
                          order.status === 'DISPATCHED' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                        }>
                          {order.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-4 text-right">
                        {order.status === 'PENDING' ? (
                          <Button 
                            size="sm" 
                            // onClick={() => handleDispatch(order._id)}
                            onClick={() => toast.success("Dispatched successfully")} // Mock dispatch for demo
                            className="bg-indigo-600 hover:bg-indigo-700"
                          >
                            <Truck className="h-4 w-4 mr-2" /> Dispatch
                          </Button>
                        ) : (
                          <div className="flex items-center justify-end text-green-600 font-medium">
                            <CheckCircle className="h-4 w-4 mr-1" /> Processed
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}