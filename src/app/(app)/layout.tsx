import type { Metadata } from 'next'
import Sidebar from '@/components/Sidebar'
import Providers from '@/components/Providers'

export const metadata: Metadata = {
  title: 'ระบบคลังสินค้า',
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <div style={{ display: 'flex' }}>
        <Sidebar />
        <main className="main-content" style={{ flex: 1 }}>
          <div style={{ padding: '0', paddingTop: '0' }}>
            {children}
          </div>
        </main>
      </div>
    </Providers>
  )
}
