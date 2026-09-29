const fs = require('fs');

const file = 'd:/ftafat/FataFat/frontend/components/grocery/GroceryProductCard.tsx';
let code = fs.readFileSync(file, 'utf8');

const regex = /const imageUrl = imgError \? getImageForName[^;]+;/g;
const replacement = `const img = product.image || (product.images && product.images.length > 0 ? product.images[0] : null);
  const imageUrl = imgError || !img || img.includes('pexels') ? getImageForName(product.name) : img;`;

code = code.replace(regex, replacement);

fs.writeFileSync(file, code);
console.log('Fixed robust imageUrl');
