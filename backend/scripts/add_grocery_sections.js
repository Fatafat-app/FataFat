const fs = require('fs');
const path = 'd:/ftafat/FataFat/frontend/components/grocery/GroceryHome.tsx';
let content = fs.readFileSync(path, 'utf8');

const targetStr = `        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No items found in this category.</Text>
          </View>
        )}`;

const newSections = `        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No items found in this category.</Text>
          </View>
        )}

        {/* EXTRA SECTIONS for Homepage */}
        {!selectedCategory && !activeFilter && trending.length > 0 && (
          <View style={{ marginTop: 24 }}>
            {/* Explore New Arrivals */}
            <SectionHeader title="Explore New Arrivals" />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16, gap: 12, paddingBottom: 24 }}
            >
              {[...trending].reverse().slice(0, 6).map((product) => (
                <GroceryProductCard key={\`new-\${product.id || product._id}\`} product={product} />
              ))}
            </ScrollView>

            {/* Daily Needs */}
            <SectionHeader title="Daily Needs" />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16, gap: 12, paddingBottom: 24 }}
            >
              {[...trending].slice(1, 7).map((product) => (
                <GroceryProductCard key={\`daily-\${product.id || product._id}\`} product={product} />
              ))}
            </ScrollView>

            {/* Snacks & Munchies */}
            <SectionHeader title="Snacks & Munchies" />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16, gap: 12, paddingBottom: 24 }}
            >
              {[...trending].reverse().slice(2, 8).map((product) => (
                <GroceryProductCard key={\`snacks-\${product.id || product._id}\`} product={product} />
              ))}
            </ScrollView>
          </View>
        )}`;

// Normalize newlines in search string to match the file
const escapedSearch = targetStr.replace(/\r\n/g, '\\n').replace(/\n/g, '\\r?\\n');
const regex = new RegExp(escapedSearch);

content = content.replace(regex, newSections);
fs.writeFileSync(path, content, 'utf8');
console.log("Successfully added horizontal sections.");
