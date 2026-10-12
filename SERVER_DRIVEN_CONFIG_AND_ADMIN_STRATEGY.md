# FataFat - Server-Driven Architecture & Admin Control Strategy
> **Production Readiness Guide for Mobile Apps (Food Delivery & Quick Commerce)**  
> *Objective: Eliminate frequent Google Play Store update cycles by controlling features, pricing, operations, and UI dynamically from the backend and admin panel.*

---

## 1. Executive Summary & The Problem Statement

Jab ek consumer app Google Play Store / Apple App Store par live hoti hai:
1. **App Review Latency**: Har naye release ko Google review mein 24–72 hours lagte hain.
2. **User Fragmentation**: 30%–50% users auto-update off rakhte hain aur purane versions par rehte hain.
3. **Operational Volatility**: Food delivery aur quick-commerce mein rain surge, festive discounts, delivery fee changes, ya partner downtime ghanto mein badalte hain.

**The Solution**: App ko **Server-Driven Architecture (SDUI) & Remote Config** par chalana taaki 90% business aur UI changes bina kisi Play Store update ke instantly live ho sakein.

```
                          ┌────────────────────────────────┐
                          │   FataFat Admin Dashboard      │
                          └───────────────┬────────────────┘
                                          │ Updates Config / Banners / Slabs
                                          ▼
                          ┌────────────────────────────────┐
                          │      MongoDB / Redis Cache     │
                          └───────────────┬────────────────┘
                                          │ Cached Responses (TTL 60s)
                                          ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                           Client App Lifecycle                           │
│                                                                          │
│   App Launch ──► GET /api/v1/config/bootstrap                            │
│                     │                                                    │
│                     ├─► Check minSupportedVersion ──► [Force Update Modal]
│                     ├─► Check isMaintenanceMode  ──► [Maintenance Screen]
│                     ├─► Hydrate Feature Flags    ──► [Enable/Disable Tabs]
│                     └─► Cache Delivery Slabs     ──► [Dynamic Pricing UI] │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Core Modules to Control via Server & Admin

---

### Module 1: App Lifecycle, Versioning & Kill-Switch (P0 - Critical)

App ko crashed states, deprecated APIs, aur urgent backend downtime se bachane ke liye single bootstrap payload:

#### Backend Payload (`GET /api/v1/config/bootstrap`)
```json
{
  "success": true,
  "data": {
    "versioning": {
      "latestVersion": "1.2.0",
      "minSupportedVersion": "1.0.0",
      "playStoreUrl": "market://details?id=com.fatafat.app",
      "forceUpdateMessage": "Humne naye features aur security improvements add kiye hain. Aage badhne ke liye kripya app update kijiye.",
      "softUpdateMessage": "Naya update available hai! Faster delivery experience ke liye update karein."
    },
    "maintenance": {
      "isUnderMaintenance": false,
      "message": "FataFat systems par scheduled maintenance chal rahi hai. Hum 30 minute mein wapas aayenge.",
      "estimatedEndTime": "2026-10-11T18:00:00Z"
    },
    "featureFlags": {
      "enableGrocery": true,
      "enableFood": true,
      "enableCOD": true,
      "enableWallet": false,
      "enableReferrals": false,
      "enableLiveRiderMap": true,
      "enableVoiceSearch": false
    }
  }
}
```

#### Admin Panel Controls:
- **Force Update Switch**: Minimum version set karne ka slider (jaise hi `1.1.0` set hoga, `1.0.x` wale users ko non-dismissible modal dikhega).
- **Maintenance Kill-Switch**: 1-click toggle to show maintenance illustration & lock checkout.

---

### Module 2: Dynamic Pricing, Surcharges & Financial Engine (P0 - Critical)

Pricing kabhi bhi client code mein hardcoded nahi honi chahiye.

#### Dynamic Calculations:
1. **Delivery Fee Calculation Engine:**
   - Base Distance: `3.0 km`
   - Base Price: `₹25.00`
   - Extra Charge: `₹8.00 / km` above base distance.
   - Night Delivery Charge: `₹15.00` (11:00 PM to 06:00 AM).
2. **Surge / Weather Pricing (Rain Surcharge):**
   - High demand / monsoon time par Admin panel se 1-click **Surge Toggle**:
   - `rainSurgeActive: true`
   - `rainSurgeFee: ₹20.00`
   - Cart mein automatic *"Rain surge applied to compensate delivery partners"* badge.
3. **Platform Fee & Packaging:**
   - Platform fee: `₹3.00` to `₹5.00` per order.
   - Minimum cart packaging fee: `₹5.00`.
4. **Free Delivery Threshold:**
   - Normal days: Orders above `₹299.00`.
   - Festival / Campaign: Dynamic update to `₹199.00` from Admin panel.
5. **Small Cart Surcharge:**
   - Order below `₹99.00` attracts extra `₹15.00` handling charge.

---

### Module 3: Server-Driven UI (Banners, Carousels & Layouts) (P1 - High)

Home screen aur grocery hub ka layout server response par render hona chahiye.

#### 1. Hero Carousels & Banners
- **Banner Object Attributes**:
  - `imageUrl`: CDN optimized webp image URL.
  - `actionType`: `'DEEP_LINK' | 'CATEGORY' | 'RESTAURANT' | 'EXTERNAL_URL' | 'COUPON'`
  - `actionValue`: E.g. `fatafat://restaurant/654c871` ya `category_dairy`
  - `startDate` & `endDate`: Auto-expire banners without manual removal.
  - `priorityRank`: Order of display (1, 2, 3...).

