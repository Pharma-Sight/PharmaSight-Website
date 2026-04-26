"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table"
import { 
  ShieldAlert, 
  Settings, 
  Users, 
  Hospital, 
  Activity, 
  Database,
  Lock,
  Plus
} from "lucide-react"

const hospitals = [
  { id: "H-001", name: "City General", users: 12, status: "Active", region: "Urban" },
  { id: "H-002", name: "St. Jude Children's", users: 8, status: "Active", region: "Urban" },
  { id: "H-003", name: "Rural Health Clinic", users: 3, status: "Maintenance", region: "Rural" },
]

export default function SystemAdminDashboard() {
  // FIX 1: Prevent Hydration Mismatch
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Return a skeleton or null during SSR to save memory
  if (!mounted) return <div className="p-6 opacity-0" />

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto min-h-screen">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="bg-slate-900 p-2 rounded-lg">
            <Lock className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">System Control</h1>
            <p className="text-muted-foreground text-sm">Global User Roles & Infrastructure Management</p>
          </div>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" size="sm">
             <Settings className="mr-2 h-4 w-4" /> Configs
           </Button>
           <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
             <Plus className="mr-2 h-4 w-4" /> Add Hospital
           </Button>
        </div>
      </div>

      {/* System-wide Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: "Total API Calls", val: "1.2M", desc: "+12% from last hour", icon: Activity, color: "text-indigo-500" },
          { label: "Connected Nodes", val: "42", desc: "Across 4 regions", icon: Hospital, color: "text-indigo-500" },
          { label: "Active Sessions", val: "156", desc: "8 admin, 148 staff", icon: Users, color: "text-indigo-500" },
          { label: "DB Health", val: "99.9%", desc: "Latency: 24ms", icon: Database, color: "text-green-500" },
        ].map((stat, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{stat.label}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.val}</div>
              <p className="text-[10px] text-muted-foreground font-medium">{stat.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-12">
        <Card className="md:col-span-8">
          <CardHeader>
            <CardTitle>Manage Hospital Nodes</CardTitle>
            <CardDescription>View and control data synchronization for medical facilities.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Hospital Name</TableHead>
                    <TableHead>Region</TableHead>
                    <TableHead>Users</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {hospitals.map((h) => (
                    <TableRow key={h.id}>
                      <TableCell className="font-medium">{h.name}</TableCell>
                      <TableCell>{h.region}</TableCell>
                      <TableCell>{h.users}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={h.status === "Active" ? "secondary" : "outline"} 
                          className={h.status === "Active" ? "bg-green-100 text-green-700 border-none" : ""}
                        >
                          {h.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">Manage</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-4 border-l-4 border-l-indigo-600">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-indigo-600" />
              Global AI Thresholds
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {[
              { title: "Auto-Trigger Orders", desc: "Procurement starts without approval", checked: false },
              { title: "Fairness Layer (Rural)", desc: "Prioritize rural stock allocation", checked: true },
              { title: "Public Shortage Alert", desc: "Notify FDA API on prediction", checked: false },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
                <Switch defaultChecked={item.checked} />
              </div>
            ))}
            <div className="pt-4 border-t">
              <p className="text-xs font-bold uppercase text-slate-500 mb-2">Sensitivity Threshold</p>
              <div className="bg-slate-100 p-3 rounded-lg flex justify-between items--center">
                 <span className="text-sm">Confidence {'>'} 85%</span>
                 <Button variant="link" className="text-xs p-0 h-auto">Edit</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}