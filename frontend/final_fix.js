const fs = require('fs');
const files = [
  'd:/ftafat/FataFat/frontend/components/grocery/GroceryCart.tsx',
  'd:/ftafat/FataFat/frontend/components/grocery/GroceryCategoryProducts.tsx',
  'd:/ftafat/FataFat/frontend/components/grocery/GroceryProductDetails.tsx'
];

files.forEach(file => {
  if (!fs.existsSync(file)) return;
  let code = fs.readFileSync(file, 'utf8');

  // We are searching for `$` before an expression that starts with `{`.
  // e.g. `<Text>${` -> `<Text>₹{`
  // e.g. `   ${` -> `   ₹{`
  // WARNING: Don't replace `${` if it's inside a template literal like `` `${value}` ``
  // To avoid that, we can use specific replacements!

  // GroceryCart.tsx specific
  code = code.replace(/\$\\{\(product\.price \* item\.quantity\)\.toFixed\(0\)\\}/g, '₹{(product.price * item.quantity).toFixed(0)}');
  code = code.replace(/\$\\{\(originalPrice \* item\.quantity\)\.toFixed\(0\)\\}/g, '₹{(originalPrice * item.quantity).toFixed(0)}');
  code = code.replace(/`\\$\\{deliveryFee\.toFixed\(0\)\\}`/g, '`₹${deliveryFee.toFixed(0)}`'); // For the FREE delivery fallback
  code = code.replace(/>\\$\\{itemTotal\.toFixed\(0\)\\}/g, '>₹{itemTotal.toFixed(0)}'); // If it existed
  
  // GroceryCategoryProducts.tsx specific
  code = code.replace(/\$\\{product\.originalPrice\.toFixed\(0\)\\}/g, '₹{product.originalPrice.toFixed(0)}');

  // GroceryProductDetails.tsx specific
  code = code.replace(/\$\\{rel\.price\.toFixed\(0\)\\}/g, '₹{rel.price.toFixed(0)}');

  // Let's do a more robust one, just replace the exact line contents based on grep results:
  
  code = code.replace(/`\\$\\{finalToPay/g, '`₹${finalToPay');
  code = code.replace(/-\$\\{couponDiscount/g, '-₹${couponDiscount');
  code = code.replace(/>\$\\{neededForFree/g, '>₹${neededForFree');

  // JSX text replacements where it's formatted as `          ${expression}`
  code = code.replace(/([ \n])\$\{(product\.price|originalPrice|rel\.price|itemTotal|deliveryFee)/g, '$1₹{$2');

  fs.writeFileSync(file, code);
  console.log('Fixed', file);
});
