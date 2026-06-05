// Vendor's own invoice detail view.
// Registered as 'VendorInvoiceDetail' route – reads invoiceId from that route.
import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
    ScrollView,
  SafeAreaView,
} from 'react-native';
import { useFocusEffect, useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList, Invoice } from '../../types';
import { getInvoiceById } from '../../database/db';
import { Colors, StatusBadge, Divider, Card } from '../../components/UI';

type RouteType = RouteProp<RootStackParamList, 'VendorInvoiceDetail'>;

export default function VendorInvoiceDetail() {
  const { params } = useRoute<RouteType>();
  const [invoice, setInvoice] = useState<Invoice | null>(null);

  useFocusEffect(
    useCallback(() => {
      setInvoice(getInvoiceById(params.invoiceId));
    }, [params.invoiceId])
  );

  if (!invoice) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={{ color: Colors.textMuted }}>Loading…</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isOverdue =
    invoice.status === 'issued' && new Date(invoice.dueDate) < new Date();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.invoiceHeader}>
          <View style={styles.titleRow}>
            <Text style={styles.invoiceIcon}>🧾</Text>
            <View>
              <Text style={styles.invoiceTitle}>INVOICE</Text>
              <Text style={styles.invoiceNum}>{invoice.invoiceNumber}</Text>
            </View>
          </View>
          <StatusBadge status={isOverdue ? 'overdue' : invoice.status} />
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
              <Text style={styles.partyRole}>You (Vendor)</Text>
            </View>
          </View>
        </Card>

        {/* Details */}
        <Card>
          <Text style={styles.cardTitle}>Invoice Details</Text>
          <InfoRow label="Invoice #" value={invoice.invoiceNumber} />
          <InfoRow label="Order #" value={invoice.orderNumber} />
          <InfoRow label="Issued" value={new Date(invoice.issuedAt).toLocaleDateString()} />
          <InfoRow label="Due Date" value={new Date(invoice.dueDate).toLocaleDateString()} />
          {invoice.paidAt && (
            <InfoRow label="Paid On" value={new Date(invoice.paidAt).toLocaleDateString()} />
          )}
        </Card>

        {/* Amount */}
        <Card>
          <Text style={styles.cardTitle}>Amount Breakdown</Text>
          <InfoRow label="Subtotal" value={`$${invoice.subtotal.toFixed(2)}`} />
          <InfoRow label="Tax (13% HST)" value={`$${invoice.tax.toFixed(2)}`} />
          <Divider />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Due</Text>
            <Text style={styles.totalValue}>${invoice.totalAmount.toFixed(2)}</Text>
          </View>
        </Card>

        {/* Status notice */}
        {invoice.status === 'issued' && (
          <View style={[styles.notice, isOverdue ? styles.noticeOverdue : styles.noticePending]}>
            <Text style={[styles.noticeText, { color: isOverdue ? Colors.danger : Colors.warning }]}>
              {isOverdue
                ? `⚠️ This invoice is overdue! It was due on ${new Date(invoice.dueDate).toLocaleDateString()}. Please contact your supplier.`
                : `💡 Payment of $${invoice.totalAmount.toFixed(2)} is due by ${new Date(invoice.dueDate).toLocaleDateString()}.`}
            </Text>
          </View>
        )}

        {invoice.status === 'paid' && (
          <View style={styles.noticePaid}>
            <Text style={styles.noticePaidText}>
              ✅ This invoice has been marked as paid. Thank you!
            </Text>
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
  invoiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
    paddingTop: 8,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  invoiceIcon: { fontSize: 36 },
  invoiceTitle: { fontSize: 11, fontWeight: '700', color: Colors.textMuted, letterSpacing: 2 },
  invoiceNum: { fontSize: 20, fontWeight: '800', color: Colors.primary },
  partiesRow: { flexDirection: 'row', alignItems: 'center' },
  partyBox: { flex: 1 },
  partyLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  partyName: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  partyRole: { fontSize: 11, color: Colors.textMuted },
  arrow: { fontSize: 20, color: Colors.textMuted, marginHorizontal: 12 },
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
  infoValue: { fontSize: 13, color: Colors.textPrimary, fontWeight: '600', textAlign: 'right' },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  totalLabel: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  totalValue: { fontSize: 28, fontWeight: '900', color: Colors.vendor, letterSpacing: -0.5 },
  notice: { borderRadius: 12, padding: 14, borderWidth: 1, marginBottom: 12 },
  noticePending: { backgroundColor: Colors.warningBg, borderColor: Colors.warning },
  noticeOverdue: { backgroundColor: Colors.dangerBg, borderColor: Colors.danger },
  noticeText: { fontSize: 13, fontWeight: '500', lineHeight: 18 },
  noticePaid: {
    backgroundColor: Colors.successBg,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.success,
  },
  noticePaidText: { fontSize: 13, color: Colors.success, fontWeight: '600' },
});
