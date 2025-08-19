import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log("Missing credentials");
          throw new Error("Missing email or password");
        }

        try {
          console.log("Attempting to authenticate:", credentials.email);
          
          const user = await prisma.user.findUnique({
            where: { email: credentials.email.toLowerCase() }
          });

          if (!user || !user.hashedPassword) {
            console.log("User not found or no password for:", credentials.email);
            throw new Error("Invalid email or password");
          }

          console.log("User found, checking password...");

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.hashedPassword
          );

          if (!isPasswordValid) {
            console.log("Invalid password for:", credentials.email);
            throw new Error("Invalid email or password");
          }

          console.log("Authentication successful for:", credentials.email);

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            emailVerified: user.emailVerified,
          };
        } catch (error) {
          console.error("Database error during credentials auth:", error);
          if (error instanceof Error) {
            throw error;
          }
          throw new Error("Authentication failed");
        }
      }
    })
  ],
  callbacks: {
    async signIn({ user, account }) {
      // Handle credentials provider (email/password authentication)
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
    async jwt({ token, account, user, trigger }) {
      if (account) {
        token.provider = account.provider;
      }
      if (user) {
        token.emailVerified = user.emailVerified;
      }
      
      // Refresh emailVerified status on update triggers (like after email verification)
      if (trigger === "update" && token.sub) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.sub },
            select: { emailVerified: true }
          });
          if (dbUser) {
            token.emailVerified = dbUser.emailVerified;
          }
        } catch (error) {
          console.error("Error refreshing user session:", error);
        }
      }
      
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.sub;
      session.provider = token.provider;
      session.user.emailVerified = token.emailVerified;
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
    error: "/signin", // Redirect errors back to signin page
  },
  debug: process.env.NODE_ENV === "development",
  useSecureCookies: process.env.NODE_ENV === "production",
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };

