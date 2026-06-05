import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, TextInput , SafeAreaView, Platform, StatusBar} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, Order } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { getOrdersBySupplier, updateOrderStatus, createInvoiceFromOrder, getInvoiceByOrderId } from '../../database/db';
import { Colors, EmptyState, StatusBadge } from '../../components/UI';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function ManageOrders() {
  const { user } = useAuth();
  const navigation = useNavigation<Nav>();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<'all'|'pending'|'accepted'|'invoiced'|'rejected'>('all');
  const [search, setSearch] = useState('');

  const load = useCallback(() => { if (user) setOrders(getOrdersBySupplier(user.id)); }, [user]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const filtered = orders.filter(o => (filter === 'all' || o.status === filter) &&
    (o.orderNumber.toLowerCase().includes(search.toLowerCase()) || o.vendorName.toLowerCase().includes(search.toLowerCase())));

  const handleAccept = (order: Order) => {
    Alert.alert('Accept Order', `Accept ${order.orderNumber}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Accept', onPress: async () => { await updateOrderStatus(order.id, 'accepted'); load(); } },
    ]);
  };

  const handleReject = (order: Order) => {
    Alert.alert('Reject Order', `Reject ${order.orderNumber}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reject', style: 'destructive', onPress: async () => { await updateOrderStatus(order.id, 'rejected'); load(); } },
    ]);
  };

  const handleInvoice = async (order: Order) => {
    const existing = getInvoiceByOrderId(order.id);
    if (existing) { navigation.navigate('InvoiceDetail', { invoiceId: existing.id }); return; }
    Alert.alert('Generate Invoice', `Create invoice for ${order.orderNumber}?\nTotal: $${order.totalAmount.toFixed(2)}`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Generate', onPress: async () => {
        const inv = await createInvoiceFromOrder(order);
        load();
        Alert.alert('Invoice Created ✅', `${inv.invoiceNumber} is now visible to the vendor.`);
      }},
    ]);
  };

  const FilterTab = ({ label, value }: { label: string; value: typeof filter }) => (
    <TouchableOpacity style={[styles.tab, filter === value && styles.tabActive]} onPress={() => setFilter(value)}>
      <Text style={[styles.tabText, filter === value && styles.tabTextActive]}>{label}</Text>
    </TouchableOpacity>
  );

  const renderOrder = ({ item }: { item: Order }) => (
    <TouchableOpacity style={styles.card} activeOpacity={0.85} onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.orderNum}>{item.orderNumber}</Text>
          <Text style={styles.vendorName}>👤 {item.vendorName}</Text>
          <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>
        </View>
        <View style={styles.rightCol}>
          <StatusBadge status={item.status} />
          <Text style={styles.amount}>${item.totalAmount.toFixed(2)}</Text>
          <Text style={styles.itemCount}>{item.items.length} item(s)</Text>
        </View>
      </View>
      {item.status === 'pending' && (
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.acceptBtn} onPress={() => handleAccept(item)}><Text style={styles.acceptText}>✅ Accept</Text></TouchableOpacity>
          <TouchableOpacity style={styles.rejectBtn} onPress={() => handleReject(item)}><Text style={styles.rejectText}>❌ Reject</Text></TouchableOpacity>
        </View>
      )}
      {item.status === 'accepted' && (
        <TouchableOpacity style={styles.invoiceBtn} onPress={() => handleInvoice(item)}><Text style={styles.invoiceBtnText}>🧾 Generate Invoice</Text></TouchableOpacity>
      )}
      {item.status === 'invoiced' && (
        <TouchableOpacity style={styles.viewInvBtn} onPress={() => handleInvoice(item)}><Text style={styles.viewInvText}>📄 View Invoice</Text></TouchableOpacity>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}><Text style={styles.title}>Purchase Orders</Text></View>
      <View style={styles.searchWrapper}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput style={styles.searchInput} placeholder="Search by order # or vendor…" placeholderTextColor={Colors.textMuted} value={search} onChangeText={setSearch} />
      </View>
      <View style={styles.tabs}>
        <FilterTab label="All" value="all" /><FilterTab label="Pending" value="pending" />
        <FilterTab label="Accepted" value="accepted" /><FilterTab label="Invoiced" value="invoiced" /><FilterTab label="Rejected" value="rejected" />
      </View>
      <Text style={styles.count}>{filtered.length} order(s)</Text>
      <FlatList data={filtered} keyExtractor={i => i.id} renderItem={renderOrder} contentContainerStyle={styles.list}
        ListEmptyComponent={<EmptyState icon="📋" message="No orders found." />} showsVerticalScrollIndicator={false} />
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
  searchWrapper:{flexDirection:'row',alignItems:'center',backgroundColor:Colors.bgCard,marginHorizontal:20,marginBottom:12,borderRadius:12,borderWidth:1,borderColor:Colors.border,paddingHorizontal:14},
  searchIcon:{fontSize:16,marginRight:8}, searchInput:{flex:1,color:Colors.textPrimary,paddingVertical:12,fontSize:14},
  tabs:{flexDirection:'row',paddingHorizontal:20,marginBottom:10,gap:6},
  tab:{paddingHorizontal:10,paddingVertical:6,borderRadius:20,borderWidth:1,borderColor:Colors.border},
  tabActive:{backgroundColor:Colors.primaryBg,borderColor:Colors.primary},
  tabText:{fontSize:11,color:Colors.textMuted,fontWeight:'600'}, tabTextActive:{color:Colors.primary},
  count:{fontSize:12,color:Colors.textMuted,paddingHorizontal:20,marginBottom:8}, list:{padding:20,paddingTop:0},
  card:{backgroundColor:Colors.bgCard,borderRadius:16,padding:16,borderWidth:1,borderColor:Colors.border,marginBottom:12},
  cardHeader:{flexDirection:'row',justifyContent:'space-between',marginBottom:12},
  orderNum:{fontSize:15,fontWeight:'800',color:Colors.primary,marginBottom:4},
  vendorName:{fontSize:13,color:Colors.textSecondary,marginBottom:2}, date:{fontSize:11,color:Colors.textMuted},
  rightCol:{alignItems:'flex-end',gap:4}, amount:{fontSize:18,fontWeight:'800',color:Colors.textPrimary,marginTop:4}, itemCount:{fontSize:11,color:Colors.textMuted},
  actionRow:{flexDirection:'row',gap:10},
  acceptBtn:{flex:1,backgroundColor:Colors.successBg,borderRadius:10,paddingVertical:10,alignItems:'center',borderWidth:1,borderColor:Colors.success},
  acceptText:{fontSize:13,fontWeight:'700',color:Colors.success},
  rejectBtn:{flex:1,backgroundColor:Colors.dangerBg,borderRadius:10,paddingVertical:10,alignItems:'center',borderWidth:1,borderColor:Colors.danger},
  rejectText:{fontSize:13,fontWeight:'700',color:Colors.danger},
  invoiceBtn:{backgroundColor:Colors.infoBg,borderRadius:10,paddingVertical:10,alignItems:'center',borderWidth:1,borderColor:Colors.info},
  invoiceBtnText:{fontSize:13,fontWeight:'700',color:Colors.info},
  viewInvBtn:{backgroundColor:Colors.primaryBg,borderRadius:10,paddingVertical:10,alignItems:'center',borderWidth:1,borderColor:Colors.primary},
  viewInvText:{fontSize:13,fontWeight:'700',color:Colors.primary},
});
