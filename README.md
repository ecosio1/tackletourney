# Fish Tournament Mobile App

A mobile-first fishing tournament platform with real money prizes and robust anti-cheat systems.

## Project Overview

This platform allows anglers to compete in daily fishing tournaments from anywhere. Users submit catches through a mobile app with built-in verification, and the platform automatically validates submissions using GPS tracking, unique verification codes, computer vision, and AI-powered fraud detection.

### Key Features

- **Mobile-only**: iPhone & Android native apps
- **Daily tournaments**: Multiple tournaments per day with various species and regions
- **Anti-cheat system**: Multi-layered fraud detection (codes, GPS, CV, AI)
- **Automated measurement**: Computer vision measures fish length
- **Real money**: Entry fees and prize payouts via Stripe
- **Fair competition**: Verified catches, transparent leaderboards

## Repository Structure

```
Fish tourney/
├── docs/
│   ├── Product_Design_Overview.md    # Product vision and economics
│   ├── User_Flows.md                 # Complete user journey
│   ├── Anti_Cheat_System.md          # Anti-cheat architecture
│   ├── Implementation_Roadmap.md     # 8-phase development plan
│   └── Technical_Architecture.md     # System architecture
├── backend/                          # Node.js + Express API server
│   ├── config/                       # Database and config
│   ├── middleware/                   # Authentication, validation
│   ├── routes/                       # API endpoints
│   ├── server.js                     # Main entry point
│   └── README.md                     # Backend documentation
├── database/                         # PostgreSQL schema
│   └── schema.sql                    # Database schema with PostGIS
├── mobile-app/                       # React Native mobile app (TODO)
└── admin-dashboard/                  # Web admin panel (TODO)
```

## Current Status

### ✅ Completed (Phase 1 - Week 1)

**Design & Documentation:**
- Product design and vision
- Complete user flows
- Anti-cheat system architecture
- Technical architecture
- Implementation roadmap (8 phases)

**Backend API (Node.js + Express):**
- User authentication (signup, signin, JWT)
- Tournament management (list, join, leaderboards)
- Catch submission with verification codes
- GPS and timestamp validation
- Admin review API
- PostgreSQL database with PostGIS

**Database:**
- Complete schema with all tables
- PostGIS for geographic queries
- User management, tournaments, catches, payments, fraud tracking

### 🚧 In Progress (Phase 1 - Week 2-4)

- [ ] React Native mobile app
  - [ ] Authentication screens
  - [ ] Tournament browsing
  - [ ] In-app camera with GPS
  - [ ] Catch submission flow
  - [ ] Leaderboard views
- [ ] Admin web dashboard
  - [ ] Catch review interface
  - [ ] User management
  - [ ] Dashboard statistics

### 📅 Upcoming (Phases 2-8)

- **Phase 2 (Weeks 5-8):** Anti-cheat foundation (EXIF, duplicates, auto-rejection)
- **Phase 3 (Weeks 9-12):** Computer vision measurement
- **Phase 4 (Weeks 13-16):** Advanced fraud detection (AI, behavioral)
- **Phase 5 (Weeks 17-20):** Video verification
- **Phase 6 (Weeks 21-24):** Payments and payouts (Stripe)
- **Phase 7 (Weeks 25-28):** Community and growth features
- **Phase 8 (Weeks 29-32):** Custom tournaments and monetization

## Quick Start

### Prerequisites

- Node.js 16+
- PostgreSQL 14+ with PostGIS
- (Optional) React Native development environment for mobile app

### Backend Setup

1. **Install dependencies:**
```bash
cd backend
npm install
```

2. **Create PostgreSQL database:**
```bash
createdb fish_tournament
psql -d fish_tournament -f ../database/schema.sql
```

3. **Configure environment:**
```bash
copy .env.example .env
# Edit .env with your database credentials and JWT secret
```

4. **Start server:**
```bash
npm run dev
```

Server runs on `http://localhost:3000`

