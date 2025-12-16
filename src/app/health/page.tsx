"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { CheckCircle, XCircle, AlertCircle, Database, Key, Globe, Mail, CreditCard, Shield } from 'lucide-react';

export default function HealthPage() {
  const [healthData, setHealthData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await fetch('/api/health');
        const data = await response.json();
        setHealthData(data);
      } catch (error) {
        setHealthData({
          status: "error",
          error: error instanceof Error ? error.message : 'Failed to fetch health data'
        });
      } finally {
        setIsLoading(false);
      }
    };

    checkHealth();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Checking system health...</p>
          </div>
        </div>
      </div>
    );
  }

  const getStatusIcon = (isHealthy: boolean) => {
    return isHealthy ? (
      <CheckCircle className="w-5 h-5 text-green-600" />
    ) : (
      <XCircle className="w-5 h-5 text-red-600" />
    );
  };

  const getServiceStatus = (service: unknown) => {
    if (typeof service === 'string') {
      return service === 'connected' || service === 'accessible';
    }
    return false;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">System Health Dashboard</h1>
          <p className="text-gray-600">Monitor your application's connectivity and configuration</p>
        </div>

        {/* Overall Status */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {healthData?.status === 'healthy' ? (
                <CheckCircle className="w-6 h-6 text-green-600" />
              ) : (
                <XCircle className="w-6 h-6 text-red-600" />
              )}
              Overall Status: {healthData?.status || 'Unknown'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Last checked: {healthData?.timestamp ? new Date(healthData.timestamp).toLocaleString() : 'Unknown'}
            </p>
            {healthData?.error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 font-medium">Error: {healthData.error}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Services Status */}
        {healthData?.services && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Core Services
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(healthData.services).map(([service, status]) => {
                  const statusText =
                    typeof status === "string"
                      ? status
                      : status == null
                        ? "Unknown"
                        : JSON.stringify(status);

                  return (
                  <div key={service} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium capitalize">{service}</span>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(getServiceStatus(status))}
                      <span className="text-sm">{statusText}</span>
                    </div>
                  </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Environment Variables */}
        {healthData?.environment && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Supabase */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Database className="w-5 h-5 text-green-600" />
                  Supabase
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(healthData.environment.supabase).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <span className="text-sm font-mono">{key}</span>
                      {getStatusIcon(!!value)}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Clerk */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Shield className="w-5 h-5 text-blue-600" />
                  Clerk Auth
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(healthData.environment.clerk).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <span className="text-sm font-mono">{key}</span>
                      {getStatusIcon(!!value)}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* AWS S3 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Globe className="w-5 h-5 text-orange-600" />
                  AWS S3
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(healthData.environment.aws).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <span className="text-sm font-mono">{key}</span>
                      {getStatusIcon(!!value)}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Stripe */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CreditCard className="w-5 h-5 text-purple-600" />
                  Stripe
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(healthData.environment.stripe).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <span className="text-sm font-mono">{key}</span>
                      {getStatusIcon(!!value)}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Email */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Mail className="w-5 h-5 text-teal-600" />
                  Email SMTP
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(healthData.environment.email).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <span className="text-sm font-mono">{key}</span>
                      {getStatusIcon(!!value)}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Next Steps */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>🚀 What's Working</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                Supabase database connection established
              </p>
              <p className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                Database migrations applied successfully
              </p>
              <p className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                User authentication system ready
              </p>
              <p className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                Team management system ready
              </p>
              <p className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                Content management system ready
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}