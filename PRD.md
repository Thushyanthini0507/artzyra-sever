# Product Requirements Document (PRD)
## Artzyra Creative Marketplace API

**Version:** 1.0.0  
**Last Updated:** January 2025  
**Status:** Production

---

## 1. Executive Summary

### 1.1 Product Overview
Artzyra is a RESTful API platform that connects customers with professional artists for various creative services including photography, videography, music, design, makeup, and more. The platform facilitates booking, payment processing, reviews, and artist management through a comprehensive backend system.

### 1.2 Business Objectives
- **Primary Goal:** Create a marketplace platform connecting customers with verified creative professionals
- **Revenue Model:** Commission-based or subscription model (future implementation)
- **Target Users:** 
  - Customers seeking creative services
  - Professional artists offering services
  - Platform administrators

### 1.3 Success Metrics
- Number of registered artists and customers
- Booking conversion rate
- Average booking value
- Artist approval rate
- Customer satisfaction (review ratings)
- API response time and uptime

---

## 2. Product Scope

### 2.1 In Scope
- User registration and authentication (Customer, Artist, Admin)
- Artist profile management and approval workflow
- Booking creation and management
- Payment processing and tracking
- Review and rating system
- Category management
- Notification system
- Search and filtering capabilities
- Admin dashboard and user management

### 2.2 Out of Scope (Future Phases)
- Real-time chat/messaging
- Video call integration
- Mobile app (API supports future mobile clients)
- Advanced analytics dashboard
- Multi-currency support
- Subscription plans
- Artist portfolio galleries
- Calendar integration

---

## 3. User Roles & Personas

### 3.1 Customer
**Profile:**
- Seeks creative services for events, projects, or personal needs
- Needs easy booking process and reliable artists
- Wants to see reviews and ratings before booking

**Key Actions:**
- Register account (auto-approved)
- Browse and search artists
- Create bookings
- Make payments
- Leave reviews
- Manage bookings

### 3.2 Artist
**Profile:**
- Professional creative service provider
- Needs platform to showcase skills and get bookings
- Requires approval before accepting bookings

**Key Actions:**
- Register account (requires admin approval)
- Create and manage profile
- Set availability and hourly rates
- Accept/reject booking requests
- View bookings and payments
- Manage reviews

### 3.3 Admin
**Profile:**
- Platform administrator
- Manages user accounts and content
- Monitors platform health and transactions

**Key Actions:**
- Approve/reject artist registrations
- Manage categories
- View all bookings and payments
- Access dashboard statistics
- Manage user accounts
- Process refunds

---

## 4. Functional Requirements

### 4.1 Authentication & Authorization

#### 4.1.1 User Registration
**FR-AUTH-001: Customer Registration**
- **Priority:** High
- **Description:** Customers can register with email and password
- **Acceptance Criteria:**
  - Email must be unique and valid format
  - Password minimum 6 characters
  - Customer account is auto-approved upon registration
  - JWT token returned immediately for access
  - Customer profile created automatically

**FR-AUTH-002: Artist Registration**
- **Priority:** High
- **Description:** Artists can register with profile information
- **Acceptance Criteria:**
  - Email must be unique and valid format
  - Password minimum 6 characters
  - Category is required (must exist in system)
  - Artist saved to pending table
  - Requires admin approval before activation
  - No token returned until approved
  - Availability can be string or structured object

**FR-AUTH-003: Login**
- **Priority:** High
- **Description:** Users can login with email and password
- **Acceptance Criteria:**
  - Validates email and password
  - Returns JWT token on success
  - Returns user profile data
  - Handles pending approval status
  - Rate limiting: 10 attempts per 15 minutes

**FR-AUTH-004: Token Management**
- **Priority:** High
- **Description:** JWT-based authentication system
- **Acceptance Criteria:**
  - Token expires after configured time (default: 7 days)
  - Token includes user ID and role
  - Protected routes validate token
  - Logout endpoint validates token

#### 4.1.2 Role-Based Access Control
**FR-AUTH-005: Role Enforcement**
- **Priority:** High
- **Description:** Different endpoints require different roles
- **Acceptance Criteria:**
  - Customer endpoints require customer role
  - Artist endpoints require artist role
  - Admin endpoints require admin role
  - Public endpoints accessible without authentication
  - Unauthorized access returns 403 error

### 4.2 User Management

#### 4.2.1 Customer Management
**FR-USER-001: Customer Profile**
- **Priority:** High
- **Description:** Customers can view and update their profile
- **Acceptance Criteria:**
  - View profile with address and image
  - Update profile information
  - Profile linked to User account

