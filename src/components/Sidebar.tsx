'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import {
  LayoutDashboard, Package, ArrowDownToLine, ArrowUpFromLine,
  BarChart3, Users, ClipboardList, Settings, LogOut, Menu, X,
  ChevronRight, Warehouse, Tag, Scale, Truck, FileText
} from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/products', label: 'สินค้า', icon: Package },
  { href: '/stock-in', label: 'รับสินค้าเข้า', icon: ArrowDownToLine },
  { href: '/stock-out', label: 'จ่ายสินค้าออก', icon: ArrowUpFromLine },
  { href: '/inventory', label: 'ยอดคงเหลือ', icon: Warehouse },
  { href: '/reports', label: 'รายงาน', icon: BarChart3 },
  {
    label: 'ข้อมูลพื้นฐาน',
    icon: Settings,
    children: [
      { href: '/master/categories', label: 'หมวดหมู่', icon: Tag },
      { href: '/master/units', label: 'หน่วยนับ', icon: Scale },
      { href: '/master/suppliers', label: 'ผู้ขาย', icon: Truck },
    ]
  },
  { href: '/admin/users', label: 'จัดการผู้ใช้', icon: Users },
  { href: '/admin/audit', label: 'Audit Log', icon: ClipboardList },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [open, setOpen] = useState(false)
  const [masterOpen, setMasterOpen] = useState(false)

  // Auto-open master group if on master page
  useEffect(() => {
    if (pathname.startsWith('/master')) setMasterOpen(true)
  }, [pathname])

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={`sidebar-overlay ${open ? 'open' : ''}`}
        onClick={() => setOpen(false)}
      />

      {/* Mobile top bar */}
      <div style={{
        display: 'none',
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 30,
        background: '#0f172a', padding: '12px 16px',
        alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
      }} className="mobile-topbar">
        <button onClick={() => setOpen(true)} className="btn btn-ghost" style={{ color: 'white', padding: '6px' }}>
          <Menu size={22} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'white', fontWeight: 600 }}>
          <Package size={20} color="#2563eb" />
          ระบบคลังสินค้า
        </div>
        <div style={{ width: '34px' }} />
      </div>

      {/* Sidebar */}
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        {/* Logo */}
        <div style={{ padding: '20px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '10px',
                background: 'linear-gradient(135deg, #2563eb, #06b6d4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Package size={20} color="white" />
              </div>
              <div>
                <div style={{ color: 'white', fontWeight: 700, fontSize: '0.9rem', lineHeight: 1.2 }}>ระบบคลังสินค้า</div>
                <div style={{ color: '#64748b', fontSize: '0.7rem' }}>WMS v1.0</div>
              </div>
            </div>
            <button className="btn btn-ghost" style={{ color: '#64748b', padding: '4px', display: 'none' }} onClick={() => setOpen(false)} id="close-sidebar">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ padding: '12px 8px', flex: 1 }}>
          {navItems.map((item) => {
            if (item.children) {
              return (
                <div key={item.label}>
                  <button
                    onClick={() => setMasterOpen(!masterOpen)}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '9px 10px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                      background: masterOpen ? 'rgba(37,99,235,0.15)' : 'transparent',
                      color: masterOpen ? '#60a5fa' : '#94a3b8',
                      fontSize: '0.875rem', fontWeight: 500,
                      transition: 'all 0.15s', marginBottom: '2px',
                    }}
                  >
                    <item.icon size={18} />
                    <span style={{ flex: 1, textAlign: 'left' }}>{item.label}</span>
                    <ChevronRight size={14} style={{ transform: masterOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
                  </button>
                  {masterOpen && (
                    <div style={{ paddingLeft: '12px', marginBottom: '4px' }}>
                      {item.children.map(child => (
                        <Link
                          key={child.href}
                          href={child.href}
                          onClick={() => setOpen(false)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '10px',
                            padding: '8px 10px', borderRadius: '8px',
                            color: isActive(child.href) ? '#60a5fa' : '#94a3b8',
                            background: isActive(child.href) ? 'rgba(37,99,235,0.15)' : 'transparent',
                            fontSize: '0.85rem', fontWeight: isActive(child.href) ? 600 : 400,
                            textDecoration: 'none', marginBottom: '2px',
                            transition: 'all 0.15s',
                          }}
                        >
                          <child.icon size={15} />
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )
            }

            return (
              <Link
                key={item.href}
                href={item.href!}
                onClick={() => setOpen(false)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '9px 10px', borderRadius: '8px',
                  color: isActive(item.href!) ? '#60a5fa' : '#94a3b8',
                  background: isActive(item.href!) ? 'rgba(37,99,235,0.15)' : 'transparent',
                  fontSize: '0.875rem', fontWeight: isActive(item.href!) ? 600 : 400,
                  textDecoration: 'none', marginBottom: '2px',
                  transition: 'all 0.15s',
                  borderLeft: isActive(item.href!) ? '3px solid #2563eb' : '3px solid transparent',
                }}
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* User */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontWeight: 700, fontSize: '0.9rem', flexShrink: 0,
            }}>
              {((session?.user as any)?.fullName || 'U')[0].toUpperCase()}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ color: 'white', fontWeight: 600, fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {(session?.user as any)?.fullName || session?.user?.name}
              </div>
              <div style={{ color: '#64748b', fontSize: '0.75rem' }}>
                {((session?.user as any)?.roles || []).join(', ')}
              </div>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="btn btn-ghost"
            style={{ width: '100%', color: '#ef4444', justifyContent: 'center', gap: '6px', fontSize: '0.85rem' }}
          >
            <LogOut size={16} />
            ออกจากระบบ
          </button>
        </div>
      </aside>

      <style>{`
        @media (max-width: 768px) {
          .mobile-topbar { display: flex !important; }
          #close-sidebar { display: flex !important; }
        }
      `}</style>
    </>
  )
}
