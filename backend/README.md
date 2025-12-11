# Fish Tournament Backend API

Node.js + Express + PostgreSQL backend for the fishing tournament mobile app.

## Features

- User authentication (JWT)
- Tournament management
- Catch submission with verification codes
- GPS and timestamp validation
- Admin review dashboard API
- Leaderboard calculation
- Wallet system (ready for Phase 6 payments)

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** PostgreSQL with PostGIS
- **Authentication:** JWT (jsonwebtoken)
- **File Upload:** Multer
- **Password Hashing:** bcrypt

## Prerequisites

- Node.js 16+
- PostgreSQL 14+ with PostGIS extension
- npm or yarn

## Installation

1. **Install dependencies:**
```bash
cd backend
npm install
```

2. **Set up PostgreSQL database:**

Create a new PostgreSQL database:
```sql
CREATE DATABASE fish_tournament;
```

Run the schema:
```bash
psql -U postgres -d fish_tournament -f ../database/schema.sql
```

3. **Configure environment variables:**

Copy the example env file:
```bash
copy .env.example .env
```

Edit `.env` and update the values:
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=fish_tournament
DB_USER=postgres
DB_PASSWORD=your_password

JWT_SECRET=your_secret_key_here
```

4. **Create uploads directory:**
```bash
mkdir uploads
```

## Running the Server

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

Server will start on `http://localhost:3000`

## API Endpoints

### Authentication

**Sign Up**
```http
POST /api/auth/signup
Content-Type: application/json

{
  "email": "angler@example.com",
  "password": "password123",
  "username": "angler_joe",
  "region": "Florida",
  "favorite_species": ["Snook", "Redfish"]
}
```

**Sign In**
```http
POST /api/auth/signin
Content-Type: application/json

{
  "email": "angler@example.com",
  "password": "password123"
}
```

**Admin Sign In**
```http
POST /api/auth/admin/signin
Content-Type: application/json

{
  "email": "admin@fishtourney.com",
  "password": "admin123"
}
```

### Tournaments

**List Tournaments**
```http
GET /api/tournaments
GET /api/tournaments?status=active
GET /api/tournaments?species=Snook
```

**Get Tournament Details**
```http
GET /api/tournaments/:id
```

**Join Tournament**
```http
POST /api/tournaments/:id/join
Authorization: Bearer {token}
```

**Get Leaderboard**
```http
GET /api/tournaments/:id/leaderboard
```

**Get My Catches**
```http
GET /api/tournaments/:id/my-catches
Authorization: Bearer {token}
```

### Catches

**Start Catch Session (Get Verification Code)**
```http
POST /api/catches/sessions/start
Authorization: Bearer {token}
Content-Type: application/json

{
  "tournament_id": "uuid",
  "gps_lat": 27.9506,
  "gps_lon": -82.4572
}
```

**Submit Catch**
```http
POST /api/catches
Authorization: Bearer {token}
Content-Type: multipart/form-data

{
  "session_id": "uuid",
  "tournament_id": "uuid",
  "species": "Snook",
  "length_inches": 23.75,
  "gps_lat": 27.9506,
  "gps_lon": -82.4572,
  "photo": [file]
}
```

**Get Catch Details**
```http
GET /api/catches/:id
Authorization: Bearer {token}
```

### Users

**Get My Profile**
```http
GET /api/users/me
Authorization: Bearer {token}
```

**Get My Tournaments**
```http
GET /api/users/me/tournaments
GET /api/users/me/tournaments?status=active
Authorization: Bearer {token}
```

**Get My Catch History**
```http
GET /api/users/me/catches
GET /api/users/me/catches?tournament_id=uuid
Authorization: Bearer {token}
```

**Get Wallet Balance**
```http
GET /api/users/me/wallet
Authorization: Bearer {token}
```

### Admin (Requires Admin Token)

**Get Pending Catches**
```http
GET /api/admin/catches/pending
Authorization: Bearer {admin_token}
```

