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
          console.error("Database error during credentials auth:", error);
          return null;
        }
      }
    })
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Handle both Google and credentials provider account creation
      if (account?.provider === "google" && user?.email) {
        try {
          const email = user.email.toLowerCase();
          const existingUser = await prisma.user.findUnique({ where: { email } });
          
          if (!existingUser) {
            // Create new user with personal workspace
            const newUser = await prisma.user.create({
              data: { 
                email, 
                name: user.name ?? null, 
                emailVerified: new Date() 
              }
            });
            
            // Create personal workspace for new user
            const personalTeam = await prisma.team.create({
              data: {
                name: `${newUser.name || 'Personal'}'s Workspace`,
                description: 'Your personal video workspace',
                ownerId: newUser.id,
                isPersonal: true
              }
            });
            
            // Link personal workspace to user
            await prisma.user.update({
              where: { id: newUser.id },
              data: { personalTeamId: personalTeam.id }
            });
          } else {
            // Update existing user and ensure they have personal workspace
            await prisma.user.update({
              where: { email },
              data: { name: user.name ?? null, emailVerified: new Date() }
            });
            
            // Create personal workspace if missing
            if (!existingUser.personalTeamId) {
              const personalTeam = await prisma.team.create({
                data: {
                  name: `${existingUser.name || 'Personal'}'s Workspace`,
                  description: 'Your personal video workspace',
                  ownerId: existingUser.id,
                  isPersonal: true
                }
              });
              
              await prisma.user.update({
                where: { id: existingUser.id },
                data: { personalTeamId: personalTeam.id }
              });
            }
          }
        } catch (err) {
          console.error("Google sign-in user creation/update failed", {
            message: (err as Error).message,
          });
          // Do not block sign-in; let user proceed with Google session
          return true;
        }
      }
      
      // Handle credentials provider (email/password registration)
      if (account?.provider === "credentials" && user?.email) {
        try {
          const email = user.email.toLowerCase();
          const existingUser = await prisma.user.findUnique({ 
            where: { email },
            include: { ownedTeams: { where: { isPersonal: true } } }
          });
          
          // Create personal workspace if user exists but doesn't have one
          if (existingUser && !existingUser.personalTeamId) {
            const personalTeam = await prisma.team.create({
              data: {
                name: `${existingUser.name || 'Personal'}'s Workspace`,
                description: 'Your personal video workspace',
                ownerId: existingUser.id,
                isPersonal: true
              }
            });
            
            await prisma.user.update({
              where: { id: existingUser.id },
              data: { personalTeamId: personalTeam.id }
            });
          }
        } catch (err) {
          console.error("Credentials sign-in personal workspace setup failed", {
            message: (err as Error).message,
          });
          // Do not block sign-in
          return true;
        }
      }
      return true;
    },
    async jwt({ token, account }) {
      if (account) {
        token.provider = account.provider;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.sub;
      session.provider = token.provider;
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Handle admin routes
      if (url.startsWith('/admin')) {
        return `${baseUrl}${url}`;
      }
      // Handle relative URLs
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
      }
      // Handle callback URLs
      if (url.startsWith(baseUrl)) {
        return url;
      }
      // Default redirect to dashboard after successful login
      return `${baseUrl}/dashboard`;
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

