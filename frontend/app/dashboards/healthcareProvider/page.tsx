"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table"
import { 
  AlertTriangle, 
  TrendingDown, 
  Plus, 
  Search, 
  ClipboardList,
  ArrowRight
} from "lucide-react"
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line 
} from 'recharts'

const stockData = [
  { id: 1, name: "Amoxicillin", stock: 120, usage: 45, status: "Low", trend: [10, 20, 15, 30, 45] },
  { id: 2, name: "Insulin", stock: 40, usage: 5, status: "Normal", trend: [4, 6, 5, 5, 5] },
]

const demandData = [
  { name: 'Mon', stock: 400, demand: 240 },
  { name: 'Tue', stock: 300, demand: 139 },
  { name: 'Wed', stock: 200, demand: 980 },
  { name: 'Thu', stock: 278, demand: 390 },
  { name: 'Fri', stock: 189, demand: 480 },
]

export default function HealthcareProviderDashboard() {
  // --- FIX 1: Hydration Guard ---
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Header Section */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Healthcare Provider Dashboard</h1>
          <p className="text-muted-foreground">Unified Operational & Decision View</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline"><Search className="mr-2 h-4 w-4" /> Inventory Search</Button>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white"><Plus className="mr-2 h-4 w-4" /> Update Stock</Button>
        </div>
      </div>

      {/* TOP ROW: Urgent AI Alerts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Alert variant="destructive" className="border-red-500 bg-red-50/50">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle className="font-bold text-red-700">Predictive Shortage Alert</AlertTitle>
          <AlertDescription className="flex justify-between items-center text-red-800">
            <span>Amoxicillin stock will deplete in <strong>6 days</strong> based on seasonal demand spikes.</span>
            <Button size="sm" variant="destructive" className="ml-4">Approve Restock</Button>
          </AlertDescription>
        </Alert>

        <Card className="bg-blue-900 text-white border-none shadow-lg overflow-hidden">
          <CardContent className="pt-6 flex justify-between items-center">
            <div>
              <p className="text-blue-300 text-xs font-bold uppercase tracking-wider">AI Fairness Score</p>
              <h3 className="text-2xl font-bold">85% Optimized</h3>
              <p className="text-blue-200 text-xs mt-1">Allocation prioritized for rural departments</p>
            </div>
            <div className="w-24">
              <Progress value={85} className="h-2 bg-blue-800" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* MIDDLE ROW: Operational Inventory + Analytics */}
      <div className="grid gap-6 md:grid-cols-12">
        {/* Current Stock Table */}
        <Card className="md:col-span-7 min-w-0">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Inventory Management</CardTitle>
              <CardDescription>Real-time stock levels and usage trends</CardDescription>
            </div>
            <ClipboardList className="h-5 w-5 text-slate-400" />
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Drug Name</TableHead>
                  <TableHead>Current Stock</TableHead>
                  <TableHead className="w-[100px]">Trend</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stockData.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.stock} units</TableCell>
                    <TableCell>
                      {/* --- FIX 2: Explicit height and width for sparklines --- */}
                      <div className="h-[30px] w-[80px]">
                        {mounted && (
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={item.trend.map(v => ({v}))}>
                              <Line 
                                type="monotone" 
                                dataKey="v" 
                                stroke={item.status === 'Low' ? '#ef4444' : '#10b981'} 
                                strokeWidth={2} 
                                dot={false} 
                                isAnimationActive={false} 
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.status === "Low" ? "destructive" : "secondary"}>{item.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Consumption Graph */}
        <Card className="md:col-span-5 min-w-0">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Usage vs Forecast</CardTitle>
              <CardDescription>AI-predicted demand for the week</CardDescription>
            </div>
            <TrendingDown className="h-5 w-5 text-blue-500" />
          </CardHeader>
          {/* --- FIX 3: Explicit height class on the container --- */}
          <CardContent className="h-[300px] w-full pt-4">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={demandData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="demand" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full bg-slate-50 animate-pulse rounded-lg flex items-center justify-center text-slate-400 text-sm">
                Loading Forecast...
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* BOTTOM ROW: Quick Insights */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-l-4 border-l-blue-500 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-700">Alternative Suggestions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-2">If Amoxicillin runs out:</p>
            <div className="flex items-center justify-between p-2 bg-blue-50/50 rounded border border-blue-100">
              <span className="text-sm font-bold text-blue-700">Ceflacor</span>
              <Badge variant="outline" className="text-[10px] bg-white">High Availability</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-purple-700">AI Recommendation</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs leading-relaxed text-slate-600">
              Consolidate your antibiotic order with <strong>Ward B</strong> to save 12% in procurement costs.
            </p>
            <Button variant="link" size="sm" className="px-0 h-auto text-purple-700 font-bold mt-2">
              Apply Strategy <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 shadow-sm">
          <CardHeader className="pb-2 text-green-700">
            <CardTitle className="text-sm font-semibold">System Integrity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <p className="text-xs text-slate-600">RAG Sources: FDA & WHO Synced</p>
            </div>
            <p className="text-[10px] text-muted-foreground mt-2 italic">Last updated: 2 mins ago</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}