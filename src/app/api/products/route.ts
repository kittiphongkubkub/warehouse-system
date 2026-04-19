import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/next-auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') || ''
  const categoryId = searchParams.get('categoryId') || ''
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')

  const where: any = { isActive: true }
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { code: { contains: search } },
    ]
  }
  if (categoryId) where.categoryId = categoryId

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        category: { select: { name: true } },
        unit: { select: { name: true, abbreviation: true } },
        inventoryBalances: { select: { quantity: true } },
      },
      orderBy: { code: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.product.count({ where })
  ])

  const productsWithBalance = products.map(p => ({
    ...p,
    currentStock: p.inventoryBalances.reduce((sum, b) => sum + b.quantity, 0),
  }))

  return NextResponse.json({ products: productsWithBalance, total, page, limit })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { code, name, description, categoryId, unitId, minStock, costPrice, salePrice } = body

  if (!code || !name || !categoryId || !unitId) {
    return NextResponse.json({ error: 'กรุณากรอกข้อมูลที่จำเป็น' }, { status: 400 })
  }

  try {
    const product = await prisma.product.create({
      data: { code, name, description, categoryId, unitId, minStock: minStock || 0, costPrice, salePrice }
    })
    await prisma.auditLog.create({
      data: {
        userId: (session.user as any).id,
        action: 'CREATE',
        module: 'products',
        targetId: product.id,
        targetType: 'Product',
        newData: JSON.stringify(product),
      }
    })
    return NextResponse.json(product, { status: 201 })
  } catch (error: any) {
    if (error.code === 'P2002') return NextResponse.json({ error: 'รหัสสินค้านี้มีอยู่แล้ว' }, { status: 409 })
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}
