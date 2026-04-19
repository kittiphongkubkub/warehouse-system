'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, ArrowUpFromLine, Search, AlertTriangle } from 'lucide-react'
import { formatNumber, formatDate } from '@/lib/utils'

type Item = { productId: string; productCode: string; productName: string; unitName: string; quantity: number; lotNumber: string; batchNumber: string; available: number; note: string }

export default function NewStockOutPage() {
  const router = useRouter()
  const [warehouses, setWarehouses] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [balances, setBalances] = useState<any[]>([])
  const [form, setForm] = useState({ warehouseId: '', referenceNo: '', note: '' })
  const [items, setItems] = useState<Item[]>([])
  const [productSearch, setProductSearch] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/master/warehouses').then(r => r.json()).then(d => { setWarehouses(d); if (d[0]) setForm(f => ({ ...f, warehouseId: d[0].id })) })
    fetch('/api/products?limit=200').then(r => r.json()).then(d => setProducts(d.products || []))
  }, [])

  useEffect(() => {
    if (form.warehouseId) {
      fetch(`/api/inventory?limit=500`).then(r => r.json()).then(d => setBalances(d.balances || []))
    }
  }, [form.warehouseId])

  const filteredProducts = products.filter(p =>
    p.currentStock > 0 &&
    (p.name.toLowerCase().includes(productSearch.toLowerCase()) || p.code.toLowerCase().includes(productSearch.toLowerCase()))
  ).slice(0, 10)

  function addProduct(p: any) {
    const productBalances = balances.filter(b => b.productId === p.id && b.quantity > 0)
    const totalAvailable = productBalances.reduce((sum: number, b: any) => sum + b.quantity, 0)
    const firstLot = productBalances[0]
    setItems(prev => [...prev, {
      productId: p.id, productCode: p.code, productName: p.name, unitName: p.unit?.abbreviation || p.unit?.name || '',
      quantity: 1, lotNumber: firstLot?.lotNumber || '', batchNumber: firstLot?.batchNumber || '',
      available: totalAvailable, note: ''
    }])
    setProductSearch('')
  }

  function updateItem(idx: number, field: keyof Item, value: any) {
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item))
  }

  function removeItem(idx: number) { setItems(prev => prev.filter((_, i) => i !== idx)) }

  async function handleSubmit() {
    if (!form.warehouseId || items.length === 0) { setError('กรุณาเลือกคลังและเพิ่มสินค้าอย่างน้อย 1 รายการ'); return }
    for (const item of items) {
      if (!item.quantity || item.quantity <= 0) { setError('กรุณากรอกจำนวนให้ถูกต้อง'); return }
      if (item.quantity > item.available) { setError(`สินค้า "${item.productName}" มีสต๊อกไม่เพียงพอ`); return }
    }
    setSaving(true); setError('')
    const r = await fetch('/api/stock-out', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        items: items.map(i => ({
          productId: i.productId, quantity: Number(i.quantity),
          lotNumber: i.lotNumber || null, batchNumber: i.batchNumber || null, note: i.note || null,
        }))
      })
    })
    const d = await r.json()
    if (!r.ok) { setError(d.error || 'เกิดข้อผิดพลาด'); setSaving(false); return }
    router.push('/stock-out')
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>สร้างเอกสารจ่ายสินค้าออก</h1>
          <p style={{ color: '#64748b', margin: '4px 0 0', fontSize: '0.875rem' }}>บันทึกการจ่ายสินค้าออกจากคลัง</p>
        </div>
        <button className="btn btn-secondary" onClick={() => router.back()}>ยกเลิก</button>
      </div>

      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {error && <div className="alert alert-error"><AlertTriangle size={16} /> {error}</div>}

        <div className="card" style={{ padding: '20px' }}>
          <h2 style={{ margin: '0 0 16px', fontSize: '1rem', fontWeight: 600 }}>ข้อมูลเอกสาร</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div>
              <label className="label">คลังสินค้า *</label>
              <select className="select" value={form.warehouseId} onChange={e => setForm(f => ({ ...f, warehouseId: e.target.value }))}>
                {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">เลขที่อ้างอิง</label>
              <input className="input" value={form.referenceNo} onChange={e => setForm(f => ({ ...f, referenceNo: e.target.value }))} placeholder="เลขที่ใบเบิก ฯลฯ" />
            </div>
            <div>
              <label className="label">หมายเหตุ</label>
              <input className="input" value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} placeholder="หมายเหตุ" />
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <h2 style={{ margin: '0 0 16px', fontSize: '1rem', fontWeight: 600 }}>รายการสินค้า (มีสต๊อกเท่านั้น)</h2>
          <div style={{ position: 'relative', marginBottom: '16px' }}>
            <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input className="input" style={{ paddingLeft: '36px' }} value={productSearch} onChange={e => setProductSearch(e.target.value)} placeholder="ค้นหาสินค้าที่มีสต๊อก..." />
            {productSearch && filteredProducts.length > 0 && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10, background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', marginTop: '4px' }}>
                {filteredProducts.map(p => (
                  <button key={p.id} onClick={() => addProduct(p)} style={{ width: '100%', padding: '10px 14px', border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left', display: 'flex', gap: '8px', alignItems: 'center' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                    <span style={{ fontFamily: 'monospace', color: '#64748b', fontSize: '0.8rem', minWidth: '70px' }}>{p.code}</span>
                    <span style={{ fontWeight: 500 }}>{p.name}</span>
                    <span className="badge badge-green" style={{ marginLeft: 'auto' }}>คงเหลือ: {formatNumber(p.currentStock)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {items.length === 0 ? (
            <div className="empty-state" style={{ padding: '32px' }}>
              <ArrowUpFromLine size={32} color="#cbd5e1" /><p>ค้นหาและเพิ่มสินค้าด้านบน</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>รหัส</th><th>ชื่อสินค้า</th><th>Lot No.</th><th>Batch No.</th>
                    <th style={{ textAlign: 'center' }}>จำนวน *</th><th>หน่วย</th>
                    <th style={{ textAlign: 'center' }}>สต๊อกคงเหลือ</th><th></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={idx} style={{ background: item.quantity > item.available ? '#fef2f2' : 'transparent' }}>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#64748b' }}>{item.productCode}</td>
                      <td style={{ fontWeight: 600 }}>{item.productName}</td>
                      <td><input className="input" value={item.lotNumber} onChange={e => updateItem(idx, 'lotNumber', e.target.value)} placeholder="Lot" style={{ width: '90px' }} /></td>
                      <td><input className="input" value={item.batchNumber} onChange={e => updateItem(idx, 'batchNumber', e.target.value)} placeholder="Batch" style={{ width: '90px' }} /></td>
                      <td>
                        <input type="number" min="0.01" max={item.available} step="any" value={item.quantity} onChange={e => updateItem(idx, 'quantity', Number(e.target.value))}
                          className="input" style={{ width: '90px', textAlign: 'center', borderColor: item.quantity > item.available ? '#ef4444' : '' }} />
                      </td>
                      <td style={{ textAlign: 'center', color: '#64748b' }}>{item.unitName}</td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{ fontWeight: 600, color: item.quantity > item.available ? '#ef4444' : '#10b981' }}>
                          {formatNumber(item.available)}
                          {item.quantity > item.available && <AlertTriangle size={12} style={{ marginLeft: '4px', verticalAlign: 'middle' }} />}
                        </span>
                      </td>
                      <td><button className="btn btn-danger btn-sm" onClick={() => removeItem(idx)}><Trash2 size={13} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button className="btn btn-secondary" onClick={() => router.back()}>ยกเลิก</button>
          <button className="btn btn-primary btn-lg" style={{ background: '#ef4444' }} onClick={handleSubmit} disabled={saving || items.length === 0}>
            {saving ? <><span className="spinner" style={{ width: '16px', height: '16px' }} /> กำลังบันทึก...</> : <><ArrowUpFromLine size={16} /> บันทึกจ่ายสินค้าออก ({items.length} รายการ)</>}
          </button>
        </div>
      </div>
    </div>
  )
}
