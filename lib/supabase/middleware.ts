import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  // 1. Setup Response Awal
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // 2. Setup Supabase Client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Loop 1: Update cookies di Request (agar Server Component bisa baca sesi terbaru)
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )

          // Refresh Response object agar membawa cookies request terbaru
          response = NextResponse.next({
            request,
          })

          // Loop 2: Update cookies di Response (agar Browser user menyimpan sesi)
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // 3. Cek User (Refresh Token)
  // PENTING: Jangan hapus bagian ini, ini jantungnya auth middleware
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // ----------------------------------------------------------------
  // 4. LOGIC PROTEKSI ROUTE (SECURITY)
  // ----------------------------------------------------------------
  
  const path = request.nextUrl.pathname

  // KONDISI A: User BELUM Login, tapi maksa masuk Dashboard
  // Redirect ke Login
  if (path.startsWith('/dashboard') && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login' // Pastikan kamu punya page login di /login
    return NextResponse.redirect(url)
  }

  // KONDISI B (OPSIONAL TAPI BAGUS): User SUDAH Login, tapi iseng buka halaman Login
  // Redirect balik ke Dashboard
  if ((path === '/login' || path === '/register') && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard' // Redirect ke halaman utama dashboard
    return NextResponse.redirect(url)
  }

  return response
}