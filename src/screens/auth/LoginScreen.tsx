import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { Colors, PrimaryButton } from '../../components/UI';
import { StyledInput } from '../../components/StyledInput';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Login'>;
};

export default function LoginScreen(_: Props) {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ username?: string; password?: string }>({});

  const validate = () => {
    const e: typeof errors = {};
    if (!username.trim()) e.username = 'Username is required';
    if (!password.trim()) e.password = 'Password is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    const result = await login(username, password);
    setLoading(false);
    if (!result.success) {
      Alert.alert('Login Failed', result.error ?? 'Invalid credentials.');
    }
    // Navigation handled by root navigator watching auth state
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo / Hero */}
          <View style={styles.hero}>
            <View style={styles.logoBox}>
              <Text style={styles.logoIcon}>🏭</Text>
            </View>
            <Text style={styles.appName}>VendorLink</Text>
            <Text style={styles.tagline}>Procurement Portal</Text>
          </View>

          {/* Info Card */}
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Default Test Accounts</Text>

            {/* Supplier row */}
            <View style={styles.credRow}>
              <View style={[styles.roleChip, { borderColor: Colors.supplier }]}>
                <Text style={styles.roleIcon}>🏢</Text>
                <Text style={[styles.roleText, { color: Colors.supplier }]}>Supplier</Text>
              </View>
              <Text style={styles.credText}>
                <Text style={styles.cred}>admin</Text>
                {' / '}
                <Text style={styles.cred}>admin123</Text>
              </Text>
            </View>

            {/* Vendor row */}
            <View style={styles.credRow}>
              <View style={[styles.roleChip, { borderColor: Colors.vendor }]}>
                <Text style={styles.roleIcon}>🛒</Text>
                <Text style={[styles.roleText, { color: Colors.vendor }]}>Vendor</Text>
              </View>
              <Text style={styles.credText}>
                <Text style={styles.cred}>vendor1</Text>
                {' / '}
                <Text style={styles.cred}>vendor123</Text>
              </Text>
            </View>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <StyledInput
              label="Username"
              placeholder="Enter your username"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
              error={errors.username}
              leftIcon="👤"
            />
            <StyledInput
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              isPassword
              error={errors.password}
              leftIcon="🔒"
            />

            <PrimaryButton
              title="Sign In"
              onPress={handleLogin}
              loading={loading}
              style={styles.loginBtn}
            />
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              CS5450 Mobile Programming — Group 7
            </Text>
            <Text style={styles.footerText}>Vendor / Supplier Portal</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bg,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0,
  },
  scroll: {
    flexGrow: 1,
    padding: 24,
  },
  hero: {
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 32,
  },
  logoBox: {
    width: 88,
    height: 88,
    borderRadius: 24,
    backgroundColor: Colors.primaryBg,
    borderWidth: 2,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoIcon: { fontSize: 40 },
  appName: {
    fontSize: 36,
    fontWeight: '900',
    color: Colors.textPrimary,
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '600',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginTop: 4,
  },
  infoCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 24,
    alignItems: 'center',
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  roleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  credRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
    width: '100%',
  },
  credText: {
    fontSize: 13,
    color: Colors.textMuted,
    flex: 1,
  },
  roleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  roleIcon: { fontSize: 16 },
  roleText: { fontSize: 13, fontWeight: '700' },
  roleSep: { fontSize: 18, color: Colors.textMuted, fontWeight: '800' },
  infoHint: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  cred: { color: Colors.primary, fontWeight: '700' },
  form: {
    marginBottom: 24,
  },
  loginBtn: {
    marginTop: 8,
  },
  footer: {
    alignItems: 'center',
    marginTop: 'auto',
    paddingTop: 24,
  },
  footerText: {
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'center',
  },
});
