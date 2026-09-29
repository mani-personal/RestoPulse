'use client'
import { browserDb as supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export function ProfileHeader() {
  const router = useRouter()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <div className="flex items-center justify-between p-4 border-b bg-white">
      <span className="font-bold text-lg">RestoPulse Dashboard</span>
      <Button variant="outline" onClick={handleSignOut}>
        Sign Off / Logout
      </Button>
    </div>
  )
}
