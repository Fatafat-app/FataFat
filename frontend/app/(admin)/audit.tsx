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
import { Typography, Colors } from '../../constants/Theme';

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
      <View style={styles.navbar}>
        <View>
          <Text style={styles.pageTitle}>Security & Audit Logs</Text>
          <Text style={styles.pageSubtitle}>Immutable Activity Ledger</Text>
        </View>

        <TouchableOpacity onPress={onRefresh} style={styles.refreshBtn}>
          <Ionicons name="refresh" size={18} color={Colors.textSecondary} />
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
            <Ionicons name="shield-checkmark-outline" size={48} color={Colors.borderDark} />
            <Text style={styles.emptyTitle}>No Audit Logs Recorded</Text>
            <Text style={styles.emptySubtitle}>Admin events and modifications will appear here.</Text>
          </View>
        ) : (
          auditLogs.map((log: any) => (
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
  safeArea: { flex: 1, backgroundColor: Colors.background },
  navbar: { backgroundColor: Colors.surface, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pageTitle: { ...Typography.heading, fontSize: 18 },
  pageSubtitle: { ...Typography.bodySmall, fontSize: 11 },
  refreshBtn: { backgroundColor: Colors.background, padding: 8, borderRadius: 10 },
  scrollContainer: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingVertical: 12, paddingBottom: 40 },
  emptyCard: { backgroundColor: Colors.surface, borderRadius: 20, padding: 36, alignItems: 'center', justifyContent: 'center', marginTop: 20, borderWidth: 1, borderColor: Colors.border },
  emptyTitle: { ...Typography.title, fontSize: 16, marginTop: 12 },
  emptySubtitle: { ...Typography.caption, textAlign: 'center', marginTop: 4 },
  logCard: { backgroundColor: Colors.surface, borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: Colors.border, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
  logHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  actionBadge: { backgroundColor: '#EEF2FF', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  actionText: { ...Typography.button, fontSize: 10, color: '#4F46E5', textTransform: 'uppercase' },
  logDate: { ...Typography.caption, fontSize: 11 },
  targetInfo: { ...Typography.title, fontSize: 13 },
  adminInfo: { ...Typography.caption, fontSize: 11, marginTop: 2 },
});
