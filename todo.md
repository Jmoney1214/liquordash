# LiquorDash TODO

- [x] Set up theme colors (warm terracotta/amber palette)
- [x] Configure tab navigation (Home, Browse, Cart, Orders, Profile)
- [x] Add icon mappings for all tabs
- [x] Build Home screen with hero banner, delivery mode toggle, and product rows
- [x] Build Browse screen with category grid and search bar
- [x] Build Product List screen with filters and sorting
- [x] Build Product Detail screen with full product info and actions
- [x] Build Cart screen with grouped items and order summary
- [x] Build Checkout flow with address, payment, and age verification
- [x] Build Orders screen with active/past order tabs
- [x] Build Order Detail screen with status timeline and tracking
- [x] Build Profile screen with user info and settings menu
- [x] Build Age Verification modal/gate
- [x] Implement product data store (AsyncStorage-based)
- [x] Implement cart state management
- [x] Implement order state management
- [x] Implement search with autocomplete
- [x] Implement category filtering
- [x] Implement delivery mode toggle (Express vs Ship)
- [x] Implement gifting flow (gift message, recipient address)
- [x] Implement favorites/wishlist
- [x] Generate custom app logo
- [x] Update app.config.ts with branding
- [x] Write unit tests for data helpers

## Store Onboarding & Fulfillment System

- [x] Create store data models (StoreProfile, StoreInventory, StoreOrder, StoreApplication)
- [x] Build store context/state management for partner stores
- [x] Build multi-step store onboarding flow (business info, license, hours, delivery zones)
- [x] Build store application review/status screen
- [x] Build store dashboard home with key metrics (pending orders, revenue, ratings)
- [x] Build store order management (incoming orders, accept/reject, status updates)
- [x] Build store inventory management (add/edit/remove products, stock levels, pricing)
- [x] Build store settings screen (hours, delivery zones, payout info)
- [x] Build store profile screen (store info, photos, ratings)
- [x] Add store selector to customer home screen (nearby stores)
- [x] Integrate store assignment into customer order flow
- [x] Add store info to order detail/tracking screens
- [x] Add "Become a Partner" entry point from Profile screen
- [x] Build store switcher (customer mode vs store mode)

## Customer Portal

- [x] Create customer data models and context (profile, addresses, payment methods, rewards)
- [x] Build account/profile editing screen (name, email, phone, avatar)
- [x] Build saved addresses screen (add/edit/delete, set default, address form)
- [x] Build payment methods screen (add/edit/delete cards, set default)
- [x] Build detailed order history screen with filtering and reorder button
- [x] Build loyalty/rewards program screen (points balance, tier status, earn/redeem)
- [x] Build notification preferences screen (push, email, SMS toggles)
- [x] Build customer support/help center screen (FAQ, contact, chat)
- [x] Build reorder flow (quick reorder from past orders)
- [x] Integrate all customer portal screens into Profile tab navigation
- [x] Add customer portal icon mappings
- [x] Write unit tests for customer data models

## Driver/Courier Tracking Module

- [x] Create driver data models (DriverProfile, DeliveryJob, DriverEarnings, DriverLocation)
- [x] Build driver context/state management with simulated GPS tracking
- [x] Add driver-related icon mappings to icon-symbol.tsx
- [x] Build driver dashboard screen (available jobs, stats, online/offline toggle)
- [x] Build active delivery screen with step-by-step navigation and status updates
- [x] Build driver earnings screen (daily/weekly/monthly breakdown, payout history)
- [x] Build driver delivery history screen
- [x] Build driver profile/settings screen (vehicle info, documents, availability)
- [x] Build customer-facing live tracking map with driver location
- [x] Integrate live tracking into order detail screen
- [x] Add "Become a Driver" entry point from Profile screen
- [x] Add driver mode switcher (customer mode vs driver mode)
- [x] Integrate driver routes into app navigation
- [x] Write unit tests for driver data models

## Admin Dashboard

- [x] Create admin data models and context (platform stats, store applications, driver approvals, orders)
- [x] Build admin dashboard home with platform-wide KPIs and alerts
- [x] Build store application review screen (pending/approved/rejected, detail view, approve/reject actions)
- [x] Build platform order monitoring screen (all orders across stores, filters, status overview)
- [x] Build driver management screen (pending approvals, active drivers, suspend/approve actions)
- [x] Build user management screen (customer list, activity, account actions)
- [x] Build platform analytics screen (revenue charts, order trends, growth metrics)
- [x] Build platform settings screen (commission rates, delivery fees, promo management)
- [x] Add "Admin Panel" entry point from Profile screen
- [x] Integrate admin routes into app navigation
- [x] Write unit tests for admin data models

## PostgreSQL Backend Integration

- [x] Review server README and existing Drizzle/tRPC setup
- [x] Create Drizzle schema tables for products, categories, orders, order items, user profiles, addresses, and cart
- [x] Run db:push to create database tables
- [x] Build tRPC routers for products (list, getById, search, filter by category)
- [x] Build tRPC routers for orders (create, list, getById, update status)
- [x] Build tRPC routers for user profiles (get, update, addresses CRUD)
- [x] Build tRPC router for cart (sync cart to server)
- [x] Create seed script to populate products and categories
- [x] Update Home screen to fetch products from API
- [x] Update Browse screen to fetch and search from API
- [x] Update Product Detail screen to fetch from API
- [x] Update Cart to sync with server
- [x] Update Orders to persist to database
- [x] Update Customer Portal to use server data
- [x] Test full end-to-end database flow
- [x] Write integration tests for API endpoints

