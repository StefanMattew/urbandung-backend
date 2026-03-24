
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.review.deleteMany();
  await prisma.cafe.deleteMany();
  await prisma.user.deleteMany();

  // Buat akun Admin utama
  const admin = await prisma.user.create({
    data: {
      email: 'admin@urbandung.com', 
      name: 'Admin Stefan',
      password: 'Stefan246', 
      role: 'ADMIN',
    },
  });

  console.log('✅ Berhasil membuat akun Admin:', admin.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });