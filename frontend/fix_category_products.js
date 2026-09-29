const fs = require('fs');

const CATEGORY_PRODUCTS = {
  'fresh-vegetables': [
    { name: 'Fresh Tomato (Tamatar)', price: 40, originalPrice: 60, unit: '500 g', badge: 'organic', images: ['https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400&q=80'], rating: 4.7 },
    { name: 'Green Spinach (Palak)', price: 25, originalPrice: 35, unit: '250 g', badge: 'organic', images: ['https://images.unsplash.com/photo-1573246123716-6b1782bfc492?w=400&q=80'], rating: 4.5 },
    { name: 'Fresh Potato (Aloo)', price: 30, originalPrice: 45, unit: '1 kg', badge: 'best_seller', images: ['https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400&q=80'], rating: 4.6 },
    { name: 'Fresh Onion (Pyaz)', price: 35, originalPrice: 50, unit: '1 kg', badge: 'best_seller', images: ['https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=400&q=80'], rating: 4.4 },
    { name: 'Green Capsicum (Shimla Mirch)', price: 60, originalPrice: 80, unit: '250 g', images: ['https://images.unsplash.com/photo-1563565375-f3fdfdbefa8a?w=400&q=80'], rating: 4.3 },
    { name: 'Broccoli Fresh', price: 80, originalPrice: 100, unit: '300 g', badge: 'organic', images: ['https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?w=400&q=80'], rating: 4.6 },
    { name: 'Fresh Carrot (Gajar)', price: 40, originalPrice: 55, unit: '500 g', images: ['https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&q=80'], rating: 4.5 },
    { name: 'Green Peas (Matar)', price: 55, originalPrice: 70, unit: '250 g', badge: 'deal', images: ['https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80'], rating: 4.7 },
  ],
  'fresh-fruits': [
    { name: 'Red Apple (Seb)', price: 120, originalPrice: 150, unit: '4 pcs (~500g)', badge: 'best_seller', images: ['https://images.unsplash.com/photo-1560806887-1e4cd0b6fac6?w=400&q=80'], rating: 4.8 },
    { name: 'Banana (Kela)', price: 40, originalPrice: 50, unit: '6 pcs', badge: 'best_seller', images: ['https://images.unsplash.com/photo-1571508601891-ca5e7a713859?w=400&q=80'], rating: 4.7 },
    { name: 'Sweet Mango Alphonso', price: 180, originalPrice: 220, unit: '3 pcs (~500g)', badge: 'deal', images: ['https://images.unsplash.com/photo-1600459913827-c92b1ca2f28e?w=400&q=80'], rating: 4.9 },
    { name: 'Seedless Green Grapes', price: 90, originalPrice: 120, unit: '500 g', images: ['https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=400&q=80'], rating: 4.6 },
    { name: 'Fresh Papaya (Papita)', price: 60, originalPrice: 80, unit: '1 pc (~600g)', badge: 'organic', images: ['https://images.unsplash.com/photo-1517600403703-9803e07853a3?w=400&q=80'], rating: 4.4 },
    { name: 'Pomegranate (Anar)', price: 100, originalPrice: 130, unit: '2 pcs', images: ['https://images.unsplash.com/photo-1604495772376-9657f0035843?w=400&q=80'], rating: 4.7 },
    { name: 'Fresh Watermelon', price: 80, originalPrice: 100, unit: '1 pc (~2 kg)', badge: 'deal', images: ['https://images.unsplash.com/photo-1576181256399-834e3ef49cec?w=400&q=80'], rating: 4.5 },
    { name: 'Kiwi Fruit (Pack)', price: 110, originalPrice: 140, unit: '4 pcs', images: ['https://images.unsplash.com/photo-1550258987-190a2d41a8ba?w=400&q=80'], rating: 4.6 },
  ],
  'dairy-eggs': [
    { name: 'Amul Taaza Toned Milk', price: 34, originalPrice: 34, unit: '500 ml', badge: 'best_seller', images: ['https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&q=80'], rating: 4.9 },
    { name: 'Amul Butter Pasteurised', price: 58, originalPrice: 60, unit: '100 g', badge: 'best_seller', images: ['https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&q=80'], rating: 4.8 },
    { name: 'Farm Fresh White Eggs', price: 75, originalPrice: 90, unit: '10 pcs', badge: 'deal', images: ['https://images.unsplash.com/photo-1587486913049-53fc88980cfc?w=400&q=80'], rating: 4.7 },
    { name: 'Mother Dairy Dahi', price: 45, originalPrice: 50, unit: '400 g', badge: 'best_seller', images: ['https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&q=80'], rating: 4.6 },
    { name: 'Amul Processed Cheese Slice', price: 85, originalPrice: 100, unit: '10 slices', images: ['https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=400&q=80'], rating: 4.5 },
    { name: 'Nestle Milkmaid Condensed Milk', price: 62, originalPrice: 72, unit: '200 g', badge: 'deal', images: ['https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&q=80'], rating: 4.7 },
    { name: 'Amul Fresh Cream', price: 32, originalPrice: 35, unit: '200 ml', images: ['https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&q=80'], rating: 4.5 },
    { name: 'Brown Bread Eggs (Pack)', price: 55, originalPrice: 65, unit: '6 pcs', badge: 'organic', images: ['https://images.unsplash.com/photo-1587486913049-53fc88980cfc?w=400&q=80'], rating: 4.6 },
  ],
  'atta-rice-dal': [
    { name: 'Aashirvaad Shudh Chakki Atta', price: 215, originalPrice: 240, unit: '5 kg', badge: 'best_seller', images: ['https://images.unsplash.com/photo-1598128558393-70ff21433be0?w=400&q=80'], rating: 4.8 },
    { name: 'India Gate Basmati Rice', price: 160, originalPrice: 190, unit: '1 kg', badge: 'best_seller', images: ['https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?w=400&q=80'], rating: 4.8 },
    { name: 'Toor Dal (Arhar)', price: 165, originalPrice: 195, unit: '1 kg', images: ['https://images.unsplash.com/photo-1585625082224-5b2e0e8e6e9a?w=400&q=80'], rating: 4.7 },
    { name: 'Moong Dal (Yellow)', price: 145, originalPrice: 170, unit: '1 kg', badge: 'organic', images: ['https://images.unsplash.com/photo-1585625082224-5b2e0e8e6e9a?w=400&q=80'], rating: 4.6 },
    { name: 'Chana Dal (Split Bengal Gram)', price: 120, originalPrice: 145, unit: '1 kg', badge: 'deal', images: ['https://images.unsplash.com/photo-1585625082224-5b2e0e8e6e9a?w=400&q=80'], rating: 4.5 },
    { name: 'Rajma (Red Kidney Beans)', price: 135, originalPrice: 160, unit: '1 kg', images: ['https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80'], rating: 4.6 },
    { name: 'Vermicelli (Seviyan)', price: 35, originalPrice: 40, unit: '200 g', images: ['https://images.unsplash.com/photo-1598128558393-70ff21433be0?w=400&q=80'], rating: 4.4 },
    { name: 'Maida Refined Flour', price: 45, originalPrice: 55, unit: '1 kg', badge: 'deal', images: ['https://images.unsplash.com/photo-1598128558393-70ff21433be0?w=400&q=80'], rating: 4.3 },
  ],
  'oil-masala': [
    { name: 'Fortune Sunlite Refined Sunflower Oil', price: 135, originalPrice: 155, unit: '1 Litre', badge: 'best_seller', images: ['https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80'], rating: 4.8 },
    { name: 'MDH Chhole Masala', price: 72, originalPrice: 85, unit: '100 g', badge: 'best_seller', images: ['https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=400&q=80'], rating: 4.8 },
    { name: 'Everest Garam Masala', price: 68, originalPrice: 80, unit: '100 g', images: ['https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=400&q=80'], rating: 4.6 },
    { name: 'Tata Salt Vacuum Evaporated', price: 28, originalPrice: 30, unit: '1 kg', badge: 'deal', images: ['https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80'], rating: 4.7 },
    { name: 'Madhur Sugar', price: 55, originalPrice: 60, unit: '1 kg', images: ['https://images.unsplash.com/photo-1544025162-d76538612a36?w=400&q=80'], rating: 4.5 },
    { name: 'Saffola Gold Refined Oil', price: 165, originalPrice: 190, unit: '1 Litre', badge: 'deal', images: ['https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80'], rating: 4.7 },
    { name: 'Catch Black Pepper Powder', price: 65, originalPrice: 80, unit: '50 g', images: ['https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=400&q=80'], rating: 4.6 },
    { name: 'Everest Kitchen King Masala', price: 75, originalPrice: 90, unit: '100 g', badge: 'best_seller', images: ['https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=400&q=80'], rating: 4.7 },
  ],
  'snacks-drinks': [
    { name: 'Maggi 2-Minute Noodles', price: 14, originalPrice: 14, unit: '70 g', badge: 'best_seller', images: ['https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=400&q=80'], rating: 4.6 },
    { name: 'Lays Classic Salted Chips', price: 20, originalPrice: 20, unit: '26 g', badge: 'best_seller', images: ['https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=400&q=80'], rating: 4.5 },
    { name: 'Tropicana Orange Juice', price: 99, originalPrice: 120, unit: '1 Litre', badge: 'deal', images: ['https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&q=80'], rating: 4.4 },
    { name: 'Bisleri Water Bottle', price: 20, originalPrice: 20, unit: '1 Litre', images: ['https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&q=80'], rating: 4.7 },
    { name: 'Good Day Butter Biscuit', price: 30, originalPrice: 35, unit: '200 g', badge: 'deal', images: ['https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&q=80'], rating: 4.5 },
    { name: 'Kurkure Masala Munch', price: 20, originalPrice: 20, unit: '70 g', images: ['https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=400&q=80'], rating: 4.3 },
    { name: 'Paperboat Aamras', price: 20, originalPrice: 25, unit: '200 ml', badge: 'deal', images: ['https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&q=80'], rating: 4.7 },
    { name: 'Oreo Vanilla Cream Biscuit', price: 35, originalPrice: 40, unit: '100 g', images: ['https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&q=80'], rating: 4.6 },
  ],
  'personal-care': [
    { name: 'Dove Moisturising Soap Bar', price: 55, originalPrice: 65, unit: '4 pcs', badge: 'deal', images: ['https://images.unsplash.com/photo-1584820927498-cafe4c239369?w=400&q=80'], rating: 4.7 },
    { name: 'Colgate Strong Teeth Toothpaste', price: 55, originalPrice: 65, unit: '200 g', badge: 'best_seller', images: ['https://images.unsplash.com/photo-1584820927498-cafe4c239369?w=400&q=80'], rating: 4.8 },
    { name: 'Head & Shoulders Shampoo', price: 199, originalPrice: 240, unit: '180 ml', badge: 'deal', images: ['https://images.unsplash.com/photo-1584820927498-cafe4c239369?w=400&q=80'], rating: 4.6 },
    { name: 'Nivea Body Lotion', price: 175, originalPrice: 210, unit: '200 ml', images: ['https://images.unsplash.com/photo-1584820927498-cafe4c239369?w=400&q=80'], rating: 4.5 },
    { name: 'Gillette Fusion5 Razor', price: 299, originalPrice: 350, unit: '1 pc', badge: 'deal', images: ['https://images.unsplash.com/photo-1584820927498-cafe4c239369?w=400&q=80'], rating: 4.7 },
    { name: 'Parachute Coconut Oil', price: 95, originalPrice: 115, unit: '200 ml', badge: 'best_seller', images: ['https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80'], rating: 4.7 },
    { name: 'Himalaya Purifying Neem Face Wash', price: 90, originalPrice: 110, unit: '150 ml', images: ['https://images.unsplash.com/photo-1584820927498-cafe4c239369?w=400&q=80'], rating: 4.5 },
    { name: 'Listerine Cool Mint Mouthwash', price: 130, originalPrice: 155, unit: '250 ml', badge: 'deal', images: ['https://images.unsplash.com/photo-1584820927498-cafe4c239369?w=400&q=80'], rating: 4.4 },
  ],
  'household': [
    { name: 'Vim Dishwash Liquid', price: 89, originalPrice: 105, unit: '750 ml', badge: 'best_seller', images: ['https://images.unsplash.com/photo-1584820927498-cafe4c239369?w=400&q=80'], rating: 4.6 },
    { name: 'Surf Excel Matic Liquid', price: 299, originalPrice: 350, unit: '1 Litre', badge: 'deal', images: ['https://images.unsplash.com/photo-1584820927498-cafe4c239369?w=400&q=80'], rating: 4.7 },
    { name: 'Harpic Power Plus Toilet Cleaner', price: 110, originalPrice: 130, unit: '500 ml', images: ['https://images.unsplash.com/photo-1584820927498-cafe4c239369?w=400&q=80'], rating: 4.5 },
    { name: 'Dettol Antiseptic Liquid', price: 130, originalPrice: 155, unit: '250 ml', badge: 'best_seller', images: ['https://images.unsplash.com/photo-1584820927498-cafe4c239369?w=400&q=80'], rating: 4.8 },
    { name: 'Colin Glass Cleaner Spray', price: 110, originalPrice: 130, unit: '500 ml', badge: 'deal', images: ['https://images.unsplash.com/photo-1584820927498-cafe4c239369?w=400&q=80'], rating: 4.5 },
    { name: 'Good Knight Fast Card', price: 40, originalPrice: 50, unit: '10 pcs', images: ['https://images.unsplash.com/photo-1584820927498-cafe4c239369?w=400&q=80'], rating: 4.6 },
    { name: 'Scotch Brite Scrub Pad', price: 35, originalPrice: 40, unit: '3 pcs', images: ['https://images.unsplash.com/photo-1584820927498-cafe4c239369?w=400&q=80'], rating: 4.4 },
    { name: 'Lizol Floor Cleaner Floral', price: 140, originalPrice: 165, unit: '500 ml', badge: 'deal', images: ['https://images.unsplash.com/photo-1584820927498-cafe4c239369?w=400&q=80'], rating: 4.7 },
  ],
  'breakfast-bread': [
    { name: 'Britannia Brown Bread', price: 44, originalPrice: 50, unit: '400 g', badge: 'best_seller', images: ['https://images.unsplash.com/photo-1598128558393-70ff21433be0?w=400&q=80'], rating: 4.6 },
    { name: 'Kellogg\'s Corn Flakes', price: 155, originalPrice: 185, unit: '250 g', badge: 'deal', images: ['https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&q=80'], rating: 4.7 },
    { name: 'Quaker Oats (Instant)', price: 125, originalPrice: 150, unit: '400 g', badge: 'organic', images: ['https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&q=80'], rating: 4.8 },
    { name: 'Ensure Nutrition Powder (Chocolate)', price: 840, originalPrice: 990, unit: '400 g', badge: 'deal', images: ['https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&q=80'], rating: 4.7 },
    { name: 'Marie Gold Biscuits', price: 25, originalPrice: 28, unit: '250 g', badge: 'best_seller', images: ['https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&q=80'], rating: 4.5 },
    { name: 'Nutella Hazelnut Spread', price: 299, originalPrice: 350, unit: '200 g', badge: 'deal', images: ['https://images.unsplash.com/photo-1604803932791-72f3e82cc872?w=400&q=80'], rating: 4.9 },
    { name: 'Peanut Butter Creamy', price: 199, originalPrice: 240, unit: '340 g', badge: 'best_seller', images: ['https://images.unsplash.com/photo-1604803932791-72f3e82cc872?w=400&q=80'], rating: 4.7 },
    { name: 'Amul Strawberry Jam', price: 75, originalPrice: 90, unit: '500 g', images: ['https://images.unsplash.com/photo-1517594422361-5e18a412072f?w=400&q=80'], rating: 4.5 },
  ],
};

