const fs = require('fs');

const file = 'd:/ftafat/FataFat/frontend/components/grocery/GroceryAllCategories.tsx';
let code = fs.readFileSync(file, 'utf8');

// Fix 1: Initialize with LOCAL_CATEGORIES so it shows instantly
code = code.replace(
  '] = useState<GroceryCategory[]>([]);',
  '] = useState<GroceryCategory[]>(LOCAL_CATEGORIES as any);'
);

fs.writeFileSync(file, code);

// Verify
const updated = fs.readFileSync(file, 'utf8');
console.log('Contains LOCAL_CATEGORIES init:', updated.includes('useState<GroceryCategory[]>(LOCAL_CATEGORIES'));
