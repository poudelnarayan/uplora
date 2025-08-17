import { NextResponse } from "next/server";

export async function GET() {
  const requiredVars = [
    'NEXTAUTH_URL',
    'NEXTAUTH_SECRET',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'DATABASE_URL'
  ];

  const optionalVars = [
    'NEXT_PUBLIC_SITE_URL',
    'EMAIL_SERVER',
    'EMAIL_FROM',
    'SMTP_HOST',
    'SMTP_PORT',
    'SMTP_USER',
    'SMTP_PASS',
    'SMTP_FROM'
  ];

  const checkVars = (vars: string[]) => {
    return vars.map(varName => ({
      name: varName,
      set: !!process.env[varName],
      value: process.env[varName] ? 
        (varName.includes('SECRET') || varName.includes('PASSWORD') ? '***HIDDEN***' : process.env[varName]) : 
        'NOT SET'
    }));
  };

  const required = checkVars(requiredVars);
  const optional = checkVars(optionalVars);

  const missingRequired = required.filter(v => !v.set);

  return NextResponse.json({
    status: missingRequired.length === 0 ? "success" : "error",
    message: missingRequired.length === 0 ? 
      "All required environment variables are set" : 
      `Missing ${missingRequired.length} required environment variables`,
    required,
    optional,
    missing: missingRequired.map(v => v.name),
    timestamp: new Date().toISOString()
  });
}
