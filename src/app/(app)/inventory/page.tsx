'use client'

import { useEffect, useState } from 'react'
import { Search, Warehouse, Calendar, AlertTriangle } from 'lucide-react'
import { formatDate, formatNumber, isExpired, isExpiringSoon } from '@/lib/utils'

export default function InventoryPage() {
  const [data, setData] = useState<any>({ balances: [], total: 0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [view, setView] = useState<'by-product' | 'by-lot'>('by-product')

  useEffect(() => {
    fetch('/api/inventory?limit=500').then(r => r.json()).then(d => { setData(d); setLoading(false) })
  }, [])

  // Group by product
  const byProduct: Record<string, any> = {}
  for (const b of (data.balances || [])) {
    if (!byProduct[b.productId]) {
      byProduct[b.productId] = { product: b.product, warehouse: b.warehouse, lots: [], total: 0 }
    }
    byProduct[b.productId].lots.push(b)
    byProduct[b.productId].total += b.quantity
  }

  const productList = Object.values(byProduct).filter((p: any) => {
    const s = search.toLowerCase()
    return !s || p.product.name.toLowerCase().includes(s) || p.product.code.toLowerCase().includes(s)
  })

  const filteredBalances = (data.balances || []).filter((b: any) => {
    const s = search.toLowerCase()
    return !s || b.product.name.toLowerCase().includes(s) || b.product.code.toLowerCase().includes(s)
  })

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>ยอดคงเหลือ</h1>
          <p style={{ color: '#64748b', margin: '4px 0 0', fontSize: '0.875rem' }}>ข้อมูลสต๊อกปัจจุบัน</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className={`btn ${view === 'by-product' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setView('by-product')}>แยกตามสินค้า</button>
          <button className={`btn ${view === 'by-lot' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setView('by-lot')}>แยกตาม Lot</button>
        </div>
      </div>

      <div style={{ padding: '24px' }}>
        <div style={{ marginBottom: '16px', position: 'relative', maxWidth: '400px' }}>
          <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input className="input" style={{ paddingLeft: '36px' }} value={search} onChange={e => setSearch(e.target.value)} placeholder="ค้นหาสินค้า..." />
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center' }}><div className="spinner" /></div>
        ) : view === 'by-product' ? (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>รหัสสินค้า</th><th>ชื่อสินค้า</th><th>หมวดหมู่</th><th>หน่วย</th>
                  <th style={{ textAlign: 'right' }}>ยอดคงเหลือรวม</th><th>จำนวน Lot</th><th>สถานะ</th>
                </tr>
              </thead>
              <tbody>
                {productList.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>ไม่พบข้อมูล</td></tr>
                ) : productList.map((p: any) => {
                  const hasExpired = p.lots.some((l: any) => l.expiryDate && isExpired(l.expiryDate) && l.quantity > 0)
                  const hasExpiringSoon = p.lots.some((l: any) => l.expiryDate && isExpiringSoon(l.expiryDate) && l.quantity > 0)
                  const isLow = p.total <= p.product.minStock && p.product.minStock > 0
                  return (
                    <tr key={p.product.id}>
                      <td><span style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '0.85rem' }}>{p.product.code}</span></td>
                      <td style={{ fontWeight: 600 }}>{p.product.name}</td>
                      <td><span className="badge badge-blue">{p.product.category?.name}</span></td>
                      <td>{p.product.unit?.abbreviation || p.product.unit?.name}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: isLow ? '#ef4444' : '#0f172a' }}>
                        {formatNumber(p.total)}
                        {isLow && <AlertTriangle size={12} style={{ marginLeft: '4px', color: '#ef4444', verticalAlign: 'middle' }} />}
                      </td>
                      <td style={{ textAlign: 'center', color: '#64748b' }}>{p.lots.length}</td>
                      <td>
                        {hasExpired && <span className="badge badge-red" style={{ marginRight: '4px' }}>หมดอายุ</span>}
                        {hasExpiringSoon && !hasExpired && <span className="badge badge-yellow">ใกล้หมดอายุ</span>}
                        {isLow && <span className="badge badge-orange">สต๊อกต่ำ</span>}
                        {!hasExpired && !hasExpiringSoon && !isLow && <span className="badge badge-green">ปกติ</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>รหัสสินค้า</th><th>ชื่อสินค้า</th><th>Lot No.</th><th>Batch No.</th>
                  <th>วันหมดอายุ</th><th style={{ textAlign: 'right' }}>คงเหลือ</th><th>หน่วย</th><th>สถานะ</th>
                </tr>
              </thead>
              <tbody>
                {filteredBalances.length === 0 ? (
                  <tr><td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>ไม่พบข้อมูล</td></tr>
                ) : filteredBalances.map((b: any) => {
                  const expired = b.expiryDate && isExpired(b.expiryDate)
                  const expiringSoon = b.expiryDate && isExpiringSoon(b.expiryDate)
                  return (
                    <tr key={b.id} style={{ background: expired ? '#fef2f2' : expiringSoon ? '#fefce8' : 'transparent' }}>
                      <td><span style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{b.product.code}</span></td>
                      <td style={{ fontWeight: 600 }}>{b.product.name}</td>
                      <td>{b.lotNumber || <span style={{ color: '#94a3b8' }}>-</span>}</td>
                      <td>{b.batchNumber || <span style={{ color: '#94a3b8' }}>-</span>}</td>
                      <td>
                        {b.expiryDate ? (
                          <span style={{ color: expired ? '#ef4444' : expiringSoon ? '#d97706' : '#0f172a', fontWeight: expired || expiringSoon ? 600 : 400 }}>
                            {formatDate(b.expiryDate)}
                          </span>
                        ) : <span style={{ color: '#94a3b8' }}>-</span>}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }}>{formatNumber(b.quantity)}</td>
                      <td style={{ color: '#64748b' }}>{b.product.unit?.abbreviation || b.product.unit?.name}</td>
                      <td>
                        {expired ? <span className="badge badge-red">หมดอายุ</span>
                          : expiringSoon ? <span className="badge badge-yellow">ใกล้หมดอายุ</span>
                          : <span className="badge badge-green">ปกติ</span>}
                      </td>
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
