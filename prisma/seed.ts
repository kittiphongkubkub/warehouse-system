import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient({})

async function main() {
  console.log('🌱 Seeding database...')

  // Create Permissions
  const permissions = await Promise.all([
    // Products
    prisma.permission.upsert({ where: { code: 'products.view' }, update: {}, create: { code: 'products.view', name: 'ดูสินค้า', module: 'products' } }),
    prisma.permission.upsert({ where: { code: 'products.create' }, update: {}, create: { code: 'products.create', name: 'เพิ่มสินค้า', module: 'products' } }),
    prisma.permission.upsert({ where: { code: 'products.edit' }, update: {}, create: { code: 'products.edit', name: 'แก้ไขสินค้า', module: 'products' } }),
    prisma.permission.upsert({ where: { code: 'products.delete' }, update: {}, create: { code: 'products.delete', name: 'ลบสินค้า', module: 'products' } }),
    // Stock
    prisma.permission.upsert({ where: { code: 'stock.view' }, update: {}, create: { code: 'stock.view', name: 'ดูสต๊อก', module: 'stock' } }),
    prisma.permission.upsert({ where: { code: 'stock.in' }, update: {}, create: { code: 'stock.in', name: 'รับสินค้าเข้า', module: 'stock' } }),
    prisma.permission.upsert({ where: { code: 'stock.out' }, update: {}, create: { code: 'stock.out', name: 'จ่ายสินค้าออก', module: 'stock' } }),
    // Reports
    prisma.permission.upsert({ where: { code: 'reports.view' }, update: {}, create: { code: 'reports.view', name: 'ดูรายงาน', module: 'reports' } }),
    // Admin
    prisma.permission.upsert({ where: { code: 'users.manage' }, update: {}, create: { code: 'users.manage', name: 'จัดการผู้ใช้', module: 'admin' } }),
    prisma.permission.upsert({ where: { code: 'master.manage' }, update: {}, create: { code: 'master.manage', name: 'จัดการข้อมูลพื้นฐาน', module: 'admin' } }),
    prisma.permission.upsert({ where: { code: 'audit.view' }, update: {}, create: { code: 'audit.view', name: 'ดู Audit Log', module: 'admin' } }),
  ])

  // Create Roles
  const adminRole = await prisma.role.upsert({
    where: { name: 'Admin' },
    update: {},
    create: { name: 'Admin', description: 'ผู้ดูแลระบบ' }
  })
  const managerRole = await prisma.role.upsert({
    where: { name: 'Manager' },
    update: {},
    create: { name: 'Manager', description: 'ผู้จัดการ' }
  })
  const staffRole = await prisma.role.upsert({
    where: { name: 'Staff' },
    update: {},
    create: { name: 'Staff', description: 'พนักงานคลัง' }
  })
  const viewerRole = await prisma.role.upsert({
    where: { name: 'Viewer' },
    update: {},
    create: { name: 'Viewer', description: 'ผู้ดูรายงาน' }
  })

  // Assign all permissions to Admin
  for (const perm of permissions) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: adminRole.id, permissionId: perm.id } },
      update: {},
      create: { roleId: adminRole.id, permissionId: perm.id }
    })
  }

  // Manager permissions
  const managerPerms = ['products.view', 'stock.view', 'stock.in', 'stock.out', 'reports.view', 'audit.view']
  for (const code of managerPerms) {
    const perm = permissions.find(p => p.code === code)
    if (perm) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: managerRole.id, permissionId: perm.id } },
        update: {},
        create: { roleId: managerRole.id, permissionId: perm.id }
      })
    }
  }

  // Staff permissions
  const staffPerms = ['products.view', 'stock.view', 'stock.in', 'stock.out']
  for (const code of staffPerms) {
    const perm = permissions.find(p => p.code === code)
    if (perm) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: staffRole.id, permissionId: perm.id } },
        update: {},
        create: { roleId: staffRole.id, permissionId: perm.id }
      })
    }
  }

  // Viewer permissions
  const viewerPerms = ['products.view', 'stock.view', 'reports.view']
  for (const code of viewerPerms) {
    const perm = permissions.find(p => p.code === code)
    if (perm) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: viewerRole.id, permissionId: perm.id } },
        update: {},
        create: { roleId: viewerRole.id, permissionId: perm.id }
      })
    }
  }

  // Create Admin User
  const hashedPassword = await bcrypt.hash('admin1234', 10)
  const adminUser = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@warehouse.com',
      password: hashedPassword,
      fullName: 'ผู้ดูแลระบบ',
    }
  })

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: adminUser.id, roleId: adminRole.id } },
    update: {},
    create: { userId: adminUser.id, roleId: adminRole.id }
  })

  // Create Warehouse
  const warehouse = await prisma.warehouse.upsert({
    where: { code: 'WH-001' },
    update: {},
    create: { code: 'WH-001', name: 'คลังสินค้าหลัก', location: 'อาคาร A' }
  })

  // Create Categories
  const cat1 = await prisma.category.upsert({ where: { name: 'วัตถุดิบ' }, update: {}, create: { name: 'วัตถุดิบ', description: 'วัตถุดิบสำหรับการผลิต' } })
  const cat2 = await prisma.category.upsert({ where: { name: 'สินค้าสำเร็จรูป' }, update: {}, create: { name: 'สินค้าสำเร็จรูป', description: 'สินค้าพร้อมจำหน่าย' } })
  const cat3 = await prisma.category.upsert({ where: { name: 'อุปกรณ์' }, update: {}, create: { name: 'อุปกรณ์', description: 'อุปกรณ์และเครื่องมือ' } })

  // Create Units
  const unit1 = await prisma.unit.upsert({ where: { name: 'ชิ้น' }, update: {}, create: { name: 'ชิ้น', abbreviation: 'ชิ้น' } })
  const unit2 = await prisma.unit.upsert({ where: { name: 'กล่อง' }, update: {}, create: { name: 'กล่อง', abbreviation: 'กล่อง' } })
  const unit3 = await prisma.unit.upsert({ where: { name: 'กิโลกรัม' }, update: {}, create: { name: 'กิโลกรัม', abbreviation: 'kg' } })
  const unit4 = await prisma.unit.upsert({ where: { name: 'ลิตร' }, update: {}, create: { name: 'ลิตร', abbreviation: 'L' } })

  // Create Suppliers
  const sup1 = await prisma.supplier.upsert({
    where: { code: 'SUP-001' }, update: {},
    create: { code: 'SUP-001', name: 'บริษัท ABC จำกัด', contactName: 'คุณสมชาย', phone: '02-111-1111', email: 'abc@example.com' }
  })
  const sup2 = await prisma.supplier.upsert({
    where: { code: 'SUP-002' }, update: {},
    create: { code: 'SUP-002', name: 'บริษัท XYZ จำกัด', contactName: 'คุณสมหญิง', phone: '02-222-2222', email: 'xyz@example.com' }
  })

  // Create Sample Products
  await prisma.product.upsert({
    where: { code: 'PRD-001' }, update: {},
    create: { code: 'PRD-001', name: 'แป้งสาลี', categoryId: cat1.id, unitId: unit3.id, minStock: 50, costPrice: 25 }
  })
  await prisma.product.upsert({
    where: { code: 'PRD-002' }, update: {},
    create: { code: 'PRD-002', name: 'น้ำตาลทราย', categoryId: cat1.id, unitId: unit3.id, minStock: 30, costPrice: 40 }
  })
  await prisma.product.upsert({
    where: { code: 'PRD-003' }, update: {},
    create: { code: 'PRD-003', name: 'ขนมปัง', categoryId: cat2.id, unitId: unit2.id, minStock: 100, costPrice: 45, salePrice: 65 }
  })

  console.log('✅ Seed completed!')
  console.log('📦 Warehouse:', warehouse.name)
  console.log('👤 Admin user: admin / admin1234')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
