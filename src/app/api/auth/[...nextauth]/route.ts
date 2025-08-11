import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          // offline for refresh_token, force prompt to ensure it
          scope: "openid email profile https://www.googleapis.com/auth/youtube.upload",
          access_type: "offline",
          prompt: "consent"
        }
      }
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });

        if (!user || !user.hashedPassword) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.hashedPassword
        );

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, account }) {
      // On initial sign-in
      if (account) {
        token.access_token = account.access_token;
        token.refresh_token = account.refresh_token ?? token.refresh_token;
        token.expires_at = Date.now() + (account.expires_in ? Number(account.expires_in) * 1000 : 0);
        // Persist granted scopes on first sign-in
        if (account.scope) {
          token.scopes = account.scope.split(" ");
        }
      }

      // If token not expired, return it
      if (token.expires_at && Date.now() < token.expires_at - 60_000) {
        return token;
      }

      // Attempt refresh with refresh_token
      if (token.refresh_token) {
        try {
          const resp = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
              client_id: process.env.GOOGLE_CLIENT_ID!,
              client_secret: process.env.GOOGLE_CLIENT_SECRET!,
              grant_type: "refresh_token",
              refresh_token: token.refresh_token,
            }),
          });
          const json = (await resp.json()) as {
            access_token?: string;
            expires_in?: number;
            scope?: string;
          };
          if (json.access_token) {
            token.access_token = json.access_token;
            if (typeof json.expires_in === "number") {
              token.expires_at = Date.now() + json.expires_in * 1000;
            }
            token.scopes = json.scope ? json.scope.split(" ") : token.scopes;
          }
        } catch {
          // fall through; session callback will handle missing token
        }
      }
      return token;
    },
    async session({ session, token }) {
      session.access_token = token.access_token;
      session.refresh_token = token.refresh_token;
      session.expires_at = token.expires_at;
      session.scopes = token.scopes;
      return session;
    }
  },
  session: { strategy: "jwt" },
  pages: {
    signIn: "/signin",
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
