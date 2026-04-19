import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/next-auth'
import { prisma } from '@/lib/prisma'
import { generateTransactionNo } from '@/lib/utils'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')

  const [transactions, total] = await Promise.all([
    prisma.inventoryTransaction.findMany({
      where: { type: 'STOCK_IN' },
      include: {
        createdBy: { select: { fullName: true } },
        supplier: { select: { name: true } },
        warehouse: { select: { name: true } },
        items: { include: { product: { select: { name: true, code: true } } } }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.inventoryTransaction.count({ where: { type: 'STOCK_IN' } })
  ])

  return NextResponse.json({ transactions, total, page, limit })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { supplierId, warehouseId, referenceNo, note, items } = body

  if (!warehouseId || !items || items.length === 0) {
    return NextResponse.json({ error: 'กรุณาเลือกคลังและเพิ่มรายการสินค้า' }, { status: 400 })
  }

  const transactionNo = generateTransactionNo('IN')

  try {
    const transaction = await prisma.$transaction(async (tx) => {
      // Create transaction header
      const txn = await tx.inventoryTransaction.create({
        data: {
          transactionNo,
          type: 'STOCK_IN',
          warehouseId,
          supplierId: supplierId || null,
          referenceNo,
          note,
          totalItems: items.length,
          createdById: (session.user as any).id,
          items: {
            create: items.map((item: any) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitCost: item.unitCost,
              lotNumber: item.lotNumber || null,
              batchNumber: item.batchNumber || null,
              expiryDate: item.expiryDate ? new Date(item.expiryDate) : null,
              note: item.note || null,
            }))
          }
        }
      })

      // Update inventory balances
      for (const item of items) {
        const lotKey = item.lotNumber || ''
        const batchKey = item.batchNumber || ''

        await tx.inventoryBalance.upsert({
          where: {
            productId_warehouseId_lotNumber_batchNumber: {
              productId: item.productId,
              warehouseId,
              lotNumber: lotKey,
              batchNumber: batchKey,
            }
          },
          update: { quantity: { increment: item.quantity }, expiryDate: item.expiryDate ? new Date(item.expiryDate) : undefined },
          create: {
            productId: item.productId,
            warehouseId,
            lotNumber: lotKey,
            batchNumber: batchKey,
            expiryDate: item.expiryDate ? new Date(item.expiryDate) : null,
            quantity: item.quantity,
          }
        })
      }

      return txn
    })

    await prisma.auditLog.create({
      data: {
        userId: (session.user as any).id,
        action: 'STOCK_IN', module: 'inventory',
        targetId: transaction.id, targetType: 'InventoryTransaction',
        newData: JSON.stringify({ transactionNo, items }),
      }
    })

    return NextResponse.json(transaction, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}
