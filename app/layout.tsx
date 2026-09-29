import { ProfileHeader } from '@/components/ProfileHeader'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ProfileHeader />
        {children}
      </body>
    </html>
  )
}
