const fs = require('fs');

function fixFile(file, replacements) {
  if (!fs.existsSync(file)) return;
  let code = fs.readFileSync(file, 'utf8');
  replacements.forEach(([from, to]) => {
    code = code.split(from).join(to);
  });
  fs.writeFileSync(file, code);
  console.log('Fixed', file);
}

fixFile('d:/ftafat/FataFat/frontend/components/grocery/GroceryCart.tsx', [
  ['${(product.price * item.quantity).toFixed(0)}', '₹{(product.price * item.quantity).toFixed(0)}'],
  ['${(originalPrice * item.quantity).toFixed(0)}', '₹{(originalPrice * item.quantity).toFixed(0)}']
]);

fixFile('d:/ftafat/FataFat/frontend/components/grocery/GroceryCategoryProducts.tsx', [
  ['${product.originalPrice.toFixed(0)}', '₹{product.originalPrice.toFixed(0)}']
]);
