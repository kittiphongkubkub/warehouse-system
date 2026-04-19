'use client'

import { useEffect, useState } from 'react'
import { Package, ArrowDownToLine, ArrowUpFromLine, AlertTriangle, TrendingUp, Clock, Calendar } from 'lucide-react'
import { formatDate, formatDateTime, formatNumber } from '@/lib/utils'
import Link from 'next/link'

export default function DashboardPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard').then(r => r.json()).then(d => { setData(d); setLoading(false) })
  }, [])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', flexDirection: 'column', gap: '12px' }}>
      <div className="spinner" style={{ width: '40px', height: '40px' }} />
      <p style={{ color: '#64748b' }}>กำลังโหลดข้อมูล...</p>
    </div>
  )

  const { stats, recentTransactions, lowStockProducts, expiringBalances } = data

  const statCards = [
    { label: 'สินค้าทั้งหมด', value: formatNumber(stats.totalProducts), icon: Package, color: '#2563eb', bg: '#dbeafe', change: 'รายการ' },
    { label: 'รับเข้าวันนี้', value: formatNumber(stats.todayStockIn), icon: ArrowDownToLine, color: '#10b981', bg: '#dcfce7', change: 'เอกสาร' },
    { label: 'จ่ายออกวันนี้', value: formatNumber(stats.todayStockOut), icon: ArrowUpFromLine, color: '#f59e0b', bg: '#fef9c3', change: 'เอกสาร' },
    { label: 'สินค้าใกล้หมด', value: formatNumber(stats.lowStockCount), icon: AlertTriangle, color: '#ef4444', bg: '#fee2e2', change: 'รายการ' },
    { label: 'ใกล้หมดอายุ (30 วัน)', value: formatNumber(stats.expiringSoon), icon: Calendar, color: '#8b5cf6', bg: '#ede9fe', change: 'lot' },
    { label: 'ยอดรวมคงเหลือ', value: formatNumber(stats.totalQuantity), icon: TrendingUp, color: '#06b6d4', bg: '#cffafe', change: 'หน่วย' },
  ]

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Dashboard</h1>
          <p style={{ color: '#64748b', margin: '4px 0 0', fontSize: '0.875rem' }}>ภาพรวมระบบคลังสินค้า</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Link href="/stock-in/new" className="btn btn-primary btn-sm">
            <ArrowDownToLine size={14} /> รับสินค้าเข้า
          </Link>
          <Link href="/stock-out/new" className="btn btn-secondary btn-sm">
            <ArrowUpFromLine size={14} /> จ่ายสินค้าออก
          </Link>
        </div>
      </div>

      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Stat Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
          {statCards.map((card) => (
            <div key={card.label} className="stat-card">
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <card.icon size={22} color={card.color} />
              </div>
              <div>
                <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#0f172a', lineHeight: 1 }}>{card.value}</div>
                <div style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '4px' }}>{card.label}</div>
                <div style={{ color: card.color, fontSize: '0.7rem', fontWeight: 600 }}>{card.change}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {/* Low Stock Alert */}
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={18} color="#ef4444" /> สินค้าใกล้หมด
              </h2>
              <Link href="/reports?tab=low-stock" className="btn btn-ghost btn-sm">ดูทั้งหมด</Link>
            </div>
            {lowStockProducts.length === 0 ? (
              <div className="empty-state" style={{ padding: '24px' }}>
                <p>ไม่มีสินค้าใกล้หมด 🎉</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {lowStockProducts.map((p: any) => (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: '#fef2f2', borderRadius: '8px', border: '1px solid #fecaca' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{p.name}</div>
                      <div style={{ color: '#64748b', fontSize: '0.75rem' }}>{p.code}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 700, color: '#ef4444' }}>{formatNumber(p.currentStock)}</div>
                      <div style={{ color: '#64748b', fontSize: '0.7rem' }}>min: {formatNumber(p.minStock)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Expiring Soon */}
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={18} color="#8b5cf6" /> ใกล้หมดอายุ (30 วัน)
              </h2>
              <Link href="/inventory" className="btn btn-ghost btn-sm">ดูทั้งหมด</Link>
            </div>
            {expiringBalances.length === 0 ? (
              <div className="empty-state" style={{ padding: '24px' }}>
                <p>ไม่มีสินค้าใกล้หมดอายุ 🎉</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {expiringBalances.map((b: any) => (
                  <div key={b.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: '#faf5ff', borderRadius: '8px', border: '1px solid #ddd6fe' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{b.product.name}</div>
                      <div style={{ color: '#64748b', fontSize: '0.75rem' }}>
                        {b.lotNumber && `Lot: ${b.lotNumber}`} {b.batchNumber && `| Batch: ${b.batchNumber}`}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 700, color: '#8b5cf6' }}>{formatNumber(b.quantity)}</div>
                      <div style={{ color: '#64748b', fontSize: '0.7rem' }}>หมด: {formatDate(b.expiryDate)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={18} color="#2563eb" /> รายการล่าสุด
            </h2>
          </div>
          {recentTransactions.length === 0 ? (
            <div className="empty-state"><p>ยังไม่มีรายการ</p></div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>เลขที่เอกสาร</th>
                    <th>ประเภท</th>
                    <th>คลัง</th>
                    <th>จำนวนรายการ</th>
                    <th>ผู้ทำรายการ</th>
                    <th>วันที่</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTransactions.map((t: any) => (
                    <tr key={t.id}>
                      <td><span style={{ fontWeight: 600, fontFamily: 'monospace', fontSize: '0.85rem' }}>{t.transactionNo}</span></td>
                      <td>
                        <span className={`badge ${t.type === 'STOCK_IN' ? 'badge-green' : 'badge-red'}`}>
                          {t.type === 'STOCK_IN' ? '▼ รับเข้า' : '▲ จ่ายออก'}
                        </span>
                      </td>
                      <td>{t.warehouse?.name}</td>
                      <td>{t.totalItems} รายการ</td>
                      <td>{t.createdBy?.fullName}</td>
                      <td style={{ color: '#64748b', fontSize: '0.8rem' }}>{formatDateTime(t.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
