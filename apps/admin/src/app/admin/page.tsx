import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);
  return (
    <main style={{padding:24}}>
      <h1 style={{fontSize:24, fontWeight:700}}>Admin Dashboard</h1>
      <p style={{marginTop:8}}>Signed in as: {session?.user?.email}</p>
      <div style={{marginTop:24}}>
        <ul>
          <li>Users overview (wire to /api/admin/users)</li>
          <li>Teams overview (wire to /api/admin/teams)</li>
          <li>Videos overview (wire to /api/admin/videos)</li>
        </ul>
      </div>
    </main>
  );
}


