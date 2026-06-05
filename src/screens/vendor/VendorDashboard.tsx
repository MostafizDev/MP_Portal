import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Platform,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { getVendorStats } from '../../database/db';
import { Colors, StatCard, Card } from '../../components/UI';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList>;
};

export default function VendorDashboard({ navigation }: Props) {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    totalInvoices: 0,
    unpaidInvoices: 0,
    totalSpent: 0,
  });
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = useCallback(() => {
    if (!user) return;
    setStats(getVendorStats(user.id));
  }, [user]);

  useFocusEffect(useCallback(() => { loadStats(); }, [loadStats]));

  const onRefresh = () => {
    setRefreshing(true);
    loadStats();
    setRefreshing(false);
  };

  const quickActions = [
    {
      icon: '🛒',
      label: 'Browse & Order',
      color: Colors.vendor,
      onPress: () => navigation.navigate('BrowseProducts'),
    },
    {
      icon: '📋',
      label: 'My Orders',
      color: Colors.primary,
      onPress: () => navigation.navigate('VendorOrders'),
    },
    {
      icon: '🧾',
      label: 'My Invoices',
      color: Colors.success,
      onPress: () => navigation.navigate('VendorInvoices'),
    },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.vendor} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.userName}>{user?.name}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>🛒 Vendor Account</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
            <Text style={styles.logoutIcon}>🚪</Text>
          </TouchableOpacity>
        </View>

        {/* Alert for unpaid invoices */}
        {stats.unpaidInvoices > 0 && (
          <TouchableOpacity
            style={styles.alertBox}
            onPress={() => navigation.navigate('VendorInvoices')}
          >
            <Text style={styles.alertIcon}>⚠️</Text>
            <Text style={styles.alertText}>
              You have {stats.unpaidInvoices} unpaid invoice(s). Tap to view.
            </Text>
          </TouchableOpacity>
        )}

        {/* Stats */}
        <Text style={styles.sectionTitle}>My Activity</Text>
        <View style={styles.statsGrid}>
          <StatCard label="Total Orders" value={stats.totalOrders} icon="📦" accent={Colors.primary} />
          <StatCard label="Pending" value={stats.pendingOrders} icon="⏳" accent={Colors.warning} />
          <StatCard label="Invoices" value={stats.totalInvoices} icon="🧾" accent={Colors.info} />
          <StatCard label="Unpaid" value={stats.unpaidInvoices} icon="💳" accent={Colors.danger} />
          <StatCard label="Total Spent" value={`$${stats.totalSpent.toFixed(2)}`} icon="💰" accent={Colors.success} />
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsRow}>
          {quickActions.map((a, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.actionCard, { borderColor: a.color }]}
              onPress={a.onPress}
              activeOpacity={0.75}
            >
              <Text style={styles.actionIcon}>{a.icon}</Text>
              <Text style={[styles.actionLabel, { color: a.color }]}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Profile */}
        <Card style={styles.profileCard}>
          <Text style={styles.profileTitle}>My Profile</Text>
          <InfoRow label="Company" value={user?.company ?? '—'} />
          <InfoRow label="Email" value={user?.email ?? '—'} />
          <InfoRow label="Phone" value={user?.phone ?? '—'} />
          <InfoRow label="Username" value={user?.username ?? '—'} />
          <InfoRow label="Member Since" value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'} />
        </Card>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bg,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0,
  },
  scroll: { flex: 1, padding: 20 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
    marginTop: 8,
  },
  greeting: { fontSize: 14, color: Colors.textMuted, fontWeight: '500' },
  userName: { fontSize: 24, fontWeight: '800', color: Colors.textPrimary, letterSpacing: -0.5 },
  roleBadge: {
    marginTop: 6,
    backgroundColor: Colors.vendorBg,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: Colors.vendor,
  },
  roleText: { color: Colors.vendor, fontSize: 11, fontWeight: '700' },
  logoutBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutIcon: { fontSize: 18 },
  alertBox: {
    backgroundColor: Colors.warningBg,
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.warning,
    marginBottom: 20,
    gap: 10,
  },
  alertIcon: { fontSize: 20 },
  alertText: { flex: 1, fontSize: 13, color: Colors.warning, fontWeight: '600' },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4, marginBottom: 24 },
  actionsRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  actionCard: {
    flex: 1,
    backgroundColor: Colors.bgCard,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1.5,
  },
  actionIcon: { fontSize: 24, marginBottom: 6 },
  actionLabel: { fontSize: 11, fontWeight: '700', textAlign: 'center' },
  profileCard: { marginBottom: 0 },
  profileTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, marginBottom: 12 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  infoLabel: { fontSize: 12, color: Colors.textMuted, fontWeight: '600' },
  infoValue: { fontSize: 13, color: Colors.textPrimary, fontWeight: '500', flex: 1, textAlign: 'right' },
});
