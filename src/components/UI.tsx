import React, { ReactNode } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';

// ─── Color Palette ────────────────────────────────────────────────────────────
export const Colors = {
  // Dark navy base
  bg: '#0F172A',
  bgCard: '#1E293B',
  bgCardAlt: '#162032',
  bgInput: '#0F172A',
  border: '#334155',
  borderLight: '#1E293B',

  // Accent – electric teal / cyan
  primary: '#06B6D4',
  primaryDark: '#0891B2',
  primaryLight: '#67E8F9',
  primaryBg: 'rgba(6,182,212,0.10)',

  // Supplier accent – amber gold
  supplier: '#F59E0B',
  supplierDark: '#D97706',
  supplierBg: 'rgba(245,158,11,0.12)',

  // Vendor accent – violet
  vendor: '#8B5CF6',
  vendorDark: '#7C3AED',
  vendorBg: 'rgba(139,92,246,0.12)',

  // Status colors
  success: '#10B981',
  successBg: 'rgba(16,185,129,0.12)',
  warning: '#F59E0B',
  warningBg: 'rgba(245,158,11,0.12)',
  danger: '#EF4444',
  dangerBg: 'rgba(239,68,68,0.12)',
  info: '#3B82F6',
  infoBg: 'rgba(59,130,246,0.12)',

  // Text
  textPrimary: '#F1F5F9',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  textDark: '#0F172A',

  white: '#FFFFFF',
  black: '#000000',
};

// ─── Typography ───────────────────────────────────────────────────────────────
export const Typography = {
  h1: { fontSize: 28, fontWeight: '800' as const, color: Colors.textPrimary, letterSpacing: -0.5 },
  h2: { fontSize: 22, fontWeight: '700' as const, color: Colors.textPrimary, letterSpacing: -0.3 },
  h3: { fontSize: 18, fontWeight: '600' as const, color: Colors.textPrimary },
  h4: { fontSize: 15, fontWeight: '600' as const, color: Colors.textPrimary },
  body: { fontSize: 14, fontWeight: '400' as const, color: Colors.textSecondary, lineHeight: 20 },
  small: { fontSize: 12, fontWeight: '400' as const, color: Colors.textMuted },
  caption: { fontSize: 11, fontWeight: '500' as const, color: Colors.textMuted, letterSpacing: 0.5 },
  label: { fontSize: 12, fontWeight: '600' as const, color: Colors.textSecondary, letterSpacing: 0.8, textTransform: 'uppercase' as const },
  mono: { fontSize: 13, fontWeight: '600' as const, color: Colors.primary, letterSpacing: 0.5 },
};

// ─────────────────────────────────────────────────────────────────────────────
//  REUSABLE COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

// Card
export function Card({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

// Section Header
export function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={Typography.h2}>{title}</Text>
      {subtitle ? <Text style={[Typography.body, { marginTop: 4 }]}>{subtitle}</Text> : null}
    </View>
  );
}

// Primary Button
export function PrimaryButton({
  title,
  onPress,
  loading,
  style,
  textStyle,
  disabled,
  color,
}: {
  title: string;
  onPress: () => void;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
  color?: string;
}) {
  const bg = color ?? Colors.primary;
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[styles.primaryBtn, { backgroundColor: bg }, disabled && styles.btnDisabled, style]}
    >
      {loading ? (
        <ActivityIndicator color={Colors.textDark} size="small" />
      ) : (
        <Text style={[styles.primaryBtnText, textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

// Ghost / Outline Button
export function OutlineButton({
  title,
  onPress,
  style,
  color,
}: {
  title: string;
  onPress: () => void;
  style?: ViewStyle;
  color?: string;
}) {
  const c = color ?? Colors.primary;
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[styles.outlineBtn, { borderColor: c }, style]}
    >
      <Text style={[styles.outlineBtnText, { color: c }]}>{title}</Text>
    </TouchableOpacity>
  );
}

// Badge / Status Chip
export function StatusBadge({ status }: { status: string }) {
  const cfg = statusConfig(status);
  return (
    <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
      <Text style={[styles.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
}

export function statusConfig(status: string) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    pending: { label: 'Pending', color: Colors.warning, bg: Colors.warningBg },
    accepted: { label: 'Accepted', color: Colors.success, bg: Colors.successBg },
    rejected: { label: 'Rejected', color: Colors.danger, bg: Colors.dangerBg },
    invoiced: { label: 'Invoiced', color: Colors.info, bg: Colors.infoBg },
    delivered: { label: 'Delivered', color: Colors.primary, bg: Colors.primaryBg },
    issued: { label: 'Issued', color: Colors.info, bg: Colors.infoBg },
    paid: { label: 'Paid', color: Colors.success, bg: Colors.successBg },
    overdue: { label: 'Overdue', color: Colors.danger, bg: Colors.dangerBg },
  };
  return map[status] ?? { label: status, color: Colors.textMuted, bg: Colors.bgCard };
}

// Stat Card for dashboards
export function StatCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: string | number;
  icon: string;
  accent: string;
}) {
  return (
    <View style={[styles.statCard, { borderLeftColor: accent }]}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={[styles.statValue, { color: accent }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// Empty state
export function EmptyState({ icon, message }: { icon: string; message: string }) {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>{icon}</Text>
      <Text style={styles.emptyText}>{message}</Text>
    </View>
  );
}

// Divider
export function Divider({ style }: { style?: ViewStyle }) {
  return <View style={[styles.divider, style]} />;
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  primaryBtn: {
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  primaryBtnText: {
    color: Colors.textDark,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  outlineBtn: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  outlineBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  statCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    borderLeftWidth: 4,
    flex: 1,
    minWidth: '45%',
    margin: 4,
  },
  statIcon: { fontSize: 24, marginBottom: 8 },
  statValue: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  statLabel: { fontSize: 11, color: Colors.textMuted, marginTop: 4, fontWeight: '500' },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 14, color: Colors.textMuted, textAlign: 'center', lineHeight: 20 },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 12,
  },
});
