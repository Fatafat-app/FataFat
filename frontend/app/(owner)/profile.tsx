import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Switch,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import { useOwnerStore } from '../../store/owner.store';
import { ownerService } from '../../services/owner.service';
import { Typography, Colors } from '../../constants/Theme';

const PRESET_BANNERS = [
  {
    name: 'Modern Restaurant',
    url: 'https://images.pexels.com/photos/260922/pexels-photo-260922.jpeg',
  },
  {
    name: 'Royal Indian / Biryani',
    url: 'https://images.pexels.com/photos/1624487/pexels-photo-1624487.jpeg',
  },
  {
    name: 'Pizzeria & Italian',
    url: 'https://images.pexels.com/photos/1146760/pexels-photo-1146760.jpeg',
  },
  {
    name: 'Fast Food & Burgers',
    url: 'https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg',
  },
  {
    name: 'Cafe & Beverages',
    url: 'https://images.pexels.com/photos/312418/pexels-photo-312418.jpeg',
  },
  {
    name: 'Sweets & Desserts',
    url: 'https://images.pexels.com/photos/2144112/pexels-photo-2144112.jpeg',
  },
];

const POPULAR_CUISINES = [
  'North Indian',
  'South Indian',
  'Biryani',
  'Fast Food',
  'Chinese',
  'Italian',
  'Pizza',
  'Burgers',
  'Mughlai',
  'Desserts',
  'Beverages',
  'Rolls',
  'Street Food',
  'Thali',
];

