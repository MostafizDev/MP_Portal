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
import { getSupplierStats } from '../../database/db';
import { Colors, StatCard, Card, PrimaryButton } from '../../components/UI';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList>;
};

export default function SupplierDashboard({ navigation }: Props) {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState({
    totalVendors: 0,
    totalProducts: 0,
    pendingOrders: 0,
    totalRevenue: 0,
    totalOrders: 0,
    totalInvoices: 0,
  });
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = useCallback(() => {
    if (!user) return;
    const s = getSupplierStats(user.id);
    setStats(s);
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [loadStats])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadStats();
    setRefreshing(false);
  };

  const quickActions = [
    {
      icon: '➕',
      label: 'Add Product',
      color: Colors.primary,
      onPress: () => navigation.navigate('CreateProduct'),
    },
    {
      icon: '👥',
      label: 'Add Vendor',
      color: Colors.supplier,
      onPress: () => navigation.navigate('CreateVendor'),
    },
    {
      icon: '📋',
      label: 'View Orders',
      color: Colors.vendor,
      onPress: () => navigation.navigate('ManageOrders'),
    },
    {
      icon: '🧾',
      label: 'Invoices',
      color: Colors.success,
      onPress: () => navigation.navigate('ManageInvoices'),
    },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good day,</Text>
            <Text style={styles.userName}>{user?.name}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>🏢 Supplier Account</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
            <Text style={styles.logoutIcon}>🚪</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Grid */}
        <Text style={styles.sectionTitle}>Overview</Text>
        <View style={styles.statsGrid}>
          <StatCard label="Vendors" value={stats.totalVendors} icon="👥" accent={Colors.supplier} />
          <StatCard label="Products" value={stats.totalProducts} icon="📦" accent={Colors.primary} />
          <StatCard label="Pending Orders" value={stats.pendingOrders} icon="⏳" accent={Colors.warning} />
          <StatCard label="Total Orders" value={stats.totalOrders} icon="📋" accent={Colors.vendor} />
          <StatCard label="Invoices" value={stats.totalInvoices} icon="🧾" accent={Colors.info} />
          <StatCard
            label="Revenue Paid"
            value={`$${stats.totalRevenue.toFixed(2)}`}
            icon="💰"
            accent={Colors.success}
          />
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
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

        {/* Company Info */}
        <Card style={styles.companyCard}>
          <Text style={styles.companyTitle}>Company Profile</Text>
          <View style={styles.companyRow}>
            <Text style={styles.companyKey}>Company</Text>
            <Text style={styles.companyVal}>{user?.company ?? '—'}</Text>
          </View>
          <View style={styles.companyRow}>
            <Text style={styles.companyKey}>Email</Text>
            <Text style={styles.companyVal}>{user?.email}</Text>
          </View>
          <View style={styles.companyRow}>
            <Text style={styles.companyKey}>Phone</Text>
            <Text style={styles.companyVal}>{user?.phone ?? '—'}</Text>
          </View>
          <View style={styles.companyRow}>
            <Text style={styles.companyKey}>Username</Text>
            <Text style={styles.companyVal}>{user?.username}</Text>
          </View>
        </Card>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
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
    marginBottom: 28,
    marginTop: 8,
  },
  greeting: { fontSize: 14, color: Colors.textMuted, fontWeight: '500' },
  userName: { fontSize: 24, fontWeight: '800', color: Colors.textPrimary, letterSpacing: -0.5 },
  roleBadge: {
    marginTop: 6,
    backgroundColor: Colors.supplierBg,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: Colors.supplier,
  },
  roleText: { color: Colors.supplier, fontSize: 11, fontWeight: '700' },
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
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
    marginBottom: 24,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
    marginBottom: 24,
  },
  actionCard: {
    width: '46%',
    margin: '2%',
    backgroundColor: Colors.bgCard,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1.5,
  },
  actionIcon: { fontSize: 28, marginBottom: 8 },
  actionLabel: { fontSize: 13, fontWeight: '700' },
  companyCard: { marginBottom: 0 },
  companyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  companyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  companyKey: { fontSize: 12, color: Colors.textMuted, fontWeight: '600' },
  companyVal: { fontSize: 13, color: Colors.textPrimary, fontWeight: '500', flex: 1, textAlign: 'right' },
});
