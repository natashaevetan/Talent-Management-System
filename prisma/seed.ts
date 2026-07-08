import bcrypt from "bcrypt";
import { prisma } from "../src/lib/prisma";

async function main() {
  const adminEmail = "natasha.tan@dhc.com.sg";
  const adminPassword = "changeme123";

  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!existing) {
    await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash: await bcrypt.hash(adminPassword, 12),
        name: "Natasha",
        role: "ADMIN",
      },
    });
    console.log(`Created admin user ${adminEmail} (password: ${adminPassword} — change after first login)`);
  } else {
    console.log(`Admin user ${adminEmail} already exists, skipping`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
