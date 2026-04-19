'use client'

import { useEffect, useState } from 'react'
import { BarChart3, TrendingDown, TrendingUp, AlertTriangle, Calendar } from 'lucide-react'
import { formatDate, formatDateTime, formatNumber } from '@/lib/utils'

export default function ReportsPage() {
  const [tab, setTab] = useState('balance')
  const [balances, setBalances] = useState<any[]>([])
  const [stockIn, setStockIn] = useState<any[]>([])
  const [stockOut, setStockOut] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      fetch('/api/inventory?limit=500').then(r => r.json()),
      fetch('/api/stock-in?limit=200').then(r => r.json()),
      fetch('/api/stock-out?limit=200').then(r => r.json()),
    ]).then(([inv, si, so]) => {
      setBalances(inv.balances || [])
      setStockIn(si.transactions || [])
      setStockOut(so.transactions || [])
      setLoading(false)
    })
  }, [])

  const tabs = [
    { id: 'balance', label: 'ยอดคงเหลือ', icon: BarChart3 },
    { id: 'stock-in', label: 'รายงานรับเข้า', icon: TrendingDown },
    { id: 'stock-out', label: 'รายงานจ่ายออก', icon: TrendingUp },
    { id: 'low-stock', label: 'สินค้าใกล้หมด', icon: AlertTriangle },
    { id: 'expiry', label: 'สินค้าใกล้หมดอายุ', icon: Calendar },
  ]

  // Summary by product for balance
  const byProduct: Record<string, any> = {}
  for (const b of balances) {
    if (!byProduct[b.productId]) byProduct[b.productId] = { product: b.product, total: 0 }
    byProduct[b.productId].total += b.quantity
  }
  const balanceSummary = Object.values(byProduct)

  const lowStockList = balanceSummary.filter((p: any) => p.total <= p.product.minStock && p.product.minStock > 0)

  const thirtyDaysLater = new Date(); thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30)
  const expiryList = balances.filter(b => b.expiryDate && new Date(b.expiryDate) <= thirtyDaysLater && b.quantity > 0)
    .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime())

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>รายงาน</h1>
          <p style={{ color: '#64748b', margin: '4px 0 0', fontSize: '0.875rem' }}>รายงานสรุปข้อมูลคลังสินค้า</p>
        </div>
      </div>

      <div style={{ padding: '24px' }}>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '4px' }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`btn ${tab === t.id ? 'btn-primary' : 'btn-secondary'}`} style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
              <t.icon size={14} /> {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}><div className="spinner" /></div>
        ) : tab === 'balance' ? (
          <div className="table-container">
            <table>
              <thead><tr><th>รหัสสินค้า</th><th>ชื่อสินค้า</th><th>หมวดหมู่</th><th>หน่วย</th><th style={{ textAlign: 'right' }}>ยอดคงเหลือ</th><th style={{ textAlign: 'right' }}>Min Stock</th><th>สถานะ</th></tr></thead>
              <tbody>
                {balanceSummary.map((p: any) => {
                  const isLow = p.total <= p.product.minStock && p.product.minStock > 0
                  return (
                    <tr key={p.product.id}>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{p.product.code}</td>
                      <td style={{ fontWeight: 600 }}>{p.product.name}</td>
                      <td><span className="badge badge-blue">{p.product.category?.name}</span></td>
                      <td>{p.product.unit?.abbreviation}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: isLow ? '#ef4444' : '#0f172a' }}>{formatNumber(p.total)}</td>
                      <td style={{ textAlign: 'right', color: '#64748b' }}>{formatNumber(p.product.minStock)}</td>
                      <td>{isLow ? <span className="badge badge-red">ต่ำกว่า Min</span> : <span className="badge badge-green">ปกติ</span>}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : tab === 'stock-in' ? (
          <div className="table-container">
            <table>
              <thead><tr><th>เลขที่เอกสาร</th><th>คลัง</th><th>ผู้ขาย</th><th>เลขอ้างอิง</th><th style={{ textAlign: 'center' }}>รายการ</th><th>ผู้ทำรายการ</th><th>วันที่</th></tr></thead>
              <tbody>
                {stockIn.map((t: any) => (
                  <tr key={t.id}>
                    <td><span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#10b981' }}>{t.transactionNo}</span></td>
                    <td>{t.warehouse?.name}</td><td>{t.supplier?.name || '-'}</td>
                    <td>{t.referenceNo || '-'}</td><td style={{ textAlign: 'center' }}>{t.totalItems}</td>
                    <td>{t.createdBy?.fullName}</td>
                    <td style={{ fontSize: '0.8rem', color: '#64748b' }}>{formatDateTime(t.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : tab === 'stock-out' ? (
          <div className="table-container">
            <table>
              <thead><tr><th>เลขที่เอกสาร</th><th>คลัง</th><th>เลขอ้างอิง</th><th style={{ textAlign: 'center' }}>รายการ</th><th>หมายเหตุ</th><th>ผู้ทำรายการ</th><th>วันที่</th></tr></thead>
              <tbody>
                {stockOut.map((t: any) => (
                  <tr key={t.id}>
                    <td><span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#ef4444' }}>{t.transactionNo}</span></td>
                    <td>{t.warehouse?.name}</td><td>{t.referenceNo || '-'}</td>
                    <td style={{ textAlign: 'center' }}>{t.totalItems}</td><td>{t.note || '-'}</td>
                    <td>{t.createdBy?.fullName}</td>
                    <td style={{ fontSize: '0.8rem', color: '#64748b' }}>{formatDateTime(t.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : tab === 'low-stock' ? (
          <div className="table-container">
            <table>
              <thead><tr><th>รหัสสินค้า</th><th>ชื่อสินค้า</th><th>หมวดหมู่</th><th style={{ textAlign: 'right' }}>คงเหลือ</th><th style={{ textAlign: 'right' }}>Min Stock</th><th style={{ textAlign: 'right' }}>ขาดอีก</th></tr></thead>
              <tbody>
                {lowStockList.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>🎉 ไม่มีสินค้าที่สต๊อกต่ำกว่า Min</td></tr>
                ) : lowStockList.map((p: any) => (
                  <tr key={p.product.id}>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{p.product.code}</td>
                    <td style={{ fontWeight: 600 }}>{p.product.name}</td>
                    <td><span className="badge badge-blue">{p.product.category?.name}</span></td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: '#ef4444' }}>{formatNumber(p.total)}</td>
                    <td style={{ textAlign: 'right' }}>{formatNumber(p.product.minStock)}</td>
                    <td style={{ textAlign: 'right', color: '#ef4444', fontWeight: 700 }}>{formatNumber(p.product.minStock - p.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead><tr><th>รหัสสินค้า</th><th>ชื่อสินค้า</th><th>Lot No.</th><th>Batch No.</th><th>วันหมดอายุ</th><th style={{ textAlign: 'right' }}>คงเหลือ</th><th>สถานะ</th></tr></thead>
              <tbody>
                {expiryList.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>🎉 ไม่มีสินค้าที่ใกล้หมดอายุ</td></tr>
                ) : expiryList.map((b: any) => {
                  const expired = new Date(b.expiryDate) < new Date()
                  return (
                    <tr key={b.id}>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{b.product.code}</td>
                      <td style={{ fontWeight: 600 }}>{b.product.name}</td>
                      <td>{b.lotNumber || '-'}</td><td>{b.batchNumber || '-'}</td>
                      <td style={{ color: expired ? '#ef4444' : '#d97706', fontWeight: 600 }}>{formatDate(b.expiryDate)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }}>{formatNumber(b.quantity)}</td>
                      <td>{expired ? <span className="badge badge-red">หมดอายุแล้ว</span> : <span className="badge badge-yellow">ใกล้หมด</span>}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