**FR-USER-002: Customer Bookings**
- **Priority:** High
- **Description:** Customers can view their bookings
- **Acceptance Criteria:**
  - Filter by status, date range, amount
  - Search by location or special requests
  - Pagination support
  - Sort by date or amount

#### 4.2.2 Artist Management
**FR-USER-003: Artist Profile**
- **Priority:** High
- **Description:** Artists can manage their profile
- **Acceptance Criteria:**
  - View profile with bio, skills, rates
  - Update profile information
  - Set availability schedule
  - Update hourly rate
  - Add/remove skills

**FR-USER-004: Artist Approval Workflow**
- **Priority:** High
- **Description:** Artists require admin approval
- **Acceptance Criteria:**
  - New artists saved to PendingArtist collection
  - Admin can view pending artists
  - Admin can approve or reject
  - Approved artists moved to Artist collection
  - Status: pending → approved/rejected

**FR-USER-005: Artist Public Profile**
- **Priority:** High
- **Description:** Public can view approved artist profiles
- **Acceptance Criteria:**
  - Only approved artists visible
  - Shows bio, skills, rating, hourly rate
  - Includes category information
  - No authentication required

### 4.3 Booking System

#### 4.3.1 Booking Creation
**FR-BOOK-001: Create Booking**
- **Priority:** High
- **Description:** Customers can create booking requests
- **Acceptance Criteria:**
  - Requires customer authentication
  - Must select artist and category
  - Date, start time, end time required
  - Duration calculated automatically
  - Total amount calculated (hourly rate × duration)
  - Status defaults to "pending"
  - Payment status defaults to "pending"
  - Optional: location, special requests

**FR-BOOK-002: Booking Validation**
- **Priority:** High
- **Description:** Validate booking data before creation
- **Acceptance Criteria:**
  - Artist must exist and be approved
  - Category must exist and be active
  - Date must be in the future
  - End time must be after start time
  - Duration must be positive
  - Check for conflicts (future enhancement)

#### 4.3.2 Booking Management
**FR-BOOK-003: Artist Booking Actions**
- **Priority:** High
- **Description:** Artists can accept or reject bookings
- **Acceptance Criteria:**
  - Artist can view pending bookings
  - Accept booking changes status to "accepted"
  - Reject booking changes status to "rejected"
  - Notification sent to customer on action

**FR-BOOK-004: Booking Status Workflow**
- **Priority:** High
- **Description:** Booking status progression
- **Acceptance Criteria:**
  - Statuses: pending → accepted/rejected → completed/cancelled
  - Only artist can accept/reject
  - Only artist can mark as completed
  - Customer can cancel (with refund logic)
  - Status changes trigger notifications

**FR-BOOK-005: Booking Viewing**
- **Priority:** Medium
- **Description:** Users can view booking details
- **Acceptance Criteria:**
  - Customer can view their bookings
  - Artist can view their bookings
  - Admin can view all bookings
  - Includes related artist/customer info
  - Includes payment status

### 4.4 Payment System

#### 4.4.1 Payment Processing
**FR-PAY-001: Create Payment**
- **Priority:** High
- **Description:** Create payment record for booking
- **Acceptance Criteria:**
  - Linked to booking, customer, and artist
  - Amount matches booking total
  - Payment method: Card, Cash, Online
  - Status: pending → completed/failed/refunded
  - Transaction ID for online payments
  - Payment date recorded

**FR-PAY-002: Payment Status**
- **Priority:** High
- **Description:** Track payment status
- **Acceptance Criteria:**
  - Statuses: pending, completed, failed, refunded
  - Booking payment status updated
  - Notification sent on status change

**FR-PAY-003: Refund Processing**
- **Priority:** Medium
- **Description:** Admin can process refunds
- **Acceptance Criteria:**
  - Only admin can process refunds
  - Updates payment status to "refunded"
  - Updates booking payment status
  - Records refund transaction

### 4.5 Review & Rating System

#### 4.5.1 Review Creation
**FR-REV-001: Create Review**
- **Priority:** High
- **Description:** Customers can review completed bookings
- **Acceptance Criteria:**
  - Only for completed bookings
  - One review per booking (unique constraint)
  - Rating: 1-5 stars (required)
  - Comment optional
  - Review linked to artist and customer
  - Review visible by default

**FR-REV-002: Review Impact**
- **Priority:** High
- **Description:** Reviews affect artist ratings
- **Acceptance Criteria:**
  - Artist rating recalculated on new review
  - Total reviews count updated
  - Average rating displayed on artist profile
  - Notification sent to artist

