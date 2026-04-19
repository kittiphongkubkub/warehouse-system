import type { NextAuthConfig } from 'next-auth'

export const authConfig = {
  pages: {
    signIn: '/login',
  },
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
  providers: [], // Add providers in next-auth.ts to avoid bundling large libs in middleware
} satisfies NextAuthConfig
