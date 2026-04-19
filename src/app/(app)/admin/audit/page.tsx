'use client'

import { useEffect, useState } from 'react'
import { ClipboardList, Filter } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'badge-green', UPDATE: 'badge-blue', DELETE: 'badge-red',
  STOCK_IN: 'badge-green', STOCK_OUT: 'badge-orange',
}

export default function AuditPage() {
  const [data, setData] = useState<any>({ logs: [], total: 0 })
  const [loading, setLoading] = useState(true)
  const [module, setModule] = useState('')

  useEffect(() => {
    setLoading(true)
    const params = module ? `?module=${module}` : ''
    fetch(`/api/audit${params}`).then(r => r.json()).then(d => { setData(d); setLoading(false) })
  }, [module])

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Audit Log</h1>
          <p style={{ color: '#64748b', margin: '4px 0 0', fontSize: '0.875rem' }}>ประวัติการเปลี่ยนแปลงทั้งหมด {data.total} รายการ</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={16} color="#64748b" />
          <select className="select" value={module} onChange={e => setModule(e.target.value)} style={{ width: '160px' }}>
            <option value="">ทุก Module</option>
            <option value="products">สินค้า</option>
            <option value="inventory">คลังสินค้า</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      </div>

      <div style={{ padding: '24px' }}>
        <div className="table-container">
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center' }}><div className="spinner" /></div>
          ) : data.logs.length === 0 ? (
            <div className="empty-state"><ClipboardList size={40} color="#cbd5e1" /><p>ยังไม่มีประวัติ</p></div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>วันที่-เวลา</th><th>ผู้ใช้</th><th>Action</th><th>Module</th>
                  <th>Target ID</th><th>ประเภท</th>
                </tr>
              </thead>
              <tbody>
                {data.logs.map((log: any) => (
                  <tr key={log.id}>
                    <td style={{ fontSize: '0.8rem', color: '#64748b', whiteSpace: 'nowrap' }}>{formatDateTime(log.createdAt)}</td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{log.user?.fullName}</div>
                      <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>{log.user?.username}</div>
                    </td>
                    <td>
                      <span className={`badge ${ACTION_COLORS[log.action] || 'badge-gray'}`}>{log.action}</span>
                    </td>
                    <td><span className="badge badge-gray">{log.module}</span></td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#64748b' }}>{log.targetId?.slice(0, 12)}...</td>
                    <td style={{ color: '#64748b', fontSize: '0.8rem' }}>{log.targetType}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
