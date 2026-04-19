import { auth } from '@/lib/next-auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const { nextUrl, auth: session } = req
  const isLoggedIn = !!session

  const publicPaths = ['/login']
  const isPublicPath = publicPaths.some(path => nextUrl.pathname.startsWith(path))

  if (!isLoggedIn && !isPublicPath) {
    return NextResponse.redirect(new URL('/login', nextUrl))
  }

  if (isLoggedIn && isPublicPath) {
    return NextResponse.redirect(new URL('/dashboard', nextUrl))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
