'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const mockHistory = [
  { date: '2025-07-10', type: 'Purchase', credits: 1000000, method: 'Stripe' },
  { date: '2025-07-08', type: 'Admin Credit', credits: 2000, method: 'Manual' },
  { date: '2025-07-05', type: 'Purchase', credits: 500000, method: 'Stripe' },
]

export default function CreditHistoryPanel() {
  return (
    <div className="bg-white p-6 rounded-xl shadow border space-y-4">
      <h2 className="text-lg font-semibold">Credit History</h2>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Credits</TableHead>
            <TableHead>Method</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {mockHistory.map((item, idx) => (
            <TableRow key={idx}>
              <TableCell>{item.date}</TableCell>
              <TableCell>{item.type}</TableCell>
              <TableCell>{item.credits.toLocaleString()}</TableCell>
              <TableCell>{item.method}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
} 