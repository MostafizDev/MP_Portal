import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, TextInput , SafeAreaView, Platform, StatusBar} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, User } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { getAllVendors, deleteVendor } from '../../database/db';
import { Colors, EmptyState, PrimaryButton } from '../../components/UI';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function ManageVendors() {
  const { user } = useAuth();
  const navigation = useNavigation<Nav>();
  const [vendors, setVendors] = useState<User[]>([]);
  const [search, setSearch] = useState('');

  const load = useCallback(() => {
    if (!user) return;
    setVendors(getAllVendors(user.id));
  }, [user]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const filtered = vendors.filter(
    (v) =>
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      v.username.toLowerCase().includes(search.toLowerCase()) ||
      v.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = (v: User) => {
    Alert.alert('Delete Vendor', `Remove "${v.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await deleteVendor(v.id); load(); } },
    ]);
  };

  const renderVendor = ({ item }: { item: User }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text></View>
        <View style={styles.cardInfo}>
          <Text style={styles.vendorName}>{item.name}</Text>
          <Text style={styles.vendorUsername}>@{item.username}</Text>
          {item.company ? <Text style={styles.vendorMeta}>🏢 {item.company}</Text> : null}
          <Text style={styles.vendorMeta}>📧 {item.email}</Text>
          {item.phone ? <Text style={styles.vendorMeta}>📱 {item.phone}</Text> : null}
        </View>
        <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item)}>
          <Text style={{ fontSize: 18 }}>🗑️</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.credBox}>
        <Text style={styles.credLabel}>Login Credentials</Text>
        <Text style={styles.credText}>User: <Text style={styles.credValue}>{item.username}</Text>{'  '}Pass: <Text style={styles.credValue}>{item.password}</Text></Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Vendor Accounts</Text>
        <PrimaryButton title="+ New" onPress={() => navigation.navigate('CreateVendor')} style={styles.addBtn} color={Colors.supplier} />
      </View>
      <View style={styles.searchWrapper}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput style={styles.searchInput} placeholder="Search vendors…" placeholderTextColor={Colors.textMuted} value={search} onChangeText={setSearch} />
      </View>
      <Text style={styles.count}>{filtered.length} vendor(s)</Text>
      <FlatList data={filtered} keyExtractor={(i) => i.id} renderItem={renderVendor} contentContainerStyle={styles.list}
        ListEmptyComponent={<EmptyState icon="👥" message="No vendors yet. Create one to get started." />} showsVerticalScrollIndicator={false} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bg,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  title: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary },
  addBtn: { paddingVertical: 10, paddingHorizontal: 16 },
  searchWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bgCard, marginHorizontal: 20, marginBottom: 10, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 14 },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, color: Colors.textPrimary, paddingVertical: 12, fontSize: 14 },
  count: { fontSize: 12, color: Colors.textMuted, paddingHorizontal: 20, marginBottom: 8 },
  list: { padding: 20, paddingTop: 0 },
  card: { backgroundColor: Colors.bgCard, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: Colors.border, marginBottom: 12, borderLeftWidth: 4, borderLeftColor: Colors.supplier },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.supplierBg, borderWidth: 2, borderColor: Colors.supplier, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  avatarText: { fontSize: 18, fontWeight: '800', color: Colors.supplier },
  cardInfo: { flex: 1, gap: 2 },
  vendorName: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  vendorUsername: { fontSize: 12, color: Colors.textMuted },
  vendorMeta: { fontSize: 12, color: Colors.textSecondary },
  deleteBtn: { padding: 6 },
  credBox: { backgroundColor: Colors.bg, borderRadius: 8, padding: 10, borderWidth: 1, borderColor: Colors.primaryBg },
  credLabel: { fontSize: 10, color: Colors.primary, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 4 },
  credText: { fontSize: 12, color: Colors.textMuted },
  credValue: { color: Colors.primary, fontWeight: '700' },
});
