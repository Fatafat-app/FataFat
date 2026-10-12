import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Alert,
  Modal,
  Image,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { bannerService, BannerItem, CreateBannerPayload } from '../../services/banner.service';
import { Typography, Colors } from '../../constants/Theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ADMIN_PRIMARY = '#0D9488';

const COLOR_PRESETS = [
  { name: 'Teal', colors: ['#0D9488', '#0F766E'], accent: '#CCFBF1', text: '#FFFFFF' },
  { name: 'Amber', colors: ['#F59E0B', '#D97706'], accent: '#FEF3C7', text: '#1A1A1F' },
  { name: 'Orange', colors: ['#EA580C', '#C2410C'], accent: '#FFEDD5', text: '#FFFFFF' },
  { name: 'Flame', colors: ['#F97316', '#EA580C'], accent: '#FFF7ED', text: '#FFFFFF' },
  { name: 'Emerald', colors: ['#10B981', '#059669'], accent: '#D1FAE5', text: '#FFFFFF' },
  { name: 'Indigo', colors: ['#6366F1', '#4F46E5'], accent: '#E0E7FF', text: '#FFFFFF' },
  { name: 'Rose', colors: ['#E11D48', '#BE123C'], accent: '#FFE4E6', text: '#FFFFFF' },
  { name: 'Dark Slate', colors: ['#1E293B', '#0F172A'], accent: '#E2E8F0', text: '#FFFFFF' },
];

