import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert , SafeAreaView} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../types';
import { updateProduct } from '../../database/db';
import { Colors, PrimaryButton, OutlineButton } from '../../components/UI';
import { StyledInput } from '../../components/StyledInput';

type RouteType = RouteProp<RootStackParamList, 'EditProduct'>;
const CATEGORIES = ['Electronics','Office Supplies','Machinery','Raw Materials','Packaging','Food & Beverage','Chemicals','Furniture','Tools','Other'];
const UNITS = ['pcs','kg','g','L','mL','box','carton','pallet','m','set'];

export default function EditProduct() {
  const navigation = useNavigation();
  const { params } = useRoute<RouteType>();
  const prod = params.product;
  const [form, setForm] = useState({ name:prod.name, description:prod.description, price:String(prod.price), unit:prod.unit, stockQty:String(prod.stockQty), category:prod.category, sku:prod.sku });
  const [errors, setErrors] = useState<Record<string,string>>({});
  const [loading, setLoading] = useState(false);
  const set=(k:string,v:string)=>setForm(f=>({...f,[k]:v}));

  const validate=()=>{
    const e:Record<string,string>={};
    if(!form.name.trim())e.name='Required';
    if(!form.sku.trim())e.sku='Required';
    if(!form.price.trim()||isNaN(Number(form.price))||Number(form.price)<=0)e.price='Invalid price';
    if(!form.stockQty.trim()||isNaN(Number(form.stockQty))||Number(form.stockQty)<0)e.stockQty='Invalid qty';
    setErrors(e); return Object.keys(e).length===0;
  };

  const handleSave=async()=>{
    if(!validate())return;
    setLoading(true);
    try{
      await updateProduct({...prod,name:form.name.trim(),description:form.description.trim(),price:Number(form.price),unit:form.unit,stockQty:Number(form.stockQty),category:form.category,sku:form.sku.trim().toUpperCase()});
      Alert.alert('Updated ✅','Product saved.',[{text:'OK',onPress:()=>navigation.goBack()}]);
    }catch(e:any){Alert.alert('Error',e.message??'Update failed.');}
    finally{setLoading(false);}
  };

  const ChipSelector=({label,options,selected,onSelect}:any)=>(
    <View style={styles.chipSection}>
      <Text style={styles.chipLabel}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {options.map((o:string)=>(<View key={o} style={[styles.chip,selected===o&&styles.chipSelected]}><Text style={[styles.chipText,selected===o&&styles.chipTextSelected]} onPress={()=>onSelect(o)}>{o}</Text></View>))}
      </ScrollView>
    </View>
  );

  return(
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS==='ios'?'padding':'height'} style={{flex:1}}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.titleBox}><Text style={styles.icon}>✏️</Text><Text style={styles.title}>Edit Product</Text></View>
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Details</Text>
            <StyledInput label="Name *" value={form.name} onChangeText={v=>set('name',v)} error={errors.name} leftIcon="🏷️"/>
            <StyledInput label="SKU *" value={form.sku} onChangeText={v=>set('sku',v)} autoCapitalize="characters" error={errors.sku} leftIcon="🔢"/>
            <StyledInput label="Description" value={form.description} onChangeText={v=>set('description',v)} multiline numberOfLines={3} textAlignVertical="top" leftIcon="📝"/>
          </View>
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Pricing & Stock</Text>
            <View style={{flexDirection:'row'}}>
              <View style={{flex:1,marginRight:8}}><StyledInput label="Price ($) *" value={form.price} onChangeText={v=>set('price',v)} keyboardType="decimal-pad" error={errors.price} leftIcon="💲"/></View>
              <View style={{flex:1}}><StyledInput label="Stock Qty *" value={form.stockQty} onChangeText={v=>set('stockQty',v)} keyboardType="numeric" error={errors.stockQty} leftIcon="📊"/></View>
            </View>
            <ChipSelector label="Unit" options={UNITS} selected={form.unit} onSelect={(v:string)=>set('unit',v)}/>
          </View>
          <View style={styles.section}><ChipSelector label="Category" options={CATEGORIES} selected={form.category} onSelect={(v:string)=>set('category',v)}/></View>
          <PrimaryButton title="Save Changes" onPress={handleSave} loading={loading}/>
          <OutlineButton title="Cancel" onPress={()=>navigation.goBack()} style={{marginTop:10}} color={Colors.textMuted}/>
          <View style={{height:32}}/>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles=StyleSheet.create({
  safe:{flex:1,backgroundColor:Colors.bg},scroll:{padding:20},
  titleBox:{alignItems:'center',marginBottom:24,paddingTop:8},icon:{fontSize:40,marginBottom:12},title:{fontSize:22,fontWeight:'800',color:Colors.textPrimary},
  section:{backgroundColor:Colors.bgCard,borderRadius:16,padding:16,borderWidth:1,borderColor:Colors.border,marginBottom:16},
  sectionLabel:{fontSize:11,fontWeight:'700',color:Colors.primary,letterSpacing:1,textTransform:'uppercase',marginBottom:16},
  chipSection:{marginBottom:4},chipLabel:{fontSize:12,fontWeight:'600',color:Colors.textSecondary,letterSpacing:0.8,textTransform:'uppercase',marginBottom:10},
  chip:{backgroundColor:Colors.bg,borderRadius:20,borderWidth:1,borderColor:Colors.border,paddingHorizontal:14,paddingVertical:8,marginRight:8},
  chipSelected:{backgroundColor:Colors.primaryBg,borderColor:Colors.primary},
  chipText:{fontSize:13,color:Colors.textMuted,fontWeight:'500'},chipTextSelected:{color:Colors.primary,fontWeight:'700'},
});
