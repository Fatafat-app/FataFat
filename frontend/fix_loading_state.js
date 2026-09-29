const fs = require('fs');

const file = 'd:/ftafat/FataFat/frontend/components/grocery/GroceryAllCategories.tsx';
let code = fs.readFileSync(file, 'utf8');

// When we already have LOCAL_CATEGORIES pre-loaded, no need to show loading spinner
// Set loading=false initially so categories show immediately
code = code.replace(
  'const [loading, setLoading] = useState(true);',
  'const [loading, setLoading] = useState(false);'
);

fs.writeFileSync(file, code);
console.log('Fixed: loading starts as false (categories show immediately)');
