const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function createAdminAccount() {
  try {
    const email = "kan77bct049@kec.edu.np";
    const password = "Password@5809";
    const name = "Admin User";

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      console.log("✅ Admin account already exists!");
      console.log(`Email: ${existingUser.email}`);
      console.log(`Name: ${existingUser.name}`);
      console.log(`Created: ${existingUser.createdAt}`);
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create admin user
    const adminUser = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        name: name,
        hashedPassword: hashedPassword,
        emailVerified: new Date(), // Mark as verified
      },
    });

    console.log("✅ Admin account created successfully!");
    console.log(`Email: ${adminUser.email}`);
    console.log(`Name: ${adminUser.name}`);
    console.log(`Password: ${password}`);
    console.log(`Created: ${adminUser.createdAt}`);
  } catch (error) {
    console.error("❌ Error creating admin account:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminAccount();