## WebSocket Real-Time Order Updates

- [x] Build WebSocket server with Express upgrade handler and room-based channels
- [x] Create event types for order status, driver location, store alerts, and admin notifications
- [x] Build client-side WebSocket hook with auto-reconnect and connection state management
- [x] Create real-time event context provider for app-wide event distribution
- [x] Integrate live order status updates into customer order detail/tracking screens
- [x] Integrate new order alerts into store dashboard with sound/haptic notification
- [x] Integrate delivery job updates into driver dashboard
- [x] Integrate platform-wide live feed into admin dashboard
- [x] Add connection status indicator to app UI
- [x] Write unit tests for WebSocket event types and message handling

## Push Notifications (Expo Notifications)

- [x] Read Expo Notifications docs and understand permission/token flow
- [x] Build notification service with permission request, token registration, and local scheduling
- [x] Build server-side push notification delivery via Expo Push API
- [x] Create notification channel configuration (order updates, promotions, driver alerts)
- [x] Integrate push notifications into order lifecycle (status changes trigger push)
- [x] Add push notification triggers for store new order alerts
- [x] Add push notification triggers for driver delivery requests
- [x] Add push notification triggers for admin alerts (new applications, high volume)
- [x] Build in-app notification center/inbox screen
- [x] Integrate notification deep linking (tap notification → navigate to relevant screen)
- [x] Connect with existing notification preferences from customer portal
- [x] Write unit tests for notification service

## Bug Fixes

- [x] Fix FlatList numColumns error on native: "Changing numColumns on the fly is not supported" — add key prop to FlatList when numColumns changes dynamically
- [x] Add loading animation to Browse screen while search results are being fetched
- [x] Add skeleton loading to Home screen horizontal product rows (Featured Picks, Express, Premium, etc.)
- [x] Add skeleton loading to Category detail screen for full consistency across the app
- [x] Add 200ms fade-in transition when skeletons resolve to real content (Browse, Home, Category screens)
- [x] Collect and store Uber Direct API credentials (Client ID, Client Secret, Customer ID)
- [x] Build server-side Uber Direct service (OAuth token management, quote, delivery, tracking)
- [x] Create tRPC routes for delivery quotes, creation, and status tracking
- [x] Integrate Uber Direct delivery quotes into checkout flow
- [x] Add Uber courier info card to order detail screen
- [x] Write tests for Uber Direct integration
- [x] Build Uber Direct webhook endpoint with signature verification
- [x] Handle all delivery status events (pickup, dropoff, cancelled, returned, etc.)
- [x] Propagate webhook events to clients via WebSocket for real-time order updates
- [x] Write tests for webhook event handling
- [x] Fix publish error: "no expo project found" — ensure app.json exists for the build system
- [x] Create reusable skill for Uber Direct API integration using skill-creator
- [x] Fix persistent publish error: "no expo project found" — deep investigation of build system project detection
- [x] Configure Uber Direct webhook URL in the Uber Direct dashboard for real-time delivery updates
- [ ] Test full Uber Direct sandbox delivery flow (auth, quote, create delivery, track status, verify webhooks)

## Lightspeed Retail R-Series Integration

- [x] Store Lightspeed API credentials (Client ID, Client Secret)
- [x] Build Lightspeed OAuth authorization flow (authorization code grant + refresh token)
- [x] Build server-side Lightspeed API service (token management, API helper)
- [x] Implement product catalog sync (pull products from Lightspeed into LiquorDash)
- [x] Implement inventory tracking (real-time stock levels from Lightspeed)
- [x] Implement order management (push orders from LiquorDash to Lightspeed)
- [x] Implement customer management (sync customer data with Lightspeed)
- [x] Create tRPC routes for Lightspeed operations
- [x] Build admin Lightspeed settings screen (connect account, sync status)
- [x] Write tests for Lightspeed API integration
- [x] Update Lightspeed credentials to new Client ID/Secret with employee:all scope
- [x] Fix Lightspeed OAuth endpoints (cloud.lightspeedapp.com / cloud.merchantos.com)
- [x] Fix TypeScript errors in admin/lightspeed.tsx
- [x] Add Lightspeed Quick Action to admin dashboard
- [x] Complete OAuth flow to get access/refresh tokens
- [x] Fix publish error: "no expo project found" — updated app.json with full config matching app.config.ts
- [x] Fix persistent "no expo project found" publish error — removed broken app.config.js bridge that crashed Node.js
- [x] CRITICAL: Delete app.config.ts, use only app.json for EAS Build compatibility
- [x] URGENT: Fix APK build failing at 1% and resetting
- [x] Verify app.config.ts is deleted and only app.json exists
- [x] Run expo-doctor to diagnose build issues
- [x] Clean up any interfering config files
- [x] Save clean checkpoint for successful build
- [x] URGENT: APK build still failing at 1% and resetting - root cause: git branch divergence
- [x] Run all 6 user-requested diagnostic checks
- [x] Identify and fix root cause of silent build failure - reset local main to origin/main
