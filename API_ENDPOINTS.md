# API Endpoints Documentation

## Base URL

```
http://localhost:8000/api
```

---

## 🔐 Authentication Routes (`/api/auth`)

### Public Routes

#### Register Customer

```http
POST /api/auth/register/customer
```

**Body:**

```json
{
  "email": "customer@example.com",
  "password": "password123",
  "address": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "country": "USA"
  },
  "profileImage": "https://example.com/image.jpg"
}
```

**Response:** Returns token (auto-approved, instant access)

---

#### Register Artist

```http
POST /api/auth/register/artist
```

**Body:**

```json
{
  "email": "artist@example.com",
  "password": "password123",
  "bio": "Professional photographer",
  "category": "category_id_here",
  "skills": ["photography", "editing"],
  "hourlyRate": 50,
  "availability": {},
  "profileImage": "https://example.com/image.jpg"
}
```

**Response:** Returns pending status (requires admin approval)

---

#### Login

```http
POST /api/auth/login
```

**Body:**

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Note:** Artists can only login if their status is "approved"

---

### Protected Routes (Requires Authentication)

#### Get Current User

```http
GET /api/auth/me
```

**Headers:** `Authorization: Bearer <token>`

---

#### Logout

```http
POST /api/auth/logout
```

**Headers:** `Authorization: Bearer <token>`

---

## 👥 Customers Routes (`/api/customers`)

All routes require `customer` role authentication.

#### Get Profile

```http
GET /api/customers/profile
```

#### Update Profile

```http
PUT /api/customers/profile
```

**Body:**

```json
{
  "address": {...},
  "profileImage": "https://example.com/image.jpg"
}
```

#### Get Bookings

```http
GET /api/customers/bookings
```

**Query Params:** `search`, `status`, `paymentStatus`, `artist`, `category`, `startDate`, `endDate`, `minAmount`, `maxAmount`, `page`, `limit`, `sortBy`, `sortOrder`

#### Get Reviews

```http
GET /api/customers/reviews
```

**Query Params:** `search`, `artist`, `minRating`, `maxRating`, `startDate`, `endDate`, `page`, `limit`, `sortBy`, `sortOrder`

---

## 🎨 Artists Routes (`/api/artists`)

### Public Routes (No Authentication Required)

#### Get All Artists

```http
GET /api/artists
```

**Query Params:** `category`, `search`, `page`, `limit`
**Returns:** Only approved artists

#### Get Artist by ID

```http
GET /api/artists/:id
```

**Returns:** Approved artist details

---

### Protected Routes

#### Get Pending Artists (Admin Only)

```http
GET /api/artists/pending
```

**Query Params:** `search`, `status`, `category`, `page`, `limit`, `sortBy`, `sortOrder`

#### Approve Artist (Admin Only)

```http
PATCH /api/artists/:id/approve
```

#### Reject Artist (Admin Only)

```http
PATCH /api/artists/:id/reject
```

**Body:**

```json
{
  "reason": "Optional rejection reason"
}
```

---

### Artist-Only Routes (Requires `artist` role)

#### Get Profile

```http
GET /api/artists/profile
```

#### Update Profile

```http
PUT /api/artists/profile
```

**Body:**

```json
{
  "bio": "Updated bio",
  "category": "category_id",
  "skills": ["skill1", "skill2"],
  "hourlyRate": 60,
  "availability": {},
  "profileImage": "https://example.com/image.jpg"
}
```

#### Get Bookings

```http
GET /api/artists/bookings
```

**Query Params:** `search`, `status`, `paymentStatus`, `category`, `startDate`, `endDate`, `minAmount`, `maxAmount`, `page`, `limit`, `sortBy`, `sortOrder`

#### Accept Booking

```http
PUT /api/artists/bookings/:bookingId/accept
```

#### Reject Booking

```http
PUT /api/artists/bookings/:bookingId/reject
```

**Body:**

```json
{
  "reason": "Optional rejection reason"
}
```

#### Get Reviews

```http
GET /api/artists/reviews
```

**Query Params:** `search`, `minRating`, `maxRating`, `startDate`, `endDate`, `page`, `limit`, `sortBy`, `sortOrder`

---

## 📅 Bookings Routes (`/api/bookings`)

### Create Booking (Customer Only)

```http
POST /api/bookings
```

**Body:**

```json
{
  "artistId": "artist_id_here",
  "categoryId": "category_id_here",
  "bookingDate": "2024-12-25",
  "startTime": "10:00",
  "endTime": "12:00",
  "specialRequests": "Please bring equipment",
  "location": "123 Main St, New York"
}
```

### Get Booking by ID

```http
GET /api/bookings/:bookingId
```

**Access:** Customer, Artist (owner), or Admin

### Cancel Booking (Customer Only)

```http
PUT /api/bookings/:bookingId/cancel
```

