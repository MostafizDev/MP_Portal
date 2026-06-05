import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, SafeAreaView } from 'react-native';
import { useFocusEffect, useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList, Invoice, Order } from '../../types';
import { getInvoiceById, updateInvoiceStatus, getOrderById } from '../../database/db';
import { useAuth } from '../../context/AuthContext';
import { Colors, StatusBadge, Divider, Card } from '../../components/UI';
import { downloadInvoicePdf } from '../../utils/generateInvoicePdf';

type RouteType = RouteProp<RootStackParamList, 'InvoiceDetail'>;

function fmtDateTime(d: string) {
  return new Date(d).toLocaleString('en-CA', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true,
  });
}

export default function InvoiceDetail() {
  const { params } = useRoute<RouteType>();
  const { user } = useAuth();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  const load = useCallback(() => {
    const inv = getInvoiceById(params.invoiceId);
    setInvoice(inv);
    if (inv) setOrder(getOrderById(inv.orderId));
  }, [params.invoiceId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleMarkPaid = () => {
    if (!invoice) return;
    Alert.alert('Mark as Paid', `Mark ${invoice.invoiceNumber} as paid?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Mark Paid', onPress: async () => { await updateInvoiceStatus(invoice.id, 'paid'); load(); } },
    ]);
  };

  const handleDownload = async () => {
    if (!invoice) return;
    setPdfLoading(true);
    try {
      await downloadInvoicePdf(invoice, order);
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Could not generate PDF.');
    } finally {
      setPdfLoading(false);
    }
  };

  if (!invoice) return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.center}><Text style={{ color: Colors.textMuted }}>Loading…</Text></View>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Invoice header */}
        <View style={styles.invoiceHeader}>
          <View style={styles.titleRow}>
            <Text style={styles.invoiceIcon}>🧾</Text>
            <View>
              <Text style={styles.invoiceTitle}>INVOICE</Text>
              <Text style={styles.invoiceNum}>{invoice.invoiceNumber}</Text>
            </View>
          </View>
          <StatusBadge status={invoice.status} />
        </View>

        {/* Parties */}
        <Card>
          <View style={styles.partiesRow}>
            <View style={styles.partyBox}>
              <Text style={styles.partyLabel}>FROM</Text>
              <Text style={styles.partyName}>{invoice.supplierName}</Text>
              <Text style={styles.partyRole}>Supplier</Text>
            </View>
            <Text style={styles.arrow}>→</Text>
            <View style={[styles.partyBox, { alignItems: 'flex-end' }]}>
              <Text style={[styles.partyLabel, { color: Colors.vendor }]}>TO</Text>
              <Text style={styles.partyName}>{invoice.vendorName}</Text>
              <Text style={styles.partyRole}>Vendor</Text>
            </View>
          </View>
        </Card>

        {/* Invoice details */}
        <Card>
          <Text style={styles.cardTitle}>Invoice Details</Text>
          <InfoRow label="Order #" value={invoice.orderNumber} />
          <InfoRow label="Issued On" value={fmtDateTime(invoice.issuedAt)} />
          <InfoRow label="Due Date" value={new Date(invoice.dueDate).toLocaleDateString()} />
          {invoice.paidAt && <InfoRow label="Paid On" value={fmtDateTime(invoice.paidAt)} />}
        </Card>

        {/* Order items */}
        <Card>
          <Text style={styles.cardTitle}>Order Items</Text>
          {order && order.items.length > 0 ? (
            <>
              <View style={styles.itemHeader}>
                <Text style={[styles.itemCol, { flex: 3 }]}>Product</Text>
                <Text style={[styles.itemCol, styles.itemCenter]}>Qty</Text>
                <Text style={[styles.itemCol, styles.itemRight]}>Unit</Text>
                <Text style={[styles.itemCol, styles.itemRight]}>Total</Text>
              </View>
              {order.items.map((item) => (
                <View key={item.id} style={styles.itemRow}>
                  <View style={{ flex: 3 }}>
                    <Text style={styles.itemName}>{item.productName}</Text>
                    <Text style={styles.itemSku}>{item.productSku}</Text>
                  </View>
                  <Text style={[styles.itemCol, styles.itemCenter]}>{item.quantity}</Text>
                  <Text style={[styles.itemCol, styles.itemRight]}>${item.unitPrice.toFixed(2)}</Text>
                  <Text style={[styles.itemCol, styles.itemRight, styles.itemTotal]}>${item.total.toFixed(2)}</Text>
                </View>
              ))}
            </>
          ) : (
            <Text style={styles.noItems}>No items found for this order.</Text>
          )}
        </Card>

        {/* Amount */}
        <Card>
          <Text style={styles.cardTitle}>Amount</Text>
          <InfoRow label="Subtotal" value={`$${invoice.subtotal.toFixed(2)}`} />
          <InfoRow label="Tax (13% HST)" value={`$${invoice.tax.toFixed(2)}`} />
          <Divider />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Due</Text>
            <Text style={styles.totalValue}>${invoice.totalAmount.toFixed(2)}</Text>
          </View>
        </Card>

        {user?.role === 'supplier' && invoice.status === 'issued' && (
          <TouchableOpacity style={styles.paidBtn} onPress={handleMarkPaid}>
            <Text style={styles.paidBtnText}>✅ Mark as Paid</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.downloadBtn} onPress={handleDownload} disabled={pdfLoading}>
          <Text style={styles.downloadBtnText}>{pdfLoading ? 'Generating PDF…' : '⬇️  Download Invoice PDF'}</Text>
        </TouchableOpacity>

        {user?.role === 'vendor' && invoice.status === 'issued' && (
          <View style={styles.pendingBox}>
            <Text style={styles.pendingText}>💡 Invoice due by {new Date(invoice.dueDate).toLocaleDateString()}.</Text>
          </View>
        )}

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
  invoiceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, paddingTop: 8 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  invoiceIcon: { fontSize: 36 },
  invoiceTitle: { fontSize: 11, fontWeight: '700', color: Colors.textMuted, letterSpacing: 2 },
  invoiceNum: { fontSize: 20, fontWeight: '800', color: Colors.primary },
  partiesRow: { flexDirection: 'row', alignItems: 'center' },
  partyBox: { flex: 1 },
  partyLabel: { fontSize: 10, fontWeight: '800', color: Colors.primary, letterSpacing: 1.5, marginBottom: 4 },
  partyName: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  partyRole: { fontSize: 11, color: Colors.textMuted },
  arrow: { fontSize: 20, color: Colors.textMuted, marginHorizontal: 12 },
  cardTitle: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.8 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  infoLabel: { fontSize: 13, color: Colors.textMuted, fontWeight: '500' },
  infoValue: { fontSize: 13, color: Colors.textPrimary, fontWeight: '600', textAlign: 'right', flex: 1, marginLeft: 8 },
  // Items table
  itemHeader: { flexDirection: 'row', paddingVertical: 6, borderBottomWidth: 2, borderBottomColor: Colors.border, marginBottom: 4 },
  itemRow: { flexDirection: 'row', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.borderLight, alignItems: 'center' },
  itemCol: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600' },
  itemCenter: { flex: 1, textAlign: 'center' },
  itemRight: { flex: 1.2, textAlign: 'right' },
  itemName: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
  itemSku: { fontSize: 10, color: Colors.textMuted, marginTop: 2 },
  itemTotal: { color: Colors.primary, fontWeight: '700' },
  noItems: { fontSize: 13, color: Colors.textMuted, textAlign: 'center', paddingVertical: 12 },
  // Totals
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  totalLabel: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  totalValue: { fontSize: 28, fontWeight: '900', color: Colors.primary, letterSpacing: -0.5 },
  // Buttons
  paidBtn: { backgroundColor: Colors.successBg, borderRadius: 14, paddingVertical: 14, alignItems: 'center', borderWidth: 1.5, borderColor: Colors.success, marginBottom: 12 },
  paidBtnText: { fontSize: 15, fontWeight: '700', color: Colors.success },
  downloadBtn: { backgroundColor: Colors.primaryBg, borderRadius: 14, paddingVertical: 14, alignItems: 'center', borderWidth: 1.5, borderColor: Colors.primary, marginBottom: 12 },
  downloadBtnText: { fontSize: 15, fontWeight: '700', color: Colors.primary },
  pendingBox: { backgroundColor: Colors.warningBg, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: Colors.warning },
  pendingText: { fontSize: 13, color: Colors.warning, fontWeight: '500' },
});
