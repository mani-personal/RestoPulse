'use client'

import React, { useEffect, useState } from 'react'
import { browserDb as supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export default function Page() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [restaurants, setRestaurants] = useState<any[]>([])
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        
        // Correct client method usage instead of calling supabase directly as a function
        const { data, error } = await supabase
          .from('restaurants')
          .select('*')

        if (error) {
          setErrorMsg(error.message)
        } else {
          setRestaurants(data || [])
        }

        // Properly typed auth state listener subscription
        const authListener = supabase.auth.onAuthStateChange(
          (_event: string, session: any) => {
            if (!session) {
              // Handle unauthenticated state if needed
            }
          }
        )

        return () => {
          // Clean up subscription safely
          authListener?.data?.subscription?.unsubscribe()
        }
      } catch (err: any) {
        setErrorMsg(err.message || 'An error occurred loading data.')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  return (
    <main className="min-h-screen p-8 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center border-b pb-4">
          <h1 className="text-3xl font-bold tracking-tight">RestoPulse Dashboard</h1>
          <Button onClick={() => router.push('/admin/restaurants')}>
            Manage Restaurants
          </Button>
        </div>

        {errorMsg && (
          <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            <strong>Error:</strong> {errorMsg}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading system data...</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {restaurants.length > 0 ? (
              restaurants.map((x: any) => (
                <div key={x.id || Math.random()} className="p-5 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 space-y-2">
                  <h3 className="font-semibold text-lg">{x.name || 'Unnamed Restaurant'}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{x.location || x.address || 'No location specified'}</p>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-12 text-gray-500">
                No restaurants found. Run your database migrations or add sample data in Supabase.
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