#### 2. Categories & Taxonomy ("What's on your mind?")
- Admin controls:
  - Add / edit / delete category items.
  - Display name, thumbnail image, badge text (`50% OFF`, `BESTSELLER`).
  - Drag-and-drop sort order.
  - Active toggle (`isActive`).

#### 3. Announcement Ticker / Marquee Bar
- Top banner on home screen:
  - Text: *"Deliveries might take 10-15 minutes extra due to heavy rainfall."*
  - Type: `'INFO' | 'WARNING' | 'PROMO'`
  - Dismissible: `boolean`

---

### Module 4: Ground Operations & Geo-Fencing (P1 - High)

Food delivery aur grocery ground reality par depend karti hai:

1. **Serviceable Pincodes & Geo-Polygons:**
   - Pincodes jahan delivery available hai.
   - Pincode non-serviceable hone par screen par *"Coming Soon to your locality"* dikhana.
2. **Emergency Kitchen / Dark Store Auto-Pause:**
   - Kitchen par heavy backlog hone par restaurant owner ya admin 30 mins ke liye "Pause New Orders" kar sake.
3. **Dynamic Buffer ETA:**
   - Traffic rush hours ya peak dinner hours (8 PM - 10 PM) mein automatic `+10 mins` ETA buffer add karna customer expectations set karne ke liye.
4. **Cash on Delivery (COD) Rules:**
   - Admin config: *"Disable COD for carts above ₹1,500"* taaki high-value fake order returns na hon.
   - User-level fraud flag: High-cancellation users ke liye COD auto-disable.

---

### Module 5: Payment Gateway Routing & Fallback (P1 - High)

Agar Razorpay ya bank servers mein outage ho:

```
[Customer Checkout] ──► Query Active Gateway Config ──► Razorpay (Primary)
                                                      ──► If DOWN ──► Switch to Cashfree / PhonePe instantly
```

- **Gateway Switcher**: Admin panel dropdown: `Razorpay`, `Cashfree`, `PhonePe`, `Paytm`.
- **Payment Method Toggles**:
  - `allowUPI: true`
  - `allowCards: true`
  - `allowNetBanking: true`
  - `allowCOD: true`

---

### Module 6: Support, Policies & Dynamic Content (P2 - Medium)

