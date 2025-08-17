"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (res?.error) {
      setError("Invalid credentials or not an allowed admin");
      return;
    }
    router.push("/admin");
  };

  return (
    <main style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <form onSubmit={submit} style={{width:360,padding:24,border:'1px solid #e5e7eb',borderRadius:12}}>
        <h1 style={{fontSize:20,marginBottom:16}}>Admin Login</h1>
        <label>Email</label>
        <input value={email} onChange={(e)=>setEmail(e.target.value)} type="email" required style={{width:'100%',padding:8,margin:'6px 0 12px',border:'1px solid #e5e7eb',borderRadius:8}} />
        <label>Password</label>
        <input value={password} onChange={(e)=>setPassword(e.target.value)} type="password" required style={{width:'100%',padding:8,margin:'6px 0 12px',border:'1px solid #e5e7eb',borderRadius:8}} />
        {error && <p style={{color:'#b91c1c',marginBottom:8}}>{error}</p>}
        <button disabled={loading} type="submit" style={{width:'100%',padding:10,borderRadius:8,background:'#111827',color:'#fff'}}>
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </main>
  );
}


