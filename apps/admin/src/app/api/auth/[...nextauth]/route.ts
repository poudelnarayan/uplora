import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Only allow admins from allowlist
const ADMIN_EMAILS = (process.env.ADMIN_ALLOWED_EMAILS || "kan077bct049@kec.edu.np")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Admin Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const email = credentials.email.toLowerCase();
        if (!ADMIN_EMAILS.includes(email)) return null;
        try {
          const user = await prisma.user.findUnique({ where: { email } });
          if (!user?.hashedPassword) return null;
          const ok = await bcrypt.compare(credentials.password, user.hashedPassword);
          if (!ok) return null;
          return { id: user.id, email: user.email, name: user.name ?? "Admin" } as any;
        } catch {
          return null;
        }
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/admin-login" },
  callbacks: {
    async jwt({ token }) { return token; },
    async session({ session, token }) { (session as any).user.id = token.sub; return session; },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };


