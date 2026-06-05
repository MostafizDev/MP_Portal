import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert, Modal, ScrollView, KeyboardAvoidingView, Platform , SafeAreaView, StatusBar} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, Product } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { getAllProducts, createOrder, getUserById } from '../../database/db';
import { Colors, EmptyState, PrimaryButton, OutlineButton } from '../../components/UI';

type Nav = NativeStackNavigationProp<RootStackParamList>;
interface CartItem { product: Product; quantity: number; }
const TAX = 0.13;

export default function BrowseProducts() {
  const { user } = useAuth();
  const navigation = useNavigation<Nav>();
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [notes, setNotes] = useState('');
  const [placing, setPlacing] = useState(false);

  const load = useCallback(() => { setProducts(getAllProducts()); }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase())
  );

  const addToCart = (product: Product) => setCart(prev => {
    const ex = prev.find(c => c.product.id === product.id);
    if (ex) return prev.map(c => c.product.id === product.id ? { ...c, quantity: c.quantity + 1 } : c);
    return [...prev, { product, quantity: 1 }];
  });
  const updateQty = (id: string, qty: number) => { if (qty <= 0) setCart(p => p.filter(c => c.product.id !== id)); else setCart(p => p.map(c => c.product.id === id ? { ...c, quantity: qty } : c)); };
  const cartQty = (id: string) => cart.find(c => c.product.id === id)?.quantity ?? 0;
  const subtotal = cart.reduce((s, c) => s + c.product.price * c.quantity, 0);
  const tax = subtotal * TAX;
  const total = subtotal + tax;
  const totalItems = cart.reduce((s, c) => s + c.quantity, 0);

  const placeOrder = () => {
    if (!cart.length || !user) return;
    Alert.alert('Confirm Order', `Place order for $${total.toFixed(2)}?\n\nSupplier will review and accept/reject.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Place Order', onPress: async () => {
        setPlacing(true);
        try {
          const supplier = getUserById(user.createdBy ?? 'supplier-001');
          await createOrder({ vendorId: user.id, vendorName: user.name, supplierId: user.createdBy ?? 'supplier-001', supplierName: supplier?.name ?? 'Supplier', status: 'pending',
            items: cart.map(c => ({ id:'', orderId:'', productId: c.product.id, productName: c.product.name, productSku: c.product.sku, quantity: c.quantity, unitPrice: c.product.price, total: c.product.price * c.quantity })),
            subtotal, tax, totalAmount: total, notes: notes.trim() });
          setCart([]); setNotes(''); setShowCart(false);
          Alert.alert('Order Placed ✅', 'Your order is sent to the supplier for review.', [
            { text: 'View Orders', onPress: () => navigation.navigate('VendorOrders') }, { text: 'OK' }
          ]);
        } catch (e: any) { Alert.alert('Error', e.message ?? 'Could not place order.'); }
        finally { setPlacing(false); }
      }},
    ]);
  };

  const renderProduct = ({ item }: { item: Product }) => {
    const qty = cartQty(item.id);
    return (
      <View style={styles.productCard}>
        <View style={styles.productHeader}>
          <View style={styles.productMain}>
            <Text style={styles.productName}>{item.name}</Text>
            <Text style={styles.productSku}>SKU: {item.sku}</Text>
            <Text style={styles.productCategory}>📁 {item.category}</Text>
            {item.description ? <Text style={styles.productDesc} numberOfLines={2}>{item.description}</Text> : null}
          </View>
          <View style={styles.productRight}>
            <Text style={styles.productPrice}>${item.price.toFixed(2)}</Text>
            <Text style={styles.productUnit}>/{item.unit}</Text>
            {/* <Text style={styles.productStock}>Stock: {item.stockQty}</Text> */}
          </View>
        </View>
        {qty === 0 ? (
          <TouchableOpacity style={styles.addBtn} onPress={() => addToCart(item)}><Text style={styles.addBtnText}>+ Add to Order</Text></TouchableOpacity>
        ) : (
          <View style={styles.qtyRow}>
            <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQty(item.id, qty - 1)}><Text style={styles.qtyBtnText}>−</Text></TouchableOpacity>
            <View style={styles.qtyDisplay}><Text style={styles.qtyText}>{qty}</Text></View>
            <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQty(item.id, qty + 1)}><Text style={styles.qtyBtnText}>+</Text></TouchableOpacity>
            <Text style={styles.lineTotal}>${(item.price * qty).toFixed(2)}</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Product Catalog</Text>
        {cart.length > 0 && (
          <TouchableOpacity style={styles.cartBtn} onPress={() => setShowCart(true)}>
            <Text style={styles.cartBtnText}>🛒 {totalItems}</Text>
            <Text style={styles.cartTotal}>${total.toFixed(2)}</Text>
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.searchWrapper}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput style={styles.searchInput} placeholder="Search products…" placeholderTextColor={Colors.textMuted} value={search} onChangeText={setSearch} />
      </View>
      <Text style={styles.count}>{filtered.length} product(s) available</Text>
      <FlatList data={filtered} keyExtractor={i => i.id} renderItem={renderProduct} contentContainerStyle={styles.list}
        ListEmptyComponent={<EmptyState icon="📦" message="No products available yet." />} showsVerticalScrollIndicator={false} />

      <Modal visible={showCart} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalSafe}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={styles.modalScroll} keyboardShouldPersistTaps="handled">
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>My Order</Text>
                <TouchableOpacity onPress={() => setShowCart(false)}><Text style={styles.closeBtn}>✕</Text></TouchableOpacity>
              </View>
              {cart.map(c => (
                <View key={c.product.id} style={styles.cartItem}>
                  <View style={styles.cartItemMain}>
                    <Text style={styles.cartItemName}>{c.product.name}</Text>
                    <Text style={styles.cartItemSku}>SKU: {c.product.sku}</Text>
                    <Text style={styles.cartItemPrice}>${c.product.price.toFixed(2)}/{c.product.unit}</Text>
                  </View>
                  <View style={styles.cartItemRight}>
                    <View style={styles.qtyRow}>
                      <TouchableOpacity style={styles.qtyBtnSm} onPress={() => updateQty(c.product.id, c.quantity - 1)}><Text style={styles.qtyBtnText}>−</Text></TouchableOpacity>
                      <Text style={styles.qtyTextSm}>{c.quantity}</Text>
                      <TouchableOpacity style={styles.qtyBtnSm} onPress={() => updateQty(c.product.id, c.quantity + 1)}><Text style={styles.qtyBtnText}>+</Text></TouchableOpacity>
                    </View>
                    <Text style={styles.cartItemTotal}>${(c.product.price * c.quantity).toFixed(2)}</Text>
                    <TouchableOpacity onPress={() => updateQty(c.product.id, 0)}><Text style={styles.removeBtn}>Remove</Text></TouchableOpacity>
                  </View>
                </View>
              ))}
              <View style={styles.notesBox}>
                <Text style={styles.notesLabel}>Order Notes (Optional)</Text>
                <TextInput style={styles.notesInput} placeholder="Add special instructions…" placeholderTextColor={Colors.textMuted} value={notes} onChangeText={setNotes} multiline numberOfLines={3} textAlignVertical="top"/>
              </View>
              <View style={styles.totalsBox}>
                <View style={styles.totalRow}><Text style={styles.totalLabel}>Subtotal</Text><Text style={styles.totalVal}>${subtotal.toFixed(2)}</Text></View>
                <View style={styles.totalRow}><Text style={styles.totalLabel}>Tax (13% HST)</Text><Text style={styles.totalVal}>${tax.toFixed(2)}</Text></View>
                <View style={[styles.totalRow,styles.grandTotalRow]}><Text style={styles.grandLabel}>Total</Text><Text style={styles.grandVal}>${total.toFixed(2)}</Text></View>
              </View>
              <PrimaryButton title="Place Order" onPress={placeOrder} loading={placing} color={Colors.vendor}/>
              <OutlineButton title="Continue Shopping" onPress={() => setShowCart(false)} style={{ marginTop: 10 }} color={Colors.textMuted}/>
              <View style={{height:32}}/>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
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
  cartBtn:{backgroundColor:Colors.vendorBg,borderRadius:20,borderWidth:1.5,borderColor:Colors.vendor,paddingHorizontal:14,paddingVertical:8,alignItems:'center'},
  cartBtnText:{fontSize:14,fontWeight:'800',color:Colors.vendor}, cartTotal:{fontSize:11,color:Colors.vendor,fontWeight:'600'},
  searchWrapper:{flexDirection:'row',alignItems:'center',backgroundColor:Colors.bgCard,marginHorizontal:20,marginBottom:10,borderRadius:12,borderWidth:1,borderColor:Colors.border,paddingHorizontal:14},
  searchIcon:{fontSize:16,marginRight:8}, searchInput:{flex:1,color:Colors.textPrimary,paddingVertical:12,fontSize:14},
  count:{fontSize:12,color:Colors.textMuted,paddingHorizontal:20,marginBottom:8}, list:{padding:20,paddingTop:0},
  productCard:{backgroundColor:Colors.bgCard,borderRadius:16,padding:16,borderWidth:1,borderColor:Colors.border,marginBottom:12,borderLeftWidth:4,borderLeftColor:Colors.vendor},
  productHeader:{flexDirection:'row',marginBottom:12}, productMain:{flex:1,paddingRight:12},
  productName:{fontSize:16,fontWeight:'700',color:Colors.textPrimary,marginBottom:4}, productSku:{fontSize:11,color:Colors.primary,fontWeight:'600',marginBottom:2},
  productCategory:{fontSize:12,color:Colors.textMuted,marginBottom:4}, productDesc:{fontSize:12,color:Colors.textSecondary,lineHeight:16},
  productRight:{alignItems:'flex-end'}, productPrice:{fontSize:20,fontWeight:'800',color:Colors.vendor,letterSpacing:-0.5},
  productUnit:{fontSize:11,color:Colors.textMuted}, productStock:{fontSize:11,color:Colors.textMuted,marginTop:4},
  addBtn:{backgroundColor:Colors.vendorBg,borderRadius:10,paddingVertical:10,alignItems:'center',borderWidth:1,borderColor:Colors.vendor},
  addBtnText:{fontSize:13,fontWeight:'700',color:Colors.vendor},
  qtyRow:{flexDirection:'row',alignItems:'center',gap:8},
  qtyBtn:{width:36,height:36,borderRadius:18,backgroundColor:Colors.vendorBg,borderWidth:1,borderColor:Colors.vendor,alignItems:'center',justifyContent:'center'},
  qtyBtnSm:{width:30,height:30,borderRadius:15,backgroundColor:Colors.vendorBg,borderWidth:1,borderColor:Colors.vendor,alignItems:'center',justifyContent:'center'},
  qtyBtnText:{fontSize:18,fontWeight:'800',color:Colors.vendor},
  qtyDisplay:{backgroundColor:Colors.bg,borderRadius:8,paddingHorizontal:14,paddingVertical:6,borderWidth:1,borderColor:Colors.border},
  qtyText:{fontSize:16,fontWeight:'700',color:Colors.textPrimary}, qtyTextSm:{fontSize:15,fontWeight:'700',color:Colors.textPrimary,minWidth:28,textAlign:'center'},
  lineTotal:{fontSize:15,fontWeight:'800',color:Colors.primary,marginLeft:'auto'},
  modalSafe:{flex:1,backgroundColor:Colors.bg}, modalScroll:{padding:20},
  modalHeader:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:20},
  modalTitle:{fontSize:22,fontWeight:'800',color:Colors.textPrimary}, closeBtn:{fontSize:20,color:Colors.textMuted,padding:4},
  cartItem:{backgroundColor:Colors.bgCard,borderRadius:14,padding:14,borderWidth:1,borderColor:Colors.border,marginBottom:10,flexDirection:'row',justifyContent:'space-between',alignItems:'flex-start'},
  cartItemMain:{flex:1,paddingRight:12}, cartItemName:{fontSize:14,fontWeight:'700',color:Colors.textPrimary,marginBottom:2},
  cartItemSku:{fontSize:11,color:Colors.textMuted,marginBottom:4}, cartItemPrice:{fontSize:12,color:Colors.textSecondary},
  cartItemRight:{alignItems:'flex-end',gap:6}, cartItemTotal:{fontSize:16,fontWeight:'800',color:Colors.vendor},
  removeBtn:{fontSize:12,color:Colors.danger,fontWeight:'600'},
  notesBox:{backgroundColor:Colors.bgCard,borderRadius:14,padding:14,borderWidth:1,borderColor:Colors.border,marginVertical:14},
  notesLabel:{fontSize:12,fontWeight:'700',color:Colors.textSecondary,textTransform:'uppercase',letterSpacing:0.8,marginBottom:10},
  notesInput:{color:Colors.textPrimary,fontSize:14,minHeight:72,borderWidth:1,borderColor:Colors.border,borderRadius:10,padding:10,backgroundColor:Colors.bg},
  totalsBox:{backgroundColor:Colors.bgCard,borderRadius:14,padding:16,borderWidth:1,borderColor:Colors.border,marginBottom:16},
  totalRow:{flexDirection:'row',justifyContent:'space-between',paddingVertical:6,borderBottomWidth:1,borderBottomColor:Colors.borderLight},
  totalLabel:{fontSize:13,color:Colors.textMuted}, totalVal:{fontSize:13,color:Colors.textPrimary,fontWeight:'600'},
  grandTotalRow:{borderBottomWidth:0,paddingTop:10,marginTop:4},
  grandLabel:{fontSize:17,fontWeight:'700',color:Colors.textPrimary}, grandVal:{fontSize:24,fontWeight:'900',color:Colors.vendor,letterSpacing:-0.5},
});