5. **Test API:**
```bash
curl http://localhost:3000/health
```

### Mobile App Setup (Coming Soon)

Instructions for React Native setup will be added once mobile app is implemented.

## Documentation

Detailed documentation available in the root directory:

- **[Product_Design_Overview.md](Product_Design_Overview.md)** - Product vision, target users, economics
- **[User_Flows.md](User_Flows.md)** - Complete user journey and app screens
- **[Anti_Cheat_System.md](Anti_Cheat_System.md)** - Comprehensive fraud prevention
- **[Implementation_Roadmap.md](Implementation_Roadmap.md)** - 8-phase development plan
- **[Technical_Architecture.md](Technical_Architecture.md)** - System design and infrastructure
- **[backend/README.md](backend/README.md)** - Backend API documentation

## API Documentation

See [backend/README.md](backend/README.md) for complete API documentation.

**Base URL:** `http://localhost:3000/api`

**Key Endpoints:**
- `POST /auth/signup` - Create account
- `POST /auth/signin` - Login
- `GET /tournaments` - List tournaments
- `POST /tournaments/:id/join` - Join tournament
- `POST /catches/sessions/start` - Get verification code
- `POST /catches` - Submit catch
- `GET /tournaments/:id/leaderboard` - View rankings

## Development Workflow

### Current Phase: Phase 1 MVP (Weeks 1-4)

**Objectives:**
- ✅ Backend API with core features
- 🚧 Mobile app with basic UI
- 🚧 Admin review dashboard
- Manual catch review (no CV yet)
- Free tournaments (no payments yet)

**Next Steps:**
1. Build React Native mobile app shell
2. Implement authentication screens
3. Build tournament browsing
4. Implement in-app camera with GPS
5. Create catch submission flow
6. Build admin review dashboard (web)
7. Test end-to-end with beta users

### Testing Strategy

**Phase 1:**
- Manual testing with Postman/curl
- 20-30 beta testers with real phones
- Run 3-5 free tournaments
- Gather feedback on UX

**Later Phases:**
- Unit tests for backend services
- Integration tests for API endpoints
- E2E tests for mobile app
- Load testing (simulate 1000 concurrent users)

## Technology Stack

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** PostgreSQL with PostGIS
- **Authentication:** JWT
- **File Upload:** Multer (will migrate to S3)

### Mobile App (Phase 1)
- **Framework:** React Native (iOS & Android)
- **State Management:** Redux
- **Navigation:** React Navigation
- **Networking:** Axios
- **Camera:** React Native Camera
- **Location:** React Native Geolocation

### Future Tech (Phases 3-6)
- **Computer Vision:** TensorFlow.js or Python backend service
- **Payments:** Stripe
- **Cloud Storage:** AWS S3
- **Push Notifications:** Firebase Cloud Messaging
- **AI/ML:** AWS Rekognition or custom models

## Contributing

This is a private project under active development. Contact the project owner for contribution guidelines.

## Roadmap Timeline

| Phase | Weeks | Focus | Status |
|-------|-------|-------|--------|
| Phase 1 | 1-4 | MVP with manual review | 🚧 In Progress |
| Phase 2 | 5-8 | Anti-cheat foundation | 📅 Planned |
| Phase 3 | 9-12 | Computer vision measurement | 📅 Planned |
| Phase 4 | 13-16 | Advanced fraud detection | 📅 Planned |
| Phase 5 | 17-20 | Video verification | 📅 Planned |
| Phase 6 | 21-24 | Payments & payouts | 📅 Planned |
| Phase 7 | 25-28 | Community features | 📅 Planned |
| Phase 8 | 29-32 | Monetization & scale | 📅 Planned |

**Total Timeline:** 32 weeks (8 months) to full-featured platform

## License

Proprietary - Fish Tournament App

## Contact

For questions or issues, contact the development team.

---

**Current Version:** 0.1.0-alpha (Phase 1 in progress)

**Last Updated:** December 2024
