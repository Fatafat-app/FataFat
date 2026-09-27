import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { adminService, BroadcastNotificationResult } from '../../services/admin.service';
import { Typography, BOLD_FONT, STYLISH_FONT, Colors } from '../../constants/Theme';

const ADMIN_PRIMARY = '#4F46E5';

const PRESET_TEMPLATES = [
  {
    title: 'Weekend Feast! Flat 50% Off 🍕',
    body: 'Craving delicious food? Use code FEAST50 and get 50% off on your favorite restaurants!',
    audience: 'customers' as const,
    type: 'promotion' as const,
    icon: 'flame',
  },
  {
    title: 'Weather Update: Delivery Delays 🌧️',
    body: 'Due to heavy rains in your area, deliveries might take slightly longer. Thank you for your patience!',
    audience: 'customers' as const,
    type: 'alert' as const,
    icon: 'rainy',
  },
  {
    title: 'High Demand Surge: Earn Extra! 🛵',
    body: 'High order volume active in your zone! Log in now to earn extra delivery surge incentives.',
    audience: 'riders' as const,
    type: 'announcement' as const,
    icon: 'bicycle',
  },
  {
    title: 'New Menu Items & Order Rush 📈',
    body: 'Please make sure your store is online and menu stocks are updated for the evening rush.',
    audience: 'owners' as const,
    type: 'announcement' as const,
    icon: 'restaurant',
  },
];

