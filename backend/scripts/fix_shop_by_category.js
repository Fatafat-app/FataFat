const fs = require('fs');
const path = 'd:/ftafat/FataFat/frontend/components/grocery/GroceryCategories.tsx';
let content = fs.readFileSync(path, 'utf8');

// Ensure Ionicons is imported
if (!content.includes("@expo/vector-icons")) {
  content = content.replace(/import \{ LinearGradient \} from 'expo-linear-gradient';/, `import { LinearGradient } from 'expo-linear-gradient';\nimport { Ionicons } from '@expo/vector-icons';`);
}

// Add helper functions
const helpers = `
const getCategoryColor = (name) => {
  if (!name) return '#E8F5E9';
  const lower = name.toLowerCase();
  if (lower.includes('veg') || lower.includes('fruit')) return '#E8F5E9'; // light green
  if (lower.includes('oil') || lower.includes('ghee')) return '#FFF3E0'; // light orange
  if (lower.includes('stationery') || lower.includes('school')) return '#F3E5F5'; // light purple
  if (lower.includes('snack') || lower.includes('beverage')) return '#FFEBEE'; // light red
  if (lower.includes('dairy') || lower.includes('milk') || lower.includes('egg')) return '#E3F2FD'; // light blue
  if (lower.includes('meat') || lower.includes('chicken')) return '#FFEBEE'; // light red
  const colors = ['#E8F5E9', '#FFF3E0', '#F3E5F5', '#FFEBEE', '#E3F2FD', '#E0F7FA'];
  return colors[name.length % colors.length];
};

const getCategoryIcon = (name) => {
  if (!name) return 'apps';
  const lower = name.toLowerCase();
  if (lower.includes('veg') || lower.includes('fruit')) return 'leaf';
  if (lower.includes('oil') || lower.includes('ghee')) return 'water';
  if (lower.includes('stationery') || lower.includes('school')) return 'book';
  if (lower.includes('snack') || lower.includes('beverage')) return 'fast-food';
  if (lower.includes('dairy') || lower.includes('milk') || lower.includes('egg')) return 'pint';
  if (lower.includes('meat') || lower.includes('chicken')) return 'restaurant';
  return 'apps';
};
`;
if (!content.includes('getCategoryColor')) {
  content = content.replace(/export function GroceryCategories/, helpers + '\nexport function GroceryCategories');
}

// Replace the TouchableOpacity return block inside map
content = content.replace(/return \([\s\S]*?<\/TouchableOpacity>\s*\);/g, `
          const bgColor = getCategoryColor(cat.name);
          const iconName = getCategoryIcon(cat.name);
          return (
            <TouchableOpacity
              key={cat.id || cat._id}
              style={[styles.categoryCard, { backgroundColor: bgColor }, isActive && styles.categoryCardActive]}
              onPress={() => {
                const nextId = isActive ? null : cat.id;
                setInternalActiveId(nextId);
                onCategoryPress?.(cat);
              }}
              activeOpacity={0.9}
            >
              <View style={styles.imageContainer}>
                <Image source={imageSource} style={styles.categoryImage} resizeMode="cover" />
              </View>
              <View style={[styles.iconWrapper, { borderColor: bgColor }]}>
                <Ionicons name={iconName} size={15} color="#FFFFFF" />
              </View>
              <Text style={styles.categoryName} numberOfLines={2}>
                {cat.name}
              </Text>
              <Ionicons name="arrow-forward" size={14} color="#1E3D34" style={styles.arrowIcon} />
            </TouchableOpacity>
          );`);

// Replace Styles
content = content.replace(/\/\/ Immersive Card Design[\s\S]*?\}\);\s*$/g, `// Pastel Card Design matching screenshot
  categoryCard: {
    width: 96,
    height: 145,
    borderRadius: 16,
    marginRight: 14,
    alignItems: 'center',
    paddingBottom: 10,
  },
  categoryCardActive: {
    borderWidth: 1.5,
    borderColor: '#1E3D34',
  },
  imageContainer: {
    width: '100%',
    height: 65,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
  },
  categoryImage: {
    width: '100%',
    height: '100%',
  },
  iconWrapper: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#2E5041',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    marginTop: -15, // overlaps the image
    marginBottom: 6,
  },
  categoryName: {
    fontFamily: BOLD_FONT,
    fontSize: 11.5,
    color: '#1F2937',
    textAlign: 'center',
    paddingHorizontal: 4,
    lineHeight: 14,
    height: 28,
  },
  arrowIcon: {
    marginTop: 4,
  }
});
`);

fs.writeFileSync(path, content, 'utf8');
console.log('Update Complete');
