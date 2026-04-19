'use client'

import { useEffect, useState, useCallback } from 'react'
import { Plus, Search, Edit2, Trash2, Package, Filter, AlertTriangle } from 'lucide-react'
import { formatNumber, formatCurrency } from '@/lib/utils'

type Product = {
  id: string; code: string; name: string; description?: string
  categoryId: string; unitId: string; minStock: number
  costPrice?: number; salePrice?: number; currentStock: number
  category: { name: string }; unit: { name: string; abbreviation?: string }
}

type Category = { id: string; name: string }

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [units, setUnits] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [form, setForm] = useState({ code: '', name: '', description: '', categoryId: '', unitId: '', minStock: 0, costPrice: '', salePrice: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ search, ...(categoryFilter && { categoryId: categoryFilter }) })
    const r = await fetch(`/api/products?${params}`)
    const d = await r.json()
    setProducts(d.products || [])
    setTotal(d.total || 0)
    setLoading(false)
  }, [search, categoryFilter])

  useEffect(() => {
    fetch('/api/master/categories').then(r => r.json()).then(setCategories)
    fetch('/api/master/units').then(r => r.json()).then(setUnits)
  }, [])

  useEffect(() => { fetchProducts() }, [fetchProducts])

  function openAdd() {
    setEditing(null)
    setForm({ code: '', name: '', description: '', categoryId: '', unitId: '', minStock: 0, costPrice: '', salePrice: '' })
    setError('')
    setShowModal(true)
  }

  function openEdit(p: Product) {
    setEditing(p)
    setForm({ code: p.code, name: p.name, description: p.description || '', categoryId: p.categoryId, unitId: p.unitId, minStock: p.minStock, costPrice: p.costPrice?.toString() || '', salePrice: p.salePrice?.toString() || '' })
    setError('')
    setShowModal(true)
  }

  async function handleSave() {
    if (!form.code || !form.name || !form.categoryId || !form.unitId) { setError('กรุณากรอกข้อมูลที่จำเป็น'); return }
    setSaving(true); setError('')
    const body = { ...form, minStock: Number(form.minStock), costPrice: form.costPrice ? Number(form.costPrice) : null, salePrice: form.salePrice ? Number(form.salePrice) : null }
    const url = editing ? `/api/products/${editing.id}` : '/api/products'
    const method = editing ? 'PUT' : 'POST'
    const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    const d = await r.json()
    if (!r.ok) { setError(d.error || 'เกิดข้อผิดพลาด'); setSaving(false); return }
    setShowModal(false)
    fetchProducts()
    setSaving(false)
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`ต้องการลบสินค้า "${name}" ใช่หรือไม่?`)) return
    await fetch(`/api/products/${id}`, { method: 'DELETE' })
    fetchProducts()
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>จัดการสินค้า</h1>
          <p style={{ color: '#64748b', margin: '4px 0 0', fontSize: '0.875rem' }}>ทั้งหมด {total} รายการ</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> เพิ่มสินค้า</button>
      </div>

      <div style={{ padding: '24px' }}>
        {/* Filters */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
            <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input className="input" placeholder="ค้นหาสินค้า (ชื่อ, รหัส)..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: '36px' }} />
          </div>
          <select className="select" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} style={{ width: '180px' }}>
            <option value="">ทุกหมวดหมู่</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        {/* Table */}
        <div className="table-container">
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center' }}><div className="spinner" /></div>
          ) : products.length === 0 ? (
            <div className="empty-state"><Package size={40} color="#cbd5e1" /><p>ไม่พบสินค้า</p></div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>รหัสสินค้า</th>
                  <th>ชื่อสินค้า</th>
                  <th>หมวดหมู่</th>
                  <th>หน่วย</th>
                  <th style={{ textAlign: 'right' }}>คงเหลือ</th>
                  <th style={{ textAlign: 'right' }}>Min Stock</th>
                  <th style={{ textAlign: 'right' }}>ราคาทุน</th>
                  <th style={{ textAlign: 'center' }}>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.id}>
                    <td><span style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '0.85rem' }}>{p.code}</span></td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{p.name}</div>
                      {p.description && <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>{p.description}</div>}
                    </td>
                    <td><span className="badge badge-blue">{p.category?.name}</span></td>
                    <td>{p.unit?.abbreviation || p.unit?.name}</td>
                    <td style={{ textAlign: 'right' }}>
                      <span style={{ fontWeight: 700, color: p.currentStock <= p.minStock && p.minStock > 0 ? '#ef4444' : '#0f172a' }}>
                        {formatNumber(p.currentStock)}
                        {p.currentStock <= p.minStock && p.minStock > 0 && <AlertTriangle size={12} style={{ marginLeft: '4px', verticalAlign: 'middle', color: '#ef4444' }} />}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', color: '#64748b' }}>{formatNumber(p.minStock)}</td>
                    <td style={{ textAlign: 'right', color: '#64748b' }}>{p.costPrice ? formatCurrency(p.costPrice) : '-'}</td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(p)} title="แก้ไข"><Edit2 size={14} /></button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p.id, p.name)} title="ลบ"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>{editing ? 'แก้ไขสินค้า' : 'เพิ่มสินค้า'}</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              {error && <div className="alert alert-error" style={{ marginBottom: '16px' }}>{error}</div>}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label className="label">รหัสสินค้า *</label>
                  <input className="input" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} placeholder="PRD-001" />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="label">ชื่อสินค้า *</label>
                  <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="ชื่อสินค้า" />
                </div>
                <div>
                  <label className="label">หมวดหมู่ *</label>
                  <select className="select" value={form.categoryId} onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}>
                    <option value="">-- เลือกหมวดหมู่ --</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">หน่วยนับ *</label>
                  <select className="select" value={form.unitId} onChange={e => setForm(f => ({ ...f, unitId: e.target.value }))}>
                    <option value="">-- เลือกหน่วย --</option>
                    {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Min Stock</label>
                  <input className="input" type="number" min="0" value={form.minStock} onChange={e => setForm(f => ({ ...f, minStock: Number(e.target.value) }))} />
                </div>
                <div>
                  <label className="label">ราคาทุน</label>
                  <input className="input" type="number" min="0" step="0.01" value={form.costPrice} onChange={e => setForm(f => ({ ...f, costPrice: e.target.value }))} placeholder="0.00" />
                </div>
                <div>
                  <label className="label">ราคาขาย</label>
                  <input className="input" type="number" min="0" step="0.01" value={form.salePrice} onChange={e => setForm(f => ({ ...f, salePrice: e.target.value }))} placeholder="0.00" />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="label">รายละเอียด</label>
                  <textarea className="input" rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="รายละเอียดสินค้า (ถ้ามี)" style={{ resize: 'vertical' }} />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>ยกเลิก</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? <><span className="spinner" style={{ width: '14px', height: '14px' }} /> กำลังบันทึก...</> : 'บันทึก'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
