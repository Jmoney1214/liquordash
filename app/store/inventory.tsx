import { useState, useMemo, useCallback } from "react";
import {
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Switch,
  Alert,
} from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { PRODUCTS, CATEGORIES, Product, formatPrice, Category } from "@/lib/data";

interface InventoryItem {
  product: Product;
  inStock: boolean;
  stockQuantity: number;
  storePrice: number;
  expressAvailable: boolean;
  shippingAvailable: boolean;
}

function InventoryCard({
  item,
  onToggleStock,
  onUpdatePrice,
  onToggleExpress,
  onToggleShipping,
}: {
  item: InventoryItem;
  onToggleStock: () => void;
  onUpdatePrice: (price: number) => void;
  onToggleExpress: () => void;
  onToggleShipping: () => void;
}) {
  const colors = useColors();
  const [editing, setEditing] = useState(false);
  const [priceText, setPriceText] = useState(item.storePrice.toFixed(2));

  const handleSavePrice = () => {
    const p = parseFloat(priceText);
    if (!isNaN(p) && p > 0) {
      onUpdatePrice(p);
    }
    setEditing(false);
  };

  return (
    <View
      style={[
        styles.inventoryCard,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          opacity: item.inStock ? 1 : 0.6,
        },
      ]}
    >
      <View style={styles.cardTop}>
        <Image source={item.product.imageUrl} style={styles.productImage} contentFit="cover" />
        <View style={{ flex: 1 }}>
          <Text style={[styles.productName, { color: colors.foreground }]} numberOfLines={1}>
            {item.product.name}
          </Text>
          <Text style={[styles.productBrand, { color: colors.muted }]}>{item.product.brand}</Text>
          <Text style={[styles.productVolume, { color: colors.muted }]}>
            {item.product.volume} · {item.product.abv}
          </Text>
        </View>
        <View style={{ alignItems: "flex-end", gap: 4 }}>
          {editing ? (
            <View style={styles.priceEditRow}>
              <Text style={[styles.dollarSign, { color: colors.foreground }]}>$</Text>
              <TextInput
                value={priceText}
                onChangeText={setPriceText}
                keyboardType="numeric"
                style={[styles.priceInput, { color: colors.foreground, borderColor: colors.primary }]}
                autoFocus
                onBlur={handleSavePrice}
                returnKeyType="done"
                onSubmitEditing={handleSavePrice}
              />
            </View>
          ) : (
            <TouchableOpacity onPress={() => setEditing(true)} activeOpacity={0.6}>
              <Text style={[styles.price, { color: colors.foreground }]}>
                {formatPrice(item.storePrice)}
              </Text>
              <Text style={[styles.editHint, { color: colors.primary }]}>tap to edit</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Controls */}
      <View style={[styles.controlsRow, { borderTopColor: colors.border }]}>
        <View style={styles.controlItem}>
          <Text style={[styles.controlLabel, { color: colors.muted }]}>In Stock</Text>
          <Switch
            value={item.inStock}
            onValueChange={onToggleStock}
            trackColor={{ true: colors.success }}
          />
        </View>
        <View style={[styles.controlDivider, { backgroundColor: colors.border }]} />
        <View style={styles.controlItem}>
          <View style={styles.controlLabelRow}>
            <IconSymbol name="bolt.fill" size={12} color={colors.success} />
            <Text style={[styles.controlLabel, { color: colors.muted }]}>Express</Text>
          </View>
          <Switch
            value={item.expressAvailable}
            onValueChange={onToggleExpress}
            trackColor={{ true: colors.success }}
          />
        </View>
        <View style={[styles.controlDivider, { backgroundColor: colors.border }]} />
        <View style={styles.controlItem}>
          <View style={styles.controlLabelRow}>
            <IconSymbol name="shippingbox.fill" size={12} color={colors.primary} />
            <Text style={[styles.controlLabel, { color: colors.muted }]}>Ship</Text>
          </View>
          <Switch
            value={item.shippingAvailable}
            onValueChange={onToggleShipping}
            trackColor={{ true: colors.primary }}
          />
        </View>
      </View>

      {/* Stock Quantity */}
      {item.inStock && (
        <View style={[styles.stockRow, { borderTopColor: colors.border }]}>
          <Text style={[styles.stockLabel, { color: colors.muted }]}>Stock Qty:</Text>
          <Text style={[styles.stockValue, { color: colors.foreground }]}>{item.stockQuantity}</Text>
          {item.stockQuantity <= 5 && (
            <View style={[styles.lowStockBadge, { backgroundColor: "#FFF3E0" }]}>
              <Text style={{ fontSize: 10, color: "#E65100", fontWeight: "600" }}>Low Stock</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

export default function StoreInventoryScreen() {
  const colors = useColors();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Category | "all">("all");

  // Local inventory state
  const [inventory, setInventory] = useState<InventoryItem[]>(() =>
    PRODUCTS.map((p) => ({
      product: p,
      inStock: p.inStock,
      stockQuantity: Math.floor(Math.random() * 50) + 1,
      storePrice: p.price,
      expressAvailable: p.expressAvailable,
      shippingAvailable: p.shippingAvailable,
    }))
  );

  const filteredInventory = useMemo(() => {
    let items = inventory;
    if (selectedCategory !== "all") {
      items = items.filter((i) => i.product.category === selectedCategory);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      items = items.filter(
        (i) =>
          i.product.name.toLowerCase().includes(q) ||
          i.product.brand.toLowerCase().includes(q)
      );
    }
    return items;
  }, [inventory, selectedCategory, searchQuery]);

  const inStockCount = useMemo(() => inventory.filter((i) => i.inStock).length, [inventory]);
  const lowStockCount = useMemo(
    () => inventory.filter((i) => i.inStock && i.stockQuantity <= 5).length,
    [inventory]
  );

  const toggleStock = useCallback((productId: string) => {
    setInventory((prev) =>
      prev.map((i) => (i.product.id === productId ? { ...i, inStock: !i.inStock } : i))
    );
  }, []);

  const updatePrice = useCallback((productId: string, price: number) => {
    setInventory((prev) =>
      prev.map((i) => (i.product.id === productId ? { ...i, storePrice: price } : i))
    );
  }, []);

  const toggleExpress = useCallback((productId: string) => {
    setInventory((prev) =>
      prev.map((i) =>
        i.product.id === productId ? { ...i, expressAvailable: !i.expressAvailable } : i
      )
    );
  }, []);

  const toggleShipping = useCallback((productId: string) => {
    setInventory((prev) =>
      prev.map((i) =>
        i.product.id === productId ? { ...i, shippingAvailable: !i.shippingAvailable } : i
      )
    );
  }, []);

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.6}>
          <IconSymbol name="arrow.left" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Inventory</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.statValue, { color: colors.foreground }]}>{inventory.length}</Text>
          <Text style={[styles.statLabel, { color: colors.muted }]}>Total</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.statValue, { color: colors.success }]}>{inStockCount}</Text>
          <Text style={[styles.statLabel, { color: colors.muted }]}>In Stock</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.statValue, { color: "#E65100" }]}>{lowStockCount}</Text>
          <Text style={[styles.statLabel, { color: colors.muted }]}>Low Stock</Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <IconSymbol name="magnifyingglass" size={18} color={colors.muted} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search products..."
            placeholderTextColor={colors.muted}
            style={[styles.searchInput, { color: colors.foreground }]}
          />
        </View>
      </View>

      {/* Category Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryScroll}
      >
        <TouchableOpacity
          onPress={() => setSelectedCategory("all")}
          style={[
            styles.categoryChip,
            {
              backgroundColor: selectedCategory === "all" ? colors.primary : colors.surface,
              borderColor: selectedCategory === "all" ? colors.primary : colors.border,
            },
          ]}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.categoryChipText,
              { color: selectedCategory === "all" ? "#fff" : colors.foreground },
            ]}
          >
            All
          </Text>
        </TouchableOpacity>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            onPress={() => setSelectedCategory(cat.id)}
            style={[
              styles.categoryChip,
              {
                backgroundColor: selectedCategory === cat.id ? colors.primary : colors.surface,
                borderColor: selectedCategory === cat.id ? colors.primary : colors.border,
              },
            ]}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.categoryChipText,
                { color: selectedCategory === cat.id ? "#fff" : colors.foreground },
              ]}
            >
              {cat.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Inventory List */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}
      >
        <Text style={[styles.resultCount, { color: colors.muted }]}>
          {filteredInventory.length} products
        </Text>
        {filteredInventory.map((item) => (
          <InventoryCard
            key={item.product.id}
            item={item}
            onToggleStock={() => toggleStock(item.product.id)}
            onUpdatePrice={(p) => updatePrice(item.product.id, p)}
            onToggleExpress={() => toggleExpress(item.product.id)}
            onToggleShipping={() => toggleShipping(item.product.id)}
          />
        ))}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "800",
  },
  statLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    padding: 0,
  },
  categoryScroll: {
    paddingHorizontal: 16,
    gap: 8,
    paddingBottom: 8,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: "600",
  },
  resultCount: {
    fontSize: 12,
    marginBottom: 4,
  },
  inventoryCard: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
  },
  productImage: {
    width: 52,
    height: 52,
    borderRadius: 10,
  },
  productName: {
    fontSize: 14,
    fontWeight: "700",
  },
  productBrand: {
    fontSize: 12,
    marginTop: 1,
  },
  productVolume: {
    fontSize: 11,
    marginTop: 1,
  },
  price: {
    fontSize: 16,
    fontWeight: "700",
  },
  editHint: {
    fontSize: 10,
    textAlign: "right",
  },
  priceEditRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  dollarSign: {
    fontSize: 14,
    fontWeight: "600",
  },
  priceInput: {
    borderWidth: 1.5,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 14,
    fontWeight: "600",
    width: 70,
    textAlign: "right",
  },
  controlsRow: {
    flexDirection: "row",
    borderTopWidth: 0.5,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  controlItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },
  controlDivider: {
    width: 0.5,
    marginVertical: 4,
  },
  controlLabel: {
    fontSize: 11,
    fontWeight: "500",
  },
  controlLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  stockRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 0.5,
  },
  stockLabel: {
    fontSize: 12,
  },
  stockValue: {
    fontSize: 14,
    fontWeight: "700",
  },
  lowStockBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: "auto",
  },
});
