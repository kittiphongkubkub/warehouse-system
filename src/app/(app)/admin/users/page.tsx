'use client'

import { useEffect, useState, useCallback } from 'react'
import { Plus, Edit2, Trash2, Users, Shield } from 'lucide-react'

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [roles, setRoles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ username: '', email: '', fullName: '', password: '', roleIds: [] as string[] })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    const r = await fetch('/api/users')
    const d = await r.json()
    setUsers(d.users || [])
    setRoles(d.roles || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  function openAdd() {
    setEditing(null)
    setForm({ username: '', email: '', fullName: '', password: '', roleIds: [] })
    setError('')
    setShowModal(true)
  }

  function openEdit(u: any) {
    setEditing(u)
    setForm({
      username: u.username,
      email: u.email || '',
      fullName: u.fullName,
      password: '',
      roleIds: u.userRoles.map((ur: any) => ur.role.id)
    })
    setError('')
    setShowModal(true)
  }

  function toggleRole(roleId: string) {
    setForm(f => ({
      ...f,
      roleIds: f.roleIds.includes(roleId) ? f.roleIds.filter(id => id !== roleId) : [...f.roleIds, roleId]
    }))
  }

  async function handleSave() {
    if (!form.username || !form.fullName) { setError('กรุณากรอกชื่อผู้ใช้และชื่อ-นามสกุล'); return }
    if (!editing && !form.password) { setError('กรุณากรอกรหัสผ่าน'); return }
    setSaving(true); setError('')

    const method = editing ? 'PUT' : 'POST'
    const body = editing
      ? { id: editing.id, ...form, password: form.password || undefined }
      : form

    const r = await fetch('/api/users', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    const d = await r.json()
    if (!r.ok) { setError(d.error || 'เกิดข้อผิดพลาด'); setSaving(false); return }
    setShowModal(false); fetchData(); setSaving(false)
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`ต้องการลบผู้ใช้ "${name}" ใช่หรือไม่?`)) return
    const r = await fetch(`/api/users?id=${id}`, { method: 'DELETE' })
    const d = await r.json()
    if (!r.ok) { alert(d.error); return }
    fetchData()
  }

  const roleColors: Record<string, string> = {
    Admin: 'badge-red', Manager: 'badge-blue', Staff: 'badge-green', Viewer: 'badge-gray'
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>จัดการผู้ใช้</h1>
          <p style={{ color: '#64748b', margin: '4px 0 0', fontSize: '0.875rem' }}>ทั้งหมด {users.length} ผู้ใช้</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> เพิ่มผู้ใช้</button>
      </div>

      <div style={{ padding: '24px' }}>
        {/* Role Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px', marginBottom: '24px' }}>
          {roles.map(role => {
            const count = users.filter(u => u.userRoles.some((ur: any) => ur.role.id === role.id)).length
            return (
              <div key={role.id} className="card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Shield size={18} color="#2563eb" />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1.25rem' }}>{count}</div>
                  <div style={{ color: '#64748b', fontSize: '0.8rem' }}>{role.name}</div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="table-container">
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center' }}><div className="spinner" /></div>
          ) : users.length === 0 ? (
            <div className="empty-state"><Users size={40} color="#cbd5e1" /><p>ยังไม่มีผู้ใช้</p></div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>ชื่อ-นามสกุล</th>
                  <th>ชื่อผู้ใช้</th>
                  <th>อีเมล</th>
                  <th>บทบาท</th>
                  <th style={{ textAlign: 'center' }}>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u: any) => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
                          background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: 'white', fontWeight: 700, fontSize: '0.9rem',
                        }}>
                          {u.fullName[0].toUpperCase()}
                        </div>
                        <span style={{ fontWeight: 600 }}>{u.fullName}</span>
                      </div>
                    </td>
                    <td style={{ fontFamily: 'monospace', color: '#64748b' }}>{u.username}</td>
                    <td style={{ color: '#64748b' }}>{u.email || '-'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {u.userRoles.length === 0
                          ? <span className="badge badge-gray">ไม่มี Role</span>
                          : u.userRoles.map((ur: any) => (
                            <span key={ur.role.id} className={`badge ${roleColors[ur.role.name] || 'badge-gray'}`}>
                              {ur.role.name}
                            </span>
                          ))}
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(u)} title="แก้ไข"><Edit2 size={14} /></button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(u.id, u.fullName)} title="ลบ"><Trash2 size={14} /></button>
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
              <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>
                {editing ? 'แก้ไขผู้ใช้' : 'เพิ่มผู้ใช้ใหม่'}
              </h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              {error && <div className="alert alert-error" style={{ marginBottom: '16px' }}>{error}</div>}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="label">ชื่อ-นามสกุล *</label>
                  <input className="input" value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))} placeholder="ชื่อ-นามสกุล" />
                </div>
                <div>
                  <label className="label">ชื่อผู้ใช้ (username) *</label>
                  <input className="input" value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} placeholder="username" />
                </div>
                <div>
                  <label className="label">อีเมล</label>
                  <input className="input" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@example.com" />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="label">{editing ? 'รหัสผ่านใหม่ (ปล่อยว่างถ้าไม่ต้องการเปลี่ยน)' : 'รหัสผ่าน *'}</label>
                  <input className="input" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="รหัสผ่าน" />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="label" style={{ marginBottom: '8px' }}>บทบาท (Role)</label>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {roles.map(role => (
                      <button
                        key={role.id}
                        type="button"
                        onClick={() => toggleRole(role.id)}
                        className={`btn ${form.roleIds.includes(role.id) ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ padding: '6px 14px', fontSize: '0.85rem' }}
                      >
                        {form.roleIds.includes(role.id) ? '✓ ' : ''}{role.name}
                      </button>
                    ))}
                  </div>
                  {roles.map(role => (
                    form.roleIds.includes(role.id) && (
                      <p key={role.id} style={{ color: '#64748b', fontSize: '0.75rem', margin: '6px 0 0' }}>
                        {role.description}
                      </p>
                    )
                  ))}
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
