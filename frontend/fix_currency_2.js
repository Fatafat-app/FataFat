const fs = require('fs');
const path = require('path');

const files = [
  'd:/ftafat/FataFat/frontend/components/grocery/GroceryCart.tsx',
  'd:/ftafat/FataFat/frontend/components/grocery/GroceryCategoryProducts.tsx',
  'd:/ftafat/FataFat/frontend/components/grocery/GroceryFloatingCart.tsx',
  'd:/ftafat/FataFat/frontend/components/grocery/GroceryProductDetails.tsx',
  'd:/ftafat/FataFat/frontend/components/grocery/GroceryAllCategories.tsx'
];

files.forEach(file => {
  if (!fs.existsSync(file)) return;
  let code = fs.readFileSync(file, 'utf8');

  // Replace literal $ followed by { (e.g. >${total.toFixed(2)}) with >₹{
  code = code.replace(/>\$\{/g, '>₹{');

  // Replace Enjoy -${ with Enjoy -₹{
  code = code.replace(/-\$\{/g, '-₹{');
  
  // Replace >$ with >₹ (e.g. >$10)
  code = code.replace(/>\$/g, '>₹');

  // Fix .toFixed(2) in grocery cart mostly
  code = code.replace(/\.toFixed\(2\)/g, '.toFixed(0)');
  
  // Fix template string literal like `...$${...}`
  code = code.replace(/\$\$\{/g, '₹${');

  fs.writeFileSync(file, code);
  console.log('Fixed', file);
});
