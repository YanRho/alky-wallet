import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

const PUBLIC_ROUTES = ['/', '/login', '/signup']

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const isPublic = PUBLIC_ROUTES.some((route) => pathname === route)

  if (isPublic) return NextResponse.next()

  const token = await getToken({ req })

  if (!token) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('callbackUrl', req.url)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next|static|favicon.ico).*)', // Match all routes except static and API
  ],
}
