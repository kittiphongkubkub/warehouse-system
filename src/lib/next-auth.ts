import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from '@/lib/prisma'
import { verifyPassword, getUserWithPermissions } from '@/lib/auth'

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { username: credentials.username as string, isActive: true }
        })

        if (!user) return null

        const isValid = await verifyPassword(credentials.password as string, user.password)
        if (!isValid) return null

        const userWithPerms = await getUserWithPermissions(user.id)
        if (!userWithPerms) return null

        return {
          id: user.id,
          name: user.fullName,
          email: user.email,
          username: user.username,
          fullName: user.fullName,
          roles: userWithPerms.roles,
          permissions: userWithPerms.permissions,
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.username = (user as any).username
        token.fullName = (user as any).fullName
        token.roles = (user as any).roles
        token.permissions = (user as any).permissions
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        ;(session.user as any).username = token.username
        ;(session.user as any).fullName = token.fullName
        ;(session.user as any).roles = token.roles
        ;(session.user as any).permissions = token.permissions
      }
      return session
    }
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 8 * 60 * 60, // 8 hours
  },
})