export default function OwnerProfileScreen() {
  const { restaurant, fetchOwnerData, isLoading } = useOwnerStore();

  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [newGalleryUrl, setNewGalleryUrl] = useState('');

  const [cuisines, setCuisines] = useState<string[]>([]);
  const [customCuisine, setCustomCuisine] = useState('');
  const [isPureVeg, setIsPureVeg] = useState(false);

  // Timings & Operations
  const [openTime, setOpenTime] = useState('09:00');
  const [closeTime, setCloseTime] = useState('22:00');
  const [prepTime, setPrepTime] = useState('20');
  const [isOpen, setIsOpen] = useState(true);

  // Delivery & Pricing
  const [minOrder, setMinOrder] = useState('0');
  const [deliveryFee, setDeliveryFee] = useState('30');
  const [deliveryRadius, setDeliveryRadius] = useState('5');
  const [estimatedDeliveryMin, setEstimatedDeliveryMin] = useState('30');

  // Address & Location
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [longitude, setLongitude] = useState('');
  const [latitude, setLatitude] = useState('');

  // Compliance
  const [fssaiLicense, setFssaiLicense] = useState('');
  const [taxPercent, setTaxPercent] = useState('5');

  useEffect(() => {
    if (restaurant) {
      setName(restaurant.name || '');
      setDescription(restaurant.description || '');
      setPhone(restaurant.phone || '');
      setEmail(restaurant.email || '');
      setCoverImage(restaurant.coverImage || restaurant.images?.[0] || PRESET_BANNERS[0].url);
      setGalleryImages(restaurant.images || []);
      setCuisines(restaurant.cuisines || []);
      setIsPureVeg(restaurant.isPureVeg || false);

      setOpenTime(restaurant.timings?.open || '09:00');
      setCloseTime(restaurant.timings?.close || '22:00');
      setPrepTime(restaurant.preparationTime?.toString() || '20');
      setIsOpen(restaurant.isOpen !== false);

      const dInfo = (restaurant as any).deliveryInfo || {};
      setMinOrder(((dInfo.minOrderAmount || 0) / 100).toString());
      setDeliveryFee(((dInfo.deliveryFee || (restaurant as any).pricing?.deliveryCharge || 3000) / 100).toString());
      setDeliveryRadius((dInfo.radiusKm || 5).toString());
      setEstimatedDeliveryMin((dInfo.estimatedMinutes || restaurant.estimatedDeliveryTime || 30).toString());

      const addr = restaurant.address || ({} as any);
      setAddressLine1(addr.line1 || addr.street || '');
      setAddressLine2(addr.line2 || '');
      setCity(addr.city || '');
      setState(addr.state || '');
      setPincode(addr.pincode || '');

      const coords = restaurant.location?.coordinates || [];
      if (coords.length === 2) {
        setLongitude(coords[0].toString());
        setLatitude(coords[1].toString());
      }

      setFssaiLicense(restaurant.fssaiLicense || '');
      setTaxPercent(restaurant.taxPercent?.toString() || '5');
    }
  }, [restaurant]);

  const toggleCuisine = (c: string) => {
    if (cuisines.includes(c)) {
      setCuisines(cuisines.filter((item) => item !== c));
    } else {
      setCuisines([...cuisines, c]);
    }
  };

  const handleAddCustomCuisine = () => {
    if (customCuisine.trim() && !cuisines.includes(customCuisine.trim())) {
      setCuisines([...cuisines, customCuisine.trim()]);
      setCustomCuisine('');
    }
  };

  const handleAddGalleryImage = () => {
    if (newGalleryUrl.trim()) {
      setGalleryImages([...galleryImages, newGalleryUrl.trim()]);
      setNewGalleryUrl('');
    }
  };

  const handleRemoveGalleryImage = (index: number) => {
    setGalleryImages(galleryImages.filter((_, i) => i !== index));
  };

  const handleDetectGPS = async () => {
    try {
      setLocating(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please enable location permissions in device settings.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setLongitude(loc.coords.longitude.toFixed(6));
      setLatitude(loc.coords.latitude.toFixed(6));

      // Reverse geocode to auto-fill address if empty
      const [geo] = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
      if (geo) {
        if (!city && geo.city) setCity(geo.city);
        if (!state && geo.region) setState(geo.region);
        if (!pincode && geo.postalCode) setPincode(geo.postalCode);
        if (!addressLine1 && (geo.street || geo.name)) {
          setAddressLine1([geo.name, geo.street].filter(Boolean).join(', '));
        }
      }
      Alert.alert('Location Updated 📍', 'GPS coordinates fetched accurately.');
    } catch (err: any) {
      Alert.alert('GPS Error', err.message || 'Could not fetch current location.');
    } finally {
      setLocating(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!restaurant?._id) {
      Alert.alert('Error', 'Restaurant profile not loaded. Please pull to refresh.');
      return;
    }
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Restaurant Name is required.');
      return;
    }
    if (!addressLine1.trim() || !city.trim()) {
      Alert.alert('Validation Error', 'Street Address and City are required.');
      return;
    }

    try {
      setSaving(true);

      const lngNum = parseFloat(longitude) || 77.209;
      const latNum = parseFloat(latitude) || 28.6139;

      const payload: any = {
        name: name.trim(),
        description: description.trim(),
        phone: phone.trim(),
        email: email.trim(),
        coverImage: coverImage.trim(),
        images: galleryImages.length > 0 ? galleryImages : [coverImage.trim()],
        cuisines: cuisines.length > 0 ? cuisines : ['Multi-Cuisine'],
        isPureVeg,
        isOpen,
        preparationTime: parseInt(prepTime, 10) || 20,
        taxPercent: parseFloat(taxPercent) || 5,
        fssaiLicense: fssaiLicense.trim(),
        timings: {
          open: openTime.trim() || '09:00',
          close: closeTime.trim() || '22:00',
        },
        deliveryInfo: {
          minOrderAmount: Math.round((parseFloat(minOrder) || 0) * 100),
          deliveryFee: Math.round((parseFloat(deliveryFee) || 30) * 100),
          radiusKm: parseFloat(deliveryRadius) || 5,
          estimatedMinutes: parseInt(estimatedDeliveryMin, 10) || 30,
        },
        address: {
          line1: addressLine1.trim(),
          line2: addressLine2.trim(),
          city: city.trim(),
          state: state.trim() || 'Delhi',
          pincode: pincode.trim() || '110001',
        },
        location: {
          type: 'Point',
          coordinates: [lngNum, latNum],
        },
      };

      await ownerService.updateRestaurant(restaurant._id, payload);
      await fetchOwnerData();

      Alert.alert('Success 🎉', 'Restaurant profile and store settings updated successfully!');
    } catch (err: any) {
      console.warn('Update restaurant error:', err);
      Alert.alert('Update Failed', err.response?.data?.message || err.message || 'Could not save restaurant profile.');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading && !restaurant) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading restaurant profile...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header Bar */}
      <View style={styles.navbar}>
        <View style={{ flex: 1 }}>
          <Text style={styles.portalBadge}>STORE PROFILE & SETTINGS</Text>
          <Text style={styles.pageTitle} numberOfLines={1}>
            {restaurant?.name || 'Edit Restaurant'}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => router.replace('/(tabs)')}
          style={styles.switchModeButton}
        >
          <Ionicons name="swap-horizontal" size={16} color={Colors.text} style={{ marginRight: 4 }} />
          <Text style={styles.switchModeText}>User App</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Live Store Status Switch */}
        <View style={[styles.storeStatusCard, isOpen ? styles.storeOpenBg : styles.storeClosedBg]}>
          <View style={{ flex: 1, marginRight: 12 }}>
            <View style={styles.statusDotRow}>
              <View style={[styles.statusDot, { backgroundColor: isOpen ? Colors.success : Colors.error }]} />
              <Text style={[styles.statusTitle, { color: isOpen ? '#065F46' : '#991B1B' }]}>
                {isOpen ? 'STORE IS LIVE & ONLINE' : 'STORE IS CURRENTLY CLOSED'}
              </Text>
            </View>
            <Text style={styles.statusSubtitle}>
              {isOpen
                ? 'Your store is active on customer search and accepting orders.'
                : 'Store is hidden from new orders. Turn ON when you are ready.'}
            </Text>
          </View>
          <Switch
            value={isOpen}
            onValueChange={setIsOpen}
            trackColor={{ false: Colors.border, true: '#86EFAC' }}
            thumbColor={isOpen ? Colors.success : Colors.textSecondary}
          />
        </View>

        {/* 1. BANNER & PHOTOS SECTION */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Ionicons name="images" size={18} color={Colors.primary} style={{ marginRight: 6 }} />
            <Text style={styles.cardHeading}>MAIN BANNER & COVER IMAGE</Text>
          </View>

          {coverImage ? (
            <View style={styles.coverPreviewContainer}>
              <Image source={{ uri: coverImage }} style={styles.coverImagePreview} />
              <View style={styles.coverBadge}>
                <Text style={styles.coverBadgeText}>Current Live Banner</Text>
              </View>
            </View>
          ) : null}

          <Text style={styles.inputLabel}>Cover Banner URL *</Text>
          <TextInput
            value={coverImage}
            onChangeText={setCoverImage}
            placeholder="https://images.pexels.com/..."
            style={styles.inputField}
            placeholderTextColor={Colors.textSecondary}
          />

          {/* Preset Suggestions */}
          <Text style={[styles.inputLabel, { marginTop: 12 }]}>Or choose high-res preset banner:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetScroll}>
            {PRESET_BANNERS.map((preset, idx) => (
              <TouchableOpacity
                key={idx}
                onPress={() => setCoverImage(preset.url)}
                style={[styles.presetCard, coverImage === preset.url && styles.presetCardActive]}
              >
                <Image source={{ uri: preset.url }} style={styles.presetThumb} />
                <Text style={styles.presetName} numberOfLines={1}>{preset.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Gallery Photos */}
          <Text style={[styles.inputLabel, { marginTop: 14 }]}>Gallery & Showcase Photos</Text>
          <View style={styles.galleryRow}>
            {galleryImages.map((img, idx) => (
              <View key={idx} style={styles.galleryItem}>
                <Image source={{ uri: img }} style={styles.galleryThumb} />
                <TouchableOpacity
                  onPress={() => handleRemoveGalleryImage(idx)}
                  style={styles.removeImgBtn}
                >
                  <Ionicons name="close-circle" size={18} color={Colors.error} />
                </TouchableOpacity>
              </View>
            ))}
          </View>

          <View style={styles.addUrlRow}>
            <TextInput
              value={newGalleryUrl}
              onChangeText={setNewGalleryUrl}
              placeholder="Paste photo URL to add to gallery"
              style={[styles.inputField, { flex: 1, marginRight: 8, marginBottom: 0 }]}
              placeholderTextColor={Colors.textSecondary}
            />
            <TouchableOpacity onPress={handleAddGalleryImage} style={styles.addPhotoBtn}>
              <Ionicons name="add" size={18} color={Colors.white} />
              <Text style={styles.addPhotoText}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 2. BASIC RESTAURANT DETAILS */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Ionicons name="restaurant" size={18} color={Colors.primary} style={{ marginRight: 6 }} />
            <Text style={styles.cardHeading}>RESTAURANT DETAILS</Text>
          </View>

          <Text style={styles.inputLabel}>Restaurant Name *</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. Royal Biryani Darbar"
            style={styles.inputField}
            placeholderTextColor={Colors.textSecondary}
          />

          <Text style={styles.inputLabel}>Short Tagline / Description</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="e.g. Authentic Hyderabadi Biryani & North Indian Delicacies"
            multiline
            numberOfLines={2}
            style={[styles.inputField, { height: 60, textAlignVertical: 'top' }]}
            placeholderTextColor={Colors.textSecondary}
          />

          <View style={styles.rowInputs}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.inputLabel}>Contact Phone</Text>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder="+919876543210"
                keyboardType="phone-pad"
                style={styles.inputField}
                placeholderTextColor={Colors.textSecondary}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>Contact Email</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="contact@restaurant.com"
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.inputField}
                placeholderTextColor={Colors.textSecondary}
              />
            </View>
          </View>

          {/* Pure Veg Switch */}
          <View style={styles.switchRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={[styles.vegBadge, { borderColor: isPureVeg ? '#10B981' : '#94A3B8' }]}>
                <View style={[styles.vegDot, { backgroundColor: isPureVeg ? '#10B981' : '#94A3B8' }]} />
              </View>
              <View style={{ marginLeft: 10 }}>
                <Text style={styles.switchTitle}>Pure Veg Restaurant</Text>
                <Text style={styles.switchSub}>Show 100% Green Pure Veg tag on app</Text>
              </View>
            </View>
            <Switch
              value={isPureVeg}
              onValueChange={setIsPureVeg}
              trackColor={{ false: Colors.border, true: '#A7F3D0' }}
              thumbColor={isPureVeg ? '#10B981' : Colors.textSecondary}
            />
          </View>

          {/* Cuisines Chips */}
          <Text style={[styles.inputLabel, { marginTop: 12 }]}>Cuisines Served</Text>
          <View style={styles.chipsContainer}>
            {POPULAR_CUISINES.map((c, idx) => {
              const isSelected = cuisines.includes(c);
              return (
                <TouchableOpacity
                  key={idx}
                  onPress={() => toggleCuisine(c)}
                  style={[styles.cuisineChip, isSelected && styles.cuisineChipActive]}
                >
                  <Text style={[styles.cuisineChipText, isSelected && styles.cuisineChipTextActive]}>
                    {c}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.addCuisineRow}>
            <TextInput
              value={customCuisine}
              onChangeText={setCustomCuisine}
              placeholder="Add other cuisine (e.g. Continental)"
              style={[styles.inputField, { flex: 1, marginRight: 8, marginBottom: 0 }]}
              placeholderTextColor={Colors.textSecondary}
            />
            <TouchableOpacity onPress={handleAddCustomCuisine} style={styles.addCuisineBtn}>
              <Text style={styles.addCuisineBtnText}>+ Add</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 3. TIMINGS & OPERATING DETAILS */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Ionicons name="time" size={18} color={Colors.primary} style={{ marginRight: 6 }} />
            <Text style={styles.cardHeading}>STORE TIMINGS & KITCHEN SPEED</Text>
          </View>

          <View style={styles.rowInputs}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.inputLabel}>Opening Time</Text>
              <TextInput
                value={openTime}
                onChangeText={setOpenTime}
                placeholder="09:00"
                style={styles.inputField}
                placeholderTextColor={Colors.textSecondary}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>Closing Time</Text>
              <TextInput
                value={closeTime}
                onChangeText={setCloseTime}
                placeholder="23:00"
                style={styles.inputField}
                placeholderTextColor={Colors.textSecondary}
              />
            </View>
          </View>

          <View style={styles.rowInputs}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.inputLabel}>Avg Prep Time (Mins)</Text>
              <TextInput
                value={prepTime}
                onChangeText={setPrepTime}
                placeholder="20"
                keyboardType="numeric"
                style={styles.inputField}
                placeholderTextColor={Colors.textSecondary}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>Est. Delivery Time (Mins)</Text>
              <TextInput
                value={estimatedDeliveryMin}
                onChangeText={setEstimatedDeliveryMin}
                placeholder="30"
                keyboardType="numeric"
                style={styles.inputField}
                placeholderTextColor={Colors.textSecondary}
              />
            </View>
          </View>
        </View>

        {/* 4. DELIVERY CHARGES & RADIUS */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Ionicons name="bicycle" size={18} color={Colors.primary} style={{ marginRight: 6 }} />
            <Text style={styles.cardHeading}>DELIVERY CONFIGURATION</Text>
          </View>

          <View style={styles.rowInputs}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.inputLabel}>Delivery Fee (₹)</Text>
              <TextInput
                value={deliveryFee}
                onChangeText={setDeliveryFee}
                placeholder="30"
                keyboardType="numeric"
                style={styles.inputField}
                placeholderTextColor={Colors.textSecondary}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>Delivery Radius (KM)</Text>
              <TextInput
                value={deliveryRadius}
                onChangeText={setDeliveryRadius}
                placeholder="5"
                keyboardType="numeric"
                style={styles.inputField}
                placeholderTextColor={Colors.textSecondary}
              />
            </View>
          </View>

          <Text style={styles.inputLabel}>Minimum Order Value (₹)</Text>
          <TextInput
            value={minOrder}
            onChangeText={setMinOrder}
            placeholder="0"
            keyboardType="numeric"
            style={styles.inputField}
            placeholderTextColor={Colors.textSecondary}
          />
        </View>

        {/* 5. LOCATION & ADDRESS */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Ionicons name="location" size={18} color={Colors.primary} style={{ marginRight: 6 }} />
            <Text style={styles.cardHeading}>PHYSICAL OUTLET ADDRESS</Text>
          </View>

          <Text style={styles.inputLabel}>Street / Building / Line 1 *</Text>
          <TextInput
            value={addressLine1}
            onChangeText={setAddressLine1}
            placeholder="e.g. Shop 12, Market Complex"
            style={styles.inputField}
            placeholderTextColor={Colors.textSecondary}
          />

          <Text style={styles.inputLabel}>Landmark / Area / Line 2</Text>
          <TextInput
            value={addressLine2}
            onChangeText={setAddressLine2}
            placeholder="e.g. Near Metro Station"
            style={styles.inputField}
            placeholderTextColor={Colors.textSecondary}
          />

          <View style={styles.rowInputs}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.inputLabel}>City *</Text>
              <TextInput
                value={city}
                onChangeText={setCity}
                placeholder="e.g. Delhi"
                style={styles.inputField}
                placeholderTextColor={Colors.textSecondary}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>State</Text>
              <TextInput
                value={state}
                onChangeText={setState}
                placeholder="e.g. Delhi"
                style={styles.inputField}
                placeholderTextColor={Colors.textSecondary}
              />
            </View>
          </View>

          <Text style={styles.inputLabel}>Pincode</Text>
          <TextInput
            value={pincode}
            onChangeText={setPincode}
            placeholder="110001"
            keyboardType="numeric"
            style={styles.inputField}
            placeholderTextColor={Colors.textSecondary}
          />

          {/* GPS Coordinates & Auto Detect */}
          <View style={styles.gpsContainer}>
            <View style={{ flex: 1 }}>
              <Text style={styles.gpsTitle}>GPS Live Coordinates</Text>
              <Text style={styles.gpsSubtitle}>
                {latitude && longitude ? `Lat: ${latitude}, Lng: ${longitude}` : 'Coordinates not set'}
              </Text>
            </View>
            <TouchableOpacity onPress={handleDetectGPS} disabled={locating} style={styles.gpsBtn}>
              {locating ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="locate" size={16} color={Colors.white} style={{ marginRight: 4 }} />
                  <Text style={styles.gpsBtnText}>Use GPS</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* 6. COMPLIANCE & TAX */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Ionicons name="shield-checkmark" size={18} color={Colors.primary} style={{ marginRight: 6 }} />
            <Text style={styles.cardHeading}>COMPLIANCE & LICENSES</Text>
          </View>

          <Text style={styles.inputLabel}>FSSAI License Number</Text>
          <TextInput
            value={fssaiLicense}
            onChangeText={setFssaiLicense}
            placeholder="14-digit FSSAI registration"
            keyboardType="numeric"
            style={styles.inputField}
            placeholderTextColor={Colors.textSecondary}
          />

          <Text style={styles.inputLabel}>GST / Tax Rate (%)</Text>
          <TextInput
            value={taxPercent}
            onChangeText={setTaxPercent}
            placeholder="5"
            keyboardType="numeric"
            style={styles.inputField}
            placeholderTextColor={Colors.textSecondary}
          />
        </View>

        {/* SAVE BUTTON */}
        <TouchableOpacity
          onPress={handleSaveProfile}
          disabled={saving}
          style={[styles.saveBtn, saving && { opacity: 0.8 }]}
        >
          {saving ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.white} style={{ marginRight: 8 }} />
              <Text style={styles.saveBtnText}>Save Restaurant Profile</Text>
            </View>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  centerContainer: { flex: 1, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center' },
  loadingText: { ...Typography.bodySmall, color: Colors.textSecondary, marginTop: 12 },
  navbar: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  portalBadge: { ...Typography.label, fontSize: 9, color: Colors.primary, letterSpacing: 0.5 },
  pageTitle: { ...Typography.heading, fontSize: 18, marginTop: 1 },
  switchModeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  switchModeText: { ...Typography.button, fontSize: 11, color: Colors.text },
  scrollContainer: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingVertical: 14, paddingBottom: 60 },

  storeStatusCard: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
  },
  storeOpenBg: { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' },
  storeClosedBg: { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
  statusDotRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  statusTitle: { ...Typography.button, fontSize: 11, letterSpacing: 0.5 },
  statusSubtitle: { ...Typography.bodySmall, fontSize: 12 },

  card: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  cardHeading: { ...Typography.label, fontSize: 11, letterSpacing: 0.5 },
  coverPreviewContainer: { position: 'relative', borderRadius: 14, overflow: 'hidden', marginBottom: 12 },
  coverImagePreview: { width: '100%', height: 150, borderRadius: 14, backgroundColor: Colors.background },
  coverBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  coverBadgeText: { ...Typography.caption, color: Colors.white, fontSize: 10 },
  inputLabel: { ...Typography.button, fontSize: 11, color: Colors.textSecondary, marginBottom: 4, marginTop: 4 },
  inputField: {
    ...Typography.bodySmall,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: Colors.text,
    marginBottom: 10,
  },
  presetScroll: { marginVertical: 6 },
  presetCard: {
    marginRight: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    overflow: 'hidden',
    width: 110,
    backgroundColor: Colors.background,
  },
  presetCardActive: { borderColor: Colors.primary },
  presetThumb: { width: '100%', height: 60 },
  presetName: { ...Typography.caption, fontSize: 10, padding: 4, textAlign: 'center' },
  galleryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginVertical: 8 },
  galleryItem: { position: 'relative', width: 68, height: 68, borderRadius: 12, overflow: 'hidden' },
  galleryThumb: { width: '100%', height: '100%', borderRadius: 12 },
  removeImgBtn: { position: 'absolute', top: 2, right: 2, backgroundColor: '#FFF', borderRadius: 9 },
  addUrlRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  addPhotoBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  addPhotoText: { ...Typography.button, color: Colors.white, fontSize: 12, marginLeft: 2 },
  rowInputs: { flexDirection: 'row' },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: 12,
    borderRadius: 14,
    marginVertical: 10,
  },
  vegBadge: { width: 22, height: 22, borderWidth: 1.5, borderRadius: 4, justifyContent: 'center', alignItems: 'center' },
  vegDot: { width: 10, height: 10, borderRadius: 5 },
  switchTitle: { ...Typography.button, fontSize: 13, color: Colors.text },
  switchSub: { ...Typography.caption, fontSize: 11 },
  chipsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginVertical: 8 },
  cuisineChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  cuisineChipActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  cuisineChipText: { ...Typography.caption, fontSize: 11, color: Colors.text },
  cuisineChipTextActive: { color: Colors.primary, fontWeight: '700' },
  addCuisineRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  addCuisineBtn: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  addCuisineBtnText: { ...Typography.button, color: '#4F46E5', fontSize: 12 },
  gpsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    padding: 12,
    borderRadius: 14,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  gpsTitle: { ...Typography.button, fontSize: 12, color: '#3730A3' },
  gpsSubtitle: { ...Typography.caption, fontSize: 10, color: '#4F46E5', marginTop: 2 },
  gpsBtn: { backgroundColor: '#4F46E5', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  gpsBtnText: { ...Typography.button, color: Colors.white, fontSize: 11 },
  saveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 40,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnText: { ...Typography.heading, color: Colors.white, fontSize: 15 },
});
