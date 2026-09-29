const fs = require('fs');

const file = 'd:/ftafat/FataFat/frontend/components/grocery/GroceryAllCategories.tsx';
let code = fs.readFileSync(file, 'utf8');

// If backend returns 0 categories, use these local ones with proper slugs
const localFallback = `
const LOCAL_CATEGORIES = [
  { id: '1', name: 'Fresh Vegetables', slug: 'fresh-vegetables', emoji: '🥦', image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=300&q=80', bg: '#F0FDF4', subtitle: 'Farm fresh daily', badge: 'FRESH', badgeType: 'lime', itemCount: '50+ items' },
  { id: '2', name: 'Fresh Fruits', slug: 'fresh-fruits', emoji: '🍎', image: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=300&q=80', bg: '#FFF7ED', subtitle: 'Seasonal & exotic', badge: 'POPULAR', badgeType: 'lime', itemCount: '40+ items' },
  { id: '3', name: 'Dairy & Eggs', slug: 'dairy-eggs', emoji: '🥛', image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=300&q=80', bg: '#EFF6FF', subtitle: 'Daily essentials', badge: 'TOP OFFER', badgeType: 'lime', itemCount: '30+ items' },
  { id: '4', name: 'Atta, Rice & Dal', slug: 'atta-rice-dal', emoji: '🌾', image: 'https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?w=300&q=80', bg: '#FEF9C3', subtitle: 'Kitchen staples', badge: 'VALUE', badgeType: 'lime', itemCount: '60+ items' },
  { id: '5', name: 'Oil & Masala', slug: 'oil-masala', emoji: '🫙', image: 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=300&q=80', bg: '#FFF7ED', subtitle: 'Spices & condiments', badge: 'DEALS', badgeType: 'pink', itemCount: '80+ items' },
  { id: '6', name: 'Snacks & Drinks', slug: 'snacks-drinks', emoji: '🥤', image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=300&q=80', bg: '#F0F9FF', subtitle: 'Munch any time', badge: 'HOT', badgeType: 'pink', itemCount: '70+ items' },
  { id: '7', name: 'Personal Care', slug: 'personal-care', emoji: '🧴', image: 'https://images.unsplash.com/photo-1584820927498-cafe4c239369?w=300&q=80', bg: '#F9F0FF', subtitle: 'Stay fresh & clean', badge: 'NEW', badgeType: 'grey', itemCount: '45+ items' },
  { id: '8', name: 'Household Items', slug: 'household', emoji: '🧹', image: 'https://images.unsplash.com/photo-1584820927498-cafe4c239369?w=300&q=80', bg: '#F0FDF4', subtitle: 'Home & kitchen', badge: 'TOP OFFER', badgeType: 'lime', itemCount: '55+ items' },
  { id: '9', name: 'Breakfast & Bread', slug: 'breakfast-bread', emoji: '🍞', image: 'https://images.unsplash.com/photo-1598128558393-70ff21433be0?w=300&q=80', bg: '#FFFBEB', subtitle: 'Morning essentials', badge: 'POPULAR', badgeType: 'lime', itemCount: '35+ items' },
];
`;

// Insert after the getImageForName function (before const { width })
if (!code.includes('LOCAL_CATEGORIES')) {
  code = code.replace('const { width } = Dimensions.get(\'window\');', localFallback + '\nconst { width } = Dimensions.get(\'window\');');
}

// Update the fetchCategories function to use fallback when backend returns empty
const oldFetch = `      if (data && data.length > 0) {
        const mapped: GroceryCategory[] = data.map((c) => ({
          id: c._id || c.slug,
          _id: c._id,
          name: c.name,
          slug: c.slug,
          emoji: c.emoji || '🛒',
          image: (!c.image || c.image.includes('pexels')) ? getImageForName(c.name) : c.image,
          bg: c.bg || '#F3F7F2',
          subtitle: c.subtitle || 'Essential daily staples',
          badge: c.badge || 'TOP OFFER',
          badgeType: c.badgeType || 'lime',
          itemCount: c.itemCount || '50+ items',
        }));
        setCategories(mapped);
      }`;

const newFetch = `      if (data && data.length > 0) {
        const mapped: GroceryCategory[] = data.map((c) => ({
          id: c._id || c.slug,
          _id: c._id,
          name: c.name,
          slug: c.slug,
          emoji: c.emoji || '🛒',
          image: (!c.image || c.image.includes('pexels')) ? getImageForName(c.name) : c.image,
          bg: c.bg || '#F3F7F2',
          subtitle: c.subtitle || 'Essential daily staples',
          badge: c.badge || 'TOP OFFER',
          badgeType: c.badgeType || 'lime',
          itemCount: c.itemCount || '50+ items',
        }));
        setCategories(mapped);
      } else {
        // Backend has no categories seeded, use local curated list
        setCategories(LOCAL_CATEGORIES as any);
      }`;

code = code.replace(oldFetch, newFetch);
fs.writeFileSync(file, code);
console.log('Added local category fallback + proper slugs');
