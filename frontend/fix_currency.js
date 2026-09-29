const fs = require('fs');
const file = 'd:/ftafat/FataFat/frontend/components/grocery/GroceryCart.tsx';
let code = fs.readFileSync(file, 'utf8');

// Replace all $ literals followed by { to ₹{
code = code.replace(/\$\$\{/g, '₹${'); // For template literal interpolation `$${value}` -> `₹${value}`
code = code.replace(/-\$\$\{/g, '-₹${'); // `-$${value}` -> `-₹${value}`

// Replace $ followed by numbers
code = code.replace(/\$([0-9.]+)/g, '₹$1');

// Remove .toFixed(2) since INR usually drops decimals in UI
code = code.replace(/\.toFixed\(2\)/g, '.toFixed(0)');

fs.writeFileSync(file, code);
console.log('Done replacement');
