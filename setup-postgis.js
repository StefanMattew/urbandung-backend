const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Mencoba mengaktifkan ekstensi PostGIS...");
  await prisma.$executeRawUnsafe('CREATE EXTENSION IF NOT EXISTS postgis;');
  console.log("Berhasil! Ekstensi PostGIS sudah aktif di geshare_db.");
}

main()
  .catch(e => console.error("Gagal:", e.message))
  .finally(async () => {
    await prisma.$disconnect();
  });