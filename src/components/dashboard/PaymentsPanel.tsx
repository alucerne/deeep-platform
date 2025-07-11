import { useEffect, useState } from 'react'

interface PaymentItem {
  id: string
  created: number
  amount_total: number
  currency: string
  payment_status: string
  metadata: {
    api_key: string
    credits: string
  }
}

export default function PaymentsPanel() {
  const [payments, setPayments] = useState<PaymentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const res = await fetch('/api/payments')
        const data = await res.json()
        if (res.ok) {
          setPayments(data.payments)
        } else {
          setError(data.error || 'Failed to fetch payments')
        }
      } catch (err) {
        setError('Network error occurred')
      } finally {
        setLoading(false)
      }
    }
    fetchPayments()
  }, [])

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Payments</h2>
      {loading ? (
        <div className="text-gray-500">Loading...</div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : payments.length === 0 ? (
        <div className="text-gray-500">No payments found.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2 pr-4">Date</th>
                <th className="py-2 pr-4">Amount</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Credits</th>
                <th className="py-2 pr-4">API Key</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((item) => (
                <tr key={item.id} className="border-b last:border-0">
                  <td className="py-2 pr-4">{new Date(item.created * 1000).toLocaleString()}</td>
                  <td className="py-2 pr-4">${(item.amount_total / 100).toFixed(2)} {item.currency.toUpperCase()}</td>
                  <td className="py-2 pr-4">{item.payment_status === 'paid' ? 'Paid' : item.payment_status}</td>
                  <td className="py-2 pr-4">{parseInt(item.metadata.credits).toLocaleString()}</td>
                  <td className="py-2 pr-4 font-mono text-xs">{item.metadata.api_key?.substring(0, 8)}...</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
} 