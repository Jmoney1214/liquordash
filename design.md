# LiquorDash — Mobile App Interface Design

## Brand Identity

**App Name:** LiquorDash
**Tagline:** "Premium spirits. Delivered your way."
**Concept:** A sleek, premium liquor marketplace that combines the speed of on-demand delivery with the breadth of nationwide shipping. The design language evokes a sophisticated cocktail lounge — dark tones, warm amber accents, and clean typography.

## Color Palette

| Token | Light Mode | Dark Mode | Usage |
|-------|-----------|-----------|-------|
| **primary** | `#C8553D` (warm terracotta) | `#E07A5F` (soft coral) | CTA buttons, active tabs, highlights |
| **background** | `#FAFAF8` (warm white) | `#121214` (near black) | Screen backgrounds |
| **surface** | `#F2F0EC` (warm gray) | `#1C1C1F` (dark surface) | Cards, elevated surfaces |
| **foreground** | `#1A1A1A` (rich black) | `#F5F5F3` (warm white) | Primary text |
| **muted** | `#8A8680` (warm gray) | `#9A9590` (warm gray) | Secondary text, labels |
| **border** | `#E5E2DC` (light warm) | `#2A2A2E` (dark border) | Dividers, card borders |
| **success** | `#2D9B4E` (green) | `#4ADE80` (bright green) | Delivery confirmed, in stock |
| **warning** | `#D4A017` (amber gold) | `#FBBF24` (gold) | Age verification, limited stock |
| **error** | `#D93025` (red) | `#F87171` (light red) | Errors, out of stock |
| **accent** | `#D4A017` (amber gold) | `#FBBF24` (gold) | Premium badges, ratings, gifting |

## Screen List & Layout

### 1. Home Screen (Tab: Home)
**Primary Content:** A curated discovery feed that surfaces deals, trending products, and personalized recommendations. The screen opens with a hero banner carousel showcasing featured collections (e.g., "Weekend Picks," "New Arrivals," "Gift-Worthy Bottles"). Below the banner, horizontal scrollable rows display categories like "Express Delivery," "Top Rated Spirits," "Wine Under $30," and "Premium Shipped Collection." Each row contains product cards with image, name, price, and a quick-add button. A persistent delivery mode toggle at the top lets users switch between "Express" (local, under 1 hour) and "Ship to Me" (nationwide).

**Layout:** Full-width hero carousel (200pt tall) → delivery mode pill toggle → horizontal category rows → promotional banner → trending products grid.

### 2. Browse / Categories Screen (Tab: Browse)
**Primary Content:** A grid of category tiles with icons and labels. Categories include: Whiskey, Vodka, Tequila, Rum, Gin, Wine (Red/White/Rosé/Sparkling), Beer & Cider, Champagne, Ready-to-Drink, Mixers & Non-Alcoholic, and Gift Sets. Tapping a category opens a filtered product list. A search bar at the top provides instant search with autocomplete suggestions.

**Layout:** Search bar (sticky top) → category grid (2 columns, large tiles with icons) → "Popular Brands" horizontal scroll → "Shop by Occasion" row (Party, Date Night, Gift, Celebration).

### 3. Product List Screen (Push from Browse)
**Primary Content:** A vertical list of products filtered by category, brand, or search query. Each product card shows: product image, name, brand, volume (ml), ABV%, price, rating stars, and availability badge ("Express Available" or "Ships in 2-3 days"). Filter chips at the top allow sorting by price, rating, type, and delivery method. A floating filter button opens a bottom sheet with advanced filters.

**Layout:** Filter chips (horizontal scroll) → product list (FlatList, card-style rows) → floating sort/filter FAB.

### 4. Product Detail Screen (Push from Product List/Home)
**Primary Content:** A full product page with a large hero image, product name, brand, volume, ABV%, price, and description. Below the image: delivery options (Express vs. Ship), quantity selector, "Add to Cart" button, and "Send as Gift" button. Further down: tasting notes, food pairings, customer reviews, and "You May Also Like" recommendations.

**Layout:** Hero image (full width, 300pt) → product info section → delivery option cards → action buttons → tabbed content (Details | Reviews | Pairings) → related products horizontal scroll.

### 5. Cart Screen (Tab: Cart)
**Primary Content:** A list of items in the cart, grouped by delivery method (Express items vs. Shipped items). Each item shows image, name, quantity stepper, price, and remove button. Below the items: order summary (subtotal, delivery fee, service fee, tax, total). A prominent "Checkout" button at the bottom. If the cart contains both Express and Shipped items, a notice explains they will be processed as separate orders.

**Layout:** Delivery method group headers → item cards with quantity steppers → promo code input → order summary card → checkout button (sticky bottom).