export default function AdminNotificationsScreen() {
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [targetAudience, setTargetAudience] = useState<'all' | 'customers' | 'riders' | 'owners'>('all');
  const [type, setType] = useState<'announcement' | 'promotion' | 'alert' | 'offer'>('announcement');
  const [imageUrl, setImageUrl] = useState('');

  const [sending, setSending] = useState(false);
  const [lastResult, setLastResult] = useState<BroadcastNotificationResult | null>(null);

  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHistory = async () => {
    try {
      setLoadingHistory(true);
      const res = await adminService.getNotificationHistory({ limit: 15 });
      setHistory(res?.notifications || []);
    } catch (e) {
      // History fetch failure should not block UI
    } finally {
      setLoadingHistory(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleApplyTemplate = (tmpl: typeof PRESET_TEMPLATES[0]) => {
    setTitle(tmpl.title);
    setBody(tmpl.body);
    setTargetAudience(tmpl.audience);
    setType(tmpl.type);
  };

  const handleSend = async () => {
    if (!title.trim()) {
      Alert.alert('Validation Error', 'Please enter a notification title.');
      return;
    }
    if (!body.trim()) {
      Alert.alert('Validation Error', 'Please enter a notification message body.');
      return;
    }

    const audienceLabel =
      targetAudience === 'all'
        ? 'All Users'
        : targetAudience === 'customers'
        ? 'All Customers'
        : targetAudience === 'riders'
        ? 'All Delivery Riders'
        : 'All Restaurant Owners';

    Alert.alert(
      'Confirm Broadcast',
      `Are you sure you want to send this push notification to ${audienceLabel}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Now 🚀',
          style: 'default',
          onPress: async () => {
            try {
              setSending(true);
              setLastResult(null);
              const result = await adminService.sendNotification({
                title: title.trim(),
                body: body.trim(),
                targetAudience,
                type,
                imageUrl: imageUrl.trim() || undefined,
              });

              setLastResult(result);
              Alert.alert(
                'Notification Broadcasted! 🎉',
                `Successfully sent to ${result.recipientCount} accounts (${result.fcmTokensCount} active FCM devices targeted).`
              );
              setTitle('');
              setBody('');
              setImageUrl('');
              fetchHistory();
            } catch (err: any) {
              Alert.alert('Send Failed', err.response?.data?.message || 'Could not send notification.');
            } finally {
              setSending(false);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <View style={styles.iconCircle}>
            <Ionicons name="notifications" size={20} color="#FFF" />
          </View>
          <View>
            <Text style={styles.headerTitle}>Push & In-App Broadcast</Text>
            <Text style={styles.headerSubtitle}>Send instant alerts and promotions via FCM</Text>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchHistory(); }} colors={[ADMIN_PRIMARY]} />}
      >
        {/* Quick Templates */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>QUICK PRESETS & TEMPLATES</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.templatesScroll}>
            {PRESET_TEMPLATES.map((tmpl, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.templateCard}
                onPress={() => handleApplyTemplate(tmpl)}
                activeOpacity={0.8}
              >
                <View style={styles.templateIconCircle}>
                  <Ionicons name={tmpl.icon as any} size={16} color={ADMIN_PRIMARY} />
                </View>
                <Text style={styles.templateTitle} numberOfLines={1}>
                  {tmpl.title}
                </Text>
                <Text style={styles.templateAudience}>
                  Target: {tmpl.audience.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Compose Form */}
        <View style={styles.card}>
          <Text style={styles.cardHeading}>Compose Notification</Text>

          {/* Target Audience */}
          <Text style={styles.inputLabel}>TARGET AUDIENCE</Text>
          <View style={styles.audienceGrid}>
            {[
              { key: 'all', label: 'Everyone (All)', icon: 'globe-outline' },
              { key: 'customers', label: 'Customers', icon: 'people-outline' },
              { key: 'riders', label: 'Riders', icon: 'bicycle-outline' },
              { key: 'owners', label: 'Store Owners', icon: 'storefront-outline' },
            ].map((item) => (
              <TouchableOpacity
                key={item.key}
                style={[
                  styles.audienceBtn,
                  targetAudience === item.key && styles.audienceBtnActive,
                ]}
                onPress={() => setTargetAudience(item.key as any)}
              >
                <Ionicons
                  name={item.icon as any}
                  size={16}
                  color={targetAudience === item.key ? '#FFF' : '#6B7280'}
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={[
                    styles.audienceBtnText,
                    targetAudience === item.key && styles.audienceBtnTextActive,
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Notification Type */}
          <Text style={styles.inputLabel}>CATEGORY TYPE</Text>
          <View style={styles.typeRow}>
            {[
              { key: 'announcement', label: '📢 Announcement' },
              { key: 'promotion', label: '🎉 Promotion' },
              { key: 'offer', label: '🏷️ Special Offer' },
              { key: 'alert', label: '⚠️ Alert' },
            ].map((item) => (
              <TouchableOpacity
                key={item.key}
                style={[styles.typeChip, type === item.key && styles.typeChipActive]}
                onPress={() => setType(item.key as any)}
              >
                <Text style={[styles.typeChipText, type === item.key && styles.typeChipTextActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Title */}
          <Text style={styles.inputLabel}>NOTIFICATION TITLE *</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="e.g. Flash Sale Live Now! ⚡"
              placeholderTextColor="#9CA3AF"
              value={title}
              onChangeText={setTitle}
              maxLength={80}
            />
            {title.length > 0 && (
              <TouchableOpacity onPress={() => setTitle('')}>
                <Ionicons name="close-circle" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>

          {/* Body */}
          <Text style={styles.inputLabel}>MESSAGE BODY *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Write your message here... Describe the offer, update, or alert in detail."
            placeholderTextColor="#9CA3AF"
            value={body}
            onChangeText={setBody}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          {/* Image URL (Optional) */}
          <Text style={styles.inputLabel}>IMAGE / BANNER URL (OPTIONAL)</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="image-outline" size={18} color="#9CA3AF" style={{ marginRight: 8 }} />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="https://images.example.com/banner.jpg"
              placeholderTextColor="#9CA3AF"
              value={imageUrl}
              onChangeText={setImageUrl}
              autoCapitalize="none"
              keyboardType="url"
            />
          </View>

          {/* LIVE PREVIEW BOX */}
          <View style={styles.previewContainer}>
            <Text style={styles.previewHeader}>📱 Live Preview (Device Notification Banner)</Text>
            <View style={styles.mockNotification}>
              <View style={styles.mockAppRow}>
                <View style={styles.mockAppIcon}>
                  <Text style={styles.mockAppIconText}>F</Text>
                </View>
                <Text style={styles.mockAppName}>Ftafat Delivery • now</Text>
              </View>
              <Text style={styles.mockTitle}>
                {title.trim() || 'Notification Title Preview'}
              </Text>
              <Text style={styles.mockBody}>
                {body.trim() || 'Your message body will appear here on customer lock screen and notification shade.'}
              </Text>
              {imageUrl.trim().length > 0 && (
                <Image
                  source={{ uri: imageUrl.trim() }}
                  style={styles.mockBannerImage}
                  resizeMode="cover"
                />
              )}
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.sendBtn, sending && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={sending}
            activeOpacity={0.85}
          >
            {sending ? (
              <View style={styles.btnContentRow}>
                <ActivityIndicator size="small" color="#FFF" style={{ marginRight: 8 }} />
                <Text style={styles.sendBtnText}>Broadcasting via Firebase FCM...</Text>
              </View>
            ) : (
              <View style={styles.btnContentRow}>
                <Ionicons name="paper-plane" size={18} color="#FFF" style={{ marginRight: 8 }} />
                <Text style={styles.sendBtnText}>Broadcast Notification Now</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Success / Last Status Banner */}
        {lastResult && (
          <View style={styles.resultBanner}>
            <Ionicons name="checkmark-circle" size={24} color="#059669" style={{ marginRight: 10 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.resultTitle}>Broadcast Completed</Text>
              <Text style={styles.resultDetails}>
                Delivered to {lastResult.recipientCount} database accounts • {lastResult.fcmTokensCount} FCM tokens dispatched.
              </Text>
            </View>
          </View>
        )}

        {/* Notification History */}
        <View style={styles.section}>
          <View style={styles.historyHeaderRow}>
            <Text style={styles.sectionLabel}>RECENT BROADCASTS HISTORY</Text>
            <TouchableOpacity onPress={fetchHistory} disabled={loadingHistory}>
              <Ionicons name="refresh" size={18} color={ADMIN_PRIMARY} />
            </TouchableOpacity>
          </View>

          {loadingHistory && history.length === 0 ? (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <ActivityIndicator size="small" color={ADMIN_PRIMARY} />
            </View>
          ) : history.length === 0 ? (
            <View style={styles.emptyHistoryBox}>
              <Ionicons name="chatbubbles-outline" size={36} color="#D1D5DB" />
              <Text style={styles.emptyHistoryText}>No past broadcasts sent yet.</Text>
            </View>
          ) : (
            <View style={styles.historyList}>
              {history.map((item, idx) => (
                <View key={item._id || idx} style={styles.historyItem}>
                  <View style={styles.historyTopRow}>
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>
                        {(item.type || 'Announcement').toUpperCase()}
                      </Text>
                    </View>
                    <Text style={styles.historyDate}>
                      {item.createdAt ? new Date(item.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Recently'}
                    </Text>
                  </View>
                  <Text style={styles.historyTitle}>{item.title}</Text>
                  <Text style={styles.historyBody}>{item.body}</Text>
                  {item.user && (
                    <Text style={styles.historyRecipient}>
                      Sent to: {item.user.name || item.user.phone || 'User'} ({item.user.role || 'customer'})
                    </Text>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: ADMIN_PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: BOLD_FONT,
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 12,
    fontFamily: STYLISH_FONT,
    color: '#6B7280',
    marginTop: 2,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 12,
    fontFamily: BOLD_FONT,
    color: '#6B7280',
    letterSpacing: 1,
    marginBottom: 10,
  },
  templatesScroll: {
    gap: 12,
  },
  templateCard: {
    backgroundColor: '#EEF2FF',
    borderRadius: 14,
    padding: 14,
    width: 220,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  templateIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  templateTitle: {
    fontSize: 13,
    fontFamily: BOLD_FONT,
    color: '#1E1B4B',
    marginBottom: 4,
  },
  templateAudience: {
    fontSize: 11,
    fontFamily: STYLISH_FONT,
    color: ADMIN_PRIMARY,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeading: {
    fontSize: 16,
    fontFamily: BOLD_FONT,
    color: '#111827',
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 11,
    fontFamily: BOLD_FONT,
    color: '#4B5563',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 12,
  },
  audienceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 6,
  },
  audienceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  audienceBtnActive: {
    backgroundColor: ADMIN_PRIMARY,
    borderColor: ADMIN_PRIMARY,
  },
  audienceBtnText: {
    fontSize: 12,
    fontFamily: BOLD_FONT,
    color: '#4B5563',
  },
  audienceBtnTextActive: {
    color: '#FFFFFF',
  },
  typeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 6,
  },
  typeChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  typeChipActive: {
    backgroundColor: '#EEF2FF',
    borderColor: ADMIN_PRIMARY,
  },
  typeChipText: {
    fontSize: 12,
    fontFamily: BOLD_FONT,
    color: '#4B5563',
  },
  typeChipTextActive: {
    color: ADMIN_PRIMARY,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  input: {
    fontSize: 14,
    fontFamily: STYLISH_FONT,
    color: '#111827',
    flex: 1,
  },
  textArea: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    padding: 12,
    minHeight: 90,
  },
  previewContainer: {
    marginTop: 18,
    marginBottom: 18,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  previewHeader: {
    fontSize: 11,
    fontFamily: BOLD_FONT,
    color: '#64748B',
    marginBottom: 8,
  },
  mockNotification: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  mockAppRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  mockAppIcon: {
    width: 16,
    height: 16,
    borderRadius: 4,
    backgroundColor: '#FF6000',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  mockAppIconText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#FFF',
  },
  mockAppName: {
    fontSize: 11,
    fontFamily: STYLISH_FONT,
    color: '#64748B',
  },
  mockTitle: {
    fontSize: 14,
    fontFamily: BOLD_FONT,
    color: '#0F172A',
    marginBottom: 3,
  },
  mockBody: {
    fontSize: 12,
    fontFamily: STYLISH_FONT,
    color: '#334155',
    lineHeight: 17,
  },
  mockBannerImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    marginTop: 8,
  },
  sendBtn: {
    backgroundColor: ADMIN_PRIMARY,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: ADMIN_PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  sendBtnDisabled: {
    opacity: 0.6,
  },
  btnContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sendBtnText: {
    fontSize: 15,
    fontFamily: BOLD_FONT,
    color: '#FFFFFF',
  },
  resultBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    marginBottom: 20,
  },
  resultTitle: {
    fontSize: 14,
    fontFamily: BOLD_FONT,
    color: '#065F46',
  },
  resultDetails: {
    fontSize: 12,
    fontFamily: STYLISH_FONT,
    color: '#047857',
    marginTop: 2,
  },
  historyHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  emptyHistoryBox: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  emptyHistoryText: {
    fontSize: 13,
    fontFamily: STYLISH_FONT,
    color: '#9CA3AF',
    marginTop: 8,
  },
  historyList: {
    gap: 10,
  },
  historyItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  historyTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  badge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: BOLD_FONT,
    color: ADMIN_PRIMARY,
  },
  historyDate: {
    fontSize: 11,
    fontFamily: STYLISH_FONT,
    color: '#9CA3AF',
  },
  historyTitle: {
    fontSize: 14,
    fontFamily: BOLD_FONT,
    color: '#111827',
    marginBottom: 3,
  },
  historyBody: {
    fontSize: 12,
    fontFamily: STYLISH_FONT,
    color: '#4B5563',
    lineHeight: 17,
  },
  historyRecipient: {
    fontSize: 11,
    fontFamily: STYLISH_FONT,
    color: '#6B7280',
    marginTop: 6,
  },
});
