import React, { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAdminStore } from '../../store/admin.store';

export default function AdminAuditScreen() {
  const { auditLogs, isLoading, fetchAuditLogs } = useAdminStore();

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const onRefresh = async () => {
    await fetchAuditLogs();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.navbar}>
        <View>
          <Text style={styles.pageTitle}>Security & Audit Logs</Text>
          <Text style={styles.pageSubtitle}>Immutable Activity Ledger</Text>
        </View>

        <TouchableOpacity onPress={onRefresh} style={styles.refreshBtn}>
          <Ionicons name="refresh" size={18} color="#4B5563" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={onRefresh} colors={['#4F46E5']} />}
      >
        {auditLogs.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="shield-checkmark-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No Audit Logs Recorded</Text>
            <Text style={styles.emptySubtitle}>Admin events and modifications will appear here.</Text>
          </View>
        ) : (
          auditLogs.map((log) => (
            <View key={log._id} style={styles.logCard}>
              <View style={styles.logHeader}>
                <View style={styles.actionBadge}>
                  <Text style={styles.actionText}>{log.action || 'SYSTEM_ACTION'}</Text>
                </View>
                <Text style={styles.logDate}>
                  {new Date(log.createdAt).toLocaleString()}
                </Text>
              </View>

              <Text style={styles.targetInfo}>
                Target: {log.targetType} ({log.targetId})
              </Text>
              <Text style={styles.adminInfo}>
                By: {log.adminId?.name || 'Super Admin'} ({log.adminId?.email || 'admin@ftafat.com'})
              </Text>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  navbar: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pageTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#111827',
  },
  pageSubtitle: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  refreshBtn: {
    backgroundColor: '#F3F4F6',
    padding: 8,
    borderRadius: 10,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 40,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#374151',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 4,
  },
  logCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  actionText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#4F46E5',
    textTransform: 'uppercase',
  },
  logDate: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  targetInfo: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  adminInfo: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
});