**Get Catch Details for Review**
```http
GET /api/admin/catches/:id
Authorization: Bearer {admin_token}
```

**Approve Catch**
```http
POST /api/admin/catches/:id/approve
Authorization: Bearer {admin_token}
```

**Reject Catch**
```http
POST /api/admin/catches/:id/reject
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "reason": "Code not visible in photo"
}
```

**Get User Details**
```http
GET /api/admin/users/:id
Authorization: Bearer {admin_token}
```

**Ban User**
```http
POST /api/admin/users/:id/ban
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "reason": "Repeated violations",
  "ban_type": "temporary",
  "duration_days": 30
}
```

**Get Dashboard Stats**
```http
GET /api/admin/stats/dashboard
Authorization: Bearer {admin_token}
```

## Database Schema

See `../database/schema.sql` for the complete PostgreSQL schema with PostGIS extensions.

Key tables:
- `users` - User accounts
- `tournaments` - Tournament definitions
- `tournament_participants` - User tournament registrations
- `catch_sessions` - Verification code sessions
- `catches` - Fish catch submissions
- `payment_methods` - Payment info (for Phase 6)
- `transactions` - Financial transactions
- `wallets` - User wallet balances
- `admin_users` - Admin accounts
- `bans` - User bans

## Testing

Use Postman, Insomnia, or curl to test the API.

**Example: Create a user and join a tournament**

1. Sign up:
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "username": "test_angler"
  }'
```

2. Save the returned token, then list tournaments:
```bash
curl http://localhost:3000/api/tournaments
```

3. Join a tournament:
```bash
curl -X POST http://localhost:3000/api/tournaments/{tournament_id}/join \
  -H "Authorization: Bearer {your_token}"
```

4. Start a catch session:
```bash
curl -X POST http://localhost:3000/api/catches/sessions/start \
  -H "Authorization: Bearer {your_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "tournament_id": "{tournament_id}",
    "gps_lat": 27.9506,
    "gps_lon": -82.4572
  }'
```

5. Submit a catch (with photo):
```bash
curl -X POST http://localhost:3000/api/catches \
  -H "Authorization: Bearer {your_token}" \
  -F "session_id={session_id}" \
  -F "tournament_id={tournament_id}" \
  -F "species=Snook" \
  -F "length_inches=23.75" \
  -F "gps_lat=27.9506" \
  -F "gps_lon=-82.4572" \
  -F "photo=@photo.jpg"
```

## Project Structure

```
backend/
├── config/
│   └── database.js          # PostgreSQL connection
├── middleware/
│   └── auth.js              # JWT authentication middleware
├── routes/
│   ├── auth.js              # Authentication endpoints
│   ├── tournaments.js       # Tournament endpoints
│   ├── catches.js           # Catch submission endpoints
│   ├── users.js             # User profile endpoints
│   └── admin.js             # Admin review endpoints
├── uploads/                 # Uploaded photos (local storage)
├── .env                     # Environment variables (git-ignored)
├── .env.example             # Example env file
├── server.js                # Main entry point
└── package.json             # Dependencies

## Future Enhancements (Phase 2-8)

- [ ] Phase 2: EXIF validation, duplicate detection, automatic rejection
- [ ] Phase 3: Computer vision integration for automatic measurement
- [ ] Phase 4: AI fraud detection, behavioral analytics
- [ ] Phase 5: Video verification
- [ ] Phase 6: Stripe payment processing, automated payouts
- [ ] Phase 7: Social features, referral system
- [ ] Phase 8: User-created tournaments, subscriptions

## Security Notes

- JWT secrets should be strong random strings in production
- Enable HTTPS in production
- Use environment variables for all sensitive data
- Implement rate limiting for production (use express-rate-limit)
- Consider adding helmet.js for security headers
- Validate and sanitize all user inputs

## License

Proprietary - Fish Tournament App
```
