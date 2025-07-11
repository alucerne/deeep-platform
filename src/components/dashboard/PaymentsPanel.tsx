'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const mockPayments = [
  { date: '2025-07-10', amount: 200.00, status: 'Completed', method: 'Stripe' },
  { date: '2025-07-08', amount: 100.00, status: 'Completed', method: 'Stripe' },
  { date: '2025-07-05', amount: 50.00, status: 'Completed', method: 'Stripe' },
]

export default function PaymentsPanel() {
  return (
    <div className="bg-white p-6 rounded-xl shadow border space-y-4">
      <h2 className="text-lg font-semibold">Payment History</h2>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Method</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {mockPayments.map((item, idx) => (
            <TableRow key={idx}>
              <TableCell>{item.date}</TableCell>
              <TableCell>${item.amount.toFixed(2)}</TableCell>
              <TableCell>{item.status}</TableCell>
              <TableCell>{item.method}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
} 