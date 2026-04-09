"use client"

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  Accordion, AccordionContent, AccordionItem, AccordionTrigger 
} from "@/components/ui/accordion"
import { 
  BrainCircuit, 
  Info, 
  Search, 
  Zap, 
  ShieldCheck, 
  Activity, 
  Database 
} from "lucide-react"
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts'

const anomalyData = [
  { time: '00:00', usage: 30 },
  { time: '04:00', usage: 35 },
  { time: '08:00', usage: 40 },
  { time: '12:00', usage: 95 }, // Anomaly
  { time: '16:00', usage: 50 },
  { time: '20:00', usage: 45 },
]

export default function AIInsightsDashboard() {
  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-blue-600">
          <BrainCircuit className="h-6 w-6" />
          <h1 className="text-3xl font-bold tracking-tight">AI Insights & Explainability</h1>
        </div>
        <p className="text-muted-foreground">Internal model transparency and prediction logic auditing.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Why Prediction Happened - THE CORE WOW FACTOR */}
        <Card className="lg:col-span-2 shadow-md border-blue-100">
          <CardHeader className="bg-blue-50/50">
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5 text-blue-600" />
              Root Cause Analysis: Amoxicillin Shortage
            </CardTitle>
            <CardDescription>Generated via RAG (FDA + WHO + Internal Data)</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex gap-4 items-center">
                    <Badge className="bg-red-100 text-red-700">65% Weight</Badge>
                    <span className="font-semibold">Supply Chain Delay (Global)</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  RAG analysis of recent FDA shortage reports indicates a raw material delay at <strong>Manufacturer X</strong>. This matches the 3-week delay seen in your recent supplier shipping logs.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex gap-4 items-center">
                    <Badge className="bg-orange-100 text-orange-700">25% Weight</Badge>
                    <span className="font-semibold">Seasonal Demand Spike</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  Gemini analyzed regional illness patterns (Flu/Strep) and detected a <strong>40% increase</strong> in prescriptions compared to this month last year.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        {/* Confidence Score Panel */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-green-600" />
              Model Confidence Score
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-center items-center">
            <div className="relative flex items-center justify-center mb-4">
              <svg className="h-32 w-32">
                <circle className="text-slate-100" strokeWidth="10" stroke="currentColor" fill="transparent" r="50" cx="64" cy="64" />
                <circle className="text-green-500" strokeWidth="10" strokeDasharray={314} strokeDashoffset={314 - (314 * 0.92)} strokeLinecap="round" stroke="currentColor" fill="transparent" r="50" cx="64" cy="64" />
              </svg>
              <span className="absolute text-3xl font-bold">92%</span>
            </div>
            <p className="text-center text-sm text-muted-foreground px-4">
              High confidence based on <span className="text-blue-600 font-bold">128 data points</span> from 3 separate API sources.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-12">
        {/* Anomaly Detection Graph */}
        <Card className="md:col-span-8">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-purple-600" />
                  Real-time Anomaly Detection
                </CardTitle>
                <CardDescription>Usage spikes vs. Normal Baseline</CardDescription>
              </div>
              <Badge variant="destructive" className="animate-pulse">Anomaly Detected at 12:00</Badge>
            </div>
          </CardHeader>
          <CardContent className="h-[250px] pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={anomalyData}>
                <defs>
                  <linearGradient id="colorUsage" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="usage" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorUsage)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Data Sources / Training Data Info */}
        <Card className="md:col-span-4">
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Database className="h-4 w-4 text-slate-500" />
              Active RAG Sources
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: "FDA Shortage DB", status: "Synced", color: "text-green-600" },
              { label: "WHO Essential Meds", status: "Synced", color: "text-green-600" },
              { label: "Internal Ward Logs", status: "Real-time", color: "text-blue-600" },
              { label: "Regional CDC Data", status: "Latent (2h)", color: "text-orange-600" },
            ].map((source, i) => (
              <div key={i} className="flex justify-between items-center border-b pb-2 last:border-0">
                <span className="text-sm font-medium">{source.label}</span>
                <span className={`text-xs font-bold ${source.color}`}>{source.status}</span>
              </div>
            ))}
            <div className="mt-4 p-3 bg-purple-50 rounded-lg text-xs flex gap-2 border border-purple-100">
              <Info className="h-4 w-4 text-purple-600 shrink-0" />
              <p className="text-purple-900 leading-tight">
                <strong>Why 92%?</strong> Model accuracy is limited by "Regional CDC Data" being 2 hours behind real-time.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}