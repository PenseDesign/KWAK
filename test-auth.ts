import { createAdminClient } from './src/lib/supabase/admin'

async function run() {
  console.log("Starting...")
  const adminClient = createAdminClient()
  console.log("Admin client created")
  
  try {
    const { data, error } = await adminClient
      .from('profiles')
      .select('id')
      .eq('phone', '612345678')
      .maybeSingle()
      
    console.log("Response:", data, error)
  } catch (e) {
    console.log("Exception:", e)
  }
}

run()
