import { prisma } from './prisma'
import bcrypt from 'bcryptjs'

export type SessionUser = {
  id: string
  username: string
  email: string | null
  fullName: string
  roles: string[]
  permissions: string[]
}

export async function getUserWithPermissions(userId: string): Promise<SessionUser | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId, isActive: true },
    include: {
      userRoles: {
        include: {
          role: {
            include: {
              rolePermissions: {
                include: { permission: true }
              }
            }
          }
        }
      }
    }
  })

  if (!user) return null

  const roles = user.userRoles.map(ur => ur.role.name)
  const permissions = [...new Set(
    user.userRoles.flatMap(ur =>
      ur.role.rolePermissions.map(rp => rp.permission.code)
    )
  )]

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    fullName: user.fullName,
    roles,
    permissions,
  }
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export function hasPermission(userPermissions: string[], required: string): boolean {
  return userPermissions.includes(required)
}