Play Store policies ke mutabik legal links aur customer support numbers hamesha update ho sakte hain:

- **Customer Care Coordinates:**
  - WhatsApp Support Direct Link (`https://wa.me/91XXXXXXXXXX`)
  - Toll-free / Phone Hotline
  - Support Email ID
- **Dynamic Policy Parameters:**
  - **Cancellation Window**: E.g. `cancellationWindowSeconds: 60`. Kal ko agar 120 seconds karna ho, toh bina app release ke ho sake.
  - Refund policy & FAQ contents fetched from backend via Markdown or JSON.

---

### Module 7: Over-The-Air (OTA) Updates via Expo EAS Update (Pro Tip)

Play Store par binary update (`.aab`) bheje bina TypeScript/JavaScript bug fixes deploy karna:

* **What is EAS Update?**
  - Expo EAS Update aapke JS bundle aur assets ko silently download kar leta hai jab app launch hoti hai.
* **Kab use karein?**
  - UI bug fixes, layout tweaks, styling corrections, API endpoint fixes, new screen workflows.
  - *Zero Google Play review delay — users get instant updates in under 2 minutes.*
* **Setup Command:**
  ```bash
  # Install EAS CLI
  npm install -g eas-cli
  
  # Configure EAS update in project
  eas update:configure
  
  # Publish instant update to production branch
  eas update --branch production --message "Fixed cart calculations and banner layout"
  ```

---

## 3. Database Schema Blueprint (MongoDB / Mongoose)

Backend mein ye collections add/verify karein:

### `AppConfig` Model
```typescript
interface IAppConfig {
  minSupportedVersion: string;
  latestVersion: string;
  isMaintenanceMode: boolean;
  maintenanceMessage?: string;
  
  pricing: {
    baseDeliveryDistanceKm: number;
    baseDeliveryFeePaise: number;
    extraKmChargePaise: number;
    freeDeliveryThresholdPaise: number;
    platformFeePaise: number;
    rainSurgeActive: boolean;
    rainSurgeFeePaise: number;
    nightDeliveryFeePaise: number;
    smallCartThresholdPaise: number;
    smallCartFeePaise: number;
  };
  
  featureFlags: {
    enableGrocery: boolean;
    enableFood: boolean;
    enableCOD: boolean;
    maxCodLimitPaise: number;
  };
  
  support: {
    whatsappNumber: string;
    helplinePhone: string;
    supportEmail: string;
    cancellationWindowSeconds: number;
  };
}
```

### `Banner` Model
```typescript
interface IBanner {
  title: string;
  imageUrl: string;
  actionType: 'DEEP_LINK' | 'RESTAURANT' | 'GROCERY_CATEGORY' | 'EXTERNAL';
  actionTarget: string;
  displayLocation: 'HOME_HERO' | 'GROCERY_HERO' | 'CART_PROMO';
  priorityOrder: number;
  isActive: boolean;
  startDate?: Date;
  endDate?: Date;
}
```

---

## 4. Priority Implementation Roadmap

| Priority | Milestone | Estimated Effort | Impact |
| :--- | :--- | :--- | :--- |
| **P0 (Must)** | `/config/bootstrap` API + Force Update & Maintenance Screen in Frontend | 1 Day | App crash protection, obsolescence prevention |
| **P0 (Must)** | Dynamic Delivery & Surge Pricing Engine (Admin toggle for Rain Surge) | 1 Day | Immediate profit protection during weather & demand spikes |
| **P1 (High)** | Dynamic Banners & Category Ordering in Admin Panel | 1.5 Days | Daily festive promotions without app builds |
| **P1 (High)** | EAS Update (OTA Hotfixes) Setup | 0.5 Day | Instant bug fixing in production (bypassing Google Play review) |
| **P2 (Normal)** | Support Contacts, FAQs & Cancellation Window Config | 0.5 Day | Operational flexibility & customer support ease |
