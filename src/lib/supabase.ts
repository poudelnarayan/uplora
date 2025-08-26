import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string



// Client-side Supabase client (for browser)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Server-side Supabase client (for API routes)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Helper function to get user from Clerk and sync with Supabase
export async function getSupabaseUser(clerkUserId: string) {
  const { data: user, error } = await supabaseAdmin
    .from('users')
    .select('*')
          .eq('clerkId', clerkUserId)
    .single()
  
  if (error && error.code !== 'PGRST116') { // PGRST116 = not found
    throw error
  }
  
  return user
}

// Helper function to create/update user in Supabase from Clerk data
export async function upsertSupabaseUser(clerkUserId: string, userData: {
  email: string
  name?: string
  image?: string
}) {
  const { data, error } = await supabaseAdmin
    .from('users')
    .upsert({
              id: clerkUserId, // Use Clerk user ID as the primary key
        clerkId: clerkUserId,
        email: userData.email,
        name: userData.name || null,
        image: userData.image || null,
        updatedAt: new Date().toISOString()
    }, {
      onConflict: 'clerkId'
    })
    .select()
    .single()
  
  if (error) throw error
  return data
}


