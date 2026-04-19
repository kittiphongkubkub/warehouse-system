import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/next-auth'
import { prisma } from '@/lib/prisma'

// Master data APIs: categories, units, suppliers, warehouses

export async function GET(req: NextRequest, { params }: { params: Promise<{ resource: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { resource } = await params

  if (resource === 'categories') {
    const data = await prisma.category.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } })
    return NextResponse.json(data)
  }
  if (resource === 'units') {
    const data = await prisma.unit.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } })
    return NextResponse.json(data)
  }
  if (resource === 'suppliers') {
    const data = await prisma.supplier.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } })
    return NextResponse.json(data)
  }
  if (resource === 'warehouses') {
    const data = await prisma.warehouse.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } })
    return NextResponse.json(data)
  }

  return NextResponse.json({ error: 'Not found' }, { status: 404 })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ resource: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { resource } = await params
  const body = await req.json()

  try {
    if (resource === 'categories') {
      const data = await prisma.category.create({ data: { name: body.name, description: body.description } })
      return NextResponse.json(data, { status: 201 })
    }
    if (resource === 'units') {
      const data = await prisma.unit.create({ data: { name: body.name, abbreviation: body.abbreviation, description: body.description } })
      return NextResponse.json(data, { status: 201 })
    }
    if (resource === 'suppliers') {
      const data = await prisma.supplier.create({
        data: { code: body.code, name: body.name, contactName: body.contactName, phone: body.phone, email: body.email, address: body.address }
      })
      return NextResponse.json(data, { status: 201 })
    }
    if (resource === 'warehouses') {
      const data = await prisma.warehouse.create({ data: { code: body.code, name: body.name, location: body.location, description: body.description } })
      return NextResponse.json(data, { status: 201 })
    }
  } catch (error: any) {
    if (error.code === 'P2002') return NextResponse.json({ error: 'ข้อมูลนี้มีอยู่แล้ว' }, { status: 409 })
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }

  return NextResponse.json({ error: 'Not found' }, { status: 404 })
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ resource: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { resource } = await params
  const body = await req.json()
  const { id, ...data } = body

  try {
    if (resource === 'categories') {
      const updated = await prisma.category.update({ where: { id }, data: { name: data.name, description: data.description } })
      return NextResponse.json(updated)
    }
    if (resource === 'units') {
      const updated = await prisma.unit.update({ where: { id }, data: { name: data.name, abbreviation: data.abbreviation } })
      return NextResponse.json(updated)
    }
    if (resource === 'suppliers') {
      const updated = await prisma.supplier.update({ where: { id }, data })
      return NextResponse.json(updated)
    }
  } catch {
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }

  return NextResponse.json({ error: 'Not found' }, { status: 404 })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ resource: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { resource } = await params
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  if (resource === 'categories') {
    await prisma.category.update({ where: { id }, data: { isActive: false } })
    return NextResponse.json({ success: true })
  }
  if (resource === 'units') {
    await prisma.unit.update({ where: { id }, data: { isActive: false } })
    return NextResponse.json({ success: true })
  }
  if (resource === 'suppliers') {
    await prisma.supplier.update({ where: { id }, data: { isActive: false } })
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Not found' }, { status: 404 })
}
