const express = require('express');
const cors = require('cors');
const { PrismaClient, Prisma } = require('@prisma/client');
const path = require('path');
const fs = require('fs');

const app = express(); // Cukup satu kali di sini
const prisma = new PrismaClient();

// --- MIDDLEWARE ---
app.use(cors({
  origin: ['https://urbandung.vercel.app', 'http://localhost:3000'], // Tambah localhost frontend buat testing
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], // Tambah PATCH karena kamu pakai di bawah
  credentials: true
}));
app.use(express.json());

// --- UPLOAD CONFIG ---
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// --- CONFIG CLOUDINARY ---
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'urbandung_photos', // Folder otomatis di Cloudinary
    allowed_formats: ['jpg', 'png', 'jpeg'],
    transformation: [{ width: 800, height: 600, crop: 'limit' }] // Otomatis ngecilin foto biar hemat storage
  },
});

const upload = multer({ storage });

// --- UPDATE ROUTE UPLOAD ---
app.post('/api/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "Gagal upload ke Cloudinary" });
    
    // Link yang dikembalikan Cloudinary sudah HTTPS dan permanen!
    res.json({ 
      url: req.file.path, 
      filename: req.file.filename 
    });
  } catch (error) {
    res.status(500).json({ error: "Terjadi kesalahan saat upload" });
  }
});
app.get('/api/cafes', async (req, res) => {
  try {
    // Kita pakai fungsi standar Prisma yang aman (Bypass PostGIS sementara)
    const cafes = await prisma.cafe.findMany({
      include: {
        reviews: true // Ambil review sekalian untuk hitung rating
      }
    });
    
    // Format datanya agar sesuai dengan yang diminta Frontend
    const serializedCafes = cafes.map(cafe => {
      const totalReviews = cafe.reviews.length;
      const avgRating = totalReviews > 0 
        ? cafe.reviews.reduce((acc, rev) => acc + rev.rating, 0) / totalReviews 
        : 0;
      
      const { reviews, ...cafeData } = cafe; // Buang array reviews biar rapi
      
      return { 
        ...cafeData, 
        distance: 0, // Set jarak 0 sementara karena PostGIS kita matikan
        avgRating: Number(avgRating.toFixed(1))
      };
    });
    
    res.json(serializedCafes);
  } catch (error) { 
    console.error("Error get cafes:", error);
    res.status(500).json({ error: "Gagal memuat data kafe" }); 
  }
});
app.get('/api/cafes/:id', async (req, res) => {
  try {
    const cafe = await prisma.cafe.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { 
        menuItems: true,
        reviews: { 
          include: { user: true }, 
          orderBy: { createdAt: 'desc' } 
        } 
      }
    });

    if (!cafe) return res.status(404).json({ error: "Kafe tidak ditemukan" });

    res.json(cafe);
  } catch (error) {
    console.error("Detail Error:", error);
    res.status(500).json({ error: "Gagal memuat detail" });
  }
});

app.post('/api/cafes/:id/reviews', async (req, res) => {
  try {
    const newReview = await prisma.review.create({
      data: {
        rating: parseInt(req.body.rating),
        comment: req.body.comment,
        cafeId: parseInt(req.params.id),
        userId: parseInt(req.body.userId) || 1 
      }
    });
    res.json(newReview);
  } catch (error) {
    res.status(500).json({ error: "Gagal tambah review" });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const newUser = await prisma.user.create({
      data: { name, email, password, role: role || 'USER' }
    });
    res.json({ id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role });
  } catch (error) {
    res.status(400).json({ error: "Email sudah terdaftar atau data tidak valid" });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    
    if (!user || user.password !== password) {
      return res.status(401).json({ error: "Email atau password salah!" });
    }
    
    res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
  } catch (error) {
    res.status(500).json({ error: "Gagal memproses login" });
  }
});

