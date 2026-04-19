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
      where: { type: 'STOCK_OUT' },
      include: {
        createdBy: { select: { fullName: true } },
        warehouse: { select: { name: true } },
        items: { include: { product: { select: { name: true, code: true } } } }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.inventoryTransaction.count({ where: { type: 'STOCK_OUT' } })
  ])

  return NextResponse.json({ transactions, total, page, limit })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { warehouseId, referenceNo, note, items } = body

  if (!warehouseId || !items || items.length === 0) {
    return NextResponse.json({ error: 'กรุณาเลือกคลังและเพิ่มรายการสินค้า' }, { status: 400 })
  }

  const transactionNo = generateTransactionNo('OUT')

  try {
    // Pre-validate: check balances before transaction
    for (const item of items) {
      const balances = await prisma.inventoryBalance.findMany({
        where: {
          productId: item.productId,
          warehouseId,
          quantity: { gt: 0 },
          ...(item.lotNumber ? { lotNumber: item.lotNumber } : {}),
          ...(item.batchNumber ? { batchNumber: item.batchNumber } : {}),
        }
      })
      const available = balances.reduce((sum, b) => sum + b.quantity, 0)
      if (available < item.quantity) {
        const product = await prisma.product.findUnique({ where: { id: item.productId }, select: { name: true } })
        return NextResponse.json({
          error: `สินค้า "${product?.name}" มีสต๊อกไม่เพียงพอ (มี ${available} ต้องการ ${item.quantity})`
        }, { status: 422 })
      }
    }

    const transaction = await prisma.$transaction(async (tx) => {
      const txn = await tx.inventoryTransaction.create({
        data: {
          transactionNo,
          type: 'STOCK_OUT',
          warehouseId,
          referenceNo,
          note,
          totalItems: items.length,
          createdById: (session.user as any).id,
          items: {
            create: items.map((item: any) => ({
              productId: item.productId,
              quantity: item.quantity,
              lotNumber: item.lotNumber || null,
              batchNumber: item.batchNumber || null,
              note: item.note || null,
            }))
          }
        }
      })

      // Deduct inventory balances
      for (const item of items) {
        const lotKey = item.lotNumber || ''
        const batchKey = item.batchNumber || ''

        await tx.inventoryBalance.updateMany({
          where: {
            productId: item.productId,
            warehouseId,
            lotNumber: lotKey,
            batchNumber: batchKey,
          },
          data: { quantity: { decrement: item.quantity } }
        })
      }

      return txn
    })

    await prisma.auditLog.create({
      data: {
        userId: (session.user as any).id,
        action: 'STOCK_OUT', module: 'inventory',
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
