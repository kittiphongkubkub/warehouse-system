import { NextResponse } from 'next/server'
import { auth } from '@/lib/next-auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    // Total products
    const totalProducts = await prisma.product.count({ where: { isActive: true } })

    // Total balance quantity
    const balanceAgg = await prisma.inventoryBalance.aggregate({ _sum: { quantity: true } })
    const totalQuantity = balanceAgg._sum.quantity || 0

    // Low stock products (balance < minStock)
    const products = await prisma.product.findMany({
      where: { isActive: true },
      include: {
        inventoryBalances: true,
      }
    })
    const lowStockCount = products.filter(p => {
      const total = p.inventoryBalances.reduce((sum, b) => sum + b.quantity, 0)
      return total <= p.minStock && p.minStock > 0
    }).length

    // Expiring soon (within 30 days)
    const thirtyDaysLater = new Date()
    thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30)
    const expiringSoon = await prisma.inventoryBalance.count({
      where: {
        expiryDate: { not: null, lte: thirtyDaysLater, gt: new Date() },
        quantity: { gt: 0 }
      }
    })

    // Today's transactions
    const todayStart = new Date(); todayStart.setHours(0,0,0,0)
    const todayEnd = new Date(); todayEnd.setHours(23,59,59,999)
    const todayStockIn = await prisma.inventoryTransaction.count({
      where: { type: 'STOCK_IN', createdAt: { gte: todayStart, lte: todayEnd } }
    })
    const todayStockOut = await prisma.inventoryTransaction.count({
      where: { type: 'STOCK_OUT', createdAt: { gte: todayStart, lte: todayEnd } }
    })

    // Recent transactions (last 10)
    const recentTransactions = await prisma.inventoryTransaction.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: { select: { fullName: true } },
        warehouse: { select: { name: true } },
        items: { include: { product: { select: { name: true, code: true } } } }
      }
    })

    // Low stock products list
    const lowStockProducts = products
      .map(p => ({
        id: p.id,
        code: p.code,
        name: p.name,
        minStock: p.minStock,
        currentStock: p.inventoryBalances.reduce((sum, b) => sum + b.quantity, 0),
      }))
      .filter(p => p.currentStock <= p.minStock && p.minStock > 0)
      .slice(0, 5)

    // Expiring products list
    const expiringBalances = await prisma.inventoryBalance.findMany({
      where: {
        expiryDate: { not: null, lte: thirtyDaysLater, gt: new Date() },
        quantity: { gt: 0 }
      },
      include: { product: { select: { name: true, code: true } } },
      orderBy: { expiryDate: 'asc' },
      take: 5
    })

    return NextResponse.json({
      stats: { totalProducts, totalQuantity, lowStockCount, expiringSoon, todayStockIn, todayStockOut },
      recentTransactions,
      lowStockProducts,
      expiringBalances,
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
