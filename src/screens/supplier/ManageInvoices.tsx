import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity , SafeAreaView, Platform, StatusBar} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, Invoice } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { getInvoicesBySupplier } from '../../database/db';
import { Colors, EmptyState, StatusBadge } from '../../components/UI';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function ManageInvoices() {
  const { user } = useAuth();
  const navigation = useNavigation<Nav>();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filter, setFilter] = useState<'all'|'issued'|'paid'>('all');

  const load = useCallback(() => { if (user) setInvoices(getInvoicesBySupplier(user.id)); }, [user]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const filtered = filter === 'all' ? invoices : invoices.filter(i => i.status === filter);
  const totalIssued = invoices.filter(i => i.status === 'issued').reduce((s, i) => s + i.totalAmount, 0);
  const totalPaid = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.totalAmount, 0);

  const FilterTab = ({ label, value }: { label: string; value: typeof filter }) => (
    <TouchableOpacity style={[styles.tab, filter === value && styles.tabActive]} onPress={() => setFilter(value)}>
      <Text style={[styles.tabText, filter === value && styles.tabTextActive]}>{label}</Text>
    </TouchableOpacity>
  );

  const renderInvoice = ({ item }: { item: Invoice }) => (
    <TouchableOpacity style={styles.card} activeOpacity={0.85} onPress={() => navigation.navigate('InvoiceDetail', { invoiceId: item.id })}>
      <View style={styles.row}>
        <View>
          <Text style={styles.invNum}>{item.invoiceNumber}</Text>
          <Text style={styles.vendorName}>👤 {item.vendorName}</Text>
          <Text style={styles.date}>Order: {item.orderNumber}</Text>
          <Text style={styles.date}>Issued: {new Date(item.issuedAt).toLocaleDateString()}</Text>
          <Text style={styles.date}>Due: {new Date(item.dueDate).toLocaleDateString()}</Text>
        </View>
        <View style={styles.rightCol}>
          <StatusBadge status={item.status} />
          <Text style={styles.amount}>${item.totalAmount.toFixed(2)}</Text>
          {item.paidAt && <Text style={styles.paidDate}>Paid {new Date(item.paidAt).toLocaleDateString()}</Text>}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}><Text style={styles.title}>Invoices</Text></View>
      <View style={styles.summaryRow}>
        <View style={styles.sumCard}><Text style={styles.sumLabel}>Outstanding</Text><Text style={[styles.sumValue,{color:Colors.warning}]}>${totalIssued.toFixed(2)}</Text></View>
        <View style={styles.sumCard}><Text style={styles.sumLabel}>Collected</Text><Text style={[styles.sumValue,{color:Colors.success}]}>${totalPaid.toFixed(2)}</Text></View>
      </View>
      <View style={styles.tabs}>
        <FilterTab label="All" value="all"/><FilterTab label="Issued" value="issued"/><FilterTab label="Paid" value="paid"/>
      </View>
      <Text style={styles.count}>{filtered.length} invoice(s)</Text>
      <FlatList data={filtered} keyExtractor={i => i.id} renderItem={renderInvoice} contentContainerStyle={styles.list}
        ListEmptyComponent={<EmptyState icon="🧾" message="No invoices yet." />} showsVerticalScrollIndicator={false} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex:1,
    backgroundColor:Colors.bg,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0,
  },
  title:{fontSize:22,fontWeight:'800',color:Colors.textPrimary},
  summaryRow:{flexDirection:'row',paddingHorizontal:20,gap:12,marginBottom:12},
  sumCard:{flex:1,backgroundColor:Colors.bgCard,borderRadius:12,padding:14,borderWidth:1,borderColor:Colors.border},
  sumLabel:{fontSize:11,color:Colors.textMuted,fontWeight:'600',marginBottom:4}, sumValue:{fontSize:20,fontWeight:'800'},
  tabs:{flexDirection:'row',paddingHorizontal:20,marginBottom:10,gap:8},
  tab:{paddingHorizontal:16,paddingVertical:8,borderRadius:20,borderWidth:1,borderColor:Colors.border},
  tabActive:{backgroundColor:Colors.primaryBg,borderColor:Colors.primary},
  tabText:{fontSize:13,color:Colors.textMuted,fontWeight:'600'}, tabTextActive:{color:Colors.primary},
  count:{fontSize:12,color:Colors.textMuted,paddingHorizontal:20,marginBottom:8}, list:{padding:20,paddingTop:0},
  card:{backgroundColor:Colors.bgCard,borderRadius:16,padding:16,borderWidth:1,borderColor:Colors.border,marginBottom:12,borderLeftWidth:4,borderLeftColor:Colors.info},
  row:{flexDirection:'row',justifyContent:'space-between'},
  invNum:{fontSize:15,fontWeight:'800',color:Colors.primary,marginBottom:4},
  vendorName:{fontSize:13,color:Colors.textSecondary,marginBottom:2}, date:{fontSize:11,color:Colors.textMuted,marginBottom:1},
  rightCol:{alignItems:'flex-end',gap:6}, amount:{fontSize:18,fontWeight:'800',color:Colors.textPrimary},
  paidDate:{fontSize:11,color:Colors.success,fontWeight:'600'},
});