### 6. Checkout Screen (Push from Cart)
**Primary Content:** A step-by-step checkout flow. Step 1: Delivery address (with saved addresses and "Add New"). Step 2: Delivery time selection (for Express: "ASAP" or scheduled slots; for Shipping: estimated delivery date). Step 3: Payment method (saved cards, Apple Pay, Google Pay). Step 4: Age verification confirmation. Step 5: Order review and "Place Order" button.

**Layout:** Progress stepper at top → form sections → order summary sidebar → "Place Order" CTA (sticky bottom).

### 7. Orders Screen (Tab: Orders)
**Primary Content:** A list of past and active orders. Active orders show real-time status (Confirmed → Preparing → Out for Delivery → Delivered, or Confirmed → Shipped → In Transit → Delivered). Each order card shows: order number, date, items thumbnail strip, total, and status badge. Tapping an order opens the Order Detail screen.

**Layout:** Segmented control (Active | Past) → order cards list → empty state illustration if no orders.

### 8. Order Detail Screen (Push from Orders)
**Primary Content:** Full order details including: order status timeline (vertical stepper), delivery map (for Express orders showing driver location), tracking number (for shipped orders), items list, payment summary, and support contact button.

**Layout:** Status timeline → map/tracking section → items list → payment summary → "Need Help?" button.

### 9. Profile Screen (Tab: Profile)
**Primary Content:** User avatar, name, and membership status. Menu items: Saved Addresses, Payment Methods, Favorites/Wishlist, Age Verification Status, Notification Preferences, Order History, Gift Cards & Credits, Help & Support, Legal (Terms, Privacy), and Sign Out.

**Layout:** User info card → menu list (grouped sections) → app version footer.

### 10. Age Verification Screen (Modal)
**Primary Content:** A mandatory age gate that appears on first launch. Users must confirm they are 21+ by entering their date of birth. A secondary verification may be required at checkout via ID scan.

**Layout:** App logo → "Are you 21 or older?" prompt → date of birth picker → "Verify" button → legal disclaimer text.

## Key User Flows

### Flow 1: Browse and Order (Express Delivery)
User opens app → Home screen with Express mode active → Scrolls "Express Delivery" row → Taps a product → Product Detail screen → Selects quantity → Taps "Add to Cart" → Cart tab badge updates → Goes to Cart → Reviews items → Taps "Checkout" → Enters/selects delivery address → Selects "ASAP" delivery → Confirms payment → Confirms age verification → Places order → Order confirmation screen → Tracks delivery in real-time on Orders tab.

### Flow 2: Ship Premium Spirits
User opens app → Toggles to "Ship to Me" mode → Browses "Premium Collection" → Taps a rare whiskey → Product Detail shows "Ships in 2-3 business days" → Adds to cart → Checkout → Enters shipping address → Reviews estimated delivery → Confirms payment → Places order → Receives tracking number via push notification → Tracks shipment on Orders tab.

### Flow 3: Send as Gift
User finds a product → Taps "Send as Gift" → Gift options sheet slides up → Enters recipient name and address → Adds a personal message → Selects gift wrapping option → Adds to cart as gift → Checkout shows gift order → Confirms payment → Gift is shipped with personalized note.

### Flow 4: Search and Filter
User taps Browse tab → Types "bourbon" in search bar → Autocomplete shows suggestions → Selects "Bourbon Whiskey" category → Product list loads → Applies filter: Price $30-$60, Rating 4+, Express Available → Sorted by popularity → Scrolls and selects a product.

## Typography

| Element | Font | Size | Weight |
|---------|------|------|--------|
| Screen Title | System (SF Pro) | 28pt | Bold |
| Section Header | System | 20pt | Semibold |
| Product Name | System | 16pt | Semibold |
| Body Text | System | 14pt | Regular |
| Caption / Label | System | 12pt | Regular |
| Price | System | 18pt | Bold |
| Button Text | System | 16pt | Semibold |

## Component Patterns

**Product Card:** Rounded corners (12pt), subtle shadow, product image (square, top), name + brand below, price bottom-left, rating bottom-right, quick-add icon button.

**Delivery Mode Toggle:** Pill-shaped segmented control at top of Home screen. "Express" (lightning icon) and "Ship to Me" (package icon). Active segment uses primary color fill.

**Category Tile:** Large rounded square (2-column grid), icon centered, category name below, subtle gradient overlay on image.

**Order Status Badge:** Colored pill with icon. Green for delivered, amber for in transit, blue for processing, red for cancelled.

**Bottom Sheet:** Used for filters, gift options, and delivery time selection. Drag handle at top, scrollable content, action button at bottom.