**FR-REV-003: Review Management**
- **Priority:** Medium
- **Description:** Users can view and manage reviews
- **Acceptance Criteria:**
  - Public can view artist reviews
  - Customer can view their reviews
  - Customer can update/delete their reviews
  - Reviews can be hidden (isVisible flag)

### 4.6 Category Management

#### 4.6.1 Category Operations
**FR-CAT-001: Category CRUD**
- **Priority:** High
- **Description:** Admin manages service categories
- **Acceptance Criteria:**
  - Create category with name, description, image
  - Update category information
  - Delete category (soft delete with isActive flag)
  - List all active categories
  - Public can view categories

**FR-CAT-002: Category Usage**
- **Priority:** High
- **Description:** Categories used for artist classification
- **Acceptance Criteria:**
  - Artists must have a category
  - Filter artists by category
  - Category must be active for use
  - Categories displayed in artist profiles

### 4.7 Notification System

#### 4.7.1 Notification Types
**FR-NOT-001: Notification Creation**
- **Priority:** Medium
- **Description:** System generates notifications for events
- **Acceptance Criteria:**
  - Booking request notifications
  - Booking accepted/rejected notifications
  - Payment received notifications
  - Review received notifications
  - Approval status notifications
  - System notifications

**FR-NOT-002: Notification Management**
- **Priority:** Medium
- **Description:** Users can manage notifications
- **Acceptance Criteria:**
  - View all notifications
  - Mark as read/unread
  - Mark all as read
  - Delete notifications
  - Filter by type
  - Pagination support

### 4.8 Search & Filtering

#### 4.8.1 Artist Search
**FR-SEARCH-001: Artist Discovery**
- **Priority:** High
- **Description:** Public can search for artists
- **Acceptance Criteria:**
  - Search by name, bio, skills
  - Filter by category
  - Filter by rating range
  - Sort by rating, hourly rate, newest
  - Pagination support
  - Case-insensitive search

#### 4.8.2 Advanced Filtering
**FR-SEARCH-002: Booking Filters**
- **Priority:** Medium
- **Description:** Filter bookings by various criteria
- **Acceptance Criteria:**
  - Filter by status
  - Filter by date range
  - Filter by amount range
  - Filter by artist/customer
  - Filter by category
  - Search by location or requests

### 4.9 Admin Features

#### 4.9.1 User Management
**FR-ADMIN-001: User Administration**
- **Priority:** High
- **Description:** Admin manages all users
- **Acceptance Criteria:**
  - View users by role
  - View user details
  - Approve/reject artist registrations
  - Suspend/activate users
  - Search and filter users

**FR-ADMIN-002: Dashboard Statistics**
- **Priority:** Medium
- **Description:** Admin dashboard with platform stats
- **Acceptance Criteria:**
  - Total users (by role)
  - Total bookings (by status)
  - Total revenue
  - Pending approvals count
  - Recent activity

**FR-ADMIN-003: Content Management**
- **Priority:** Medium
- **Description:** Admin manages platform content
- **Acceptance Criteria:**
  - Manage categories
  - View all bookings
  - Process refunds
  - Monitor system health

---

## 5. Technical Requirements

### 5.1 API Architecture
- **Framework:** Express.js 5.1.0
- **Database:** MongoDB with Mongoose 8.19.1
- **Authentication:** JWT (jsonwebtoken)
- **Security:** bcryptjs for password hashing
- **Validation:** express-validator
- **Rate Limiting:** express-rate-limit
- **CORS:** Enabled for cross-origin requests

### 5.2 Data Models

#### 5.2.1 Core Entities
- **User:** Central authentication (email, password, role)
- **Customer:** Customer profile (address, profileImage)
- **Artist:** Artist profile (bio, skills, hourlyRate, availability, rating)
- **Admin:** Admin profile (permissions)
- **Category:** Service categories (name, description, image)
- **Booking:** Booking records (customer, artist, category, date, time, amount, status)
- **Payment:** Payment records (booking, customer, artist, amount, method, status)
- **Review:** Review records (booking, customer, artist, rating, comment)
- **Notification:** Notification records (user, type, message, isRead)

#### 5.2.2 Pending Entities
- **PendingArtist:** Artist registrations awaiting approval

### 5.3 API Endpoints

#### 5.3.1 Authentication (`/api/auth`)
- `POST /api/auth/register/customer` - Customer registration
- `POST /api/auth/register/artist` - Artist registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user (protected)
- `POST /api/auth/logout` - Logout (protected)

