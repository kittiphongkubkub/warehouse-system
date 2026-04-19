import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/next-auth'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const users = await prisma.user.findMany({
    where: { isActive: true },
    include: {
      userRoles: { include: { role: true } }
    },
    orderBy: { createdAt: 'asc' }
  })

  const roles = await prisma.role.findMany({ orderBy: { name: 'asc' } })

  return NextResponse.json({ users, roles })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { username, email, fullName, password, roleIds } = body

  if (!username || !fullName || !password) {
    return NextResponse.json({ error: 'กรุณากรอกข้อมูลที่จำเป็น' }, { status: 400 })
  }

  try {
    const hashed = await hashPassword(password)
    const user = await prisma.user.create({
      data: {
        username, email: email || null, fullName, password: hashed,
        userRoles: roleIds?.length > 0 ? {
          create: roleIds.map((roleId: string) => ({ roleId }))
        } : undefined
      }
    })

    await prisma.auditLog.create({
      data: {
        userId: (session.user as any).id,
        action: 'CREATE', module: 'admin',
        targetId: user.id, targetType: 'User',
        newData: JSON.stringify({ username, fullName }),
      }
    })

    return NextResponse.json(user, { status: 201 })
  } catch (error: any) {
    if (error.code === 'P2002') return NextResponse.json({ error: 'ชื่อผู้ใช้นี้มีอยู่แล้ว' }, { status: 409 })
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { id, username, email, fullName, password, roleIds } = body

  try {
    const updateData: any = { username, email: email || null, fullName }
    if (password) updateData.password = await hashPassword(password)

    const user = await prisma.user.update({ where: { id }, data: updateData })

    if (roleIds !== undefined) {
      await prisma.userRole.deleteMany({ where: { userId: id } })
      if (roleIds.length > 0) {
        await prisma.userRole.createMany({ data: roleIds.map((roleId: string) => ({ userId: id, roleId })) })
      }
    }

    await prisma.auditLog.create({
      data: {
        userId: (session.user as any).id,
        action: 'UPDATE', module: 'admin',
        targetId: id, targetType: 'User',
      }
    })

    return NextResponse.json(user)
  } catch (error: any) {
    if (error.code === 'P2002') return NextResponse.json({ error: 'ชื่อผู้ใช้นี้มีอยู่แล้ว' }, { status: 409 })
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  if (id === (session.user as any).id) return NextResponse.json({ error: 'ไม่สามารถลบตัวเองได้' }, { status: 400 })

  await prisma.user.update({ where: { id }, data: { isActive: false } })
  return NextResponse.json({ success: true })
}
