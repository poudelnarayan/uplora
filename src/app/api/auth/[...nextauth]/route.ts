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
          scope: "openid email profile",
          access_type: "online",
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
          console.log("Missing credentials");
          return null;
        }

        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email }
          });

          if (!user || !user.hashedPassword) {
            console.log("User not found or no password");
            return null;
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.hashedPassword
          );

          if (!isPasswordValid) {
            console.log("Invalid password");
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
          };
        } catch (error) {
          console.error("Database error during auth:", error);
          return null;
        }
      }
    })
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Create basic user record on first Google sign-in
      if (account?.provider === "google" && user?.email) {
        try {
          const existingUser = await prisma.user.findUnique({ where: { email: user.email } });
          if (!existingUser) {
            await prisma.user.create({
              data: {
                email: user.email,
                name: user.name ?? null,
                emailVerified: new Date(),
              }
            });
          }
        } catch (err) {
          console.error("Google sign-in user create failed", err);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, account }) {
      // On initial sign-in, store basic account info
      if (account) {
        token.provider = account.provider;
      }
      return token;
    },
    async session({ session, token }) {
      // Only pass basic user info to session
      session.user.id = token.sub;
      session.provider = token.provider;
      return session;
    }
  },
  session: { strategy: "jwt" },
  pages: {
    signIn: "/signin",
  },
  debug: process.env.NODE_ENV === "development",
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };

