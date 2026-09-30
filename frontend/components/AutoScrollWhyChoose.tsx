import React, { useRef, useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BOLD_FONT, STYLISH_FONT } from '../constants/Theme';

const { width } = Dimensions.get('window');

const WHY_CHOOSE_DATA = [
  { title: 'Lightning Fast', desc: 'Hot food delivered in 30 mins', icon: 'flash', color: '#F59E0B', bg: '#FEF3C7' },
  { title: '100% Safe', desc: 'Hygienic and contactless delivery', icon: 'shield-checkmark', color: '#10B981', bg: '#D1FAE5' },
  { title: 'Top Rated', desc: 'Curated list of best restaurants', icon: 'star', color: '#F43F5E', bg: '#FFE4E6' },
  { title: 'Live Tracking', desc: 'Track your order in real-time', icon: 'map', color: '#3B82F6', bg: '#DBEAFE' },
];

// Calculate item width including gap
const ITEM_WIDTH = 160;
const ITEM_GAP = 12;
const SNAP_INTERVAL = ITEM_WIDTH + ITEM_GAP;

export default function AutoScrollWhyChoose() {
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      let nextIndex = currentIndex + 1;
      if (nextIndex >= WHY_CHOOSE_DATA.length) {
        nextIndex = 0;
      }
      
      scrollViewRef.current?.scrollTo({
        x: nextIndex * SNAP_INTERVAL,
        animated: true,
      });
      
      setCurrentIndex(nextIndex);
    }, 3000); // Scroll every 3 seconds

    return () => clearInterval(timer);
  }, [currentIndex]);

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Why Choose Ftafat?</Text>
      </View>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        snapToInterval={SNAP_INTERVAL}
        decelerationRate="fast"
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / SNAP_INTERVAL);
          setCurrentIndex(index);
        }}
      >
        {WHY_CHOOSE_DATA.map((item, idx) => (
          <View key={idx} style={[styles.card, { backgroundColor: item.bg, shadowColor: item.color }]}>
            <View style={styles.iconBox}>
              <Ionicons name={item.icon as any} size={20} color={item.color} />
            </View>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.desc}>{item.desc}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 120,
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: BOLD_FONT,
    fontSize: 18,
    color: '#1F2937',
    letterSpacing: -0.5,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: ITEM_GAP,
  },
  card: {
    width: ITEM_WIDTH,
    padding: 16,
    borderRadius: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontFamily: BOLD_FONT,
    fontSize: 14,
    color: '#1F2937',
    marginBottom: 4,
  },
  desc: {
    fontFamily: STYLISH_FONT,
    fontSize: 11,
    color: '#4B5563',
    lineHeight: 16,
  },
});