const IMAGE_PRESETS = [
  { label: 'Pizza', url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&q=80' },
  { label: 'Burger', url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80' },
  { label: 'Biryani/Feast', url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80' },
  { label: 'Indian Thali', url: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=800&q=80' },
  { label: 'Curry Spice', url: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&q=80' },
  { label: 'Fresh Salad', url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80' },
  { label: 'Desserts', url: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=800&q=80' },
];

export default function AdminBannersScreen() {
  const router = useRouter();
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ALL' | 'FOOD_HERO' | 'OFFERS_FOR_YOU' | 'SPOTLIGHT' | 'GROCERY_HERO'>('ALL');

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingBanner, setEditingBanner] = useState<BannerItem | null>(null);
  const [saving, setSaving] = useState(false);

  // Form State
  const [displayMode, setDisplayMode] = useState<'CARD_TEMPLATE' | 'FULL_POSTER'>('CARD_TEMPLATE');
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [tag, setTag] = useState('PROMO');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [section, setSection] = useState<'FOOD_HERO' | 'OFFERS_FOR_YOU' | 'SPOTLIGHT' | 'GROCERY_HERO'>('FOOD_HERO');
  const [selectedColors, setSelectedColors] = useState<string[]>(['#0D9488', '#0F766E']);
  const [textColor, setTextColor] = useState('#FFFFFF');
  const [accentColor, setAccentColor] = useState('#CCFBF1');
  const [actionText, setActionText] = useState('Order Now');
  const [targetType, setTargetType] = useState<'restaurant' | 'category' | 'cuisine' | 'coupon' | 'search' | 'none'>('search');
  const [targetId, setTargetId] = useState('');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    loadBanners();
  }, [activeTab]);

  const loadBanners = async () => {
    try {
      setIsLoading(true);
      const data = await bannerService.getAllBannersAdmin(activeTab === 'ALL' ? undefined : activeTab);
      setBanners(data);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to load banners');
    } finally {
      setIsLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingBanner(null);
    setDisplayMode('CARD_TEMPLATE');
    setTitle('');
    const isSpotlight = activeTab === 'SPOTLIGHT';
    setSubtitle(isSpotlight ? 'Up to 40% OFF' : '');
    setTag(isSpotlight ? 'BESTSELLER' : 'PROMO');
    setDescription('');
    setImage(IMAGE_PRESETS[0].url);
    setSection(activeTab === 'ALL' ? 'FOOD_HERO' : (activeTab as any));
    setSelectedColors(COLOR_PRESETS[0].colors);
    setTextColor(COLOR_PRESETS[0].text);
    setAccentColor(isSpotlight ? '#F59E0B' : COLOR_PRESETS[0].accent);
    setActionText(isSpotlight ? 'Explore Menu' : 'Order Now');
    setTargetType(isSpotlight ? 'restaurant' : 'search');
    setTargetId('');
    setIsActive(true);
    setModalVisible(true);
  };

  const openEditModal = (b: BannerItem) => {
    setEditingBanner(b);
    setDisplayMode(b.displayMode || 'CARD_TEMPLATE');
    setTitle(b.title || '');
    setSubtitle(b.subtitle || '');
    setTag(b.tag || 'PROMO');
    setDescription(b.description || '');
    setImage(b.image || '');
    setSection(b.section || 'FOOD_HERO');
    setSelectedColors(b.colors?.length ? b.colors : COLOR_PRESETS[0].colors);
    setTextColor(b.textColor || '#FFFFFF');
    setAccentColor(b.accentColor || '#CCFBF1');
    setActionText(b.actionText || 'Order Now');
    setTargetType(b.targetType || 'none');
    setTargetId(b.targetId || '');
    setIsActive(b.isActive ?? true);
    setModalVisible(true);
  };

  const handleSaveBanner = async () => {
    if (displayMode === 'CARD_TEMPLATE' && !title.trim()) {
      Alert.alert('Validation Error', 'Banner title is required for card templates');
      return;
    }
    if (!image.trim()) {
      Alert.alert('Validation Error', 'Banner image URL is required');
      return;
    }

    try {
      setSaving(true);
      const payload: CreateBannerPayload = {
        displayMode,
        title: title.trim() || 'Promo Poster',
        subtitle: displayMode === 'FULL_POSTER' ? undefined : (subtitle.trim() || undefined),
        tag: displayMode === 'FULL_POSTER' ? undefined : (tag.trim() || undefined),
        description: displayMode === 'FULL_POSTER' ? undefined : (description.trim() || undefined),
        image: image.trim(),
        section,
        colors: selectedColors,
        textColor,
        accentColor,
        actionText: actionText.trim() || 'Order Now',
        targetType,
        targetId: targetId.trim() || undefined,
        isActive,
      };

      if (editingBanner) {
        await bannerService.updateBanner(editingBanner._id, payload);
        Alert.alert('Success', 'Banner updated successfully!');
      } else {
        await bannerService.createBanner(payload);
        Alert.alert('Success', 'Banner created successfully!');
      }

      setModalVisible(false);
      loadBanners();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to save banner');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (banner: BannerItem) => {
    try {
      const nextActive = !banner.isActive;
      await bannerService.toggleBanner(banner._id, nextActive);
      setBanners((prev) =>
        prev.map((b) => (b._id === banner._id ? { ...b, isActive: nextActive } : b))
      );
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to toggle status');
    }
  };

  const handleDeleteBanner = (banner: BannerItem) => {
    const doDelete = async () => {
      try {
        await bannerService.deleteBanner(banner._id);
        setBanners((prev) => prev.filter((b) => b._id !== banner._id));
      } catch (err: any) {
        Alert.alert('Error', err.response?.data?.message || 'Failed to delete banner');
      }
    };

    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm(`Are you sure you want to delete banner "${banner.title}"?`)) {
        doDelete();
      }
      return;
    }

    Alert.alert(
      'Delete Banner',
      `Are you sure you want to delete banner "${banner.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: doDelete,
        },
      ]
    );
  };

  const moveOrder = async (index: number, direction: 'UP' | 'DOWN') => {
    const targetIdx = direction === 'UP' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= banners.length) return;

    const updated = [...banners];
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;

    setBanners(updated);

    try {
      await bannerService.reorderBanners(updated.map((item) => ({ id: item._id })));
    } catch {
      // Revert if failed
      loadBanners();
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.headerTitle}>Banners & Posters</Text>
          <Text style={styles.headerSub}>Manage dynamic homepage hero and promo posters</Text>
        </View>
        <TouchableOpacity onPress={openCreateModal} style={styles.createBtn}>
          <Ionicons name="add" size={20} color="#FFF" />
          <Text style={styles.createBtnText}>Add</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {(['ALL', 'FOOD_HERO', 'OFFERS_FOR_YOU', 'SPOTLIGHT', 'GROCERY_HERO'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[styles.tabItem, activeTab === tab && styles.tabItemActive]}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'ALL'
                ? 'All'
                : tab === 'FOOD_HERO'
                ? 'Hero Carousel'
                : tab === 'OFFERS_FOR_YOU'
                ? 'Offers For You'
                : tab === 'SPOTLIGHT'
                ? 'Spotlight'
                : 'Grocery Hero'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Main List */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={loadBanners} colors={[ADMIN_PRIMARY]} />}
      >
        {isLoading && banners.length === 0 ? (
          <ActivityIndicator size="large" color={ADMIN_PRIMARY} style={{ marginTop: 40 }} />
        ) : banners.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="images-outline" size={48} color={Colors.textSecondary} />
            <Text style={styles.emptyTitle}>No Banners Found</Text>
            <Text style={styles.emptySub}>Add a promotional poster or hero banner to display here.</Text>
            <TouchableOpacity onPress={openCreateModal} style={[styles.createBtn, { marginTop: 16 }]}>
              <Ionicons name="add" size={18} color="#FFF" />
              <Text style={styles.createBtnText}>Create Banner</Text>
            </TouchableOpacity>
          </View>
        ) : (
          banners.map((item, index) => {
            const isDarkText = item.textColor === '#1A1A1F';
            const isFullPoster = item.displayMode === 'FULL_POSTER';
            const c1 = (Array.isArray(item.colors) && item.colors[0]) || '#0D9488';
            const c2 = (Array.isArray(item.colors) && item.colors[1]) || c1;
            return (
              <View key={item._id} style={styles.bannerCardContainer}>
                {/* Live Banner Preview Card */}
                {isFullPoster ? (
                  <View style={[styles.previewCard, { padding: 0, backgroundColor: '#0F172A', height: 180 }]}>
                    <Image source={{ uri: item.image }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                    <View style={{ position: 'absolute', top: 12, left: 12, backgroundColor: 'rgba(0,0,0,0.65)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
                      <Text style={{ ...Typography.label, fontSize: 10, color: '#FFF', fontWeight: 'bold' }}>
                        🖼️ FULL POSTER
                      </Text>
                    </View>
                    <View style={{ position: 'absolute', bottom: 12, right: 12, backgroundColor: 'rgba(255,255,255,0.92)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Text style={{ ...Typography.label, fontSize: 11, color: '#0D9488', fontWeight: 'bold' }}>
                        Click Link Active
                      </Text>
                      <Ionicons name="arrow-forward" size={12} color="#0D9488" />
                    </View>
                  </View>
                ) : item.section === 'SPOTLIGHT' ? (
                  <View style={[styles.previewCard, { padding: 0, height: 180, overflow: 'hidden', backgroundColor: '#1A1A1A' }]}>
                    <Image source={{ uri: item.image }} style={{ width: '100%', height: '100%', position: 'absolute' }} resizeMode="cover" />
                    <LinearGradient
                      colors={['rgba(0,0,0,0.15)', 'rgba(0,0,0,0.88)']}
                      style={{ flex: 1, justifyContent: 'flex-end', padding: 16 }}
                    >
                      {item.tag ? (
                        <View style={{ backgroundColor: item.accentColor || '#F59E0B', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginBottom: 6 }}>
                          <Text style={{ ...Typography.label, color: '#FFF', fontSize: 9, fontWeight: 'bold', textTransform: 'uppercase' }}>{item.tag}</Text>
                        </View>
                      ) : null}
                      <Text style={{ ...Typography.heading, color: item.textColor || '#FFF', fontSize: 18, marginBottom: 2 }} numberOfLines={1}>
                        {item.title}
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Ionicons name="flame" size={14} color="#F59E0B" />
                        <Text style={{ ...Typography.bodySmall, color: '#FCD34D', fontSize: 12, marginLeft: 4, fontWeight: 'bold' }} numberOfLines={1}>
                          {item.subtitle || 'Special Deal'}
                        </Text>
                      </View>
                    </LinearGradient>
                  </View>
                ) : (
                  <View style={[styles.previewCard, { backgroundColor: c1 }]}>
                    <LinearGradient
                      colors={[c1, c2]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={StyleSheet.absoluteFill}
                    />

                    {/* Image on Right */}
                    <View style={styles.previewImageContainer}>
                      <Image source={{ uri: item.image }} style={styles.previewImage} />
                    </View>

                    <View style={styles.previewContent}>
                      {item.tag ? (
                        <View style={[styles.tagBadge, { backgroundColor: item.accentColor || 'rgba(255,255,255,0.2)' }]}>
                          <Text style={[styles.tagText, { color: isDarkText ? '#1A1A1F' : item.colors?.[1] || '#0F766E' }]}>
                            {item.tag}
                          </Text>
                        </View>
                      ) : null}

                      <Text style={[styles.previewTitle, { color: item.textColor || '#FFF' }]} numberOfLines={1}>
                        {item.title}
                      </Text>
                      {item.subtitle ? (
                        <Text style={[styles.previewSubtitle, { color: item.textColor || '#FFF' }]} numberOfLines={1}>
                          {item.subtitle}
                        </Text>
                      ) : null}
                      {item.description ? (
                        <Text
                          style={[styles.previewDescription, { color: isDarkText ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.85)' }]}
                          numberOfLines={2}
                        >
                          {item.description}
                        </Text>
                      ) : null}

                      <View style={styles.actionPill}>
                        <Text style={[styles.actionPillText, { color: item.colors?.[0] || '#0D9488' }]}>
                          {item.actionText || 'Order Now'}
                        </Text>
                        <Ionicons name="arrow-forward" size={12} color={item.colors?.[0] || '#0D9488'} />
                      </View>
                    </View>
                  </View>
                )}

                {/* Banner Management Meta Bar */}
                <View style={styles.metaBar}>
                  {/* Row 1: Badges & Target Link */}
                  <View style={styles.metaInfoRow}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', flex: 1 }}>
                      <View style={styles.sectionBadge}>
                        <Text style={styles.sectionBadgeText}>{item.section}</Text>
                      </View>
                      <View style={[styles.sectionBadge, { backgroundColor: isFullPoster ? '#FEF3C7' : '#E0F2FE' }]}>
                        <Text style={[styles.sectionBadgeText, { color: isFullPoster ? '#B45309' : '#0369A1' }]}>
                          {isFullPoster ? '🖼️ POSTER' : '🎨 CARD'}
                        </Text>
                      </View>
                      {item.targetType && item.targetType !== 'none' ? (
                        <View style={[styles.sectionBadge, { backgroundColor: '#F1F5F9' }]}>
                          <Text style={[styles.sectionBadgeText, { color: '#475569' }]} numberOfLines={1}>
                            🔗 {item.targetType}: {item.targetId || 'any'}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  </View>

                  {/* Row 2: Action Controls (On/Off Switch, Up/Down, Edit, Delete) */}
                  <View style={styles.metaActionsRow}>
                    {/* Active/Inactive Status Toggle */}
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => handleToggleActive(item)}
                      style={[
                        styles.statusTogglePill,
                        { backgroundColor: item.isActive ? '#ECFDF5' : '#F1F5F9', borderColor: item.isActive ? '#A7F3D0' : '#E2E8F0' },
                      ]}
                    >
                      <Switch
                        value={item.isActive}
                        onValueChange={() => handleToggleActive(item)}
                        trackColor={{ false: '#D1D5DB', true: '#99F6E4' }}
                        thumbColor={item.isActive ? ADMIN_PRIMARY : '#9CA3AF'}
                        style={{ transform: [{ scaleX: 0.75 }, { scaleY: 0.75 }] }}
                      />
                      <Text style={[styles.statusText, { color: item.isActive ? '#047857' : '#64748B' }]}>
                        {item.isActive ? 'Active (ON)' : 'Paused (OFF)'}
                      </Text>
                    </TouchableOpacity>

                    {/* Buttons Group */}
                    <View style={styles.btnGroup}>
                      {/* Reorder Up */}
                      <TouchableOpacity
                        onPress={() => moveOrder(index, 'UP')}
                        disabled={index === 0}
                        style={[styles.iconBtn, index === 0 && { opacity: 0.3 }]}
                        hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                      >
                        <Ionicons name="arrow-up" size={15} color={Colors.text} />
                      </TouchableOpacity>

                      {/* Reorder Down */}
                      <TouchableOpacity
                        onPress={() => moveOrder(index, 'DOWN')}
                        disabled={index === banners.length - 1}
                        style={[styles.iconBtn, index === banners.length - 1 && { opacity: 0.3 }]}
                        hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                      >
                        <Ionicons name="arrow-down" size={15} color={Colors.text} />
                      </TouchableOpacity>

                      {/* Edit Button */}
                      <TouchableOpacity
                        onPress={() => openEditModal(item)}
                        style={[styles.iconBtn, { backgroundColor: '#F0FDFA', borderColor: '#CCFBF1' }]}
                      >
                        <Ionicons name="pencil" size={14} color={ADMIN_PRIMARY} />
                        <Text style={[styles.btnLabel, { color: ADMIN_PRIMARY }]}>Edit</Text>
                      </TouchableOpacity>

                      {/* Delete Button */}
                      <TouchableOpacity
                        onPress={() => handleDeleteBanner(item)}
                        style={[styles.iconBtn, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}
                      >
                        <Ionicons name="trash" size={14} color="#DC2626" />
                        <Text style={[styles.btnLabel, { color: '#DC2626' }]}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Create / Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <SafeAreaView style={styles.modalContainer} edges={['bottom']}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingBanner ? 'Edit Banner' : 'Create New Banner'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm} showsVerticalScrollIndicator={false}>
              {/* BANNER FORMAT SELECTOR */}
              <Text style={styles.label}>BANNER FORMAT / STYLE</Text>
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
                <TouchableOpacity
                  onPress={() => setDisplayMode('FULL_POSTER')}
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    paddingHorizontal: 10,
                    borderRadius: 14,
                    backgroundColor: displayMode === 'FULL_POSTER' ? '#0D9488' : '#F1F5F9',
                    alignItems: 'center',
                    borderWidth: 1.5,
                    borderColor: displayMode === 'FULL_POSTER' ? '#0D9488' : '#E2E8F0',
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons name="image" size={22} color={displayMode === 'FULL_POSTER' ? '#FFF' : Colors.text} />
                  <Text style={{ ...Typography.label, fontSize: 13, color: displayMode === 'FULL_POSTER' ? '#FFF' : Colors.text, marginTop: 4, fontWeight: 'bold' }}>
                    Full Graphic Poster
                  </Text>
                  <Text style={{ ...Typography.bodySmall, fontSize: 10, color: displayMode === 'FULL_POSTER' ? '#CCFBF1' : Colors.textSecondary, marginTop: 2, textAlign: 'center' }}>
                    Sirf Graphic Poster + Click Target
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setDisplayMode('CARD_TEMPLATE')}
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    paddingHorizontal: 10,
                    borderRadius: 14,
                    backgroundColor: displayMode === 'CARD_TEMPLATE' ? '#0D9488' : '#F1F5F9',
                    alignItems: 'center',
                    borderWidth: 1.5,
                    borderColor: displayMode === 'CARD_TEMPLATE' ? '#0D9488' : '#E2E8F0',
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons name="color-palette" size={22} color={displayMode === 'CARD_TEMPLATE' ? '#FFF' : Colors.text} />
                  <Text style={{ ...Typography.label, fontSize: 13, color: displayMode === 'CARD_TEMPLATE' ? '#FFF' : Colors.text, marginTop: 4, fontWeight: 'bold' }}>
                    Designer Card
                  </Text>
                  <Text style={{ ...Typography.bodySmall, fontSize: 10, color: displayMode === 'CARD_TEMPLATE' ? '#CCFBF1' : Colors.textSecondary, marginTop: 2, textAlign: 'center' }}>
                    Text, Gradients & Action Button
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Section Select */}
              <Text style={styles.label}>BANNER SECTION</Text>
              <View style={styles.selectorRow}>
                {(['FOOD_HERO', 'OFFERS_FOR_YOU', 'SPOTLIGHT', 'GROCERY_HERO'] as const).map((sec) => (
                  <TouchableOpacity
                    key={sec}
                    onPress={() => setSection(sec)}
                    style={[styles.selectorChip, section === sec && styles.selectorChipActive]}
                  >
                    <Text style={[styles.selectorChipText, section === sec && styles.selectorChipTextActive]}>
                      {sec === 'FOOD_HERO'
                        ? 'Hero Carousel'
                        : sec === 'OFFERS_FOR_YOU'
                        ? 'Offers For You'
                        : sec === 'SPOTLIGHT'
                        ? 'Spotlight'
                        : 'Grocery Hero'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Image URL & Quick Presets (Primary for both modes) */}
              <Text style={[styles.label, { marginTop: 6 }]}>POSTER IMAGE URL *</Text>
              <TextInput
                style={styles.input}
                value={image}
                onChangeText={setImage}
                placeholder="https://images.unsplash.com/..."
                placeholderTextColor={Colors.textSecondary}
              />

              {/* Quick Image Presets */}
              <Text style={styles.subLabel}>OR SELECT A HIGH-RES PRESET:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
                {IMAGE_PRESETS.map((preset) => (
                  <TouchableOpacity
                    key={preset.label}
                    onPress={() => setImage(preset.url)}
                    style={[styles.imagePresetPill, image === preset.url && styles.imagePresetPillActive]}
                  >
                    <Image source={{ uri: preset.url }} style={styles.imagePresetThumb} />
                    <Text style={styles.imagePresetText}>{preset.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Title & Subtitle */}
              <Text style={[styles.label, { marginTop: 10 }]}>{displayMode === 'FULL_POSTER' ? 'BANNER NAME / LABEL (OPTIONAL)' : 'TITLE *'}</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder={displayMode === 'FULL_POSTER' ? 'e.g. Mega Weekend Fest' : 'e.g. Midnight or Flat 50%'}
                placeholderTextColor={Colors.textSecondary}
              />

              {displayMode === 'CARD_TEMPLATE' && (
                <>
                  <Text style={styles.label}>SUBTITLE / BRAND</Text>
                  <TextInput
                    style={styles.input}
                    value={subtitle}
                    onChangeText={setSubtitle}
                    placeholder="e.g. Cravings? or OFF TODAY"
                    placeholderTextColor={Colors.textSecondary}
                  />

                  <Text style={styles.label}>BADGE TAG (OPTIONAL)</Text>
                  <TextInput
                    style={styles.input}
                    value={tag}
                    onChangeText={setTag}
                    placeholder="e.g. LIMITED TIME, EXCLUSIVE, FLAT DEAL"
                    placeholderTextColor={Colors.textSecondary}
                  />

                  <Text style={styles.label}>DESCRIPTION / CAPTION</Text>
                  <TextInput
                    style={[styles.input, { height: 60 }]}
                    value={description}
                    onChangeText={setDescription}
                    placeholder="e.g. Hot & fresh food delivered in 20 mins flat."
                    placeholderTextColor={Colors.textSecondary}
                    multiline
                  />

                  {/* Color Presets */}
                  <Text style={styles.label}>GRADIENT COLOR PRESET</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
                    {COLOR_PRESETS.map((preset) => {
                      const isSelected = selectedColors[0] === preset.colors[0];
                      return (
                        <TouchableOpacity
                          key={preset.name}
                          onPress={() => {
                            setSelectedColors(preset.colors);
                            setAccentColor(preset.accent);
                            setTextColor(preset.text);
                          }}
                          style={[
                            styles.colorPresetBtn,
                            isSelected && { borderColor: '#1E293B', borderWidth: 2 },
                          ]}
                        >
                          <LinearGradient colors={preset.colors as any} style={styles.colorPresetCircle} />
                          <Text style={styles.colorPresetName}>{preset.name}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>

                  {/* Action Button Text */}
                  <Text style={[styles.label, { marginTop: 12 }]}>ACTION BUTTON LABEL</Text>
                  <TextInput
                    style={styles.input}
                    value={actionText}
                    onChangeText={setActionText}
                    placeholder="e.g. Order Now, Claim Offer"
                    placeholderTextColor={Colors.textSecondary}
                  />
                </>
              )}

              {/* Target Type & ID */}
              <Text style={styles.label}>TAP NAVIGATION TARGET</Text>
              <View style={styles.selectorRow}>
                {(['search', 'coupon', 'cuisine', 'category', 'restaurant', 'none'] as const).map((type) => (
                  <TouchableOpacity
                    key={type}
                    onPress={() => setTargetType(type)}
                    style={[styles.selectorChip, targetType === type && styles.selectorChipActive]}
                  >
                    <Text style={[styles.selectorChipText, targetType === type && styles.selectorChipTextActive]}>
                      {type.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {targetType !== 'none' ? (
                <>
                  <Text style={styles.label}>TARGET VALUE / PARAMETER</Text>
                  <TextInput
                    style={styles.input}
                    value={targetId}
                    onChangeText={setTargetId}
                    placeholder={
                      targetType === 'search'
                        ? 'e.g. Pizza, Burger, Biryani'
                        : targetType === 'coupon'
                        ? 'e.g. FLAT50'
                        : targetType === 'cuisine'
                        ? 'e.g. North Indian'
                        : 'ID / Code'
                    }
                    placeholderTextColor={Colors.textSecondary}
                  />
                </>
              ) : null}

              {/* Active Toggle */}
              <View style={styles.switchRow}>
                <View>
                  <Text style={styles.switchTitle}>Publish Immediately</Text>
                  <Text style={styles.switchSub}>Show banner to customers right now</Text>
                </View>
                <Switch
                  value={isActive}
                  onValueChange={setIsActive}
                  trackColor={{ false: '#D1D5DB', true: '#99F6E4' }}
                  thumbColor={isActive ? ADMIN_PRIMARY : '#9CA3AF'}
                />
              </View>

              {/* Save Button */}
              <TouchableOpacity
                onPress={handleSaveBanner}
                disabled={saving}
                style={[styles.submitBtn, saving && { opacity: 0.7 }]}
              >
                {saving ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.submitBtnText}>{editingBanner ? 'Update Banner' : 'Create Banner'}</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  headerTitle: {
    ...Typography.title,
    fontSize: 18,
    color: Colors.text,
  },
  headerSub: {
    ...Typography.bodySmall,
    fontSize: 11,
    color: Colors.textSecondary,
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ADMIN_PRIMARY,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  createBtnText: {
    ...Typography.button,
    color: '#FFF',
    fontSize: 13,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tabItem: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 6,
    backgroundColor: '#F1F5F9',
  },
  tabItemActive: {
    backgroundColor: '#0D9488',
  },
  tabText: {
    ...Typography.label,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    ...Typography.title,
    fontSize: 16,
    color: Colors.text,
    marginTop: 12,
  },
  emptySub: {
    ...Typography.body,
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  bannerCardContainer: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  previewCard: {
    height: 170,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    position: 'relative',
    overflow: 'hidden',
    padding: 16,
  },
  previewImageContainer: {
    position: 'absolute',
    right: -10,
    top: 10,
    width: 150,
    height: 150,
    borderRadius: 75,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  previewContent: {
    flex: 1,
    width: '65%',
    justifyContent: 'center',
  },
  tagBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 6,
  },
  tagText: {
    ...Typography.label,
    fontSize: 10,
    fontWeight: 'bold',
  },
  previewTitle: {
    ...Typography.heading,
    fontSize: 20,
    fontWeight: 'bold',
  },
  previewSubtitle: {
    ...Typography.title,
    fontSize: 16,
    fontWeight: '600',
    marginTop: 1,
  },
  previewDescription: {
    ...Typography.bodySmall,
    fontSize: 11,
    marginTop: 4,
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    marginTop: 10,
    gap: 4,
  },
  actionPillText: {
    ...Typography.label,
    fontSize: 11,
    fontWeight: 'bold',
  },
  metaBar: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#F8FAFC',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 10,
  },
  metaInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metaActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusTogglePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
    gap: 4,
  },
  statusText: {
    ...Typography.label,
    fontSize: 11,
    fontWeight: 'bold',
  },
  btnGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  btnLabel: {
    ...Typography.label,
    fontSize: 11,
    fontWeight: 'bold',
  },
  sectionBadge: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  sectionBadgeText: {
    ...Typography.label,
    fontSize: 10,
    color: '#0369A1',
    fontWeight: '600',
  },
  iconBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    gap: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    ...Typography.title,
    fontSize: 18,
    color: Colors.text,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalForm: {
    padding: 18,
  },
  label: {
    ...Typography.label,
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: 6,
    marginTop: 8,
  },
  subLabel: {
    ...Typography.label,
    fontSize: 10,
    color: Colors.textSecondary,
    marginTop: 4,
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.text,
  },
  selectorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  selectorChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  selectorChipActive: {
    backgroundColor: '#0D9488',
    borderColor: '#0D9488',
  },
  selectorChipText: {
    ...Typography.label,
    fontSize: 11,
    color: Colors.text,
  },
  selectorChipTextActive: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  colorPresetBtn: {
    alignItems: 'center',
    padding: 6,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  colorPresetCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginBottom: 4,
  },
  colorPresetName: {
    ...Typography.label,
    fontSize: 9,
    color: Colors.textSecondary,
  },
  imagePresetPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    gap: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  imagePresetPillActive: {
    borderColor: '#0D9488',
    backgroundColor: '#CCFBF1',
  },
  imagePresetThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  imagePresetText: {
    ...Typography.label,
    fontSize: 11,
    color: Colors.text,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  switchTitle: {
    ...Typography.subtitle,
    fontSize: 14,
    color: Colors.text,
  },
  switchSub: {
    ...Typography.bodySmall,
    fontSize: 11,
    color: Colors.textSecondary,
  },
  submitBtn: {
    backgroundColor: ADMIN_PRIMARY,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 40,
  },
  submitBtnText: {
    ...Typography.button,
    color: '#FFF',
    fontSize: 15,
  },
});
