# 🚀 Ftafat Backend — Frontend Integration & API Testing Guide

> **Base URL:** `http://localhost:3000/api/v1`  
> **Socket Server:** `http://localhost:3000` (Socket.IO v4)  
> **Protocol:** JSON over HTTP/HTTPS + WebSockets  
> **All Monetary Values:** Stored in **Paise** (Integer: `₹1 = 100 paise`, e.g., `₹349.00` = `34900`).

---

## 🔑 Demo Test Credentials

| Role | Phone | Email | Password |
|---|---|---|---|
| **Customer** | `+919822233344` | `priya@example.com` | `Password@123` |
| **Restaurant Owner** | `+919876543210` | `rajesh@pizzaparadise.com` | `Password@123` |
| **Delivery Partner** | `+919811122233` | `amit.rider@ftafat.com` | `Password@123` |
| **Admin** | `+919999999999` | `admin@ftafat.com` | `Password@123` |

---

## 🛡️ Standard Response Format

### Success Response (`200 / 201`)
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

### Paginated Response
```json
{
  "success": true,
  "data": {
    "items": [ ... ],
    "meta": {
      "totalCount": 45,
      "totalPages": 3,
      "currentPage": 1,
      "perPage": 20,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

### Error Response (`400 / 401 / 403 / 404 / 409 / 422 / 500`)
```json
{
  "success": false,
  "code": "VALIDATION_ERROR",
  "message": "Validation failed",
  "errors": [
    { "field": "phone", "message": "Invalid phone number format" }
  ]
}
```

---

## 1. Authentication & Session Management (`/auth`)

### 1.1 Register
- **Endpoint:** `POST /auth/register`
- **Body:**
```json
{
  "name": "Aman Gupta",
  "phone": "+919876500000",
  "email": "aman@example.com",
  "password": "Password@123",
  "role": "customer" // "customer" | "restaurant_owner" | "delivery_partner"
}
```
- **Response (`201 Created`):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "660c1...",
      "name": "Aman Gupta",
      "phone": "+919876500000",
      "role": "customer"
    },
    "tokens": {
      "accessToken": "eyJhbGciOi...",
      "refreshToken": "eyJhbGciOi..."
    }
  }
}
```

### 1.2 Login with Password
- **Endpoint:** `POST /auth/login`
- **Body:**
```json
{
  "phone": "+919822233344",
  "password": "Password@123"
}
```

### 1.3 Send OTP (Passwordless Login / Verify)
- **Endpoint:** `POST /auth/send-otp`
- **Body:** `{ "phone": "+919822233344" }`
- **Response (`200 OK`):** `{ "success": true, "message": "OTP sent successfully" }`

### 1.4 Verify OTP
- **Endpoint:** `POST /auth/verify-otp`
- **Body:** `{ "phone": "+919822233344", "otp": "123456" }`

### 1.5 Refresh Token
- **Endpoint:** `POST /auth/refresh-token`
- **Body:** `{ "refreshToken": "eyJhbGciOi..." }`
- **Response (`200 OK`):** Returns new `accessToken` and rotated `refreshToken`.

---

## 2. User Profile & Addresses (`/users`)
*Requires Header:* `Authorization: Bearer <accessToken>`

### 2.1 Get Current User Profile
- **Endpoint:** `GET /users/me`

### 2.2 Update Profile
- **Endpoint:** `PATCH /users/me`
- **Body:** `{ "name": "Aman G.", "email": "aman.new@example.com" }`

### 2.3 Add Saved Delivery Address
- **Endpoint:** `POST /users/addresses`
- **Body:**
```json
{
  "street": "Flat 201, Lotus Towers",
  "city": "New Delhi",
  "state": "Delhi",
  "postalCode": "110001",
  "country": "India",
  "isDefault": true,
  "coordinates": [77.2195, 28.6328] // [longitude, latitude]
}
```

### 2.4 Delete Address
- **Endpoint:** `DELETE /users/addresses/:addressId`

---

## 3. Restaurants & Menus (`/restaurants`)