app.get('/api/owner/cafes/:ownerId', async (req, res) => {
  try {
    const cafes = await prisma.cafe.findMany({
      where: { ownerId: parseInt(req.params.ownerId) },
      include: { menuItems: true }, 
      orderBy: { id: 'desc' }
    });
    res.json(cafes);
  } catch (error) {
    res.status(500).json({ error: "Gagal memuat kafe milikmu" });
  }
});

app.post('/api/cafes', async (req, res) => {
  try {
    const { 
      name, description, address, latitude, longitude, 
      priceRange, imageUrl, is24Hours, isTaxInc, purpose,operationalHours, viewType,
      ownerId, gallery, menuItems , facilities
    } = req.body;
    
    const newCafe = await prisma.cafe.create({
      data: {
        name, description, address, priceRange, imageUrl, viewType, purpose,
        latitude: parseFloat(latitude), longitude: parseFloat(longitude),
        is24Hours: is24Hours === true || is24Hours === 'true',
        isTaxInc: isTaxInc === true || isTaxInc === 'true',
        operationalHours: operationalHours || null,
        ownerId: parseInt(ownerId),
        gallery: gallery || [], 
        facilities: facilities || [],
        menuItems: {
          create: menuItems ? menuItems.map(m => ({ name: m.name, price: m.price })) : []
        }
      }
    });
    res.json(newCafe);
  } catch (error) { res.status(500).json({ error: "Gagal membuat kafe baru" }); }
});

app.put('/api/cafes/:id', async (req, res) => {
  try {
    const cafeId = parseInt(req.params.id);
    const { 
      name, description, address, latitude, longitude, 
      priceRange, imageUrl, is24Hours, operationalHours, isTaxInc, purpose, viewType, 
      gallery, menuItems, facilities
    } = req.body;
    
    const updatedCafe = await prisma.cafe.update({
      where: { id: cafeId },
      data: {
        name, description, address, priceRange, imageUrl, viewType, purpose,
        latitude: parseFloat(latitude), longitude: parseFloat(longitude),
        is24Hours: is24Hours === true || is24Hours === 'true',
        operationalHours: operationalHours,
        isTaxInc: isTaxInc === true || isTaxInc === 'true',
        gallery: gallery || [],
        facilities: facilities || []
      }
    });

    if (menuItems) {
      await prisma.menuItem.deleteMany({ where: { cafeId } });
      if (menuItems.length > 0) {
        await prisma.menuItem.createMany({
          data: menuItems.map(m => ({ name: m.name, price: m.price, cafeId }))
        });
      }
    }
    res.json(updatedCafe);
  } catch (error) { res.status(500).json({ error: "Gagal mengedit kafe" }); }
});

app.delete('/api/cafes/:id', async (req, res) => {
  try {
    const cafeId = parseInt(req.params.id);
    
    await prisma.menuItem.deleteMany({ where: { cafeId } });
    await prisma.review.deleteMany({ where: { cafeId } });
    await prisma.menu.deleteMany({ where: { cafeId } }); 
    
    await prisma.cafe.delete({ where: { id: cafeId } });

    res.json({ message: "Kafe beserta isinya berhasil dihapus permanen" });
  } catch (error) {
    console.error("Error Hapus Kafe:", error);
    res.status(500).json({ error: "Gagal menghapus kafe" });
  }
});

app.get('/api/admin/cafes', async (req, res) => {
  try {
    const cafes = await prisma.cafe.findMany({
      include: { owner: true },
      orderBy: { id: 'desc' }
    });
    res.json(cafes);
  } catch (error) { res.status(500).json({ error: "Gagal memuat semua kafe" }); }
});

app.get('/api/admin/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { id: 'desc' }
    });
    res.json(users);
  } catch (error) { res.status(500).json({ error: "Gagal memuat pengguna" }); }
});

app.put('/api/admin/users/:id/role', async (req, res) => {
  try {
    const { role } = req.body;
    const updatedUser = await prisma.user.update({
      where: { id: parseInt(req.params.id) },
      data: { role }
    });
    res.json(updatedUser);
  } catch (error) { res.status(500).json({ error: "Gagal mengubah role" }); }
});

