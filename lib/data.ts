// LiquorDash product data and types

export type DeliveryMode = "express" | "shipping";

export type Category =
  | "whiskey"
  | "vodka"
  | "tequila"
  | "rum"
  | "gin"
  | "red-wine"
  | "white-wine"
  | "champagne"
  | "beer"
  | "rtd"
  | "mixers"
  | "gift-sets";

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: Category;
  price: number;
  originalPrice?: number;
  volume: string;
  abv: string;
  rating: number;
  reviewCount: number;
  imageUrl: string;
  description: string;
  tastingNotes: string;
  pairings: string;
  expressAvailable: boolean;
  shippingAvailable: boolean;
  shippingDays: string;
  inStock: boolean;
  featured: boolean;
  premium: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
  isGift: boolean;
  giftMessage?: string;
  recipientName?: string;
  recipientAddress?: string;
}

export interface Order {
  id: string;
  items: CartItem[];
  status: OrderStatus;
  deliveryMode: DeliveryMode;
  total: number;
  subtotal: number;
  deliveryFee: number;
  serviceFee: number;
  tax: number;
  createdAt: string;
  estimatedDelivery: string;
  trackingNumber?: string;
  deliveryAddress: string;
}

export type OrderStatus =
  | "confirmed"
  | "preparing"
  | "out-for-delivery"
  | "shipped"
  | "in-transit"
  | "delivered"
  | "cancelled";

export interface CategoryInfo {
  id: Category;
  name: string;
  icon: string;
  color: string;
}

export const CATEGORIES: CategoryInfo[] = [
  { id: "whiskey", name: "Whiskey", icon: "🥃", color: "#8B4513" },
  { id: "vodka", name: "Vodka", icon: "🍸", color: "#87CEEB" },
  { id: "tequila", name: "Tequila", icon: "🌵", color: "#DAA520" },
  { id: "rum", name: "Rum", icon: "🏴‍☠️", color: "#CD853F" },
  { id: "gin", name: "Gin", icon: "🫒", color: "#2E8B57" },
  { id: "red-wine", name: "Red Wine", icon: "🍷", color: "#722F37" },
  { id: "white-wine", name: "White Wine", icon: "🥂", color: "#F5DEB3" },
  { id: "champagne", name: "Champagne", icon: "🍾", color: "#FFD700" },
  { id: "beer", name: "Beer & Cider", icon: "🍺", color: "#F4A460" },
  { id: "rtd", name: "Ready to Drink", icon: "🧉", color: "#FF6347" },
  { id: "mixers", name: "Mixers", icon: "🍋", color: "#32CD32" },
  { id: "gift-sets", name: "Gift Sets", icon: "🎁", color: "#C8553D" },
];

