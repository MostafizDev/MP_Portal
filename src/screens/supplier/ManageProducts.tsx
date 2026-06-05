import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, TextInput , SafeAreaView, Platform, StatusBar} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, Product } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { getProductsBySupplierId, deleteProduct } from '../../database/db';
import { Colors, EmptyState, PrimaryButton } from '../../components/UI';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function ManageProducts() {
  const { user } = useAuth();
  const navigation = useNavigation<Nav>();
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');

  const load = useCallback(() => { if (user) setProducts(getProductsBySupplierId(user.id)); }, [user]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = (p: Product) => {
    Alert.alert('Delete Product', `Remove "${p.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await deleteProduct(p.id); load(); } },
    ]);
  };

  const renderProduct = ({ item }: { item: Product }) => (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.cardMain}>
          <Text style={styles.productName}>{item.name}</Text>
          <Text style={styles.sku}>SKU: {item.sku}</Text>
          <Text style={styles.category}>📁 {item.category}</Text>
          {item.description ? <Text style={styles.desc} numberOfLines={2}>{item.description}</Text> : null}
        </View>
        <View style={styles.priceBox}>
          <Text style={styles.price}>${item.price.toFixed(2)}</Text>
          <Text style={styles.unit}>/{item.unit}</Text>
          <View style={[styles.stockBadge, item.stockQty < 10 ? styles.lowStock : styles.inStock]}>
            <Text style={styles.stockText}>Qty: {item.stockQty}</Text>
          </View>
        </View>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.editBtn} onPress={() => navigation.navigate('EditProduct', { product: item })}>
          <Text style={styles.editBtnText}>✏️ Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item)}>
          <Text style={styles.deleteBtnText}>🗑️ Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Product Catalog</Text>
        <PrimaryButton title="+ Add" onPress={() => navigation.navigate('CreateProduct')} style={styles.addBtn} />
      </View>
      <View style={styles.searchWrapper}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput style={styles.searchInput} placeholder="Search products…" placeholderTextColor={Colors.textMuted} value={search} onChangeText={setSearch} />
      </View>
      <Text style={styles.count}>{filtered.length} product(s)</Text>
      <FlatList data={filtered} keyExtractor={(i) => i.id} renderItem={renderProduct} contentContainerStyle={styles.list}
        ListEmptyComponent={<EmptyState icon="📦" message="No products yet. Tap '+ Add' to create one." />} showsVerticalScrollIndicator={false} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex:1,
    backgroundColor:Colors.bg,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0,
  },
  title:{fontSize:22,fontWeight:'800',color:Colors.textPrimary}, addBtn:{paddingVertical:10,paddingHorizontal:14},
  searchWrapper:{flexDirection:'row',alignItems:'center',backgroundColor:Colors.bgCard,marginHorizontal:20,marginBottom:10,borderRadius:12,borderWidth:1,borderColor:Colors.border,paddingHorizontal:14},
  searchIcon:{fontSize:16,marginRight:8}, searchInput:{flex:1,color:Colors.textPrimary,paddingVertical:12,fontSize:14},
  count:{fontSize:12,color:Colors.textMuted,paddingHorizontal:20,marginBottom:8}, list:{padding:20,paddingTop:0},
  card:{backgroundColor:Colors.bgCard,borderRadius:16,padding:16,borderWidth:1,borderColor:Colors.border,marginBottom:12,borderLeftWidth:4,borderLeftColor:Colors.primary},
  cardTop:{flexDirection:'row',marginBottom:12}, cardMain:{flex:1,paddingRight:12},
  productName:{fontSize:16,fontWeight:'700',color:Colors.textPrimary,marginBottom:4}, sku:{fontSize:11,color:Colors.primary,fontWeight:'600',marginBottom:2},
  category:{fontSize:12,color:Colors.textMuted,marginBottom:4}, desc:{fontSize:12,color:Colors.textSecondary,lineHeight:16},
  priceBox:{alignItems:'flex-end'}, price:{fontSize:20,fontWeight:'800',color:Colors.primary,letterSpacing:-0.5}, unit:{fontSize:11,color:Colors.textMuted},
  stockBadge:{borderRadius:8,paddingHorizontal:8,paddingVertical:4,marginTop:6}, inStock:{backgroundColor:Colors.successBg}, lowStock:{backgroundColor:Colors.warningBg},
  stockText:{fontSize:11,fontWeight:'700',color:Colors.textSecondary}, actions:{flexDirection:'row',gap:10},
  editBtn:{flex:1,backgroundColor:Colors.primaryBg,borderRadius:10,paddingVertical:10,alignItems:'center',borderWidth:1,borderColor:Colors.primary},
  editBtnText:{fontSize:13,fontWeight:'700',color:Colors.primary},
  deleteBtn:{flex:1,backgroundColor:Colors.dangerBg,borderRadius:10,paddingVertical:10,alignItems:'center',borderWidth:1,borderColor:Colors.danger},
  deleteBtnText:{fontSize:13,fontWeight:'700',color:Colors.danger},
});
