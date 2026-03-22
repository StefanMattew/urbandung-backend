const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Jadwal 24 Jam Full
const hours24 = {
  Senin: { isOpen: true, open: '00:00', close: '23:59' },
  Selasa: { isOpen: true, open: '00:00', close: '23:59' },
  Rabu: { isOpen: true, open: '00:00', close: '23:59' },
  Kamis: { isOpen: true, open: '00:00', close: '23:59' },
  Jumat: { isOpen: true, open: '00:00', close: '23:59' },
  Sabtu: { isOpen: true, open: '00:00', close: '23:59' },
  Minggu: { isOpen: true, open: '00:00', close: '23:59' }
};

async function main() {
  console.log("🚀 Memulai proses Seeding 10 Kafe Real-Life Bandung...");

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@geshare.com' },
    update: {},
    create: {
      name: 'Admin GE-SHARE',
      email: 'admin@geshare.com',
      password: 'password123', 
      role: 'ADMIN'
    }
  });
  console.log(`✅ Admin berhasil disiapkan (ID: ${adminUser.id})`);

  const ownerId = adminUser.id;

  const realCafes = [
    {
      name: 'Sugu Collective',
      description: 'Sugu Restaurant / Collective menawarkan pengalaman makan dan nongkrong yang tak biasa dengan konsep estetik minimalis. Menyajikan aneka masakan Jepang (Salmon Maki), Western, hingga Nusantara. Cocok untuk nugas atau ngopi santai tengah malam.',
      address: 'Jl. R.A.A. Marta Negara No.3, Turangga, Kec. Lengkong, Kota Bandung',
      latitude: -6.932912,
      longitude: 107.628854,
      priceRange: 'Rp 25.000 - Rp 75.000',
      imageUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=800&q=80',
      purpose: ['Nongkrong Santai', 'Nugas / WFC', 'Estetik / Spot Foto'],
      facilities: ['WiFi', 'Colokan', 'Sofa Nyaman', 'Indoor AC', 'Mushola'],
      viewType: 'City'
    },
    {
      name: 'Sae Cafe 24H',
      description: 'Kafe estetik dengan gaya interior modern dan sentuhan retro di area Hotel Janevalla. Tidak hanya asyik untuk ngopi 24 jam, di sini kamu bisa main Billiard sepuasnya secara gratis! Ada menu Pizza, Nachos, dan Nasi Goreng.',
      address: 'Jl. Aceh No.65, Merdeka, Kec. Bandung Wetan, Kota Bandung',
      latitude: -6.909989,
      longitude: 107.611145,
      priceRange: 'Rp 30.000 - Rp 100.000',
      imageUrl: 'https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&w=800&q=80',
      purpose: ['Nongkrong Santai', 'Meeting / Diskusi'],
      facilities: ['Billiard Gratis', 'WiFi', 'Colokan', 'Smoking Area'],
      viewType: 'City'
    },
    {
      name: 'Ayamayaman',
      description: 'Resto 24 jam legendaris incaran mahasiswa Bandung! Tempatnya cozy lengkap dengan Wi-Fi kencang dan musik asyik. Menu andalannya Butter Rice Creamy Katsu dan Ayam Sambal Dangdut dengan porsi besar tapi harga mahasiswa.',
      address: 'Jl. Tubagus Ismail No.5c, Sekeloa, Kecamatan Coblong, Kota Bandung',
      latitude: -6.885621,
      longitude: 107.618632,
      priceRange: 'Rp 24.000 - Rp 60.000',
      imageUrl: 'https://images.unsplash.com/photo-1600093463592-8e36ae95ef56?auto=format&fit=crop&w=800&q=80',
      purpose: ['Nugas / WFC', 'Nongkrong Santai'],
      facilities: ['WiFi', 'Colokan Banyak', 'Musik', 'Area Makan Luas'],
      viewType: 'City'
    },
    {
      name: 'Kopi Kenangan Dago',
      description: 'Cabang Kopi Kenangan yang buka 24 jam di kawasan strategis Dago. Cocok untuk mampir ngopi saat dini hari atau mengerjakan tugas singkat dengan ditemani Kopi Kenangan Mantan.',
      address: 'Jl. Ir. H. Juanda No.143, Lb. Siliwangi, Kecamatan Coblong, Kota Bandung',
      latitude: -6.891120,
      longitude: 107.613340,
      priceRange: 'Rp 15.000 - Rp 40.000',
      imageUrl: 'https://images.unsplash.com/photo-1525610553991-2bede1a236e2?auto=format&fit=crop&w=800&q=80',
      purpose: ['Nugas / WFC', 'Nongkrong Santai'],
      facilities: ['WiFi', 'AC', 'Takeaway'],
      viewType: 'City'
    },
    {
      name: 'Tomoro Coffee Dipatiukur',
      description: 'Coffee shop modern yang ramah kantong mahasiswa. Tomoro Coffee cabang Dipatiukur ini menyediakan area seating yang bersih, terang, dan sangat nyaman untuk maraton nugas 24 jam.',
      address: 'Jl. Dipati Ukur No.73, Lebakgede, Kecamatan Coblong, Kota Bandung',
      latitude: -6.886345,
      longitude: 107.614890,
      priceRange: 'Rp 15.000 - Rp 35.000',
      imageUrl: 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&w=800&q=80',
      purpose: ['Nugas / WFC', 'Meeting / Diskusi'],
      facilities: ['WiFi Ngebut', 'Colokan', 'Indoor AC'],
      viewType: 'City'
    },
    {
      name: 'Beri Kopi',
      description: 'Tempat ngopi 24 jam yang asyik dengan berbagai pilihan minuman es kopi susu kekinian. Suasananya santai, cocok buat ngobrol bareng teman sampai pagi.',
      address: 'Jl. Ciumbuleuit No.163, Hegarmanah, Kec. Cidadap, Kota Bandung',
      latitude: -6.874152,
      longitude: 107.603310,
      priceRange: 'Rp 15.000 - Rp 30.000',
      imageUrl: 'https://images.unsplash.com/photo-1600055106603-0182cc7867ea?auto=format&fit=crop&w=800&q=80',
      purpose: ['Nongkrong Santai'],
      facilities: ['Outdoor', 'Smoking Area', 'Colokan'],
      viewType: 'City'
    },
    {
      name: 'Monday Coffee Dago',
      description: 'Hidden gem di daerah Dago dengan udara yang sejuk dan sangat homey (mengubah rumah tua menjadi kafe). Tempat paling tenang untuk WFC di Bandung, dilengkapi sofa biru ikonis dan semi-outdoor yang aesthetic.',
      address: 'Jl. Bukit Dago Utara I No.9, Dago, Kecamatan Coblong, Kota Bandung',
      latitude: -6.878510,
      longitude: 107.620025,
      priceRange: 'Rp 28.000 - Rp 50.000',
      imageUrl: 'https://images.unsplash.com/photo-1559925393-8be0ec4767c8?auto=format&fit=crop&w=800&q=80',
      purpose: ['Nugas / WFC', 'Estetik / Spot Foto'],
      facilities: ['WiFi', 'Sofa', 'Semi Outdoor', 'Area Tenang'],
      viewType: 'Nature'
    },
    {
      name: 'Armor Coffee Asia Afrika',
      description: 'Berada di jantung historis kota Bandung, Armor Coffee menawarkan kopi khas nusantara dengan nuansa bangunan heritage. Sangat seru buat nongkrong menikmati keramaian kota saat malam hari.',
      address: 'Jl. Asia Afrika No.112, Cikawao, Kec. Lengkong, Kota Bandung',
      latitude: -6.920835,
      longitude: 107.605520,
      priceRange: 'Rp 20.000 - Rp 45.000',
      imageUrl: 'https://images.unsplash.com/photo-1521017430055-16bccb9231f8?auto=format&fit=crop&w=800&q=80',
      purpose: ['Nongkrong Santai', 'Estetik / Spot Foto'],
      facilities: ['Heritage Building', 'Outdoor', 'Smoking Area'],
      viewType: 'City'
    },
    {
      name: 'Kopi Luvium',
      description: 'Kafe modern dengan desain arsitektur memanjakan mata. Spot ngopi 24 jam yang cukup hits di kalangan anak muda Bandung karena variasi mocktail kopi dan makanannya yang enak.',
      address: 'Jl. Burangrang No.24, Burangrang, Kec. Lengkong, Kota Bandung',
      latitude: -6.923450,
      longitude: 107.620120,
      priceRange: 'Rp 30.000 - Rp 65.000',
      imageUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&q=80',
      purpose: ['Nongkrong Santai', 'Nugas / WFC'],
      facilities: ['WiFi', 'AC', 'Pilihan Dessert'],
      viewType: 'City'
    },
    {
      name: 'Tangkal Pinus',
      description: 'Rasakan sensasi nongkrong 24 jam di tengah hutan pinus yang sangat dingin dan berkabut! Selain ngopi, di sini kamu bisa berinteraksi dengan Alpaca dan melakukan kegiatan camping.',
      address: 'Genteng, Jayagiri, Lembang, Kabupaten Bandung Barat',
      latitude: -6.786520,
      longitude: 107.643810,
      priceRange: 'Rp 35.000 - Rp 80.000',
      imageUrl: 'https://images.unsplash.com/photo-1445116572660-236099cecd06?auto=format&fit=crop&w=800&q=80',
      purpose: ['Estetik / Spot Foto', 'Nongkrong Santai'],
      facilities: ['Pemandangan Hutan Pinus', 'Api Unggun', 'Alpaca', 'Outdoor Luas'],
      viewType: 'Nature'
    }
  ];

  console.log("Memproses 10 Kafe Real-Life...");

  let count = 0;
  for (const cafe of realCafes) {
    const exists = await prisma.cafe.findFirst({ where: { name: cafe.name } });
    if (!exists) {
      await prisma.cafe.create({ 
        data: {
          ...cafe,
          ownerId: ownerId,
          is24Hours: true,
          operationalHours: hours24,
          isTaxInc: true,
        } 
      });
      count++;
      console.log(`+ Added: ${cafe.name}`);
    } else {
      console.log(`- Skipped: ${cafe.name} (Sudah ada di database)`);
    }
  }

  console.log(`\n🎉 SELESAI! Berhasil menambahkan ${count} kafe asli Bandung ke database!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });