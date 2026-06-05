import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Platform,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, Invoice } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { getInvoicesByVendor } from '../../database/db';
import { Colors, EmptyState, StatusBadge } from '../../components/UI';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function VendorInvoices() {
  const { user } = useAuth();
  const navigation = useNavigation<Nav>();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filter, setFilter] = useState<'all' | 'issued' | 'paid'>('all');

  const load = useCallback(() => {
    if (!user) return;
    setInvoices(getInvoicesByVendor(user.id));
  }, [user]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const filtered = filter === 'all' ? invoices : invoices.filter((i) => i.status === filter);

  const totalUnpaid = invoices
    .filter((i) => i.status === 'issued')
    .reduce((s, i) => s + i.totalAmount, 0);

  const totalPaid = invoices
    .filter((i) => i.status === 'paid')
    .reduce((s, i) => s + i.totalAmount, 0);

  const renderInvoice = ({ item }: { item: Invoice }) => (
    <TouchableOpacity
      style={[
        styles.card,
        item.status === 'issued' && styles.cardUnpaid,
        item.status === 'paid' && styles.cardPaid,
      ]}
      activeOpacity={0.85}
      onPress={() => navigation.navigate('VendorInvoiceDetail', { invoiceId: item.id })}
    >
      <View style={styles.row}>
        <View style={styles.leftCol}>
          <Text style={styles.invNum}>{item.invoiceNumber}</Text>
          <Text style={styles.supplier}>🏢 {item.supplierName}</Text>
          <Text style={styles.orderRef}>Order: {item.orderNumber}</Text>
          <Text style={styles.date}>Issued: {new Date(item.issuedAt).toLocaleDateString()}</Text>
          <Text style={[styles.date, item.status === 'issued' ? styles.dueSoon : undefined]}>
            Due: {new Date(item.dueDate).toLocaleDateString()}
          </Text>
        </View>
        <View style={styles.rightCol}>
          <StatusBadge status={item.status} />
          <Text style={styles.amount}>${item.totalAmount.toFixed(2)}</Text>
          {item.status === 'issued' && (
            <Text style={styles.unpaidLabel}>UNPAID</Text>
          )}
          {item.status === 'paid' && item.paidAt && (
            <Text style={styles.paidLabel}>
              Paid {new Date(item.paidAt).toLocaleDateString()}
            </Text>
          )}
        </View>
      </View>
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
        <Text style={styles.title}>My Invoices</Text>
      </View>

      {/* Summary Row */}
      <View style={styles.summaryRow}>
        <View style={[styles.sumCard, { borderTopColor: Colors.warning }]}>
          <Text style={styles.sumLabel}>Unpaid</Text>
          <Text style={[styles.sumValue, { color: Colors.warning }]}>
            ${totalUnpaid.toFixed(2)}
          </Text>
        </View>
        <View style={[styles.sumCard, { borderTopColor: Colors.success }]}>
          <Text style={styles.sumLabel}>Paid</Text>
          <Text style={[styles.sumValue, { color: Colors.success }]}>
            ${totalPaid.toFixed(2)}
          </Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabs}>
        <FilterTab label="All" value="all" />
        <FilterTab label="Unpaid" value="issued" />
        <FilterTab label="Paid" value="paid" />
      </View>

      <Text style={styles.count}>{filtered.length} invoice(s)</Text>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderInvoice}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <EmptyState
            icon="🧾"
            message="No invoices yet.\nInvoices appear here once the supplier accepts and invoices your order."
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
  summaryRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginBottom: 14 },
  sumCard: {
    flex: 1,
    backgroundColor: Colors.bgCard,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    borderTopWidth: 3,
  },
  sumLabel: { fontSize: 11, color: Colors.textMuted, fontWeight: '600', marginBottom: 4 },
  sumValue: { fontSize: 20, fontWeight: '800' },
  tabs: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 10, gap: 8 },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabActive: { backgroundColor: Colors.vendorBg, borderColor: Colors.vendor },
  tabText: { fontSize: 13, color: Colors.textMuted, fontWeight: '600' },
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
    borderLeftColor: Colors.info,
  },
  cardUnpaid: { borderLeftColor: Colors.warning },
  cardPaid: { borderLeftColor: Colors.success },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  leftCol: { flex: 1 },
  rightCol: { alignItems: 'flex-end', gap: 6 },
  invNum: { fontSize: 15, fontWeight: '800', color: Colors.primary, marginBottom: 4 },
  supplier: { fontSize: 13, color: Colors.textSecondary, marginBottom: 2 },
  orderRef: { fontSize: 11, color: Colors.textMuted, marginBottom: 2 },
  date: { fontSize: 11, color: Colors.textMuted, marginBottom: 1 },
  dueSoon: { color: Colors.warning, fontWeight: '600' },
  amount: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary },
  unpaidLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.warning,
    letterSpacing: 1,
    backgroundColor: Colors.warningBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  paidLabel: { fontSize: 11, color: Colors.success, fontWeight: '600' },
});