### Complete Booking (Artist Only)

```http
PUT /api/bookings/:bookingId/complete
```

---

## 📁 Categories Routes (`/api/categories`)

### Public Routes

#### Get All Categories

```http
GET /api/categories
```

**Query Params:** `search`, `isActive`, `page`, `limit`

#### Get Category by ID

```http
GET /api/categories/:categoryId
```

#### Get Artists by Category

```http
GET /api/categories/:categoryId/artists
```

**Query Params:** `search`, `minRating`, `maxRate`, `page`, `limit`

---

### Admin Only Routes

#### Create Category

```http
POST /api/categories
```

**Body:**

```json
{
  "name": "Photography",
  "description": "Professional photography services",
  "image": "https://example.com/image.jpg"
}
```

#### Update Category

```http
PUT /api/categories/:categoryId
```

**Body:**

```json
{
  "name": "Updated Name",
  "description": "Updated description",
  "image": "https://example.com/image.jpg",
  "isActive": true
}
```

#### Delete Category

```http
DELETE /api/categories/:categoryId
```

---

## 💳 Payments Routes (`/api/payments`)

### Create Payment (Customer Only)

```http
POST /api/payments
```

**Body:**

```json
{
  "bookingId": "booking_id_here",
  "amount": 100.0,
  "paymentMethod": "credit_card"
}
```

### Get Payments

```http
GET /api/payments
```

**Access:** Customer, Artist, or Admin
**Query Params:** `status`, `bookingId`, `page`, `limit`

### Get Payment by ID

```http
GET /api/payments/:paymentId
```

**Access:** Customer, Artist, or Admin

### Refund Payment (Admin Only)

```http
POST /api/payments/:paymentId/refund
```

---

## ⭐ Reviews Routes (`/api/reviews`)

### Public Routes

#### Get Reviews by Artist

```http
GET /api/reviews/artist/:artistId
```

**Query Params:** `minRating`, `maxRating`, `page`, `limit`

#### Get Review by ID

```http
GET /api/reviews/:reviewId
```

---

### Protected Routes

#### Create Review (Customer Only)

```http
POST /api/reviews
```

**Body:**

```json
{
  "artistId": "artist_id_here",
  "bookingId": "booking_id_here",
  "rating": 5,
  "comment": "Excellent service!"
}
```

#### Update Review (Customer Only)

```http
PUT /api/reviews/:reviewId
```

**Body:**

```json
{
  "rating": 4,
  "comment": "Updated comment"
}
```

#### Delete Review

```http
DELETE /api/reviews/:reviewId
```

**Access:** Customer (own review) or Admin

---

## 🔔 Notifications Routes (`/api/notifications`)

All routes require authentication (Customer, Artist, or Admin).

#### Get Notifications

```http
GET /api/notifications
```

**Query Params:** `read`, `type`, `page`, `limit`

#### Mark Notification as Read

```http
PUT /api/notifications/:notificationId/read
```

#### Mark All Notifications as Read

```http
PUT /api/notifications/read-all
```

#### Delete Notification

```http
DELETE /api/notifications/:notificationId
```

---

## 👨‍💼 Admin Routes (`/api/admin`)

All routes require `admin` role authentication.

#### Get Users by Role

```http
GET /api/admin/users
```

**Query Params:** `role` (required: "artist" or "customer"), `search`, `isApproved`, `isActive`, `category`, `minRating`, `maxHourlyRate`, `page`, `limit`, `sortBy`, `sortOrder`

#### Get User by ID

```http
GET /api/admin/users/:role/:userId
```

**Params:** `role` = "artist" or "customer"

#### Get All Bookings

```http
GET /api/admin/bookings
```

**Query Params:** `search`, `status`, `paymentStatus`, `customer`, `artist`, `category`, `startDate`, `endDate`, `minAmount`, `maxAmount`, `page`, `limit`, `sortBy`, `sortOrder`

#### Get Dashboard Status

```http
GET /api/admin/dashboard/status
```

**Returns:** Statistics (total artists, customers, bookings, revenue, etc.)

---

## 🔑 Authentication

All protected routes require a JWT token in the Authorization header:

```
Authorization: Bearer <your_token_here>
```

---

## 📝 Notes

1. **Single Email = Single User**: One email can only have one role (customer, artist, or admin)
2. **Customer Registration**: Auto-approved, instant access
3. **Artist Registration**: Requires admin approval before login
4. **Artist Login**: Only allowed if status is "approved"
5. **Pagination**: Most list endpoints support `page` and `limit` query parameters
6. **Sorting**: Most list endpoints support `sortBy` and `sortOrder` query parameters

---

## 🚨 Error Responses

All errors follow this format:

```json
{
  "success": false,
  "message": "Error message here"
}
```

Common HTTP Status Codes:

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `500` - Server Error
