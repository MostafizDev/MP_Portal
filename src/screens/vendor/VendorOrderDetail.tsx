// Vendor's own order detail view – reuses the shared OrderDetail component
// but is registered under a different route name so navigation works correctly.
import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView , SafeAreaView} from 'react-native';
import { useFocusEffect, useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList, Order } from '../../types';
import { getOrderById } from '../../database/db';
import { Colors, StatusBadge, Divider, Card } from '../../components/UI';

type RouteType = RouteProp<RootStackParamList, 'VendorOrderDetail'>;

export default function VendorOrderDetail() {
  const { params } = useRoute<RouteType>();
  const [order, setOrder] = useState<Order | null>(null);

  useFocusEffect(
    useCallback(() => {
      setOrder(getOrderById(params.orderId));
    }, [params.orderId])
  );

  if (!order) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={{ color: Colors.textMuted }}>Loading…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.orderNum}>{order.orderNumber}</Text>
          <StatusBadge status={order.status} />
        </View>

        <Card>
          <Text style={styles.cardTitle}>Order Details</Text>
          <InfoRow label="Supplier" value={order.supplierName} />
          <InfoRow label="Placed On" value={new Date(order.createdAt).toLocaleString()} />
          <InfoRow label="Last Updated" value={new Date(order.updatedAt).toLocaleString()} />
          {order.notes ? <InfoRow label="Notes" value={order.notes} /> : null}
        </Card>

        <Card>
          <Text style={styles.cardTitle}>Items Ordered</Text>
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

        <Card>
          <Text style={styles.cardTitle}>Summary</Text>
          <InfoRow label="Subtotal" value={`$${order.subtotal.toFixed(2)}`} />
          <InfoRow label="Tax (13% HST)" value={`$${order.tax.toFixed(2)}`} />
          <Divider />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>${order.totalAmount.toFixed(2)}</Text>
          </View>
        </Card>

        {/* Status guide */}
        <View style={styles.guideBox}>
          <Text style={styles.guideTitle}>Order Lifecycle</Text>
          {[
            { s: 'pending', label: 'Pending – awaiting supplier review' },
            { s: 'accepted', label: 'Accepted – supplier will generate invoice' },
            { s: 'invoiced', label: 'Invoiced – check your Invoices tab' },
            { s: 'rejected', label: 'Rejected – contact supplier for details' },
          ].map((step) => (
            <View key={step.s} style={styles.guideRow}>
              <View
                style={[
                  styles.guideDot,
                  order.status === step.s && styles.guideDotActive,
                ]}
              />
              <Text
                style={[
                  styles.guideText,
                  order.status === step.s && styles.guideTextActive,
                ]}
              >
                {step.label}
              </Text>
            </View>
          ))}
        </View>

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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingTop: 8,
  },
  orderNum: { fontSize: 22, fontWeight: '800', color: Colors.vendor },
  cardTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  infoLabel: { fontSize: 13, color: Colors.textMuted, fontWeight: '500' },
  infoValue: {
    fontSize: 13,
    color: Colors.textPrimary,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
    marginLeft: 16,
  },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  itemMain: { flex: 1 },
  itemName: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  itemSku: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  itemRight: { alignItems: 'flex-end' },
  itemQty: { fontSize: 13, color: Colors.textSecondary, fontWeight: '600' },
  itemPrice: { fontSize: 11, color: Colors.textMuted },
  itemTotal: { fontSize: 15, fontWeight: '800', color: Colors.vendor, marginTop: 4 },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  totalLabel: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  totalValue: { fontSize: 24, fontWeight: '900', color: Colors.vendor, letterSpacing: -0.5 },
  guideBox: {
    backgroundColor: Colors.bgCard,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  guideTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  guideRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  guideDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.border,
    marginRight: 10,
  },
  guideDotActive: { backgroundColor: Colors.vendor },
  guideText: { fontSize: 13, color: Colors.textMuted },
  guideTextActive: { color: Colors.vendor, fontWeight: '700' },
});
