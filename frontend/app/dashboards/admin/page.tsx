"use client"

import React from 'react'
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

// Mock Data for System Stats
const hospitals = [
  { id: "H-001", name: "City General", users: 12, status: "Active", region: "Urban" },
  { id: "H-002", name: "St. Jude Children's", users: 8, status: "Active", region: "Urban" },
  { id: "H-003", name: "Rural Health Clinic", users: 3, status: "Maintenance", region: "Rural" },
]

export default function SystemAdminDashboard() {
  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
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
           <Button variant="outline" size="sm"><Settings className="mr-2 h-4 w-4" /> Configs</Button>
           <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
             <Plus className="mr-2 h-4 w-4" /> Add Hospital
           </Button>
        </div>
      </div>

      {/* System-wide Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Total API Calls</CardTitle>
            <Activity className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1.2M</div>
            <p className="text-[10px] text-green-600 font-medium">+12% from last hour</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Connected Nodes</CardTitle>
            <Hospital className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">42</div>
            <p className="text-[10px] text-muted-foreground">Across 4 regions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Active Sessions</CardTitle>
            <Users className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">156</div>
            <p className="text-[10px] text-muted-foreground">8 admin, 148 staff</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">DB Health</CardTitle>
            <Database className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">99.9%</div>
            <p className="text-[10px] text-muted-foreground">Latency: 24ms</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-12">
        {/* Manage Hospitals/Nodes */}
        <Card className="md:col-span-8">
          <CardHeader>
            <CardTitle>Manage Hospital Nodes</CardTitle>
            <CardDescription>View and control data synchronization for medical facilities.</CardDescription>
          </CardHeader>
          <CardContent>
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
                      <Badge variant={h.status === "Active" ? "secondary" : "outline"} className={h.status === "Active" ? "bg-green-100 text-green-700 border-none" : ""}>
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
          </CardContent>
        </Card>

        {/* Global Configuration / Thresholds */}
        <Card className="md:col-span-4 border-l-4 border-l-indigo-600">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-indigo-600" />
              Global AI Thresholds
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-sm font-medium">Auto-Trigger Orders</p>
                <p className="text-xs text-muted-foreground">Procurement starts without approval</p>
              </div>
              <Switch />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-sm font-medium">Fairness Layer (Rural)</p>
                <p className="text-xs text-muted-foreground">Prioritize rural stock allocation</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-sm font-medium">Public Shortage Alert</p>
                <p className="text-xs text-muted-foreground">Notify FDA API on prediction</p>
              </div>
              <Switch />
            </div>
            <div className="pt-4 border-t">
              <p className="text-xs font-bold uppercase text-slate-500 mb-2">Sensitivity Threshold</p>
              <div className="bg-slate-100 p-3 rounded-lg flex justify-between items-center">
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