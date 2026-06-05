import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
    ScrollView,
  SafeAreaView,
} from 'react-native';
import { useFocusEffect, useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList, Order } from '../../types';
import { getOrderById } from '../../database/db';
import { Colors, StatusBadge, Divider, Card } from '../../components/UI';

type RouteType = RouteProp<RootStackParamList, 'OrderDetail'>;

export default function OrderDetail() {
  const { params } = useRoute<RouteType>();
  const [order, setOrder] = useState<Order | null>(null);

  useFocusEffect(
    useCallback(() => {
      const o = getOrderById(params.orderId);
      setOrder(o);
    }, [params.orderId])
  );

  if (!order) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loading}>
          <Text style={{ color: Colors.textMuted }}>Loading order…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.orderNum}>{order.orderNumber}</Text>
          <StatusBadge status={order.status} />
        </View>

        {/* Parties */}
        <Card>
          <Text style={styles.cardTitle}>Order Details</Text>
          <InfoRow label="Vendor" value={order.vendorName} />
          <InfoRow label="Supplier" value={order.supplierName} />
          <InfoRow label="Placed On" value={new Date(order.createdAt).toLocaleString()} />
          <InfoRow label="Last Updated" value={new Date(order.updatedAt).toLocaleString()} />
          {order.notes ? <InfoRow label="Notes" value={order.notes} /> : null}
        </Card>

        {/* Items */}
        <Card>
          <Text style={styles.cardTitle}>Order Items</Text>
          {order.items.map((item, i) => (
            <View key={item.id}>
              {i > 0 && <Divider style={{ marginVertical: 8 }} />}
              <View style={styles.itemRow}>
                <View style={styles.itemMain}>
                  <Text style={styles.itemName}>{item.productName}</Text>
                  <Text style={styles.itemSku}>SKU: {item.productSku}</Text>
                </View>
                <View style={styles.itemRight}>
                  <Text style={styles.itemQty}>× {item.quantity}</Text>
                  <Text style={styles.itemPrice}>${item.unitPrice.toFixed(2)} ea</Text>
                  <Text style={styles.itemTotal}>${item.total.toFixed(2)}</Text>
                </View>
              </View>
            </View>
          ))}
        </Card>

        {/* Totals */}
        <Card>
          <Text style={styles.cardTitle}>Summary</Text>
          <InfoRow label="Subtotal" value={`$${order.subtotal.toFixed(2)}`} />
          <InfoRow label="Tax (13% HST)" value={`$${order.tax.toFixed(2)}`} />
          <Divider />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalValue}>${order.totalAmount.toFixed(2)}</Text>
          </View>
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
  safe: { flex: 1, backgroundColor: Colors.bg },
  scroll: { padding: 20 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingTop: 8,
  },
  orderNum: { fontSize: 22, fontWeight: '800', color: Colors.primary },
  cardTitle: { fontSize: 14, fontWeight: '700', color: Colors.textSecondary, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.8 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  infoLabel: { fontSize: 13, color: Colors.textMuted, fontWeight: '500' },
  infoValue: { fontSize: 13, color: Colors.textPrimary, fontWeight: '600', flex: 1, textAlign: 'right', marginLeft: 16 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  itemMain: { flex: 1 },
  itemName: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  itemSku: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  itemRight: { alignItems: 'flex-end' },
  itemQty: { fontSize: 13, color: Colors.textSecondary, fontWeight: '600' },
  itemPrice: { fontSize: 11, color: Colors.textMuted },
  itemTotal: { fontSize: 15, fontWeight: '800', color: Colors.primary, marginTop: 4 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  totalLabel: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  totalValue: { fontSize: 24, fontWeight: '900', color: Colors.primary, letterSpacing: -0.5 },
});
