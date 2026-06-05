import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, StyleSheet, ActivityIndicator } from 'react-native';

import { useAuth } from '../context/AuthContext';
import { Colors } from '../components/UI';
import { RootStackParamList } from '../types';

// Auth
import LoginScreen from '../screens/auth/LoginScreen';

// Supplier screens
import SupplierDashboard from '../screens/supplier/SupplierDashboard';
import ManageVendors from '../screens/supplier/ManageVendors';
import CreateVendor from '../screens/supplier/CreateVendor';
import ManageProducts from '../screens/supplier/ManageProducts';
import CreateProduct from '../screens/supplier/CreateProduct';
import EditProduct from '../screens/supplier/EditProduct';
import ManageOrders from '../screens/supplier/ManageOrders';
import ManageInvoices from '../screens/supplier/ManageInvoices';

// Vendor screens
import VendorDashboard from '../screens/vendor/VendorDashboard';
import BrowseProducts from '../screens/vendor/BrowseProducts';
import VendorOrders from '../screens/vendor/VendorOrders';
import VendorInvoices from '../screens/vendor/VendorInvoices';
import VendorOrderDetail from '../screens/vendor/VendorOrderDetail';
import VendorInvoiceDetail from '../screens/vendor/VendorInvoiceDetail';

// Shared screens
import OrderDetail from '../screens/shared/OrderDetail';
import InvoiceDetail from '../screens/shared/InvoiceDetail';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

// ─── Screen Options ───────────────────────────────────────────────────────────
const screenOptions = {
  headerStyle: { backgroundColor: Colors.bgCard },
  headerTintColor: Colors.textPrimary,
  headerTitleStyle: { fontWeight: '700' as const, fontSize: 16 },
  headerShadowVisible: false,
  contentStyle: { backgroundColor: Colors.bg },
};

// ─── Supplier Tab Navigator ───────────────────────────────────────────────────
function SupplierTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: Colors.supplier,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tab.Screen
        name="SupplierDashboard"
        component={SupplierDashboard}
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => <TabIcon icon="🏠" color={color} />,
        }}
      />
      <Tab.Screen
        name="ManageVendors"
        component={ManageVendors}
        options={{
          title: 'Vendors',
          tabBarIcon: ({ color }) => <TabIcon icon="👥" color={color} />,
        }}
      />
      <Tab.Screen
        name="ManageProducts"
        component={ManageProducts}
        options={{
          title: 'Products',
          tabBarIcon: ({ color }) => <TabIcon icon="📦" color={color} />,
        }}
      />
      <Tab.Screen
        name="ManageOrders"
        component={ManageOrders}
        options={{
          title: 'Orders',
          tabBarIcon: ({ color }) => <TabIcon icon="📋" color={color} />,
        }}
      />
      <Tab.Screen
        name="ManageInvoices"
        component={ManageInvoices}
        options={{
          title: 'Invoices',
          tabBarIcon: ({ color }) => <TabIcon icon="🧾" color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

// ─── Vendor Tab Navigator ─────────────────────────────────────────────────────
function VendorTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: Colors.vendor,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tab.Screen
        name="VendorDashboard"
        component={VendorDashboard}
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => <TabIcon icon="🏠" color={color} />,
        }}
      />
      <Tab.Screen
        name="BrowseProducts"
        component={BrowseProducts}
        options={{
          title: 'Browse',
          tabBarIcon: ({ color }) => <TabIcon icon="🛒" color={color} />,
        }}
      />
      <Tab.Screen
        name="VendorOrders"
        component={VendorOrders}
        options={{
          title: 'My Orders',
          tabBarIcon: ({ color }) => <TabIcon icon="📋" color={color} />,
        }}
      />
      <Tab.Screen
        name="VendorInvoices"
        component={VendorInvoices}
        options={{
          title: 'Invoices',
          tabBarIcon: ({ color }) => <TabIcon icon="🧾" color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

// ─── Tab Icon ─────────────────────────────────────────────────────────────────
function TabIcon({ icon, color }: { icon: string; color: string }) {
  return (
    <View style={styles.iconWrap}>
      <Text style={styles.iconText}>{icon}</Text>
    </View>
  );
}

// ─── Root Navigator ───────────────────────────────────────────────────────────
export default function AppNavigator() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingScreen}>
        <Text style={styles.loadingLogo}>🏭</Text>
        <Text style={styles.loadingTitle}>VendorLink</Text>
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 24 }} />
        <Text style={styles.loadingHint}>Connecting to database…</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={screenOptions}>
        {!user ? (
          // ── Unauthenticated ──
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
        ) : user.role === 'supplier' ? (
          // ── Supplier flow ──
          <>
            <Stack.Screen
              name="SupplierTabs"
              component={SupplierTabs}
              options={{ headerShown: false }}
            />
            <Stack.Screen name="CreateVendor" component={CreateVendor} options={{ title: 'Create Vendor' }} />
            <Stack.Screen name="CreateProduct" component={CreateProduct} options={{ title: 'Add Product' }} />
            <Stack.Screen name="EditProduct" component={EditProduct} options={{ title: 'Edit Product' }} />
            <Stack.Screen name="OrderDetail" component={OrderDetail} options={{ title: 'Order Detail' }} />
            <Stack.Screen name="InvoiceDetail" component={InvoiceDetail} options={{ title: 'Invoice Detail' }} />
          </>
        ) : (
          // ── Vendor flow ──
          <>
            <Stack.Screen
              name="VendorTabs"
              component={VendorTabs}
              options={{ headerShown: false }}
            />
            <Stack.Screen name="VendorOrderDetail" component={VendorOrderDetail} options={{ title: 'Order Detail' }} />
            <Stack.Screen name="VendorInvoiceDetail" component={VendorInvoiceDetail} options={{ title: 'Invoice Detail' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.bgCard,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 6,
    paddingBottom: 6,
    height: 64,
  },
  tabLabel: { fontSize: 10, fontWeight: '700', marginTop: 2 },
  iconWrap: { alignItems: 'center', justifyContent: 'center' },
  loadingScreen: {
    flex: 1,
    backgroundColor: Colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingLogo: { fontSize: 56 },
  loadingTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: Colors.textPrimary,
    marginTop: 12,
    letterSpacing: -1,
  },
  loadingHint: {
    marginTop: 12,
    fontSize: 13,
    color: Colors.textMuted,
  },
  iconText: { fontSize: 20 },
});
