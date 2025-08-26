import { createClient } from '@/lib/supabase-server'

export default async function TestSupabase() {
  const supabase = await createClient()
  
  // Test the connection
  const { data, error } = await supabase.from('users').select('*').limit(1)
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Supabase Connection Test</h1>
      
      {error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong>Error:</strong> {error.message}
          <br />
          <strong>Code:</strong> {error.code}
        </div>
      ) : (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          <strong>Success!</strong> Connected to Supabase
          <br />
          <strong>Data:</strong> {JSON.stringify(data, null, 2)}
        </div>
      )}
    </div>
  )
}

