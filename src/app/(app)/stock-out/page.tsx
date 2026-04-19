'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, ArrowUpFromLine } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'

export default function StockOutPage() {
  const [data, setData] = useState<any>({ transactions: [], total: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/stock-out').then(r => r.json()).then(d => { setData(d); setLoading(false) })
  }, [])

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>จ่ายสินค้าออก</h1>
          <p style={{ color: '#64748b', margin: '4px 0 0', fontSize: '0.875rem' }}>ทั้งหมด {data.total} เอกสาร</p>
        </div>
        <Link href="/stock-out/new" className="btn btn-primary"><Plus size={16} /> สร้างเอกสารจ่ายออก</Link>
      </div>

      <div style={{ padding: '24px' }}>
        <div className="table-container">
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center' }}><div className="spinner" /></div>
          ) : data.transactions.length === 0 ? (
            <div className="empty-state"><ArrowUpFromLine size={40} color="#cbd5e1" /><p>ยังไม่มีเอกสารจ่ายออก</p></div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>เลขที่เอกสาร</th>
                  <th>คลัง</th>
                  <th>เลขอ้างอิง</th>
                  <th style={{ textAlign: 'center' }}>จำนวนรายการ</th>
                  <th>หมายเหตุ</th>
                  <th>ผู้ทำรายการ</th>
                  <th>วันที่</th>
                </tr>
              </thead>
              <tbody>
                {data.transactions.map((t: any) => (
                  <tr key={t.id}>
                    <td><span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#ef4444' }}>{t.transactionNo}</span></td>
                    <td>{t.warehouse?.name}</td>
                    <td>{t.referenceNo || <span style={{ color: '#94a3b8' }}>-</span>}</td>
                    <td style={{ textAlign: 'center' }}>{t.totalItems}</td>
                    <td>{t.note || <span style={{ color: '#94a3b8' }}>-</span>}</td>
                    <td>{t.createdBy?.fullName}</td>
                    <td style={{ color: '#64748b', fontSize: '0.8rem' }}>{formatDateTime(t.createdAt)}</td>
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
