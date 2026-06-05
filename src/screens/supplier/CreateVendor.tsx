import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert , SafeAreaView} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { createVendor } from '../../database/db';
import { Colors, PrimaryButton, OutlineButton } from '../../components/UI';
import { StyledInput } from '../../components/StyledInput';

export default function CreateVendor() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [form, setForm] = useState({ name: '', username: '', password: '', email: '', phone: '', company: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Required';
    if (!form.username.trim()) e.username = 'Required';
    else if (form.username.includes(' ')) e.username = 'No spaces allowed';
    if (!form.password.trim()) e.password = 'Required';
    else if (form.password.length < 4) e.password = 'Min 4 characters';
    if (!form.email.trim()) e.email = 'Required';
    else if (!form.email.includes('@')) e.email = 'Invalid email';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleCreate = async () => {
    if (!validate() || !user) return;
    setLoading(true);
    try {
      await createVendor({ username: form.username.trim().toLowerCase(), password: form.password.trim(), role: 'vendor', name: form.name.trim(), email: form.email.trim().toLowerCase(), phone: form.phone.trim(), company: form.company.trim(), createdBy: user.id });
      Alert.alert('Vendor Created ✅', `"${form.name}" can now log in.\nUsername: ${form.username}\nPassword: ${form.password}`, [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Username may already exist.');
    } finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.titleBox}>
            <Text style={styles.icon}>👤</Text>
            <Text style={styles.title}>Create Vendor Account</Text>
            <Text style={styles.subtitle}>The vendor uses these credentials to log in.</Text>
          </View>
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Personal Info</Text>
            <StyledInput label="Full Name *" placeholder="e.g. John Smith" value={form.name} onChangeText={(v) => set('name', v)} error={errors.name} leftIcon="🙍" />
            <StyledInput label="Company" placeholder="e.g. Smith Trading Co." value={form.company} onChangeText={(v) => set('company', v)} leftIcon="🏢" />
            <StyledInput label="Email *" placeholder="vendor@example.com" value={form.email} onChangeText={(v) => set('email', v)} keyboardType="email-address" autoCapitalize="none" error={errors.email} leftIcon="📧" />
            <StyledInput label="Phone" placeholder="e.g. 555-1234" value={form.phone} onChangeText={(v) => set('phone', v)} keyboardType="phone-pad" leftIcon="📱" />
          </View>
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Login Credentials</Text>
            <StyledInput label="Username *" placeholder="e.g. johnsmith" value={form.username} onChangeText={(v) => set('username', v)} autoCapitalize="none" autoCorrect={false} error={errors.username} leftIcon="🔑" />
            <StyledInput label="Password *" placeholder="Minimum 4 characters" value={form.password} onChangeText={(v) => set('password', v)} isPassword error={errors.password} leftIcon="🔒" />
          </View>
          <PrimaryButton title="Create Vendor Account" onPress={handleCreate} loading={loading} color={Colors.supplier} />
          <OutlineButton title="Cancel" onPress={() => navigation.goBack()} style={{ marginTop: 10 }} color={Colors.textMuted} />
          <View style={{ height: 32 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  scroll: { padding: 20 },
  titleBox: { alignItems: 'center', marginBottom: 24, paddingTop: 8 },
  icon: { fontSize: 40, marginBottom: 12 },
  title: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary },
  subtitle: { fontSize: 13, color: Colors.textMuted, textAlign: 'center', marginTop: 6 },
  section: { backgroundColor: Colors.bgCard, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: Colors.border, marginBottom: 16 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: Colors.supplier, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 16 },
});
