"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, Loader2, Database, Key, Globe } from 'lucide-react';

export default function TestSupabasePage() {
  const [testResult, setTestResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const testConnection = async () => {
    setIsLoading(true);
    setTestResult(null);
    
    try {
      const response = await fetch('/api/test-supabase');
      const data = await response.json();
      setTestResult(data);
    } catch (error) {
      setTestResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Supabase Connection Test</h1>
          <p className="text-gray-600">Test your Supabase database connection and environment setup</p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Connection Test
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={testConnection} 
              disabled={isLoading}
              className="w-full mb-4"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Testing Connection...
                </>
              ) : (
                <>
                  <Database className="w-4 h-4 mr-2" />
                  Test Supabase Connection
                </>
              )}
            </Button>

            {testResult && (
              <div className={`p-4 rounded-lg border ${
                testResult.success 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center gap-2 mb-3">
                  {testResult.success ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                  <h3 className={`font-semibold ${
                    testResult.success ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {testResult.success ? 'Connection Successful!' : 'Connection Failed'}
                  </h3>
                </div>

                {testResult.message && (
                  <p className={`text-sm mb-3 ${
                    testResult.success ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {testResult.message}
                  </p>
                )}

                {testResult.environment && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-800">Environment Variables:</h4>
                    <div className="grid grid-cols-1 gap-2">
                      {Object.entries(testResult.environment).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between p-2 bg-white rounded border">
                          <span className="text-sm font-mono">{key}</span>
                          <span className={`text-sm ${
                            value === '✅ Set' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {testResult.error && (
                  <div className="mt-3 p-3 bg-red-100 rounded border border-red-200">
                    <h4 className="font-medium text-red-800 mb-1">Error Details:</h4>
                    <pre className="text-xs text-red-700 overflow-auto">
                      {JSON.stringify(testResult.details || testResult.error, null, 2)}
                    </pre>
                  </div>
                )}

                {testResult.timestamp && (
                  <p className="text-xs text-gray-500 mt-3">
                    Tested at: {new Date(testResult.timestamp).toLocaleString()}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Setup Instructions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="w-5 h-5" />
              Setup Instructions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-800">If connection fails, follow these steps:</h3>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">1</div>
                  <div>
                    <h4 className="font-medium text-blue-800">Create Supabase Project</h4>
                    <p className="text-sm text-blue-700">Go to <a href="https://supabase.com" target="_blank" className="underline">supabase.com</a> and create a new project</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">2</div>
                  <div>
                    <h4 className="font-medium text-blue-800">Get API Keys</h4>
                    <p className="text-sm text-blue-700">In your Supabase dashboard, go to Settings → API and copy your keys</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">3</div>
                  <div>
                    <h4 className="font-medium text-blue-800">Update Environment Variables</h4>
                    <p className="text-sm text-blue-700">Add your Supabase URL and keys to your .env.local file</p>
                    <div className="mt-2 p-2 bg-gray-800 text-green-400 rounded text-xs font-mono">
                      NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co<br/>
                      NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key<br/>
                      SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">4</div>
                  <div>
                    <h4 className="font-medium text-blue-800">Run Database Migrations</h4>
                    <p className="text-sm text-blue-700">Copy the SQL from your migration files and run them in Supabase SQL Editor</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-bold">5</div>
                  <div>
                    <h4 className="font-medium text-green-800">Test Again</h4>
                    <p className="text-sm text-green-700">Restart your dev server and test the connection again</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}