app.put('/api/admin/cafes/:id/transfer', async (req, res) => {
  try {
    const { newOwnerId } = req.body;
    const updatedCafe = await prisma.cafe.update({
      where: { id: parseInt(req.params.id) },
      data: { ownerId: parseInt(newOwnerId) }
    });
    res.json(updatedCafe);
  } catch (error) { 
    res.status(500).json({ error: "Gagal memindah tangankan kafe" }); 
  }
});

app.delete('/api/admin/users/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    await prisma.review.deleteMany({ where: { userId } });
    
    await prisma.cafe.updateMany({ 
      where: { ownerId: userId }, 
      data: { ownerId: null } 
    });

    await prisma.user.delete({ where: { id: userId } });
    res.json({ message: "Pengguna berhasil dihapus" });
  } catch (error) {
    res.status(500).json({ error: "Gagal menghapus pengguna" });
  }
});
app.get('/api/users/:userId/favorites', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { 
        favoriteCafes: {
          include: {
            reviews: {
              select: { rating: true }
            }
          }
        } 
      }
    });

    if (!user) return res.json([]);

    const favoriteWithRatings = user.favoriteCafes.map(cafe => {
      const totalReviews = cafe.reviews.length;
      const avgRating = totalReviews > 0 
        ? cafe.reviews.reduce((acc, rev) => acc + rev.rating, 0) / totalReviews 
        : 0;
      
      const { reviews, ...cafeData } = cafe;
      return { 
        ...cafeData, 
        avgRating: avgRating.toFixed(1) 
      };
    });

    res.json(favoriteWithRatings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Gagal mengambil data favorit" });
  }
});

app.post('/api/users/:userId/favorites', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const { cafeId } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { favoriteCafes: { where: { id: parseInt(cafeId) } } }
    });

    const isFavorited = user.favoriteCafes.length > 0;

    if (isFavorited) {
      await prisma.user.update({
        where: { id: userId },
        data: { favoriteCafes: { disconnect: { id: parseInt(cafeId) } } }
      });
      res.json({ message: "Dihapus dari favorit", isFavorited: false });
    } else {
      await prisma.user.update({
        where: { id: userId },
        data: { favoriteCafes: { connect: { id: parseInt(cafeId) } } }
      });
      res.json({ message: "Disimpan ke favorit", isFavorited: true });
    }
  } catch (error) {
    res.status(500).json({ error: "Gagal memproses favorit" });
  }
});

app.get('/api/cafes/:id/reviews', async (req, res) => {
  try {
    const reviews = await prisma.review.findMany({
      where: { cafeId: parseInt(req.params.id) },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ error: "Gagal mengambil ulasan" });
  }
});

app.post('/api/cafes/:id/reviews', async (req, res) => {
  try {
    const { userId, rating, comment } = req.body;
    const cafeId = parseInt(req.params.id);

    const newReview = await prisma.review.create({
      data: {
        rating: parseInt(rating),
        comment: comment,
        userId: parseInt(userId),
        cafeId: cafeId
      },
      include: { user: { select: { name: true } } }
    });
    res.status(201).json(newReview);
  } catch (error) {
    res.status(500).json({ error: "Gagal menambahkan ulasan" });
  }
});

app.patch('/api/cafes/:id/score', async (req, res) => {
  try {
    const { id } = req.params;
    const { popularityScore } = req.body;
    const updatedCafe = await prisma.cafe.update({
      where: { id: parseInt(id) },
      data: { popularityScore: parseInt(popularityScore) || 0 }
    });
    res.json(updatedCafe);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Gagal mengupdate skor popularitas" });
  }
});

app.patch('/api/cafes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { crowdStatus } = req.body;

    if (!id) {
      return res.status(400).json({ error: "ID Kafe tidak ditemukan" });
    }

    const updatedCafe = await prisma.cafe.update({
      where: { 
        id: parseInt(id) 
      },
      data: { 
        crowdStatus: crowdStatus 
      }
    });

    res.status(200).json(updatedCafe);
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Terjadi kesalahan pada server saat update status" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend run di port ${PORT}`));