const backendFile = 'd:/ftafat/FataFat/backend/src/modules/grocery/grocery.service.js';
let code = fs.readFileSync(backendFile, 'utf8');

const oldReturn = `  return {
    products,
    total,
    totalPages: Math.ceil(total / Number(limit)),
    page: Number(page),
    limit: Number(limit),
  };`;

const newReturn = `  // Fallback: If no products from DB, return curated products by category
  if (products.length === 0 && category) {
    const catSlug = typeof category === 'string' ? category.toLowerCase().replace(/\\s+/g, '-') : '';
    const catalogData = ${JSON.stringify(CATEGORY_PRODUCTS, null, 4)};
    
    // Try exact match first, then partial match
    let dummyList = catalogData[catSlug];
    if (!dummyList) {
      // Try partial slug match
      const matchedKey = Object.keys(catalogData).find(k => catSlug.includes(k.split('-')[0]) || k.includes(catSlug.split('-')[0]));
      dummyList = matchedKey ? catalogData[matchedKey] : null;
    }
    
    if (dummyList) {
      const mapped = dummyList.map((p, i) => ({
        _id: new mongoose.Types.ObjectId().toString(),
        name: p.name,
        slug: p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + i,
        price: p.price,
        originalPrice: p.originalPrice,
        unit: p.unit,
        images: p.images,
        badge: p.badge || null,
        rating: p.rating || 4.5,
        ratingCount: 50 + i * 10,
        isAvailable: true,
        isActive: true,
        category: category
      }));
      return { products: mapped, total: mapped.length, totalPages: 1, page: 1, limit: mapped.length };
    }
    
    // Generic fallback for completely unknown categories
    const genericProducts = Array.from({ length: 8 }, (_, i) => ({
      _id: new mongoose.Types.ObjectId().toString(),
      name: \`Premium Fresh Product \${i + 1}\`,
      slug: \`\${catSlug}-product-\${i + 1}\`,
      price: 50 + i * 20,
      originalPrice: 70 + i * 20,
      unit: '1 kg',
      images: ['https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80'],
      rating: 4.5,
      ratingCount: 100,
      isAvailable: true,
      isActive: true,
      category: category
    }));
    return { products: genericProducts, total: genericProducts.length, totalPages: 1, page: 1, limit: genericProducts.length };
  }

  return {
    products,
    total,
    totalPages: Math.ceil(total / Number(limit)),
    page: Number(page),
    limit: Number(limit),
  };`;

code = code.replace(oldReturn, newReturn);
fs.writeFileSync(backendFile, code);
console.log('Successfully injected category-specific products into backend!');