export const PRODUCTS: Product[] = [
  {
    id: "1",
    name: "Maker's Mark Bourbon",
    brand: "Maker's Mark",
    category: "whiskey",
    price: 29.99,
    volume: "750ml",
    abv: "45%",
    rating: 4.5,
    reviewCount: 1243,
    imageUrl: "https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=400",
    description: "A handcrafted Kentucky straight bourbon whisky made with soft red winter wheat for a one-of-a-kind, full-flavored bourbon that's easy to drink.",
    tastingNotes: "Caramel, vanilla, fruit and spice notes. Smooth and balanced finish.",
    pairings: "Dark chocolate, smoked meats, aged cheeses",
    expressAvailable: true,
    shippingAvailable: true,
    shippingDays: "2-3 days",
    inStock: true,
    featured: true,
    premium: false,
  },
  {
    id: "2",
    name: "The Macallan 18 Year",
    brand: "The Macallan",
    category: "whiskey",
    price: 349.99,
    volume: "750ml",
    abv: "43%",
    rating: 4.9,
    reviewCount: 876,
    imageUrl: "https://images.unsplash.com/photo-1527281400683-1aae777175f8?w=400",
    description: "Aged for a minimum of 18 years in hand-picked sherry seasoned oak casks. A benchmark single malt Scotch whisky.",
    tastingNotes: "Dried fruits, ginger, chocolate orange, cinnamon. Long, warm finish.",
    pairings: "Fine dark chocolate, Christmas cake, blue cheese",
    expressAvailable: false,
    shippingAvailable: true,
    shippingDays: "3-5 days",
    inStock: true,
    featured: true,
    premium: true,
  },
  {
    id: "3",
    name: "Grey Goose Vodka",
    brand: "Grey Goose",
    category: "vodka",
    price: 34.99,
    volume: "750ml",
    abv: "40%",
    rating: 4.3,
    reviewCount: 2156,
    imageUrl: "https://images.unsplash.com/photo-1613063050781-8e3bcbf0e1c3?w=400",
    description: "Crafted in France using the finest French wheat and natural spring water. Exceptionally smooth and versatile.",
    tastingNotes: "Clean, fresh with subtle citrus. Smooth, elegant finish.",
    pairings: "Caviar, smoked salmon, fresh oysters",
    expressAvailable: true,
    shippingAvailable: true,
    shippingDays: "2-3 days",
    inStock: true,
    featured: false,
    premium: false,
  },
  {
    id: "4",
    name: "Patrón Silver Tequila",
    brand: "Patrón",
    category: "tequila",
    price: 44.99,
    volume: "750ml",
    abv: "40%",
    rating: 4.6,
    reviewCount: 1587,
    imageUrl: "https://images.unsplash.com/photo-1516535794938-6063878f08cc?w=400",
    description: "Handcrafted from the finest 100% Weber Blue Agave. Crystal clear with a smooth, sweet finish.",
    tastingNotes: "Fresh agave, citrus, light pepper. Clean, smooth finish.",
    pairings: "Ceviche, grilled shrimp, lime-based desserts",
    expressAvailable: true,
    shippingAvailable: true,
    shippingDays: "2-3 days",
    inStock: true,
    featured: true,
    premium: false,
  },
  {
    id: "5",
    name: "Hendrick's Gin",
    brand: "Hendrick's",
    category: "gin",
    price: 36.99,
    volume: "750ml",
    abv: "44%",
    rating: 4.7,
    reviewCount: 1892,
    imageUrl: "https://images.unsplash.com/photo-1608885898957-a559228e4b62?w=400",
    description: "A delightfully infused gin distilled with rose and cucumber alongside other botanicals, creating a wonderfully refreshing spirit.",
    tastingNotes: "Cucumber, rose petal, citrus, juniper. Refreshing, balanced finish.",
    pairings: "Cucumber sandwiches, seafood, light salads",
    expressAvailable: true,
    shippingAvailable: true,
    shippingDays: "2-3 days",
    inStock: true,
    featured: false,
    premium: false,
  },
  {
    id: "6",
    name: "Dom Pérignon Vintage 2013",
    brand: "Dom Pérignon",
    category: "champagne",
    price: 249.99,
    volume: "750ml",
    abv: "12.5%",
    rating: 4.8,
    reviewCount: 654,
    imageUrl: "https://images.unsplash.com/photo-1594372365401-3b5ff14eaaed?w=400",
    description: "A prestigious vintage champagne with remarkable depth and complexity. The 2013 vintage showcases exceptional balance.",
    tastingNotes: "White flowers, stone fruit, almond, brioche. Elegant, persistent finish.",
    pairings: "Lobster, truffle dishes, aged Parmesan",
    expressAvailable: false,
    shippingAvailable: true,
    shippingDays: "3-5 days",
    inStock: true,
    featured: true,
    premium: true,
  },
  {
    id: "7",
    name: "Opus One 2019",
    brand: "Opus One",
    category: "red-wine",
    price: 399.99,
    volume: "750ml",
    abv: "14.5%",
    rating: 4.9,
    reviewCount: 432,
    imageUrl: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400",
    description: "A Napa Valley icon blending Cabernet Sauvignon with Merlot, Cabernet Franc, Petit Verdot, and Malbec. Exceptional depth and elegance.",
    tastingNotes: "Blackcurrant, violet, dark chocolate, cedar. Silky tannins, long finish.",
    pairings: "Prime rib, lamb chops, aged Gouda",
    expressAvailable: false,
    shippingAvailable: true,
    shippingDays: "3-5 days",
    inStock: true,
    featured: true,
    premium: true,
  },
  {
    id: "8",
    name: "Bacardi Superior Rum",
    brand: "Bacardi",
    category: "rum",
    price: 15.99,
    volume: "750ml",
    abv: "40%",
    rating: 4.0,
    reviewCount: 3421,
    imageUrl: "https://images.unsplash.com/photo-1598018553943-29ace5dc8a10?w=400",
    description: "The original white rum, perfect for cocktails. Light, crisp, and subtly sweet with notes of almond and vanilla.",
    tastingNotes: "Light, clean, almond, vanilla, tropical fruit. Smooth finish.",
    pairings: "Tropical fruits, coconut desserts, jerk chicken",
    expressAvailable: true,
    shippingAvailable: true,
    shippingDays: "2-3 days",
    inStock: true,
    featured: false,
    premium: false,
  },
  {
    id: "9",
    name: "Cloudy Bay Sauvignon Blanc",
    brand: "Cloudy Bay",
    category: "white-wine",
    price: 24.99,
    volume: "750ml",
    abv: "13.5%",
    rating: 4.4,
    reviewCount: 987,
    imageUrl: "https://images.unsplash.com/photo-1566995541428-f2246c17cda2?w=400",
    description: "An iconic New Zealand Sauvignon Blanc with vibrant citrus and tropical fruit flavors. Fresh and expressive.",
    tastingNotes: "Passionfruit, grapefruit, fresh herbs. Crisp, zesty finish.",
    pairings: "Goat cheese, grilled fish, asparagus",
    expressAvailable: true,
    shippingAvailable: true,
    shippingDays: "2-3 days",
    inStock: true,
    featured: false,
    premium: false,
  },
  {
    id: "10",
    name: "Guinness Draught 12-Pack",
    brand: "Guinness",
    category: "beer",
    price: 18.99,
    volume: "12x440ml",
    abv: "4.2%",
    rating: 4.6,
    reviewCount: 4532,
    imageUrl: "https://images.unsplash.com/photo-1608270586620-248524c67de9?w=400",
    description: "The iconic Irish stout with a velvety smooth texture and rich, creamy head. A perfect balance of bitter and sweet.",
    tastingNotes: "Roasted barley, coffee, chocolate, cream. Smooth, dry finish.",
    pairings: "Oysters, beef stew, chocolate cake",
    expressAvailable: true,
    shippingAvailable: false,
    shippingDays: "",
    inStock: true,
    featured: false,
    premium: false,
  },
  {
    id: "11",
    name: "High West Whiskey Gift Set",
    brand: "High West",
    category: "gift-sets",
    price: 79.99,
    volume: "750ml + 2 glasses",
    abv: "46%",
    rating: 4.7,
    reviewCount: 321,
    imageUrl: "https://images.unsplash.com/photo-1574015974293-817f0ebebb74?w=400",
    description: "A premium gift set featuring High West Double Rye whiskey with two crystal rocks glasses in an elegant presentation box.",
    tastingNotes: "Cinnamon, clove, mint, dark fruit. Bold, spicy finish.",
    pairings: "Charcuterie, dark chocolate, smoked nuts",
    expressAvailable: false,
    shippingAvailable: true,
    shippingDays: "3-5 days",
    inStock: true,
    featured: true,
    premium: true,
  },
  {
    id: "12",
    name: "White Claw Variety Pack",
    brand: "White Claw",
    category: "rtd",
    price: 16.99,
    volume: "12x355ml",
    abv: "5%",
    rating: 4.1,
    reviewCount: 2876,
    imageUrl: "https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=400",
    description: "A refreshing variety pack of hard seltzers in four flavors: Black Cherry, Mango, Natural Lime, and Raspberry.",
    tastingNotes: "Light, fruity, refreshing. Clean, crisp finish.",
    pairings: "BBQ, tacos, summer salads",
    expressAvailable: true,
    shippingAvailable: false,
    shippingDays: "",
    inStock: true,
    featured: false,
    premium: false,
  },
  {
    id: "13",
    name: "Clase Azul Reposado",
    brand: "Clase Azul",
    category: "tequila",
    price: 169.99,
    volume: "750ml",
    abv: "40%",
    rating: 4.8,
    reviewCount: 765,
    imageUrl: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400",
    description: "An ultra-premium reposado tequila aged for 8 months in American whiskey casks. Housed in a handcrafted ceramic decanter.",
    tastingNotes: "Vanilla, caramel, hazelnut, agave. Rich, smooth, lingering finish.",
    pairings: "Mole, grilled meats, crème brûlée",
    expressAvailable: false,
    shippingAvailable: true,
    shippingDays: "3-5 days",
    inStock: true,
    featured: true,
    premium: true,
  },
  {
    id: "14",
    name: "Fever-Tree Tonic Water 4-Pack",
    brand: "Fever-Tree",
    category: "mixers",
    price: 7.99,
    volume: "4x200ml",
    abv: "0%",
    rating: 4.5,
    reviewCount: 1654,
    imageUrl: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400",
    description: "Premium Indian tonic water made with the finest quinine from the Congo and natural spring water. The perfect mixer.",
    tastingNotes: "Subtle citrus, clean quinine bitterness. Refreshing, effervescent.",
    pairings: "Pairs perfectly with premium gins",
    expressAvailable: true,
    shippingAvailable: true,
    shippingDays: "2-3 days",
    inStock: true,
    featured: false,
    premium: false,
  },
  {
    id: "15",
    name: "Johnnie Walker Blue Label",
    brand: "Johnnie Walker",
    category: "whiskey",
    price: 229.99,
    volume: "750ml",
    abv: "40%",
    rating: 4.8,
    reviewCount: 1123,
    imageUrl: "https://images.unsplash.com/photo-1602081115068-1a4b00e9cb28?w=400",
    description: "The pinnacle of Johnnie Walker's blending expertise. A rare blend of Scotland's most exceptional whiskies.",
    tastingNotes: "Honey, dried fruit, dark chocolate, smoke. Velvety, lingering finish.",
    pairings: "Foie gras, truffle risotto, premium dark chocolate",
    expressAvailable: false,
    shippingAvailable: true,
    shippingDays: "3-5 days",
    inStock: true,
    featured: true,
    premium: true,
  },
  {
    id: "16",
    name: "Veuve Clicquot Yellow Label",
    brand: "Veuve Clicquot",
    category: "champagne",
    price: 59.99,
    volume: "750ml",
    abv: "12%",
    rating: 4.6,
    reviewCount: 2341,
    imageUrl: "https://images.unsplash.com/photo-1571613316887-6f8d5cbf7ef7?w=400",
    description: "An iconic champagne with a bold, toasty style. Full-bodied with a rich, creamy mousse and persistent bubbles.",
    tastingNotes: "Apple, brioche, vanilla, white pepper. Elegant, balanced finish.",
    pairings: "Sushi, soft cheeses, fruit tarts",
    expressAvailable: true,
    shippingAvailable: true,
    shippingDays: "2-3 days",
    inStock: true,
    featured: false,
    premium: false,
  },
];

// Helper functions
export function getProductsByCategory(category: Category): Product[] {
  return PRODUCTS.filter((p) => p.category === category);
}

export function getFeaturedProducts(): Product[] {
  return PRODUCTS.filter((p) => p.featured);
}

export function getPremiumProducts(): Product[] {
  return PRODUCTS.filter((p) => p.premium);
}

export function getExpressProducts(): Product[] {
  return PRODUCTS.filter((p) => p.expressAvailable && p.inStock);
}

export function getShippingProducts(): Product[] {
  return PRODUCTS.filter((p) => p.shippingAvailable && p.inStock);
}

export function searchProducts(query: string): Product[] {
  const q = query.toLowerCase();
  return PRODUCTS.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q)
  );
}

export function getProductById(id: string): Product | undefined {
  return PRODUCTS.find((p) => p.id === id);
}

export function formatPrice(price: number): string {
  return `$${price.toFixed(2)}`;
}

export function getStarDisplay(rating: number): string {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5 ? 1 : 0;
  return "★".repeat(full) + (half ? "½" : "") + "☆".repeat(5 - full - half);
}
