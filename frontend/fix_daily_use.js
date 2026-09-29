const fs = require('fs');

const backendFile = 'd:/ftafat/FataFat/backend/src/modules/grocery/grocery.service.js';
let code = fs.readFileSync(backendFile, 'utf8');

const replacementStr = `
  const responseData = {
    banners,
    categories,
    specialDeals: [
      { _id: new mongoose.Types.ObjectId().toString(), name: "Aashirvaad Shudh Chakki Atta", slug: "atta", price: 215, originalPrice: 240, unit: "5 kg", images: ["https://images.unsplash.com/photo-1598128558393-70ff21433be0?w=400&q=80"], badge: "deal", isAvailable: true, isActive: true, rating: 4.8 },
      { _id: new mongoose.Types.ObjectId().toString(), name: "Amul Taaza Toned Milk", slug: "amul-milk", price: 34, originalPrice: 34, unit: "500 ml", images: ["https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&q=80"], badge: "best_seller", isAvailable: true, isActive: true, rating: 4.9 },
      { _id: new mongoose.Types.ObjectId().toString(), name: "Tata Salt, Vacuum Evaporated", slug: "tata-salt", price: 28, originalPrice: 30, unit: "1 kg", images: ["https://images.unsplash.com/photo-1598128558393-70ff21433be0?w=400&q=80"], badge: "deal", isAvailable: true, isActive: true, rating: 4.7 },
      { _id: new mongoose.Types.ObjectId().toString(), name: "Maggi 2-Minute Noodles", slug: "maggi", price: 14, originalPrice: 14, unit: "70 g", images: ["https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=400&q=80"], badge: "best_seller", isAvailable: true, isActive: true, rating: 4.6 },
      ...(specialDeals || [])
    ],
    trending: [
      { _id: new mongoose.Types.ObjectId().toString(), name: "Fortune Sunlite Refined Sunflower Oil", slug: "fortune-oil", price: 135, originalPrice: 155, unit: "1 Litre", images: ["https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80"], badge: "best_seller", isAvailable: true, isActive: true, rating: 4.8 },
      { _id: new mongoose.Types.ObjectId().toString(), name: "Madhur Pure & Hygienic Sugar", slug: "madhur-sugar", price: 55, originalPrice: 60, unit: "1 kg", images: ["https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400&q=80"], badge: "deal", isAvailable: true, isActive: true, rating: 4.5 },
      { _id: new mongoose.Types.ObjectId().toString(), name: "Tata Tea Premium", slug: "tata-tea", price: 145, originalPrice: 160, unit: "250 g", images: ["https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=400&q=80"], badge: "deal", isAvailable: true, isActive: true, rating: 4.6 },
      { _id: new mongoose.Types.ObjectId().toString(), name: "Fresh Onion (Pyaz)", slug: "onion", price: 35, originalPrice: 50, unit: "1 kg", images: ["https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=400&q=80"], badge: "best_seller", isAvailable: true, isActive: true, rating: 4.4 },
      { _id: new mongoose.Types.ObjectId().toString(), name: "Fresh Tomato (Tamatar)", slug: "tomato", price: 40, originalPrice: 60, unit: "1 kg", images: ["https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400&q=80"], badge: "organic", isAvailable: true, isActive: true, rating: 4.7 },
      { _id: new mongoose.Types.ObjectId().toString(), name: "Amul Butter Pasteurised", slug: "amul-butter", price: 58, originalPrice: 60, unit: "100 g", images: ["https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&q=80"], badge: "best_seller", isAvailable: true, isActive: true, rating: 4.9 },
      ...(trending || [])
    ],
  };
`;

code = code.replace(`  const responseData = {
    banners,
    categories,
    specialDeals,
    trending,
  };`, replacementStr);

fs.writeFileSync(backendFile, code);
console.log('Fixed backend daily use products');
