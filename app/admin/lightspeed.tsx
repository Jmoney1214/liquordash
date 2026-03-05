import { useState, useCallback } from "react";
import {
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  RefreshControl,
  TextInput,
  KeyboardAvoidingView,
} from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { trpc } from "@/lib/trpc";

// Use type assertion to access lightspeed routes (added dynamically)
const ls = (trpc as any).lightspeed;

// ─── Sub-components ──────────────────────────────────────────────────────────

function SectionHeader({ title, action, onAction }: {
  title: string; action?: string; onAction?: () => void;
}) {
  const colors = useColors();
  return (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{title}</Text>
      {action && onAction && (
        <TouchableOpacity onPress={onAction} activeOpacity={0.6}>
          <Text style={[styles.sectionAction, { color: colors.primary }]}>{action}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function StatCard({ label, value, icon, color }: {
  label: string; value: string | number; icon: any; color: string;
}) {
  const colors = useColors();
  return (
    <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[styles.statIcon, { backgroundColor: color + "15" }]}>
        <IconSymbol name={icon} size={18} color={color} />
      </View>
      <Text style={[styles.statValue, { color: colors.foreground }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.muted }]}>{label}</Text>
    </View>
  );
}

type LsProduct = { itemId: string; description: string; sku: string; upc: string; categoryName: string; categoryId: string; manufacturer: string | null; price: string; imageUrl: string | null; qoh: number; tags: string[]; createdAt: string; updatedAt: string };
type LsCustomer = { customerId: string; firstName: string; lastName: string; company: string; email: string | null; phone: string | null; address: any; createdAt: string };
type LsSale = { saleId: string; ticketNumber: string; completed: boolean; voided: boolean; total: string; totalDue: string; calcSubtotal: string; calcTax1: string; lineCount: number; customerId: string; employeeId: string; shopId: string; completeTime: string; createTime: string };
type LsLowStockItem = { itemId: string; description: string; sku: string; qoh: number };
type LsShop = { shopId: string; name: string; timeZone: string; address: any; phone: string | null };

function ProductRow({ item }: { item: LsProduct }) {
  const colors = useColors();
  return (
    <View style={[styles.productRow, { borderColor: colors.border }]}>
      {item.imageUrl ? (
        <Image source={{ uri: item.imageUrl }} style={styles.productImage} contentFit="cover" />
      ) : (
        <View style={[styles.productImagePlaceholder, { backgroundColor: colors.border }]}>
          <IconSymbol name="photo.fill" size={18} color={colors.muted} />
        </View>
      )}
      <View style={styles.productInfo}>
        <Text style={[styles.productName, { color: colors.foreground }]} numberOfLines={2}>
          {item.description}
        </Text>
        <Text style={[styles.productSku, { color: colors.muted }]}>
          SKU: {item.sku} {item.categoryName ? `• ${item.categoryName}` : ""}
        </Text>
      </View>
      <View style={styles.productRight}>
        <Text style={[styles.productPrice, { color: colors.foreground }]}>
          ${parseFloat(item.price || "0").toFixed(2)}
        </Text>
        <View style={[
          styles.stockBadge,
          { backgroundColor: item.qoh > 0 ? "#22C55E15" : "#EF444415" },
        ]}>
          <Text style={[
            styles.stockText,
            { color: item.qoh > 0 ? "#22C55E" : "#EF4444" },
          ]}>
            {item.qoh > 0 ? `${item.qoh} in stock` : "Out of stock"}
          </Text>
        </View>
      </View>
    </View>
  );
}

function CustomerRow({ customer }: { customer: LsCustomer }) {
  const colors = useColors();
  return (
    <View style={[styles.customerRow, { borderColor: colors.border }]}>
      <View style={[styles.customerAvatar, { backgroundColor: colors.primary + "15" }]}>
        <Text style={[styles.customerInitials, { color: colors.primary }]}>
          {(customer.firstName?.[0] ?? "").toUpperCase()}{(customer.lastName?.[0] ?? "").toUpperCase()}
        </Text>
      </View>
      <View style={styles.customerInfo}>
        <Text style={[styles.customerName, { color: colors.foreground }]}>
          {customer.firstName} {customer.lastName}
        </Text>
        {customer.email && (
          <Text style={[styles.customerDetail, { color: colors.muted }]}>{customer.email}</Text>
        )}
        {customer.phone && (
          <Text style={[styles.customerDetail, { color: colors.muted }]}>{customer.phone}</Text>
        )}
      </View>
    </View>
  );
}

function SaleRow({ sale }: { sale: LsSale }) {
  const colors = useColors();
  const statusColor = sale.completed ? "#22C55E" : sale.voided ? "#EF4444" : "#F59E0B";
  const statusLabel = sale.completed ? "Completed" : sale.voided ? "Voided" : "Open";

  return (
    <View style={[styles.saleRow, { borderColor: colors.border }]}>
      <View style={styles.saleLeft}>
        <Text style={[styles.saleTicket, { color: colors.foreground }]}>#{sale.ticketNumber}</Text>
        <Text style={[styles.saleDate, { color: colors.muted }]}>
          {sale.completeTime ? new Date(sale.completeTime).toLocaleDateString() : "In progress"}
        </Text>
      </View>
      <View style={styles.saleRight}>
        <Text style={[styles.saleTotal, { color: colors.foreground }]}>
          ${parseFloat(sale.total || "0").toFixed(2)}
        </Text>
        <View style={[styles.saleBadge, { backgroundColor: statusColor + "15" }]}>
          <Text style={[styles.saleStatus, { color: statusColor }]}>{statusLabel}</Text>
        </View>
      </View>
    </View>
  );
}

// ─── Tab Navigation ──────────────────────────────────────────────────────────

type TabId = "overview" | "products" | "customers" | "sales";

function TabBar({ activeTab, onTabChange }: {
  activeTab: TabId; onTabChange: (tab: TabId) => void;
}) {
  const colors = useColors();
  const tabs: { id: TabId; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "products", label: "Products" },
    { id: "customers", label: "Customers" },
    { id: "sales", label: "Sales" },
  ];

  return (
    <View style={[styles.tabBar, { borderColor: colors.border }]}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.id}
          onPress={() => onTabChange(tab.id)}
          style={[
            styles.tab,
            activeTab === tab.id && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
          ]}
          activeOpacity={0.6}
        >
          <Text
            style={[
              styles.tabLabel,
              { color: activeTab === tab.id ? colors.primary : colors.muted },
              activeTab === tab.id && { fontWeight: "700" },
            ]}
          >
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function LightspeedScreen() {
  const colors = useColors();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [syncing, setSyncing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualAccessToken, setManualAccessToken] = useState("");
  const [manualRefreshToken, setManualRefreshToken] = useState("");
  const [manualAccountId, setManualAccountId] = useState("");
  const [settingTokens, setSettingTokens] = useState(false);

  // Queries
  const statusQuery = ls.status.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  }) as any;

  const productsQuery = ls.products.list.useQuery(
    { limit: 50, offset: 0 },
    { enabled: statusQuery.data?.connected === true && activeTab === "products", retry: false }
  ) as any;

  const customersQuery = ls.customers.list.useQuery(
    { limit: 50, offset: 0 },
    { enabled: statusQuery.data?.connected === true && activeTab === "customers", retry: false }
  ) as any;

  const salesQuery = ls.sales.list.useQuery(
    { limit: 50, offset: 0, completed: true },
    { enabled: statusQuery.data?.connected === true && activeTab === "sales", retry: false }
  ) as any;

  const categoriesQuery = ls.categories.useQuery(undefined, {
    enabled: statusQuery.data?.connected === true && activeTab === "overview",
    retry: false,
  }) as any;

  const shopsQuery = ls.shops.useQuery(undefined, {
    enabled: statusQuery.data?.connected === true && activeTab === "overview",
    retry: false,
  }) as any;

  const lowStockQuery = ls.inventory.lowStock.useQuery(
    { threshold: 5 },
    { enabled: statusQuery.data?.connected === true && activeTab === "overview", retry: false }
  ) as any;

  // Mutations
  const syncMutation = ls.syncProducts.useMutation({
    onSuccess: (data: any) => {
      setSyncing(false);
      Alert.alert(
        "Sync Complete",
        `Synced ${data.synced} products to LiquorDash.\n${data.errors > 0 ? `${data.errors} errors occurred.` : "No errors."}`,
      );
    },
    onError: (err: any) => {
      setSyncing(false);
      Alert.alert("Sync Failed", err.message);
    },
  }) as any;

  const disconnectMutation = ls.disconnect.useMutation({
    onSuccess: () => {
      statusQuery.refetch();
      Alert.alert("Disconnected", "Lightspeed has been disconnected.");
    },
  }) as any;

  const setTokensMutation = ls.setTokens.useMutation({
    onSuccess: (data: any) => {
      setSettingTokens(false);
      setShowManualEntry(false);
      setManualAccessToken("");
      setManualRefreshToken("");
      setManualAccountId("");
      statusQuery.refetch();
      Alert.alert("Connected!", `Successfully connected to Lightspeed account: ${data.accountName} (ID: ${data.accountId})`);
    },
    onError: (err: any) => {
      setSettingTokens(false);
      Alert.alert("Connection Failed", err.message || "Failed to connect. Please check your tokens and try again.");
    },
  }) as any;

  const handleManualConnect = useCallback(() => {
    if (!manualAccessToken.trim() || !manualRefreshToken.trim() || !manualAccountId.trim()) {
      Alert.alert("Missing Fields", "Please fill in all three fields: Access Token, Refresh Token, and Account ID.");
      return;
    }
    setSettingTokens(true);
    setTokensMutation.mutate({
      accessToken: manualAccessToken.trim(),
      refreshToken: manualRefreshToken.trim(),
      accountId: manualAccountId.trim(),
    });
  }, [manualAccessToken, manualRefreshToken, manualAccountId, setTokensMutation]);

  const handleConnect = useCallback(() => {
    // Open the Lightspeed OAuth flow in the browser
    const apiUrl = Platform.OS === "web"
      ? "/api/lightspeed/auth"
      : `${process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000"}/api/lightspeed/auth`;

    Linking.openURL(apiUrl).catch(() => {
      Alert.alert("Error", "Could not open the authorization page.");
    });
  }, []);

  const handleSync = useCallback(() => {
    Alert.alert(
      "Sync Products",
      "This will import all products from Lightspeed into LiquorDash. Existing products will not be duplicated. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sync Now",
          onPress: () => {
            setSyncing(true);
            syncMutation.mutate();
          },
        },
      ],
    );
  }, [syncMutation]);

  const handleDisconnect = useCallback(() => {
    Alert.alert(
      "Disconnect Lightspeed",
      "Are you sure you want to disconnect your Lightspeed account?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Disconnect",
          style: "destructive",
          onPress: () => disconnectMutation.mutate(),
        },
      ],
    );
  }, [disconnectMutation]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await statusQuery.refetch();
    if (activeTab === "products") await productsQuery.refetch();
    if (activeTab === "customers") await customersQuery.refetch();
    if (activeTab === "sales") await salesQuery.refetch();
    if (activeTab === "overview") {
      await categoriesQuery.refetch();
      await shopsQuery.refetch();
      await lowStockQuery.refetch();
    }
    setRefreshing(false);
  }, [activeTab]);

  const isConnected = statusQuery.data?.connected === true;

  // ─── Not Connected State ───────────────────────────────────────────────────

  if (statusQuery.isLoading) {
    return (
      <ScreenContainer edges={["top", "left", "right"]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.6}>
            <IconSymbol name="arrow.left" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Lightspeed POS</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.muted }]}>Checking connection...</Text>
        </View>
      </ScreenContainer>
    );
  }

  if (!isConnected) {
    return (
      <ScreenContainer edges={["top", "left", "right"]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.6}>
            <IconSymbol name="arrow.left" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Lightspeed POS</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.centered}>
          <View style={[styles.connectIcon, { backgroundColor: "#FF6C0015" }]}>
            <IconSymbol name="arrow.triangle.2.circlepath" size={40} color="#FF6C00" />
          </View>
          <Text style={[styles.connectTitle, { color: colors.foreground }]}>
            Connect Lightspeed Retail
          </Text>
          <Text style={[styles.connectDesc, { color: colors.muted }]}>
            Link your Lightspeed R-Series POS to sync products, inventory, customers, and sales with LiquorDash.
          </Text>
          <TouchableOpacity
            onPress={handleConnect}
            style={[styles.connectBtn, { backgroundColor: "#FF6C00" }]}
            activeOpacity={0.8}
          >
            <IconSymbol name="arrow.triangle.2.circlepath" size={18} color="#fff" />
            <Text style={styles.connectBtnText}>Connect via OAuth</Text>
          </TouchableOpacity>

          <Text style={[styles.orDivider, { color: colors.muted }]}>— or —</Text>

          <TouchableOpacity
            onPress={() => setShowManualEntry(!showManualEntry)}
            style={[styles.manualBtn, { borderColor: "#FF6C00" }]}
            activeOpacity={0.8}
          >
            <IconSymbol name="doc.text.fill" size={18} color="#FF6C00" />
            <Text style={[styles.manualBtnText, { color: "#FF6C00" }]}>
              {showManualEntry ? "Hide Manual Entry" : "Enter Tokens Manually"}
            </Text>
          </TouchableOpacity>

          {showManualEntry && (
            <View style={[styles.manualEntryBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.manualLabel, { color: colors.foreground }]}>Access Token</Text>
              <TextInput
                style={[styles.manualInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
                value={manualAccessToken}
                onChangeText={setManualAccessToken}
                placeholder="Paste access_token from Postman"
                placeholderTextColor={colors.muted}
                autoCapitalize="none"
                autoCorrect={false}
                multiline
              />
              <Text style={[styles.manualLabel, { color: colors.foreground }]}>Refresh Token</Text>
              <TextInput
                style={[styles.manualInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
                value={manualRefreshToken}
                onChangeText={setManualRefreshToken}
                placeholder="Paste refresh_token from Postman"
                placeholderTextColor={colors.muted}
                autoCapitalize="none"
                autoCorrect={false}
                multiline
              />
              <Text style={[styles.manualLabel, { color: colors.foreground }]}>Account ID</Text>
              <TextInput
                style={[styles.manualInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
                value={manualAccountId}
                onChangeText={setManualAccountId}
                placeholder="Paste account_id from Postman"
                placeholderTextColor={colors.muted}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="number-pad"
              />
              <TouchableOpacity
                onPress={handleManualConnect}
                disabled={settingTokens}
                style={[styles.connectBtn, { backgroundColor: "#22C55E", marginTop: 12 }]}
                activeOpacity={0.8}
              >
                {settingTokens ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <IconSymbol name="checkmark.circle.fill" size={18} color="#fff" />
                )}
                <Text style={styles.connectBtnText}>
                  {settingTokens ? "Connecting..." : "Connect with Tokens"}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {statusQuery.data?.error && (
            <Text style={[styles.errorText, { color: colors.error }]}>
              {statusQuery.data.error}
            </Text>
          )}
        </View>
      </ScreenContainer>
    );
  }

  // ─── Connected State ───────────────────────────────────────────────────────

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.6}>
          <IconSymbol name="arrow.left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Lightspeed POS</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <View style={[styles.connectedDot, { backgroundColor: "#22C55E" }]} />
            <Text style={[styles.connectedText, { color: "#22C55E" }]}>
              Connected — {statusQuery.data?.accountName ?? statusQuery.data?.accountId}
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshBtn} activeOpacity={0.6}>
          <IconSymbol name="arrow.clockwise" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <TabBar activeTab={activeTab} onTabChange={setActiveTab} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* ─── Overview Tab ─────────────────────────────────────────── */}
        {activeTab === "overview" && (
          <>
            {/* Quick Stats */}
            <View style={styles.section}>
              <SectionHeader title="Quick Stats" />
              <View style={styles.statsRow}>
                <StatCard
                  label="Products"
                  value={productsQuery.data?.total ?? "—"}
                  icon="tray.full.fill"
                  color="#3B82F6"
                />
                <StatCard
                  label="Categories"
                  value={categoriesQuery.data?.length ?? "—"}
                  icon="list.bullet"
                  color="#8B5CF6"
                />
                <StatCard
                  label="Low Stock"
                  value={lowStockQuery.data?.length ?? "—"}
                  icon="exclamationmark.triangle.fill"
                  color="#F59E0B"
                />
              </View>
            </View>

            {/* Shops */}
            {shopsQuery.data && shopsQuery.data.length > 0 && (
              <View style={styles.section}>
                <SectionHeader title="Locations" />
                {shopsQuery.data.map((shop: LsShop) => (
                  <View
                    key={shop.shopId}
                    style={[styles.shopCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  >
                    <View style={[styles.shopIcon, { backgroundColor: colors.primary + "15" }]}>
                      <IconSymbol name="storefront.fill" size={20} color={colors.primary} />
                    </View>
                    <View style={styles.shopInfo}>
                      <Text style={[styles.shopName, { color: colors.foreground }]}>{shop.name}</Text>
                      {shop.address && (
                        <Text style={[styles.shopAddress, { color: colors.muted }]}>
                          {shop.address.address1}, {shop.address.city}, {shop.address.state} {shop.address.zip}
                        </Text>
                      )}
                      {shop.phone && (
                        <Text style={[styles.shopPhone, { color: colors.muted }]}>{shop.phone}</Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Low Stock Alerts */}
            {lowStockQuery.data && lowStockQuery.data.length > 0 && (
              <View style={styles.section}>
                <SectionHeader title="Low Stock Alerts" action="View All" onAction={() => setActiveTab("products")} />
                {lowStockQuery.data.slice(0, 5).map((item: LsLowStockItem) => (
                  <View
                    key={item.itemId}
                    style={[styles.lowStockRow, { borderColor: colors.border }]}
                  >
                    <View style={[styles.lowStockIcon, { backgroundColor: "#F59E0B15" }]}>
                      <IconSymbol name="exclamationmark.triangle.fill" size={16} color="#F59E0B" />
                    </View>
                    <View style={styles.lowStockInfo}>
                      <Text style={[styles.lowStockName, { color: colors.foreground }]} numberOfLines={1}>
                        {item.description}
                      </Text>
                      <Text style={[styles.lowStockSku, { color: colors.muted }]}>SKU: {item.sku}</Text>
                    </View>
                    <View style={[styles.lowStockBadge, { backgroundColor: "#EF444415" }]}>
                      <Text style={[styles.lowStockQty, { color: "#EF4444" }]}>{item.qoh} left</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Actions */}
            <View style={styles.section}>
              <SectionHeader title="Actions" />
              <TouchableOpacity
                onPress={handleSync}
                disabled={syncing}
                style={[styles.actionBtn, { backgroundColor: colors.primary }]}
                activeOpacity={0.8}
              >
                {syncing ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <IconSymbol name="arrow.triangle.2.circlepath" size={18} color="#fff" />
                )}
                <Text style={styles.actionBtnText}>
                  {syncing ? "Syncing Products..." : "Sync Products to LiquorDash"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleDisconnect}
                style={[styles.actionBtn, { backgroundColor: "#EF4444" + "10", marginTop: 10 }]}
                activeOpacity={0.8}
              >
                <IconSymbol name="power" size={18} color="#EF4444" />
                <Text style={[styles.actionBtnText, { color: "#EF4444" }]}>Disconnect Lightspeed</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* ─── Products Tab ─────────────────────────────────────────── */}
        {activeTab === "products" && (
          <View style={styles.section}>
            <SectionHeader
              title={`Products (${productsQuery.data?.total ?? 0})`}
              action="Sync All"
              onAction={handleSync}
            />
            {productsQuery.isLoading ? (
              <View style={styles.tabLoading}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            ) : productsQuery.data?.items.length === 0 ? (
              <View style={styles.emptyState}>
                <IconSymbol name="tray.full.fill" size={40} color={colors.muted} />
                <Text style={[styles.emptyText, { color: colors.muted }]}>No products found</Text>
              </View>
            ) : (
              productsQuery.data?.items.map((item: LsProduct) => (
                <ProductRow key={item.itemId} item={item} />
              ))
            )}
          </View>
        )}

        {/* ─── Customers Tab ───────────────────────────────────────── */}
        {activeTab === "customers" && (
          <View style={styles.section}>
            <SectionHeader title={`Customers (${customersQuery.data?.total ?? 0})`} />
            {customersQuery.isLoading ? (
              <View style={styles.tabLoading}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            ) : customersQuery.data?.customers.length === 0 ? (
              <View style={styles.emptyState}>
                <IconSymbol name="person.2.fill" size={40} color={colors.muted} />
                <Text style={[styles.emptyText, { color: colors.muted }]}>No customers found</Text>
              </View>
            ) : (
              customersQuery.data?.customers.map((customer: LsCustomer) => (
                <CustomerRow key={customer.customerId} customer={customer} />
              ))
            )}
          </View>
        )}

        {/* ─── Sales Tab ───────────────────────────────────────────── */}
        {activeTab === "sales" && (
          <View style={styles.section}>
            <SectionHeader title={`Recent Sales (${salesQuery.data?.total ?? 0})`} />
            {salesQuery.isLoading ? (
              <View style={styles.tabLoading}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            ) : salesQuery.data?.sales.length === 0 ? (
              <View style={styles.emptyState}>
                <IconSymbol name="bag.fill" size={40} color={colors.muted} />
                <Text style={[styles.emptyText, { color: colors.muted }]}>No sales found</Text>
              </View>
            ) : (
              salesQuery.data?.sales.map((sale: LsSale) => (
                <SaleRow key={sale.saleId} sale={sale} />
              ))
            )}
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 20, fontWeight: "800" },
  refreshBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  connectedDot: { width: 8, height: 8, borderRadius: 4 },
  connectedText: { fontSize: 12, fontWeight: "600" },

  // Centered / Loading
  centered: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 },
  loadingText: { marginTop: 12, fontSize: 14 },

  // Connect
  connectIcon: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center", marginBottom: 20 },
  connectTitle: { fontSize: 22, fontWeight: "800", marginBottom: 8, textAlign: "center" },
  connectDesc: { fontSize: 14, textAlign: "center", lineHeight: 20, marginBottom: 24 },
  connectBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  connectBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  errorText: { marginTop: 16, fontSize: 12, textAlign: "center" },
  orDivider: { marginVertical: 16, fontSize: 14, textAlign: "center" as const },
  manualBtn: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  manualBtnText: { fontSize: 16, fontWeight: "700" as const },
  manualEntryBox: {
    width: "100%" as const,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  manualLabel: { fontSize: 13, fontWeight: "600" as const, marginBottom: 6, marginTop: 12 },
  manualInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    minHeight: 44,
  },

  // Tabs
  tabBar: { flexDirection: "row", borderBottomWidth: 1, marginHorizontal: 16 },
  tab: { flex: 1, paddingVertical: 12, alignItems: "center" },
  tabLabel: { fontSize: 14, fontWeight: "600" },

  // Section
  section: { paddingHorizontal: 16, marginTop: 16 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: "700" },
  sectionAction: { fontSize: 14, fontWeight: "600" },

  // Stats
  statsRow: { flexDirection: "row", gap: 10 },
  statCard: { flex: 1, padding: 12, borderRadius: 12, borderWidth: 1, alignItems: "center" },
  statIcon: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", marginBottom: 6 },
  statValue: { fontSize: 18, fontWeight: "800" },
  statLabel: { fontSize: 11, marginTop: 2 },

  // Shop
  shopCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  shopIcon: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  shopInfo: { flex: 1 },
  shopName: { fontSize: 15, fontWeight: "700" },
  shopAddress: { fontSize: 12, marginTop: 2 },
  shopPhone: { fontSize: 12, marginTop: 1 },

  // Low Stock
  lowStockRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  lowStockIcon: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  lowStockInfo: { flex: 1 },
  lowStockName: { fontSize: 14, fontWeight: "600" },
  lowStockSku: { fontSize: 11, marginTop: 1 },
  lowStockBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  lowStockQty: { fontSize: 12, fontWeight: "700" },

  // Actions
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  actionBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },

  // Product
  productRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  productImage: { width: 48, height: 48, borderRadius: 8 },
  productImagePlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  productInfo: { flex: 1 },
  productName: { fontSize: 14, fontWeight: "600" },
  productSku: { fontSize: 11, marginTop: 2 },
  productRight: { alignItems: "flex-end" },
  productPrice: { fontSize: 14, fontWeight: "700" },
  stockBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginTop: 2 },
  stockText: { fontSize: 10, fontWeight: "600" },

  // Customer
  customerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  customerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  customerInitials: { fontSize: 16, fontWeight: "700" },
  customerInfo: { flex: 1 },
  customerName: { fontSize: 14, fontWeight: "600" },
  customerDetail: { fontSize: 12, marginTop: 1 },

  // Sale
  saleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  saleLeft: {},
  saleTicket: { fontSize: 14, fontWeight: "700" },
  saleDate: { fontSize: 11, marginTop: 2 },
  saleRight: { alignItems: "flex-end" },
  saleTotal: { fontSize: 14, fontWeight: "700" },
  saleBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginTop: 2 },
  saleStatus: { fontSize: 10, fontWeight: "600" },

  // Tab Loading / Empty
  tabLoading: { paddingVertical: 40, alignItems: "center" },
  emptyState: { paddingVertical: 40, alignItems: "center", gap: 8 },
  emptyText: { fontSize: 14 },
});
