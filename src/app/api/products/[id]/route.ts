import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/next-auth'
import { prisma } from '@/lib/prisma'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const body = await req.json()

  try {
    const old = await prisma.product.findUnique({ where: { id } })
    const product = await prisma.product.update({
      where: { id },
      data: {
        code: body.code, name: body.name, description: body.description,
        categoryId: body.categoryId, unitId: body.unitId,
        minStock: body.minStock, costPrice: body.costPrice, salePrice: body.salePrice,
      }
    })
    await prisma.auditLog.create({
      data: {
        userId: (session.user as any).id,
        action: 'UPDATE', module: 'products',
        targetId: id, targetType: 'Product',
        oldData: JSON.stringify(old), newData: JSON.stringify(product),
      }
    })
    return NextResponse.json(product)
  } catch (error: any) {
    if (error.code === 'P2002') return NextResponse.json({ error: 'รหัสสินค้านี้มีอยู่แล้ว' }, { status: 409 })
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  // Soft delete
  const product = await prisma.product.update({ where: { id }, data: { isActive: false } })
  await prisma.auditLog.create({
    data: {
      userId: (session.user as any).id,
      action: 'DELETE', module: 'products',
      targetId: id, targetType: 'Product',
    }
  })
  return NextResponse.json({ success: true })
}
