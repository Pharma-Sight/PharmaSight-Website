"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { 
  Truck, 
  MapPin, 
  PackageCheck, 
  Clock, 
  ChevronRight, 
  ArrowUpRight,
  Filter
} from "lucide-react"

const demandMap = [
  { hospital: "City General Hospital", item: "Amoxicillin", quantity: "500 units", priority: "Critical", location: "Downtown" },
  { hospital: "St. Jude Children's", item: "Insulin Glargine", quantity: "200 units", priority: "High", location: "North Side" },
  { hospital: "Hope Medical Center", item: "Paracetamol", quantity: "1000 units", priority: "Medium", location: "East Wing" },
  { hospital: "Rural Health Clinic", item: "Amoxicillin", quantity: "150 units", priority: "High", location: "Remote Zone" },
]

const recentOrders = [
  { id: "ORD-9921", hospital: "City General", status: "In Transit", date: "Today, 10:30 AM" },
  { id: "ORD-9918", hospital: "East Medical", status: "Delivered", date: "Yesterday" },
  { id: "ORD-9915", hospital: "Hope Medical", status: "Pending", date: "Today, 08:15 AM" },
]

export default function SupplierDashboard() {
  // 1. Mount State to prevent SSR dimension mismatches
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Avoid rendering until client-side to suppress "width(-1)" warnings
  if (!mounted) {
    return <div className="p-6 h-screen w-full bg-white" /> 
  }

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="bg-orange-100 p-2 rounded-lg">
            <Truck className="h-6 w-6 text-orange-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Supplier Dashboard</h1>
            <p className="text-muted-foreground">Logistics & Global Fulfillment Status</p>
          </div>
        </div>
        <Button variant="outline"><Filter className="mr-2 h-4 w-4" /> Filter Logistics</Button>
      </div>

      <div className="grid gap-6 md:grid-cols-12">
        {/* Demand Map */}
        <Card className="md:col-span-8 shadow-sm">
          <CardHeader>
            <CardTitle>Active Demand Map</CardTitle>
            <CardDescription>Real-time shortage signals from connected hospitals</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {demandMap.map((demand, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-xl hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-full ${demand.priority === 'Critical' ? 'bg-red-100' : 'bg-blue-100'}`}>
                      <MapPin className={`h-5 w-5 ${demand.priority === 'Critical' ? 'text-red-600' : 'text-blue-600'}`} />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm">{demand.hospital}</h4>
                      <p className="text-xs text-muted-foreground">{demand.location} • Need: <span className="text-slate-900 font-medium">{demand.item}</span></p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-sm font-bold">{demand.quantity}</p>
                      <Badge variant={demand.priority === "Critical" ? "destructive" : "secondary"} className="text-[10px] h-5">
                        {demand.priority}
                      </Badge>
                    </div>
                    <Button size="sm" variant="ghost"><ChevronRight className="h-4 w-4" /></Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Fulfillment Status */}
        <div className="md:col-span-4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Requested Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px] pr-4">
                {recentOrders.map((order, i) => (
                  <div key={i} className="mb-4 last:mb-0">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="text-sm font-bold">{order.id}</p>
                        <p className="text-xs text-muted-foreground">{order.hospital}</p>
                      </div>
                      <Badge className={order.status === "Delivered" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}>
                        {order.status}
                      </Badge>
                    </div>
                    <div className="flex items-center text-[10px] text-muted-foreground gap-1">
                      <Clock className="h-3 w-3" /> {order.date}
                    </div>
                    {i !== recentOrders.length - 1 && <Separator className="mt-4" />}
                  </div>
                ))}
              </ScrollArea>
              <Button className="w-full mt-4 bg-orange-600 hover:bg-orange-700">
                Process All New Orders
              </Button>
            </CardContent>
          </Card>

          {/* Quick Logistics Stats */}
          <Card className="bg-slate-900 text-white overflow-hidden">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <PackageCheck className="h-8 w-8 text-orange-400" />
                <ArrowUpRight className="h-5 w-5 text-slate-400" />
              </div>
              <div className="space-y-1">
                <p className="text-3xl font-bold">94.2%</p>
                <p className="text-xs text-slate-400">Fulfillment Accuracy Rate</p>
              </div>
              {/* 2. Ensuring containers have explicit min-heights if they hold visual data */}
              <div className="mt-6 h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-orange-500 w-[94%] transition-all duration-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}