### 3.1 Get Nearby Restaurants (Discovery)
- **Endpoint:** `GET /restaurants?lat=28.6329&lng=77.2197&radius=10&cuisine=Italian&page=1&limit=20`
- **Response (`200 OK`):**
```json
{
  "success": true,
  "data": {
    "restaurants": [
      {
        "_id": "660c1...",
        "name": "Pizza Paradise",
        "cuisines": ["Italian", "Pizza"],
        "rating": { "average": 4.6, "count": 128 },
        "deliveryInfo": { "estimatedMinutes": 30, "deliveryFee": 4000 },
        "address": { "line1": "Block B, Connaught Place", "city": "New Delhi" }
      }
    ],
    "meta": { "totalCount": 1, "currentPage": 1 }
  }
}
```

### 3.2 Get Single Restaurant Details
- **Endpoint:** `GET /restaurants/:restaurantId`

### 3.3 Get Full Restaurant Menu (Categories + Items)
- **Endpoint:** `GET /restaurants/:restaurantId/menu`
- **Response (`200 OK`):**
```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "_id": "660c2...",
        "name": "Signature Pizzas",
        "items": [
          {
            "_id": "660c3...",
            "name": "Margherita Classica",
            "price": 34900,
            "isVeg": true,
            "isAvailable": true,
            "isBestseller": true
          }
        ]
      }
    ]
  }
}
```

---

## 4. Search (`/search`)

### 4.1 Search Restaurants (Text + Geo)
- **Endpoint:** `GET /search/restaurants?q=pizza&lat=28.6329&lng=77.2197`

### 4.2 Search Menu Items
- **Endpoint:** `GET /search/items?q=pepperoni`

---

## 5. Cart Management (`/cart`)
*Requires Header:* `Authorization: Bearer <accessToken>`

### 5.1 Get User's Cart
- **Endpoint:** `GET /cart`

### 5.2 Add Item to Cart
- **Endpoint:** `POST /cart/items`
- **Body:**
```json
{
  "restaurantId": "660c1...",
  "menuItemId": "660c3...",
  "quantity": 2
}
```

### 5.3 Update Item Quantity
- **Endpoint:** `PATCH /cart/items/:menuItemId`
- **Body:** `{ "quantity": 3 }`

### 5.4 Remove Item / Clear Cart
- **Remove item:** `DELETE /cart/items/:menuItemId`
- **Clear entire cart:** `DELETE /cart`

### 5.5 Apply Promo Coupon to Cart
- **Endpoint:** `POST /cart/apply-coupon`
- **Body:** `{ "couponCode": "WELCOME50" }`

---

## 6. Orders & Checkout (`/orders`)
*Requires Header:* `Authorization: Bearer <accessToken>`

### 6.1 Place Order (Checkout from Cart)
- **Endpoint:** `POST /orders`
- **Header:** `X-Idempotency-Key: <unique-uuid-v4>` *(Optional but recommended)*
- **Body:**
```json
{
  "restaurantId": "660c1...",
  "deliveryAddress": {
    "street": "Flat 402, Green Glen Apartments",
    "city": "New Delhi",
    "state": "Delhi",
    "postalCode": "110001",
    "coordinates": [77.2195, 28.6328]
  },
  "paymentMethod": "razorpay", // "razorpay" | "cod"
  "couponCode": "WELCOME50",
  "deliveryInstructions": "Please don't ring the doorbell, call on arrival."
}
```
- **Response (`201 Created`):**
```json
{
  "success": true,
  "data": {
    "order": {
      "_id": "660c5...",
      "orderStatus": "pending",
      "subtotal": 69800,
      "deliveryFee": 4000,
      "taxAmount": 3490,
      "discountAmount": 10000,
      "totalAmount": 67290
    },
    "payment": {
      "razorpayOrderId": "order_OD12345678",
      "amount": 67290,
      "currency": "INR"
    }
  }
}
```

### 6.2 Get Customer Order History
- **Endpoint:** `GET /orders/my?page=1&limit=10`

### 6.3 Get Order Details & Live Timeline
- **Endpoint:** `GET /orders/:orderId`

### 6.4 Update Order Status (Restaurant / Admin / Partner)
- **Endpoint:** `PATCH /orders/:orderId/status`
- **Allowed transitions:**  
  `pending` ➔ `confirmed` ➔ `preparing` ➔ `ready_for_pickup` ➔ `out_for_delivery` ➔ `delivered`
- **Body:** `{ "status": "preparing" }`

---

## 7. Payments (`/payments`)

