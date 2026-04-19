'use client'

import { useEffect, useState, useCallback } from 'react'
import { Plus, Edit2, Trash2 } from 'lucide-react'

function MasterTable({ resource, title, columns, renderRow, renderForm }: any) {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [formData, setFormData] = useState<any>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const fetch_ = useCallback(async () => {
    setLoading(true)
    const r = await fetch(`/api/master/${resource}`)
    setData(await r.json())
    setLoading(false)
  }, [resource])

  useEffect(() => { fetch_() }, [fetch_])

  async function handleSave() {
    setSaving(true); setError('')
    const method = editing ? 'PUT' : 'POST'
    const body = editing ? { id: editing.id, ...formData } : formData
    const r = await fetch(`/api/master/${resource}`, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    const d = await r.json()
    if (!r.ok) { setError(d.error || 'เกิดข้อผิดพลาด'); setSaving(false); return }
    setShowModal(false); fetch_(); setSaving(false)
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`ต้องการลบ "${name}" ใช่หรือไม่?`)) return
    await fetch(`/api/master/${resource}?id=${id}`, { method: 'DELETE' })
    fetch_()
  }

  return (
    <div className="card" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>{title}</h2>
        <button className="btn btn-primary btn-sm" onClick={() => { setEditing(null); setFormData({}); setError(''); setShowModal(true) }}>
          <Plus size={14} /> เพิ่ม
        </button>
      </div>
      {loading ? <div style={{ textAlign: 'center', padding: '20px' }}><div className="spinner" /></div> : (
        <div className="table-container">
          <table>
            <thead><tr>{columns.map((c: string) => <th key={c}>{c}</th>)}<th style={{ textAlign: 'center' }}>จัดการ</th></tr></thead>
            <tbody>
              {data.length === 0 ? (
                <tr><td colSpan={columns.length + 1} style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>ยังไม่มีข้อมูล</td></tr>
              ) : data.map((item: any) => (
                <tr key={item.id}>
                  {renderRow(item)}
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => { setEditing(item); setFormData(item); setError(''); setShowModal(true) }}><Edit2 size={13} /></button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(item.id, item.name)}><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '1rem' }}>{editing ? 'แก้ไข' : 'เพิ่ม'}{title}</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              {error && <div className="alert alert-error" style={{ marginBottom: '12px' }}>{error}</div>}
              {renderForm(formData, setFormData)}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>ยกเลิก</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'กำลังบันทึก...' : 'บันทึก'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function CategoriesPage() {
  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>ข้อมูลพื้นฐาน</h1>
          <p style={{ color: '#64748b', margin: '4px 0 0', fontSize: '0.875rem' }}>จัดการหมวดหมู่ หน่วยนับ และผู้ขาย</p>
        </div>
      </div>

      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <MasterTable
          resource="categories" title="หมวดหมู่สินค้า"
          columns={['ชื่อหมวดหมู่', 'รายละเอียด']}
          renderRow={(item: any) => [
            <td key="name" style={{ fontWeight: 600 }}>{item.name}</td>,
            <td key="desc" style={{ color: '#64748b' }}>{item.description || '-'}</td>,
          ]}
          renderForm={(form: any, setForm: any) => (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div><label className="label">ชื่อหมวดหมู่ *</label><input className="input" value={form.name || ''} onChange={e => setForm((f: any) => ({ ...f, name: e.target.value }))} /></div>
              <div><label className="label">รายละเอียด</label><input className="input" value={form.description || ''} onChange={e => setForm((f: any) => ({ ...f, description: e.target.value }))} /></div>
            </div>
          )}
        />

        <MasterTable
          resource="units" title="หน่วยนับ"
          columns={['ชื่อหน่วย', 'ตัวย่อ']}
          renderRow={(item: any) => [
            <td key="name" style={{ fontWeight: 600 }}>{item.name}</td>,
            <td key="abbr">{item.abbreviation || '-'}</td>,
          ]}
          renderForm={(form: any, setForm: any) => (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div><label className="label">ชื่อหน่วย *</label><input className="input" value={form.name || ''} onChange={e => setForm((f: any) => ({ ...f, name: e.target.value }))} /></div>
              <div><label className="label">ตัวย่อ</label><input className="input" value={form.abbreviation || ''} onChange={e => setForm((f: any) => ({ ...f, abbreviation: e.target.value }))} /></div>
            </div>
          )}
        />

        <MasterTable
          resource="suppliers" title="ผู้ขาย / Supplier"
          columns={['รหัส', 'ชื่อ', 'ผู้ติดต่อ', 'โทรศัพท์', 'อีเมล']}
          renderRow={(item: any) => [
            <td key="code"><span style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{item.code}</span></td>,
            <td key="name" style={{ fontWeight: 600 }}>{item.name}</td>,
            <td key="contact" style={{ color: '#64748b' }}>{item.contactName || '-'}</td>,
            <td key="phone" style={{ color: '#64748b' }}>{item.phone || '-'}</td>,
            <td key="email" style={{ color: '#64748b' }}>{item.email || '-'}</td>,
          ]}
          renderForm={(form: any, setForm: any) => (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div><label className="label">รหัส *</label><input className="input" value={form.code || ''} onChange={e => setForm((f: any) => ({ ...f, code: e.target.value }))} /></div>
              <div><label className="label">ชื่อบริษัท *</label><input className="input" value={form.name || ''} onChange={e => setForm((f: any) => ({ ...f, name: e.target.value }))} /></div>
              <div><label className="label">ผู้ติดต่อ</label><input className="input" value={form.contactName || ''} onChange={e => setForm((f: any) => ({ ...f, contactName: e.target.value }))} /></div>
              <div><label className="label">โทรศัพท์</label><input className="input" value={form.phone || ''} onChange={e => setForm((f: any) => ({ ...f, phone: e.target.value }))} /></div>
              <div><label className="label">อีเมล</label><input className="input" value={form.email || ''} onChange={e => setForm((f: any) => ({ ...f, email: e.target.value }))} /></div>
              <div><label className="label">ที่อยู่</label><input className="input" value={form.address || ''} onChange={e => setForm((f: any) => ({ ...f, address: e.target.value }))} /></div>
            </div>
          )}
        />
      </div>
    </div>
  )
}