#### 5.3.2 Artists (`/api/artists`)
- `GET /api/artists` - Get all approved artists (public)
- `GET /api/artists/:id` - Get artist by ID (public)
- `GET /api/artists/profile` - Get artist profile (artist only)
- `PUT /api/artists/profile` - Update artist profile (artist only)
- `GET /api/artists/bookings` - Get artist bookings (artist only)
- `PUT /api/artists/bookings/:id/accept` - Accept booking (artist only)
- `PUT /api/artists/bookings/:id/reject` - Reject booking (artist only)
- `GET /api/artists/reviews` - Get artist reviews (artist only)

#### 5.3.3 Customers (`/api/customers`)
- `GET /api/customers/profile` - Get customer profile (customer only)
- `PUT /api/customers/profile` - Update customer profile (customer only)
- `GET /api/customers/bookings` - Get customer bookings (customer only)
- `GET /api/customers/reviews` - Get customer reviews (customer only)

#### 5.3.4 Bookings (`/api/bookings`)
- `POST /api/bookings` - Create booking (customer only)
- `GET /api/bookings/:id` - Get booking by ID (customer/artist/admin)
- `PUT /api/bookings/:id/cancel` - Cancel booking (customer only)
- `PUT /api/bookings/:id/complete` - Complete booking (artist only)

#### 5.3.5 Payments (`/api/payments`)
- `POST /api/payments` - Create payment (customer only)
- `GET /api/payments` - Get payments (customer/artist/admin)
- `GET /api/payments/:id` - Get payment by ID
- `POST /api/payments/:id/refund` - Process refund (admin only)

#### 5.3.6 Reviews (`/api/reviews`)
- `POST /api/reviews` - Create review (customer only)
- `GET /api/reviews/artist/:artistId` - Get reviews by artist (public)
- `GET /api/reviews/:id` - Get review by ID (public)
- `PUT /api/reviews/:id` - Update review (customer only)
- `DELETE /api/reviews/:id` - Delete review (customer only)

#### 5.3.7 Categories (`/api/categories`)
- `GET /api/categories` - Get all categories (public)
- `GET /api/categories/:id` - Get category by ID (public)
- `GET /api/categories/:id/artists` - Get artists by category (public)
- `POST /api/categories` - Create category (admin only)
- `PUT /api/categories/:id` - Update category (admin only)
- `DELETE /api/categories/:id` - Delete category (admin only)

#### 5.3.8 Admin (`/api/admin`)
- `GET /api/admin/users` - Get users by role (admin only)
- `GET /api/admin/users/:role/:userId` - Get user by ID (admin only)
- `GET /api/admin/pending/artists` - Get pending artists (admin only)
- `PUT /api/admin/users/approve` - Approve/reject user (admin only)
- `GET /api/admin/bookings` - Get all bookings (admin only)
- `GET /api/admin/dashboard/status` - Get dashboard stats (admin only)

#### 5.3.9 Notifications (`/api/notifications`)
- `GET /api/notifications` - Get notifications (authenticated)
- `PUT /api/notifications/:id/read` - Mark as read (authenticated)
- `PUT /api/notifications/read-all` - Mark all as read (authenticated)
- `DELETE /api/notifications/:id` - Delete notification (authenticated)

### 5.4 Response Format