### 7.1 Verify & Confirm Client Payment
- **Endpoint:** `POST /payments/confirm`
- **Body:**
```json
{
  "razorpayOrderId": "order_OD12345678",
  "razorpayPaymentId": "pay_PY12345678",
  "razorpaySignature": "4f5e6d7c8b9a..."
}
```

---

## 8. Delivery Partner & Live Tracking (`/delivery`)

### 8.1 Register Delivery Partner Profile
- **Endpoint:** `POST /delivery/register`
- **Body:**
```json
{
  "vehicle": {
    "type": "bike",
    "model": "Honda Splendor",
    "licenseNumber": "DL-01-AB-1234"
  }
}
```

### 8.2 Toggle Online / Offline Status
- **Endpoint:** `PATCH /delivery/toggle-online`
- **Body:** `{ "isOnline": true }`

### 8.3 Post Live Location Update (GPS Beacon)
- **Endpoint:** `POST /delivery/location`
- **Body:**
```json
{
  "latitude": 28.6325,
  "longitude": 77.2190,
  "orderId": "660c5..."
}
```

### 8.4 Update Delivery Order Status
- **Endpoint:** `PATCH /delivery/orders/:orderId/status`
- **Body:** `{ "status": "delivered" }` // "out_for_delivery" | "delivered"

---

## 9. Coupons & Reviews (`/coupons`, `/reviews`)

### 9.1 Validate Coupon
- **Endpoint:** `POST /coupons/validate`
- **Body:** `{ "code": "WELCOME50", "cartTotal": 35000 }`

### 9.2 Add Restaurant Review
- **Endpoint:** `POST /reviews`
- **Body:**
```json
{
  "restaurantId": "660c1...",
  "orderId": "660c5...",
  "rating": 5,
  "comment": "Hot and crispy pizza, delivered fast!"
}
```

---

## 10. Notifications (`/notifications`)

### 10.1 Get In-App Notifications Feed
- **Endpoint:** `GET /notifications?page=1&limit=20`

### 10.2 Register Device FCM Token
- **Endpoint:** `POST /notifications/fcm-token`
- **Body:** `{ "fcmToken": "eX_ample_FCM_Token_abc123" }`

### 10.3 Mark Notification Read
- **Single:** `PATCH /notifications/:id/read`
- **All:** `PATCH /notifications/read-all`

---

## 11. Support Ticketing (`/support`)

### 11.1 Create Support Ticket
- **Endpoint:** `POST /support`
- **Body:**
```json
{
  "subject": "Missing beverage item",
  "category": "order_issue",
  "orderId": "660c5...",
  "priority": "high",
  "message": "The cooler drink was not in the package."
}
```

### 11.2 Reply to Ticket
- **Endpoint:** `POST /support/:ticketId/reply`
- **Body:** `{ "text": "We are looking into this with the delivery partner." }`

---

## 12. Admin & Analytics (`/admin`, `/analytics`)
*Requires Admin or Owner Role*

- `GET /admin/dashboard`: Platform overview KPIs (Total Users, Active Orders, GMV, Riders Online)
- `GET /admin/users`: User search and role moderation
- `PATCH /admin/restaurants/:restaurantId/status`: Approve / suspend restaurant
- `GET /analytics/restaurants/:restaurantId?days=30`: Restaurant sales trends, top selling items, AOV

---

## ⚡ 13. Real-Time WebSockets (Socket.IO)

### Connect Handshake
```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', {
  auth: {
    token: `Bearer ${accessToken}`
  }
});
```

### Real-Time Order Tracking (Customer App)
```javascript
// 1. Subscribe to order tracking room
socket.emit('order:subscribe', orderId);

// 2. Listen for status changes (Confirmed, Preparing, Out for Delivery, Delivered)
socket.on('order:status_changed', (data) => {
  console.log('Order status updated:', data.status, data.timestamp);
});

// 3. Listen for rider's live GPS movement
socket.on('delivery:location_update', ({ lat, lng, timestamp }) => {
  updateMapRiderMarker(lat, lng);
});

// 4. Clean up on screen unmount
socket.emit('order:unsubscribe', orderId);
```

### Live Location Broadcast (Delivery Partner App)
```javascript
// Emit GPS coords every 5-10 seconds while on an active delivery
socket.emit('delivery:location_update', {
  orderId: activeOrderId,
  lat: currentLatitude,
  lng: currentLongitude
});
```
