'use client'

import React from 'react'
import { browserDb as supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export default function ProfileHeader() {
  const router = useRouter()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center space-x-3">
        <div className="h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold">
          RP
        </div>
        <div>
          <h3 className="font-semibold text-sm">RestoPulse Account</h3>
          <p className="text-xs text-gray-500">Administrator / Manager</p>
        </div>
      </div>
      <Button variant="outline" size="sm" onClick={handleSignOut}>
        Sign Out
      </Button>
    </div>
  )
}