#### 5.4.1 Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Response data
  }
}
```

#### 5.4.2 Error Response
```json
{
  "success": false,
  "message": "Error message here"
}
```

#### 5.4.3 Paginated Response
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "currentPage": 1,
    "limit": 10,
    "totalItems": 50,
    "totalPages": 5,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

### 5.5 Security Requirements

#### 5.5.1 Authentication
- JWT tokens with configurable expiration
- Password hashing with bcrypt (10 rounds)
- Token validation on protected routes
- Role-based access control

#### 5.5.2 Rate Limiting
- Authentication endpoints: 10 requests per 15 minutes
- General API: 200 requests per 15 minutes
- Payment endpoints: 20 requests per 15 minutes

#### 5.5.3 Input Validation
- Email format validation
- Password strength requirements
- Required field validation
- Data type validation
- MongoDB ObjectId validation

#### 5.5.4 Error Handling
- Consistent error response format
- Error logging for debugging
- User-friendly error messages
- No sensitive data in error responses

### 5.6 Performance Requirements
- API response time: < 500ms (p95)
- Database query optimization with indexes
- Pagination on all list endpoints
- Connection pooling for MongoDB
- Serverless-friendly architecture (Vercel)

### 5.7 Deployment
- **Platform:** Vercel (serverless functions)
- **Database:** MongoDB Atlas (cloud)
- **Environment Variables:** Secure configuration
- **CORS:** Configured for frontend domains
- **Health Check:** `/` endpoint for monitoring

---

## 6. Non-Functional Requirements

### 6.1 Scalability
- Support for 10,000+ concurrent users
- Horizontal scaling capability
- Database indexing for performance
- Efficient query patterns

### 6.2 Reliability
- 99.9% uptime target
- Graceful error handling
- Database connection retry logic
- Serverless cold start optimization

### 6.3 Maintainability
- Modular code structure
- Clear separation of concerns
- Comprehensive error handling
- Code documentation

### 6.4 Usability
- RESTful API design
- Consistent response formats
- Clear error messages
- Comprehensive API documentation

---

## 7. Data Requirements

### 7.1 Data Storage
- MongoDB collections for all entities
- Indexes on frequently queried fields
- Timestamps on all documents
- Soft deletes where applicable (isActive flag)

### 7.2 Data Relationships
- User → Customer/Artist/Admin (one-to-one)
- Booking → Customer, Artist, Category (many-to-one)
- Payment → Booking (one-to-one)
- Review → Booking, Customer, Artist (many-to-one)
- Notification → User (many-to-one)

### 7.3 Data Validation
- Required fields enforced at schema level
- Enum values for status fields
- Email uniqueness
- Password strength requirements
- Date/time validation

---

## 8. Integration Requirements

### 8.1 Current Integrations
- MongoDB Atlas (database)
- JWT (authentication)
- bcrypt (password hashing)

### 8.2 Future Integrations (Out of Scope)
- Payment gateway (Stripe, PayPal)
- Email service (SendGrid, AWS SES)
- SMS notifications (Twilio)
- File storage (AWS S3, Cloudinary)
- Analytics (Google Analytics, Mixpanel)

---

## 9. Testing Requirements

### 9.1 Unit Testing
- Controller function testing
- Model validation testing
- Utility function testing

### 9.2 Integration Testing
- API endpoint testing
- Database interaction testing
- Authentication flow testing

### 9.3 Manual Testing
- User registration flows
- Booking creation and management
- Payment processing
- Admin approval workflow

---

## 10. Documentation Requirements

### 10.1 API Documentation
- Endpoint descriptions
- Request/response examples
- Authentication requirements
- Error codes and messages
- Query parameter documentation

### 10.2 Developer Documentation
- Setup instructions
- Environment configuration
- Database schema
- Deployment guide
- Troubleshooting guide

---

## 11. Success Criteria

### 11.1 Launch Criteria
- ✅ All core features implemented
- ✅ Authentication system working
- ✅ Booking system functional
- ✅ Payment tracking implemented
- ✅ Review system operational
- ✅ Admin dashboard functional
- ✅ API deployed and accessible
- ✅ Database seeded with sample data

### 11.2 Post-Launch Metrics
- User registration rate
- Artist approval rate
- Booking conversion rate
- Average response time
- Error rate
- User satisfaction (reviews)

---

## 12. Future Enhancements (Roadmap)

### Phase 2
- Real-time notifications (WebSocket)
- Advanced search with filters
- Calendar integration
- Multi-currency support
- Subscription plans

### Phase 3
- Mobile app API endpoints
- Video call integration
- Portfolio galleries
- Advanced analytics
- Recommendation engine

---

## 13. Assumptions & Constraints

### 13.1 Assumptions
- Users have internet access
- MongoDB Atlas available
- Frontend will handle UI/UX
- Payment gateway integration in future
- Email service integration in future

### 13.2 Constraints
- Serverless function timeout (10 seconds on free tier)
- MongoDB connection limits
- Rate limiting to prevent abuse
- JWT token expiration
- Single currency (USD) initially

---

## 14. Risk Assessment

### 14.1 Technical Risks
- **Database connection issues:** Mitigated with retry logic
- **Serverless cold starts:** Optimized with connection pooling
- **Rate limiting bypass:** Multiple layers of protection
- **Data loss:** Regular backups recommended

### 14.2 Business Risks
- **Low artist adoption:** Marketing and onboarding needed
- **Payment disputes:** Clear refund policy required
- **Quality control:** Review system helps maintain standards

---

## 15. Appendices

### 15.1 Glossary
- **API:** Application Programming Interface
- **JWT:** JSON Web Token
- **RBAC:** Role-Based Access Control
- **CRUD:** Create, Read, Update, Delete
- **PRD:** Product Requirements Document

### 15.2 References
- Express.js Documentation
- MongoDB Documentation
- JWT Specification
- REST API Best Practices

---

**Document Owner:** Product Team  
**Review Cycle:** Quarterly  
**Next Review Date:** April 2025


