const fs = require('fs');
const path = 'd:/ftafat/FataFat/frontend/components/grocery/GroceryAllCategories.tsx';
let content = fs.readFileSync(path, 'utf8');

// Replace Top Row and Image Container
content = content.replace(/\{\/\* Top Row: Badge \+ Chevron \*\/\}[\s\S]*?\{\/\* Title & Subtitle \*\/\}/, `
                  {/* Landscape Image Container */}
                  <View style={styles.imageOval}>
                    {cat.image ? (
                      <Image
                        source={{ uri: cat.image }}
                        style={styles.cardImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <Text style={{ fontSize: 36 }}>{cat.emoji || '🛒'}</Text>
                    )}
                  </View>

                  <View style={styles.details}>
                  {/* Title & Subtitle */}`);

// Remove Subtitle and Bottom Row
content = content.replace(/<Text style=\{styles\.categorySubtitle\}[\s\S]*?<\/View>\s*<\/View>\s*<\/TouchableOpacity>/g, `</View>\n                </TouchableOpacity>`);

// Fix CSS
content = content.replace(/categoryCard: \{[\s\S]*?elevation: 2,/g, `categoryCard: {
    width: CARD_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
    overflow: 'hidden'`);

content = content.replace(/imageOval: \{[\s\S]*?overflow: 'hidden',/g, `imageOval: {
    width: '100%',
    height: 120, // Match product card height
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    padding: 10,`);

content = content.replace(/cardImage: \{[\s\S]*?borderRadius: 16,/g, `cardImage: {
    width: '100%',
    height: 100, // Match product image landscape height
    borderRadius: 10,
    backgroundColor: '#F9FAFB',`);

content = content.replace(/categoryName: \{[\s\S]*?marginBottom: 2,/g, `details: {
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryName: {
    fontSize: 13,
    fontFamily: BOLD_FONT,
    color: '#1E293B',
    textAlign: 'center',`);

fs.writeFileSync(path, content, 'utf8');
console.log('Update Complete');
