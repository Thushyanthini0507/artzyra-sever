# Complete API Endpoints Reference

## Base URL
```
http://localhost:8000/api
```

---

## 🔐 Authentication Routes (`/api/auth`)

### Public Routes

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register/customer` | Register new customer (auto-approved) | 
| POST | `/api/auth/register/artist` | Register new artist (pending approval) | 
| POST | `/api/auth/login` | Login user | 

### Protected Routes

| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|---------------|-------|
| GET | `/api/auth/me` | Get current user profile | ✅ | customer, artist, admin |
| POST | `/api/auth/logout` | Logout user | ✅ | customer, artist, admin |

---

## 👥 Customers Routes (`/api/customers`)

All routes require **customer** role authentication.

| Method | Endpoint | Description | Query Params |
|--------|----------|-------------|--------------|
| GET | `/api/customers/profile` | Get customer profile | - |
| PUT | `/api/customers/profile` | Update customer profile | - |
| GET | `/api/customers/bookings` | Get customer bookings | `search`, `status`, `paymentStatus`, `artist`, `category`, `startDate`, `endDate`, `minAmount`, `maxAmount`, `page`, `limit`, `sortBy`, `sortOrder` |
| GET | `/api/customers/reviews` | Get customer reviews | `search`, `artist`, `minRating`, `maxRating`, `startDate`, `endDate`, `page`, `limit`, `sortBy`, `sortOrder` |

---

## 🎨 Artists Routes (`/api/artists`)

### Public Routes (No Authentication)

| Method | Endpoint | Description | Query Params |
|--------|----------|-------------|--------------|
| GET | `/api/artists` | Get all approved artists | `category`, `search`, `page`, `limit` |
| GET | `/api/artists/:id` | Get artist by ID | - |

### Admin Routes

| Method | Endpoint | Description | Query Params |
|--------|----------|-------------|--------------|
| GET | `/api/artists/pending` | Get pending artists | `search`, `status`, `category`, `page`, `limit`, `sortBy`, `sortOrder` |
| PATCH | `/api/artists/:id/approve` | Approve artist | - |
| PATCH | `/api/artists/:id/reject` | Reject artist | `reason` (optional in body) |

### Artist Routes (Artist Role Required)

| Method | Endpoint | Description | Query Params |
|--------|----------|-------------|--------------|
| GET | `/api/artists/profile` | Get artist profile | - |
| PUT | `/api/artists/profile` | Update artist profile | - |
| GET | `/api/artists/bookings` | Get artist bookings | `search`, `status`, `paymentStatus`, `category`, `startDate`, `endDate`, `minAmount`, `maxAmount`, `page`, `limit`, `sortBy`, `sortOrder` |
| PUT | `/api/artists/bookings/:bookingId/accept` | Accept booking | - |
| PUT | `/api/artists/bookings/:bookingId/reject` | Reject booking | `reason` (optional in body) |
| GET | `/api/artists/reviews` | Get artist reviews | `search`, `minRating`, `maxRating`, `startDate`, `endDate`, `page`, `limit`, `sortBy`, `sortOrder` |

---

## 📅 Bookings Routes (`/api/bookings`)

| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|---------------|-------|
| POST | `/api/bookings` | Create new booking | ✅ | customer |
| GET | `/api/bookings/:bookingId` | Get booking by ID | ✅ | customer, artist, admin |
| PUT | `/api/bookings/:bookingId/cancel` | Cancel booking | ✅ | customer |
| PUT | `/api/bookings/:bookingId/complete` | Complete booking | ✅ | artist |

---

## 📁 Categories Routes (`/api/categories`)

### Public Routes

| Method | Endpoint | Description | Query Params |
|--------|----------|-------------|--------------|
| GET | `/api/categories` | Get all categories | `search`, `isActive`, `page`, `limit` |
| GET | `/api/categories/:categoryId` | Get category by ID | - |
| GET | `/api/categories/:categoryId/artists` | Get artists by category | `search`, `minRating`, `maxRate`, `page`, `limit` |

### Admin Routes

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/categories` | Create category | ✅ (admin) |
| PUT | `/api/categories/:categoryId` | Update category | ✅ (admin) |
| DELETE | `/api/categories/:categoryId` | Delete category | ✅ (admin) |

