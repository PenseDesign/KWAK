import { createServerClient } from '@supabase/ssr'

async function run() {
  console.log("Starting signup test...")
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  )
  
  try {
    const { data, error } = await supabase.auth.signUp({
      email: 'test' + Date.now() + '@example.com',
      password: 'password123',
    })
    console.log("Response:", data, error)
  } catch (e) {
    console.log("Exception:", e)
  }
}

run()
