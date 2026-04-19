import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/next-auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const productId = searchParams.get('productId')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '50')

  const where: any = { quantity: { gte: 0 } }
  if (productId) where.productId = productId

  const [balances, total] = await Promise.all([
    prisma.inventoryBalance.findMany({
      where,
      include: {
        product: { include: { category: true, unit: true } },
        warehouse: true,
      },
      orderBy: [{ product: { code: 'asc' } }, { expiryDate: 'asc' }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.inventoryBalance.count({ where })
  ])

  return NextResponse.json({ balances, total, page, limit })
}
