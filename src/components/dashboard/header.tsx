'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'

export default function Header() {
  const router = useRouter()
  
  const handleLogout = async () => {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      
      if (!supabaseUrl || !supabaseAnonKey) {
        console.warn('Supabase environment variables not found')
        router.push('/login')
        return
      }
      
      const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Error logging out:', error)
        alert('Error logging out. Please try again.')
      } else {
        // Redirect to login page after successful logout
        router.push('/login')
      }
    } catch (error) {
      console.error('Error logging out:', error)
      alert('Error logging out. Please try again.')
    }
  }

  return (
    <header className="w-full border-b px-6 py-4 bg-white">
      <div className="flex items-center justify-between">
        <div className="text-xl font-semibold">Email Validation Platform</div>
        <Button
          onClick={handleLogout}
          variant="outline"
          size="sm"
          className="flex items-center space-x-2"
        >
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
        </Button>
      </div>
    </header>
  )
} 