---

## 💳 Payments Routes (`/api/payments`)

| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|---------------|-------|
| POST | `/api/payments` | Create payment | ✅ | customer |
| GET | `/api/payments` | Get payments | ✅ | customer, artist, admin |
| GET | `/api/payments/:paymentId` | Get payment by ID | ✅ | customer, artist, admin |
| POST | `/api/payments/:paymentId/refund` | Refund payment | ✅ | admin |

**Query Params for GET `/api/payments`:** `status`, `bookingId`, `page`, `limit`

---

## ⭐ Reviews Routes (`/api/reviews`)

### Public Routes

| Method | Endpoint | Description | Query Params |
|--------|----------|-------------|--------------|
| GET | `/api/reviews/artist/:artistId` | Get reviews by artist | `minRating`, `maxRating`, `page`, `limit` |
| GET | `/api/reviews/:reviewId` | Get review by ID | - |

### Protected Routes

| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|---------------|-------|
| POST | `/api/reviews` | Create review | ✅ | customer |
| PUT | `/api/reviews/:reviewId` | Update review | ✅ | customer |
| DELETE | `/api/reviews/:reviewId` | Delete review | ✅ | customer, admin |

---

## 🔔 Notifications Routes (`/api/notifications`)

All routes require authentication (customer, artist, or admin).

| Method | Endpoint | Description | Query Params |
|--------|----------|-------------|--------------|
| GET | `/api/notifications` | Get notifications | `read`, `type`, `page`, `limit` |
| PUT | `/api/notifications/:notificationId/read` | Mark notification as read | - |
| PUT | `/api/notifications/read-all` | Mark all notifications as read | - |
| DELETE | `/api/notifications/:notificationId` | Delete notification | - |

---

## 👨‍💼 Admin Routes (`/api/admin`)

All routes require **admin** role authentication.

| Method | Endpoint | Description | Query Params |
|--------|----------|-------------|--------------|
| GET | `/api/admin/users` | Get users by role | `role` (required), `search`, `isApproved`, `isActive`, `category`, `minRating`, `maxHourlyRate`, `page`, `limit`, `sortBy`, `sortOrder` |
| GET | `/api/admin/users/:role/:userId` | Get user by ID | - |
| GET | `/api/admin/bookings` | Get all bookings | `search`, `status`, `paymentStatus`, `customer`, `artist`, `category`, `startDate`, `endDate`, `minAmount`, `maxAmount`, `page`, `limit`, `sortBy`, `sortOrder` |
| GET | `/api/admin/dashboard/status` | Get dashboard statistics | - |

---

## 📋 Request/Response Examples

### Register Customer
```http
POST /api/auth/register/customer
Content-Type: application/json

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

**Response:**
```json
{
  "success": true,
  "message": "Customer registered successfully. You can now log in.",
  "data": {
    "user": {
      "id": "...",
      "email": "customer@example.com",
      "role": "customer"
    },
    "profile": {...},
    "token": "jwt_token_here",
    "redirectPath": "/customer/dashboard"
  }
}
```

---

### Register Artist
```http
POST /api/auth/register/artist
Content-Type: application/json

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

**Response:**
```json
{
  "success": true,
  "message": "Artist registration submitted successfully. Please wait for admin approval before logging in.",
  "data": {
    "user": {
      "id": "...",
      "email": "artist@example.com",
      "role": "artist"
    },
    "profile": {
      "id": "...",
      "status": "pending"
    }
  }
}
```

---

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "customer@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "...",
      "email": "customer@example.com",
      "role": "customer",
      "isActive": true
    },
    "profile": {...},
    "token": "jwt_token_here",
    "redirectPath": "/customer/dashboard"
  }
}
```

---

### Create Booking
```http
POST /api/bookings
Authorization: Bearer <token>
Content-Type: application/json

