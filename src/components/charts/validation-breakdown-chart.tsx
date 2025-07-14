"use client"

import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts"
import React from "react"

const chartData = [
  { result: "valid", count: 420, fill: "var(--color-valid)" },
  { result: "invalid", count: 130, fill: "var(--color-invalid)" },
  { result: "catchall", count: 70, fill: "var(--color-catchall)" },
  { result: "unknown", count: 40, fill: "var(--color-unknown)" },
]

const total = chartData.reduce((sum, d) => sum + d.count, 0)

export function ValidationBreakdownChart() {
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="flex flex-col items-center justify-center py-8">
        <div className="relative w-56 h-56">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="count"
                nameKey="result"
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={100}
                label={false}
                stroke="none"
              >
                {chartData.map((entry) => (
                  <Cell key={`cell-${entry.result}`} fill={entry.fill} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-4xl font-bold">{total}</span>
            <span className="text-muted-foreground text-sm mt-1">Total Emails Scanned</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col items-center gap-1">
        <span className="text-base font-medium">Latest batch summary</span>
        <span className="text-xs text-muted-foreground">You can upload new files in the Bulk Uploads tab.</span>
      </CardFooter>
    </Card>
  )
}

export default ValidationBreakdownChart 