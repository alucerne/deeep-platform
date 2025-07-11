'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { User } from '@supabase/supabase-js'
import { DeeepApiKey } from '@/lib/database'
import GenerateApiKeyForm from '@/components/GenerateApiKeyForm'

// Dynamic imports to prevent SSR issues
const getAuthFunctions = async () => {
  const { getCurrentUser, signOut } = await import('@/lib/auth')
  return { getCurrentUser, signOut }
}

const getDatabaseFunctions = async () => {
  const { getLatestDeeepApiKey } = await import('@/lib/database')
  return { getLatestDeeepApiKey }
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [deeepApiKey, setDeeepApiKey] = useState<DeeepApiKey | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { getCurrentUser } = await getAuthFunctions()
        const { getLatestDeeepApiKey } = await getDatabaseFunctions()
        
        const currentUser = await getCurrentUser()
        if (!currentUser) {
          router.push('/login')
          return
        }
        
        setUser(currentUser)
        
        // Get latest DEEEP API key
        const apiKey = await getLatestDeeepApiKey(currentUser.id)
        setDeeepApiKey(apiKey)
      } catch {
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }

    checkUser()
  }, [router])

  const handleLogout = async () => {
    try {
      const { signOut } = await getAuthFunctions()
      await signOut()
      router.push('/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">DEEEP Platform</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">{user?.email}</span>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg p-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Welcome to your Dashboard!
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                You are successfully logged in with email: {user?.email}
              </p>
              
              <div className="mb-8">
                <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
                <GenerateApiKeyForm />
              </div>
              
              <div className="bg-white shadow rounded-lg p-6 max-w-md mx-auto">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Account Information
                </h3>
                <dl className="space-y-3">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Email</dt>
                    <dd className="text-sm text-gray-900">{user?.email}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">User ID</dt>
                    <dd className="text-sm text-gray-900 font-mono">{user?.id}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Email Verified</dt>
                    <dd className="text-sm text-gray-900">
                      {user?.email_confirmed_at ? 'Yes' : 'No'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Created At</dt>
                    <dd className="text-sm text-gray-900">
                      {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                    </dd>
                  </div>
                </dl>
              </div>

              {deeepApiKey && (
                <div className="bg-white shadow rounded-lg p-6 max-w-md mx-auto mt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    DEEEP API Information
                  </h3>
                  <dl className="space-y-3">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">API Key</dt>
                      <dd className="text-sm text-gray-900 font-mono break-all">
                        {deeepApiKey.api_key}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Customer Link</dt>
                      <dd className="text-sm text-gray-900">
                        {deeepApiKey.customer_link ? (
                          <a 
                            href={deeepApiKey.customer_link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:text-indigo-500 underline"
                          >
                            {deeepApiKey.customer_link}
                          </a>
                        ) : (
                          'Not available'
                        )}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">API Key Created</dt>
                      <dd className="text-sm text-gray-900">
                        {deeepApiKey.created_at ? new Date(deeepApiKey.created_at).toLocaleDateString() : 'N/A'}
                      </dd>
                    </div>
                  </dl>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
} 