{
  "artistId": "artist_id_here",
  "categoryId": "category_id_here",
  "bookingDate": "2024-12-25",
  "startTime": "10:00",
  "endTime": "14:00",
  "specialRequests": "Please bring backup equipment",
  "location": "123 Main St, New York"
}
```

---

### Create Review
```http
POST /api/reviews
Authorization: Bearer <token>
Content-Type: application/json

{
  "artistId": "artist_id_here",
  "bookingId": "booking_id_here",
  "rating": 5,
  "comment": "Excellent service!"
}
```

---

## 🔑 Authentication

All protected routes require a JWT token in the Authorization header:

```
Authorization: Bearer <your_token_here>
```

---

## 📝 Common Query Parameters

### Pagination
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)

### Sorting
- `sortBy` - Field to sort by (default: "createdAt")
- `sortOrder` - Sort direction: "asc" or "desc" (default: "desc")

### Filtering
- `search` - Text search (varies by endpoint)
- `status` - Filter by status
- `isActive` - Filter by active status (true/false)
- `category` - Filter by category ID
- Date ranges: `startDate`, `endDate` (ISO format: YYYY-MM-DD)
- Amount ranges: `minAmount`, `maxAmount`
- Rating ranges: `minRating`, `maxRating`

---

## 🚨 Error Responses

All errors follow this format:

```json
{
  "success": false,
  "message": "Error message here"
}
```

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized (not logged in)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (e.g., duplicate email)
- `500` - Server Error

---

## 🎯 Quick Reference by Role

### Customer Endpoints
- Register: `POST /api/auth/register/customer`
- Login: `POST /api/auth/login`
- Profile: `GET /api/customers/profile`, `PUT /api/customers/profile`
- Bookings: `GET /api/customers/bookings`, `POST /api/bookings`, `PUT /api/bookings/:id/cancel`
- Reviews: `GET /api/customers/reviews`, `POST /api/reviews`, `PUT /api/reviews/:id`
- Payments: `GET /api/payments`, `POST /api/payments`
- Notifications: `GET /api/notifications`, `PUT /api/notifications/:id/read`

### Artist Endpoints
- Register: `POST /api/auth/register/artist`
- Login: `POST /api/auth/login` (only if approved)
- Profile: `GET /api/artists/profile`, `PUT /api/artists/profile`
- Bookings: `GET /api/artists/bookings`, `PUT /api/artists/bookings/:id/accept`, `PUT /api/artists/bookings/:id/reject`, `PUT /api/bookings/:id/complete`
- Reviews: `GET /api/artists/reviews`
- Payments: `GET /api/payments`
- Notifications: `GET /api/notifications`, `PUT /api/notifications/:id/read`

### Admin Endpoints
- Login: `POST /api/auth/login`
- Users: `GET /api/admin/users`, `GET /api/admin/users/:role/:id`
- Artists: `GET /api/artists/pending`, `PATCH /api/artists/:id/approve`, `PATCH /api/artists/:id/reject`
- Bookings: `GET /api/admin/bookings`
- Categories: `POST /api/categories`, `PUT /api/categories/:id`, `DELETE /api/categories/:id`
- Payments: `GET /api/payments`, `POST /api/payments/:id/refund`
- Dashboard: `GET /api/admin/dashboard/status`
- Notifications: `GET /api/notifications`

---

## 🔍 Test Credentials (From Seed Data)

**Admin:**
- Email: `admin@artzyra.com`
- Password: `admin123`

**Customer:**
- Email: `customer1@example.com`
- Password: `customer123`

**Artist (Approved):**
- Email: `artist1@example.com`
- Password: `artist123`

**Artist (Pending):**
- Email: `artist6@example.com`
- Password: `artist123`

---

## 📌 Important Notes

1. **Single Email = Single User**: One email can only have one role
2. **Customer Registration**: Auto-approved, instant access
3. **Artist Registration**: Requires admin approval before login
4. **Artist Login**: Only allowed if status is "approved"
5. **All timestamps**: Use ISO 8601 format (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss)
6. **All IDs**: MongoDB ObjectId format (24 hex characters)

