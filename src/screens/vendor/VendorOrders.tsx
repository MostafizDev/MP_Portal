import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Platform,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, Order } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { getOrdersByVendor } from '../../database/db';
import { Colors, EmptyState, StatusBadge } from '../../components/UI';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function VendorOrders() {
  const { user } = useAuth();
  const navigation = useNavigation<Nav>();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'invoiced' | 'rejected'>('all');
  const [search, setSearch] = useState('');

  const load = useCallback(() => {
    if (!user) return;
    setOrders(getOrdersByVendor(user.id));
  }, [user]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const filtered = orders.filter((o) => {
    const matchFilter = filter === 'all' || o.status === filter;
    const matchSearch = o.orderNumber.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const renderOrder = ({ item }: { item: Order }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={() => navigation.navigate('VendorOrderDetail', { orderId: item.id })}
    >
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.orderNum}>{item.orderNumber}</Text>
          <Text style={styles.supplier}>🏢 {item.supplierName}</Text>
          <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>
        </View>
        <View style={styles.rightCol}>
          <StatusBadge status={item.status} />
          <Text style={styles.amount}>${item.totalAmount.toFixed(2)}</Text>
          <Text style={styles.itemCount}>{item.items.length} item(s)</Text>
        </View>
      </View>

      {/* Status messages */}
      {item.status === 'pending' && (
        <View style={styles.statusNote}>
          <Text style={styles.statusNoteText}>⏳ Awaiting supplier review…</Text>
        </View>
      )}
      {item.status === 'accepted' && (
        <View style={[styles.statusNote, styles.statusNoteSuccess]}>
          <Text style={[styles.statusNoteText, { color: Colors.success }]}>✅ Order accepted — invoice will be generated shortly.</Text>
        </View>
      )}
      {item.status === 'rejected' && (
        <View style={[styles.statusNote, styles.statusNoteDanger]}>
          <Text style={[styles.statusNoteText, { color: Colors.danger }]}>❌ Order was rejected by supplier.</Text>
        </View>
      )}
      {item.status === 'invoiced' && (
        <View style={[styles.statusNote, styles.statusNoteInfo]}>
          <Text style={[styles.statusNoteText, { color: Colors.info }]}>🧾 Invoice generated — check Invoices tab.</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const FilterTab = ({ label, value }: { label: string; value: typeof filter }) => (
    <TouchableOpacity
      style={[styles.tab, filter === value && styles.tabActive]}
      onPress={() => setFilter(value)}
    >
      <Text style={[styles.tabText, filter === value && styles.tabTextActive]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>My Orders</Text>
      </View>

      <View style={styles.searchWrapper}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by order number…"
          placeholderTextColor={Colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <View style={styles.tabs}>
        <FilterTab label="All" value="all" />
        <FilterTab label="Pending" value="pending" />
        <FilterTab label="Accepted" value="accepted" />
        <FilterTab label="Invoiced" value="invoiced" />
        <FilterTab label="Rejected" value="rejected" />
      </View>

      <Text style={styles.count}>{filtered.length} order(s)</Text>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderOrder}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <EmptyState
            icon="📋"
            message="No orders yet.\nBrowse products and create your first order!"
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bg,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0,
  },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  title: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
  },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, color: Colors.textPrimary, paddingVertical: 12, fontSize: 14 },
  tabs: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 10, gap: 6 },
  tab: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: Colors.border },
  tabActive: { backgroundColor: Colors.vendorBg, borderColor: Colors.vendor },
  tabText: { fontSize: 11, color: Colors.textMuted, fontWeight: '600' },
  tabTextActive: { color: Colors.vendor },
  count: { fontSize: 12, color: Colors.textMuted, paddingHorizontal: 20, marginBottom: 8 },
  list: { padding: 20, paddingTop: 0 },
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: Colors.vendor,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  orderNum: { fontSize: 15, fontWeight: '800', color: Colors.vendor, marginBottom: 4 },
  supplier: { fontSize: 13, color: Colors.textSecondary, marginBottom: 2 },
  date: { fontSize: 11, color: Colors.textMuted },
  rightCol: { alignItems: 'flex-end', gap: 4 },
  amount: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary, marginTop: 4 },
  itemCount: { fontSize: 11, color: Colors.textMuted },
  statusNote: {
    backgroundColor: Colors.warningBg,
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: Colors.warning,
  },
  statusNoteSuccess: { backgroundColor: Colors.successBg, borderColor: Colors.success },
  statusNoteDanger: { backgroundColor: Colors.dangerBg, borderColor: Colors.danger },
  statusNoteInfo: { backgroundColor: Colors.infoBg, borderColor: Colors.info },
  statusNoteText: { fontSize: 12, color: Colors.warning, fontWeight: '600' },
});
