# Technical Architecture

## Overview

This document describes the technical architecture for the fishing tournament mobile platform at a conceptual level. It covers system components, data flows, infrastructure, and integration patterns.

**Platform Type:** Mobile-only (iPhone & Android native apps)
**Architecture Pattern:** Microservices with API gateway
**Deployment:** Cloud-native (AWS or Google Cloud)
**Scale Target:** Support 10,000+ concurrent users, 100+ simultaneous tournaments

---

## System Architecture Diagram (Conceptual)

```
┌─────────────────────────────────────────────────────────────────┐
│                         MOBILE APPS                              │
│                   (iOS & Android Native)                         │
│                                                                  │
│  • Tournament browsing & joining                                │
│  • In-app camera capture (photos & videos)                      │
│  • GPS & sensor data collection                                 │
│  • Real-time leaderboards                                       │
│  • Push notifications                                           │
│  • Payment flows                                                │
└──────────────────────────┬───────────────────────────────────────┘
                           │ HTTPS/JSON
                           │
┌──────────────────────────▼───────────────────────────────────────┐
│                      API GATEWAY                                 │
│                   (Authentication, Rate Limiting,                │
│                    Request Routing, Load Balancing)              │
└──────────────────────────┬───────────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┬──────────────┐
        │                  │                  │              │
┌───────▼────────┐ ┌──────▼──────┐ ┌────────▼────────┐ ┌───▼──────┐
│ User Service   │ │Tournament   │ │ Catch           │ │Payment   │
│                │ │Service      │ │ Processing      │ │Service   │
│• Auth          │ │             │ │ Service         │ │          │
│• Profiles      │ │• Create/List│ │                 │ │• Stripe  │
│• Fraud Score   │ │• Join       │ │• Validation     │ │• Wallet  │
└────────────────┘ │• Leaderboard│ │• CV Analysis    │ │• Payouts │
                   │• Scoring    │ │• Fraud Check    │ └──────────┘
                   └─────────────┘ └─────┬───────────┘
                                         │
                   ┌─────────────────────┼──────────────┐
                   │                     │              │
           ┌───────▼────────┐  ┌────────▼────────┐  ┌─▼──────────┐
           │ Computer Vision│  │ Fraud Detection │  │ Notification│
           │ Service        │  │ Service         │  │ Service     │
           │                │  │                 │  │             │
           │• Board Detect  │  │• EXIF Analysis  │  │• Push       │
           │• Fish Measure  │  │• Duplicate Hash │  │• Email      │
           │• Code OCR      │  │• AI Manipulation│  │• SMS        │
           └────────────────┘  │• Behavioral     │  └─────────────┘
                               │• Environment    │
                               └─────────────────┘

┌───────────────────────────────────────────────────────────────────┐
│                          DATA LAYER                               │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │ PostgreSQL   │  │ Redis        │  │ S3 / Cloud   │           │
│  │              │  │              │  │ Storage      │           │
│  │• Users       │  │• Sessions    │  │              │           │
│  │• Tournaments │  │• Leaderboards│  │• Photos      │           │
│  │• Catches     │  │• Fraud Scores│  │• Videos      │           │
│  │• Transactions│  │• Image Hashes│  │• Thumbnails  │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
└───────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────┐
│                    THIRD-PARTY INTEGRATIONS                       │
│                                                                   │
│  • Stripe (Payments)        • Weather APIs (Validation)          │
│  • Firebase (Push Notif)    • Geolocation Services               │
│  • AWS Rekognition (AI)     • Email Service (SendGrid)           │
└───────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────┐
│                     ADMIN WEB DASHBOARD                           │
│                                                                   │
│  • Review flagged catches                                        │
│  • User management & bans                                        │
│  • Tournament monitoring                                         │
│  • Analytics & fraud reports                                     │
└───────────────────────────────────────────────────────────────────┘
```

---

## Core Services

### 1. User Service

**Responsibilities:**
- User registration and authentication
- Profile management
- Device tracking (for anti-cheat fingerprinting)
- Fraud score calculation and storage
- Ban/suspension management

**Key APIs:**
- `POST /auth/signup` - Create new user account
- `POST /auth/login` - Authenticate user, return JWT token
- `GET /users/:id` - Get user profile
- `PUT /users/:id` - Update profile
- `GET /users/:id/stats` - Get user statistics
- `POST /users/:id/fraud-score` - Update fraud score (internal)
- `POST /users/:id/ban` - Ban user (admin only)

**Data Schema (Conceptual):**
```
users
  - id (UUID)
  - email (unique)
  - password_hash
  - username
  - region
  - favorite_species (array)
  - verified_angler (boolean)
  - fraud_score (0-100)
  - created_at
  - device_fingerprint

user_devices
  - user_id (foreign key)
  - device_id
  - device_model
  - os_version
  - last_seen
```

**Security:**
- Passwords hashed with bcrypt (cost factor 12)
- JWT tokens for authentication (short-lived: 1 hour, refresh tokens for 30 days)
- Rate limiting on login attempts (5 attempts per 15 min)
- Device fingerprinting for fraud detection

---

### 2. Tournament Service

**Responsibilities:**
- Tournament creation and management
- User enrollment (joining tournaments)
- Leaderboard calculation and caching
- Prize pool calculation
- Tournament lifecycle (open → active → closed → finalized)

**Key APIs:**
- `GET /tournaments` - List tournaments (filter by date, species, region)
- `GET /tournaments/:id` - Get tournament details
- `POST /tournaments/:id/join` - Join tournament (includes payment)
- `GET /tournaments/:id/leaderboard` - Get live leaderboard
- `GET /tournaments/:id/rules` - Get tournament rules
- `POST /tournaments` - Create tournament (admin or user-created)
- `POST /tournaments/:id/finalize` - Finalize tournament and trigger payouts

**Data Schema (Conceptual):**
```
tournaments
  - id (UUID)
  - name
  - species (array)
  - region_boundaries (GeoJSON polygon)
  - start_time
  - end_time
  - entry_fee
  - prize_structure (JSON: {1st: 70%, 2nd: 20%, 3rd: 10%})
  - status (open, active, closed, finalized)
  - created_by (user_id or admin)

tournament_participants
  - tournament_id
  - user_id
  - joined_at
  - payment_transaction_id
```

**Leaderboard Calculation:**
- Query all "accepted" catches for tournament
- Sort by length DESC, timestamp ASC (tie-breaker)
- Assign ranks
- Cache in Redis (TTL: 2 seconds for real-time feel)
- Invalidate cache when new catch accepted

**Geographic Boundaries:**
- Stored as GeoJSON polygons
- Point-in-polygon check using PostGIS or turf.js
- Example: Florida West Coast = polygon of county boundaries

---

### 3. Catch Processing Service

**Responsibilities:**
- Receive catch submissions from mobile apps
- Orchestrate validation pipeline (GPS, time, session, CV, fraud detection)
- Make accept/reject/flag decisions
- Store catch data
- Trigger leaderboard updates
- Send user notifications

**Key APIs:**
- `POST /sessions/start` - Start catch session, generate code
- `POST /catches` - Submit catch (photo, metadata)
- `GET /catches/:id` - Get catch details
- `GET /users/:id/catches` - Get user's catches

**Data Schema (Conceptual):**
```
catch_sessions
  - id (UUID)
  - user_id
  - tournament_id
  - verification_code (e.g., "XG7K")
  - gps_start (lat/lon)
  - timestamp_start
  - status (active, used, expired)
  - expires_at

catches
  - id (UUID)
  - user_id
  - tournament_id
  - session_id
  - photo_url (S3 path)
  - video_url (S3 path, nullable)
  - gps_capture (lat/lon)
  - timestamp_capture
  - species
  - length_inches (decimal, e.g., 23.75)
  - status (pending, accepted, rejected, under_review)
  - cv_confidence (0-1)
  - fraud_signals (JSON)
  - rejection_reason (text, nullable)
  - created_at
```

**Catch Processing Flow:**
1. Mobile app calls `POST /sessions/start`
   - Server generates unique code
   - Captures GPS at session start
   - Returns session ID and code to app

2. User takes photo, app calls `POST /catches`
   - Receives: Photo (multipart upload), GPS, timestamp, session ID
   - Server validates:
     - Session exists and is active
     - GPS within tournament boundaries
     - Timestamp within tournament window
   - Uploads photo to S3
   - Queues catch for asynchronous processing

3. Asynchronous processing (background worker):
   - **CV Service:** Analyze photo (board, fish, measurement, code)
   - **Fraud Detection Service:** Run all fraud checks
   - Collect all results

4. Decision logic:
   - If all clear: Accept catch, update leaderboard, notify user
   - If critical flags: Reject catch, notify user with reason
   - If moderate flags: Hold for manual review, notify admin

5. Update catch status in database

6. Send notification to user (push + in-app)

**Asynchronous Processing:**
- Use message queue (RabbitMQ, AWS SQS)
- Background workers consume queue
- Scales horizontally (add more workers for high volume)

---

### 4. Computer Vision Service

**Responsibilities:**
- Detect measuring board in photo
- Detect verification code (OCR)
- Detect and segment fish
- Calculate fish length
- Return measurement and confidence scores

**Key APIs:**
- `POST /cv/analyze` - Analyze photo, return full results

**Input (JSON):**
```json
{
  "image_url": "https://s3.../photo.jpg",
  "expected_code": "XG7K"
}
```

**Output (JSON):**
```json
{
  "code_detected": true,
  "code_confidence": 0.98,
  "board_detected": true,
  "board_type": "standard_yellow",
  "board_confidence": 0.95,
  "fish_detected": true,
  "fish_confidence": 0.91,
  "length_inches": 23.75,
  "measurement_confidence": 0.89,
  "errors": [],
  "warnings": ["tail_slightly_bent"],
  "processing_time_ms": 3421
}
```

**ML Models:**
- **Board Detection:** YOLO v8 object detection
  - Detects board bounding box
  - Classifies board type
  - Locates calibration markers
- **OCR:** Tesseract or Google Cloud Vision
  - Extracts text from image
  - Searches for verification code
- **Fish Segmentation:** U-Net or Mask R-CNN
  - Segments fish from background
  - Identifies head and tail keypoints
- **Length Calculation:** Custom algorithm
  - Uses board calibration to convert pixels to inches
  - Accounts for perspective distortion

**Infrastructure:**
- Containerized (Docker)
- Deployed on GPU instances for inference (AWS EC2 p3, Google Cloud GPU)
- Auto-scaling based on queue depth
- Model versioning (can A/B test new models)

**Performance:**
- Target: <5 seconds per image
- Batch processing for efficiency (if queue builds up)

---

### 5. Fraud Detection Service

**Responsibilities:**
- EXIF data extraction and analysis
- Perceptual hashing and duplicate detection
- AI-powered manipulation detection
- Behavioral analytics
- Environmental cross-reference
- Fraud scoring

**Key APIs:**
- `POST /fraud/analyze` - Analyze catch for fraud signals

**Input (JSON):**
```json
{
  "catch_id": "uuid",
  "image_url": "https://s3.../photo.jpg",
  "user_id": "uuid",
  "gps": {"lat": 27.9506, "lon": -82.4572},
  "timestamp": "2024-03-15T14:34:12Z"
}
```

**Output (JSON):**
```json
{
  "overall_fraud_score": 0.23,
  "signals": {
    "exif_analysis": {
      "score": 0.05,
      "flags": [],
      "camera_model": "iPhone 14 Pro",
      "editing_software": null
    },
    "duplicate_detection": {
      "score": 0.02,
      "duplicate_found": false,
      "closest_match": null
    },
    "manipulation_detection": {
      "score": 0.15,
      "flags": ["possible_clone_stamp"],
      "confidence": 0.15
    },
    "behavioral": {
      "score": 0.10,
      "flags": ["high_catch_frequency"],
      "user_fraud_score": 18
    },
    "environmental": {
      "score": 0.03,
      "flags": [],
      "weather_match": true
    }
  },
  "recommendation": "ACCEPT",
  "manual_review_suggested": false
}
```

**Fraud Score Calculation:**
- Weighted average of all signals
- Thresholds:
  - <0.30: Low risk → Auto-accept
  - 0.30-0.60: Medium risk → Flag if other context suggests issues
  - >0.60: High risk → Manual review or auto-reject

**EXIF Analysis:**
- Python: Pillow or ExifRead library
- Checks: Camera model, timestamp, GPS, software signatures
- Flags editing software, missing data, mismatches

**Duplicate Detection:**
- Python: ImageHash library (pHash)
- Database: Store hashes in PostgreSQL or Redis
- Query: Find similar hashes (Hamming distance <10)
- Fast lookup: Use LSH (Locality-Sensitive Hashing) for scaling

**AI Manipulation Detection:**
- Option 1: AWS Rekognition Custom Labels
- Option 2: Custom CNN trained on ELA (Error Level Analysis)
- Outputs confidence that image has been manipulated

**Behavioral Analytics:**
- Query user's catch history
- Calculate metrics: Catch rate, success rate, average fish size
- Detect anomalies: Impossible travel, always winning, bot-like patterns

**Environmental Cross-Reference:**
- Weather API: OpenWeatherMap
- Astronomical calculations: Sunrise/sunset times
- Cross-check photo conditions with reality

**Infrastructure:**
- Stateless service (can scale horizontally)
- Cache weather data (reduce API calls)
- Background batch jobs for behavioral analytics (not real-time)

---

### 6. Payment Service

**Responsibilities:**
- Stripe integration for entry fees and payouts
- Wallet management
- Transaction logging
- Payout automation
- Refund processing

**Key APIs:**
- `POST /payments/methods` - Add payment method (tokenize card)
- `DELETE /payments/methods/:id` - Remove payment method
- `POST /payments/charge` - Charge entry fee
- `POST /payments/payout` - Send payout to user
- `GET /wallet/balance` - Get user wallet balance
- `POST /wallet/withdraw` - Withdraw from wallet to bank
- `GET /transactions` - Get transaction history

**Data Schema (Conceptual):**
```
payment_methods
  - id (UUID)
  - user_id
  - stripe_payment_method_id (token)
  - type (card, bank_account, apple_pay)
  - last4
  - is_default (boolean)

transactions
  - id (UUID)
  - user_id
  - type (entry_fee, payout, wallet_deposit, wallet_withdrawal)
  - amount
  - stripe_transaction_id
  - status (pending, completed, failed, refunded)
  - created_at

wallets
  - user_id (primary key)
  - balance (decimal)
  - updated_at
```

**Entry Fee Flow:**
1. User joins tournament via `POST /tournaments/:id/join`
2. Payment Service charges entry fee via Stripe
3. If successful:
   - Record transaction
   - Add user to tournament
   - Increase prize pool
4. If failed:
   - Return error to user
   - Do not join tournament

**Payout Flow (Automated):**
1. Tournament ends, `POST /tournaments/:id/finalize` called
2. Payment Service:
   - Calculate winner payouts (prize structure)
   - For each winner:
     - Create Stripe payout (transfer to bank or wallet)
     - Record transaction
     - Send notification
3. Handle failures:
   - Retry failed payouts (up to 3 attempts)
   - Escalate to manual review if still failing

**Wallet System:**
- Users can keep winnings on platform
- Wallet balance = sum of deposits + winnings - withdrawals - entries paid with wallet
- Instant transfers between wallet and tournament entries (no fees)
- Withdrawals to bank via Stripe (2-3 days standard, instant for fee)

**Compliance:**
- KYC for users earning >$600/year (collect SSN, name, address)
- Generate 1099 forms annually
- Fraud prevention: Stripe Radar for stolen cards
- Payout velocity limits (prevent rapid cash-out from compromised accounts)

---

### 7. Notification Service

**Responsibilities:**
- Send push notifications to mobile apps
- Send emails
- Send SMS (optional, for critical alerts)
- Manage notification preferences

**Key APIs:**
- `POST /notifications/send` - Send notification (internal service-to-service)
- `GET /notifications/preferences` - Get user notification settings
- `PUT /notifications/preferences` - Update settings

**Notification Types:**
- **Tournament related:**
  - Tournament starting soon
  - Tournament ending soon
  - You've been bumped down on leaderboard
- **Catch status:**
  - Catch accepted
  - Catch rejected (with reason)
  - Catch under review
- **Verification:**
  - Video verification required
  - Video verified
- **Results:**
  - Tournament ended
  - You won! (with prize amount)
- **Payment:**
  - Payout sent
  - Payment failed

**Infrastructure:**
- Push notifications: Firebase Cloud Messaging (FCM) for Android, Apple Push Notification Service (APNS) for iOS
- Emails: SendGrid or AWS SES
- SMS: Twilio (for critical only, to reduce cost)
- Queue-based: Use message queue to buffer and batch notifications

---

### 8. Admin Review Service

**Responsibilities:**
- Manage review queue (flagged catches)
- Provide admin dashboard with catch details and fraud signals
- Handle admin actions (approve, reject, request video, ban user)

**Key APIs (Admin-only):**
- `GET /admin/catches/pending` - Get review queue
- `POST /admin/catches/:id/approve` - Approve catch
- `POST /admin/catches/:id/reject` - Reject catch with reason
- `POST /admin/catches/:id/request-video` - Request video verification
- `POST /admin/users/:id/ban` - Ban user

**Admin Dashboard (Web App):**
- Built with React or Vue.js
- Real-time updates via WebSockets
- Displays:
  - Catch photo with zoom
  - All fraud signals and scores
  - EXIF data
  - User history
  - GPS on map with tournament boundaries
  - Similar/duplicate catches
- Admin actions accessible via buttons

**Review Queue Prioritization:**
- High priority: Critical flags, top 3 finishers, large fish
- Medium priority: Multiple moderate flags
- Low priority: Single minor flag, random audits
- SLA: High priority reviewed within 15 minutes

---

## Data Architecture

### Primary Database (PostgreSQL)

**Why PostgreSQL:**
- Relational data (users, tournaments, catches, transactions)
- ACID compliance (critical for payments)
- PostGIS extension for geospatial queries (point-in-polygon)
- JSON support for flexible fraud signals storage

**Key Tables:**
- `users` - User accounts and profiles
- `tournaments` - Tournament definitions
- `tournament_participants` - Many-to-many relationship
- `catch_sessions` - Catch codes and session data
- `catches` - Catch submissions with metadata
- `payment_methods` - Tokenized payment info
- `transactions` - Financial transactions
- `wallets` - User wallet balances
- `fraud_signals` - Detailed fraud analysis per catch (for ML training)
- `bans` - User bans and suspensions

**Scaling:**
- Read replicas for read-heavy queries (leaderboards, tournament lists)
- Partitioning for large tables (catches by tournament, transactions by date)
- Indexing: GPS (PostGIS index), timestamps, user_id, tournament_id

---

### Cache Layer (Redis)

**Why Redis:**
- In-memory = fast
- TTL (time-to-live) for automatic expiration
- Pub/sub for real-time updates

**Use Cases:**
- **Leaderboards:** Cache leaderboard results (TTL: 2 seconds)
  - Key: `leaderboard:tournament:{tournament_id}`
  - Value: JSON array of ranked catches
- **User fraud scores:** Quick lookup
  - Key: `fraud_score:user:{user_id}`
  - Value: Score (0-100)
- **Active sessions:** Track catch sessions
  - Key: `session:{session_id}`
  - Value: Session data (code, GPS, expiration)
  - TTL: 10 minutes
- **Image hashes:** Fast duplicate detection
  - Key: `hash:{phash_value}`
  - Value: Catch ID(s) with this hash
- **Rate limiting:** Prevent abuse
  - Key: `rate_limit:{user_id}:{endpoint}`
  - Value: Request count
  - TTL: 1 hour

**Scaling:**
- Redis Cluster for horizontal scaling
- Persistence enabled (RDB snapshots) for durability

---

### Object Storage (AWS S3 / Google Cloud Storage)

**Why Object Storage:**
- Scalable (unlimited storage)
- Cheap for large files (photos, videos)
- CDN integration for fast delivery

**Structure:**
```
/catches/{tournament_id}/{catch_id}/photo.jpg
/catches/{tournament_id}/{catch_id}/video.mp4
/catches/{tournament_id}/{catch_id}/thumbnail.jpg
/users/{user_id}/profile.jpg
```

**Lifecycle Policies:**
- Photos: Keep full-res for 1 year, then archive to Glacier (cheaper storage)
- Thumbnails: Keep for 2 years
- Videos: Keep for 90 days (only needed for verification window)

**Security:**
- Private buckets (not publicly accessible)
- Signed URLs for temporary access (app requests signed URL from backend, valid for 1 hour)
- Encryption at rest (AES-256)

---

### Message Queue (RabbitMQ / AWS SQS)

**Why Message Queue:**
- Decouples services (catch submission doesn't wait for CV processing)
- Buffers traffic spikes (handle 1000 submissions in 1 minute)
- Enables asynchronous processing
- Retry logic for failed jobs

**Queues:**
- `catch_processing` - New catch submissions to be analyzed
- `fraud_analysis` - Catches needing fraud check
- `cv_analysis` - Catches needing CV measurement
- `notifications` - Notifications to be sent
- `payouts` - Payouts to be processed

**Workers:**
- Separate worker processes consume queues
- Scale workers independently based on queue depth
- Dead letter queue for failures (manual intervention)

---

## Data Flow Examples

### Example 1: User Submits a Catch

**Step-by-Step:**

1. **Mobile App → API Gateway → Catch Service:**
   - `POST /catches`
   - Payload: Photo (multipart), GPS, timestamp, session ID, tournament ID

2. **Catch Service:**
   - Validates session (exists, active, correct code?)
   - Validates GPS (within tournament boundaries?)
   - Validates timestamp (within tournament window?)
   - Uploads photo to S3
   - Creates catch record in database (status: "pending")
   - Publishes message to `catch_processing` queue
   - Returns response to app: "Analyzing photo..."

3. **Background Worker (consumes `catch_processing` queue):**
   - Fetches photo from S3
   - Calls CV Service: `POST /cv/analyze`
   - Receives CV results (code detected? board detected? fish measured?)

4. **Background Worker → Fraud Detection Service:**
   - Calls `POST /fraud/analyze`
   - Receives fraud signals (EXIF, duplicates, manipulation, behavioral, environmental)

5. **Background Worker - Decision Logic:**
   - If CV successful + low fraud score:
     - Update catch status to "accepted"
     - Invalidate leaderboard cache (Redis)
     - Publish message to `notifications` queue
   - If CV failed or critical fraud flags:
     - Update catch status to "rejected"
     - Set rejection reason
     - Publish message to `notifications` queue
   - If moderate flags:
     - Update catch status to "under_review"
     - Add to admin review queue
     - Publish message to `notifications` queue

6. **Notification Service (consumes `notifications` queue):**
   - Sends push notification to user: "Catch accepted! 23.75 inch Snook"
   - Or: "Catch rejected. [Reason]"

7. **Mobile App:**
   - User receives notification
   - Leaderboard updates (next poll retrieves updated cached leaderboard)

**Timeline:** 5-10 seconds from submission to user notification

---

### Example 2: Tournament Ends and Winners Are Paid

**Step-by-Step:**

1. **Scheduled Job (cron):**
   - Runs every minute
   - Checks for tournaments where `end_time` has passed and `status` is "active"
   - Calls `POST /tournaments/:id/finalize` for each

2. **Tournament Service - Finalize Tournament:**
   - Set tournament status to "closed"
   - Calculate final leaderboard (query all "accepted" catches, rank)
   - Identify top finishers (top 3 based on prize structure)
   - Trigger pre-payout verification:
     - Are all top finishers' catches reviewed? (If not, expedite review)
     - Are video verifications complete? (If required but pending, wait or disqualify)
   - If all clear, proceed

3. **Tournament Service → Payment Service:**
   - For each winner:
     - Calculate payout (prize pool × percentage)
     - Call `POST /payments/payout`
     - Payload: User ID, amount, payout method

4. **Payment Service:**
   - Initiates Stripe payout
   - Records transaction in database
   - If successful:
     - Update transaction status to "completed"
     - Publish message to `notifications` queue
   - If failed:
     - Update transaction status to "failed"
     - Retry logic (up to 3 attempts)
     - Escalate to manual review if still failing

5. **Notification Service:**
   - Sends push notification: "Congratulations! You won $50. Payout sent to your bank account."
   - Sends email with transaction details

6. **Tournament Service:**
   - Once all payouts complete, set tournament status to "finalized"
   - Archive tournament data

**Timeline:** 1-5 minutes from tournament end to payouts initiated

---

## Infrastructure & Deployment

### Cloud Provider

**AWS (Recommended):**
- **Compute:** EC2 (API servers), Lambda (serverless functions), ECS (containerized services)
- **Database:** RDS PostgreSQL (managed database)
- **Cache:** ElastiCache Redis (managed Redis)
- **Storage:** S3 (object storage)
- **CDN:** CloudFront (fast image delivery)
- **Queue:** SQS (message queue)
- **ML:** SageMaker (model training), EC2 p3 instances (GPU inference)
- **Payments:** Stripe (third-party, works with any cloud)

**Google Cloud (Alternative):**
- **Compute:** Compute Engine, Cloud Run (containers), Cloud Functions
- **Database:** Cloud SQL PostgreSQL
- **Cache:** Memorystore Redis
- **Storage:** Cloud Storage
- **CDN:** Cloud CDN
- **Queue:** Cloud Pub/Sub
- **ML:** Vertex AI, GPU instances

**Why AWS:** Mature ecosystem, extensive documentation, Stripe integration well-tested

---

### Deployment Architecture

**API Gateway:**
- AWS API Gateway or Nginx reverse proxy
- Handles:
  - HTTPS termination
  - Authentication (JWT validation)
  - Rate limiting (per user, per endpoint)
  - Request routing to backend services
  - Load balancing

**Backend Services:**
- Containerized with Docker
- Orchestrated with Kubernetes (EKS on AWS) or ECS
- Auto-scaling based on CPU/memory usage
- Health checks and automatic restarts

**Database:**
- AWS RDS PostgreSQL (Multi-AZ for high availability)
- Read replicas for scaling read traffic
- Automated backups (daily snapshots, 30-day retention)
- Point-in-time recovery

**Cache:**
- AWS ElastiCache Redis (cluster mode enabled)
- Replication for high availability
- Automatic failover

**Object Storage:**
- AWS S3 (multi-region replication optional)
- CloudFront CDN for fast image delivery globally
- Lifecycle policies (archive old photos to Glacier)

**Message Queue:**
- AWS SQS (standard queues)
- Dead letter queues for failed messages
- Visibility timeout: 5 minutes (gives workers time to process)

**Workers:**
- Containerized background workers
- Auto-scaling based on SQS queue depth
- Separate worker pools for different queues (CV, fraud, notifications)

**Monitoring & Logging:**
- **Monitoring:** AWS CloudWatch, Datadog, or Prometheus
  - Metrics: API latency, error rates, queue depth, database CPU
  - Alerts: High error rate, slow response times, queue backlog
- **Logging:** CloudWatch Logs or ELK stack (Elasticsearch, Logstash, Kibana)
  - Centralized logging for all services
  - Searchable logs for debugging
- **Error Tracking:** Sentry
  - Captures exceptions and stack traces
  - Alerts on new errors

**CI/CD:**
- **Version Control:** GitHub or GitLab
- **CI/CD Pipeline:** GitHub Actions, GitLab CI, or Jenkins
  - Automated testing (unit tests, integration tests)
  - Docker image builds
  - Deployment to staging environment
  - Manual approval for production deployment
- **Infrastructure as Code:** Terraform or AWS CloudFormation
  - Define infrastructure in code
  - Repeatable deployments

---

### Security

**Authentication & Authorization:**
- JWT tokens for user authentication
  - Payload: User ID, role, expiration
  - Signed with secret key (RS256 algorithm)
  - Short-lived: 1 hour access token, 30-day refresh token
- Admin users: Separate role, elevated permissions
- API Gateway validates JWT on all requests

**Data Encryption:**
- **In Transit:** HTTPS/TLS 1.3 for all API communication
- **At Rest:**
  - Database: Encrypted with AWS RDS encryption (AES-256)
  - S3: Server-side encryption (SSE-S3 or SSE-KMS)
  - Redis: Encryption enabled

**Secrets Management:**
- AWS Secrets Manager or HashiCorp Vault
- Store: Database passwords, API keys, JWT secret, Stripe keys
- Never hardcode secrets in code

**Network Security:**
- VPC (Virtual Private Cloud) with private subnets for databases
- Security groups: Restrict access (e.g., database only accessible from API servers)
- No public IPs for internal services

**DDOS Protection:**
- AWS Shield (standard and advanced)
- Rate limiting at API Gateway
- CloudFront for edge caching

**PCI Compliance:**
- Stripe handles all card data (never touches our servers)
- Tokenized payment methods only

**GDPR/Privacy Compliance:**
- User data deletion on request
- Privacy policy and terms of service
- Data retention policies (delete old catches after X years?)

---

### Scalability

**Horizontal Scaling:**
- API servers: Auto-scale based on CPU (target: 70% CPU)
- Workers: Auto-scale based on queue depth
- Database: Read replicas for scaling reads

**Caching:**
- Redis for frequently accessed data (leaderboards, user profiles)
- CloudFront CDN for images (reduce S3 load)
- API response caching (tournament lists cached for 1 min)

**Database Optimization:**
- Indexes on frequently queried fields (user_id, tournament_id, GPS coordinates)
- Query optimization (use EXPLAIN to analyze slow queries)
- Connection pooling (reuse database connections)

**Asynchronous Processing:**
- Heavy operations (CV, fraud detection) happen in background
- API responds quickly, user doesn't wait

**Load Testing:**
- Simulate 1000 concurrent users submitting catches
- Identify bottlenecks (CPU, database, network)
- Optimize before launch

**Cost Optimization:**
- Use spot instances for workers (cheaper, can tolerate interruptions)
- Archive old photos to Glacier (90% cheaper than S3)
- Right-size instances (don't over-provision)

---

## Mobile App Architecture

### Platform Choice

**Option 1: Cross-Platform (React Native or Flutter)**
- **Pros:**
  - Share 80-90% of code between iOS and Android
  - Faster development (one codebase)
  - Easier to maintain
  - Good performance for most use cases
- **Cons:**
  - Slightly lower performance than native
  - Some platform-specific features require native modules
- **Recommended for:** Most cases, especially MVPs

**Option 2: Native (Swift for iOS, Kotlin for Android)**
- **Pros:**
  - Best performance
  - Full access to platform features
  - Platform-specific UI feels native
- **Cons:**
  - Two separate codebases (slower development)
  - Higher cost (need iOS and Android developers)
- **Recommended for:** If performance is critical or app is very complex

**Recommendation:** Start with React Native or Flutter for faster MVP, consider native later if needed

---

### Mobile App Components

**State Management:**
- Redux (React Native) or Provider (Flutter)
- Manages app state: User session, tournament list, catches, leaderboards

**Networking:**
- Axios (React Native) or Dio (Flutter)
- HTTP client for API calls
- Interceptors for JWT token attachment

**Camera:**
- React Native Camera or Flutter Camera plugin
- Captures photos and videos
- Access to metadata (GPS, timestamp)

**Geolocation:**
- React Native Geolocation or Flutter Geolocator
- Continuous GPS tracking during catch session

**Push Notifications:**
- Firebase Cloud Messaging (cross-platform)
- Handles push notifications on iOS and Android

**Local Storage:**
- AsyncStorage (React Native) or SharedPreferences (Flutter)
- Store user session, cached data
- Persist JWT tokens

**Image Upload:**
- Multipart form data for photo uploads
- Compress images before upload (reduce bandwidth)
- Progress indicators for user feedback

**Real-Time Updates:**
- Polling (simple): Poll leaderboard API every 5 seconds
- WebSockets (advanced): Server pushes leaderboard updates to app

---

## Admin Dashboard Architecture

**Web App (React or Vue.js):**
- Single-page application (SPA)
- Responsive design (works on desktop and tablet)

**Key Views:**
- **Review Queue:** List of flagged catches with filters
- **Catch Detail:** Full catch analysis with photo, metadata, fraud signals
- **User Management:** Search users, view history, ban/suspend
- **Tournament Monitoring:** List of active tournaments, real-time stats
- **Analytics Dashboard:** Fraud detection rates, user growth, revenue

**Authentication:**
- Separate admin login (JWT tokens)
- Role-based access control (reviewer, senior admin, super admin)

**Real-Time Updates:**
- WebSockets for live queue updates (new flagged catches appear instantly)
- Server-Sent Events (SSE) as alternative

**API Endpoints (Admin-Only):**
- All admin APIs require authentication + admin role
- Rate limited (prevent brute force)

---

## Third-Party Integrations

### Stripe (Payments)
- **SDK:** Stripe Node.js or Python SDK
- **Features Used:**
  - Payment Intents (charge entry fees)
  - Payouts (send winnings to bank)
  - Stripe Radar (fraud prevention)
  - Customer management (store payment methods)

### Firebase Cloud Messaging (Push Notifications)
- **SDK:** Firebase Admin SDK
- **Integration:** Server sends push notification via FCM, FCM delivers to devices

### Weather API (OpenWeatherMap)
- **API:** RESTful HTTP API
- **Usage:** Query weather for GPS coordinates + timestamp
- **Caching:** Cache results for 1 hour (same location/time queried repeatedly)

### AWS Rekognition (AI Image Analysis)
- **SDK:** AWS SDK
- **Features Used:**
  - Custom Labels (train on manipulated vs. real photos)
  - Face comparison (optional, for video verification)
- **Alternative:** Google Cloud Vision API

### Email Service (SendGrid or AWS SES)
- **SDK:** SendGrid Node.js or AWS SES SDK
- **Usage:** Transactional emails (account confirmation, receipts, notifications)

---

## Performance Targets

**API Response Times:**
- GET requests (lists, leaderboards): <200ms
- POST requests (catch submission, payment): <500ms
- Image upload: <3 seconds (depends on network)

**Background Processing:**
- CV analysis: <5 seconds per image
- Fraud detection: <3 seconds per catch
- Total catch processing: <10 seconds

**Leaderboard Updates:**
- Real-time feel: Updates visible within 2 seconds of catch acceptance

**App Launch Time:**
- Cold start: <3 seconds
- Warm start: <1 second

**Uptime:**
- Target: 99.9% uptime (8.76 hours downtime per year)
- Monitoring and alerts for outages

---

## Disaster Recovery & Business Continuity

**Database Backups:**
- Automated daily snapshots (RDS)
- 30-day retention
- Point-in-time recovery (restore to any second in last 30 days)
- Test restore process quarterly

**Data Replication:**
- Multi-AZ deployment (database replicated across availability zones)
- Automatic failover if primary zone fails

**Photo/Video Backups:**
- S3 versioning enabled (can recover deleted files)
- Optional: Cross-region replication for critical tournaments

**Incident Response Plan:**
1. Monitoring alerts ops team
2. On-call engineer investigates
3. Escalate to senior engineer if needed
4. Post-mortem after incident (root cause analysis, preventive measures)

**Rollback Strategy:**
- Blue/green deployments (run new version alongside old, switch traffic gradually)
- If new version has issues, instant rollback to previous version

---

## Compliance & Legal

**Age Restrictions:**
- Users must be 18+ (or with parental consent)
- Age verification on signup

**Gambling Laws:**
- Platform is skill-based competition, NOT gambling
- Legal review in each state before launch
- Terms of service clearly state skill-based nature

**Privacy:**
- GDPR compliance (if operating in EU)
- CCPA compliance (California)
- Privacy policy: What data is collected, how it's used, user rights

**Terms of Service:**
- Rules of platform
- Anti-cheat policy
- Dispute resolution
- Limitation of liability

**Tax Reporting:**
- 1099 forms for winners earning >$600/year
- KYC collection for high earners

---

## Summary

This technical architecture provides:
- **Scalability:** Can handle 10,000+ concurrent users, 100+ simultaneous tournaments
- **Reliability:** 99.9% uptime, automated failover, backups
- **Security:** Encryption, authentication, fraud prevention
- **Performance:** Real-time leaderboards, <10 second catch processing
- **Maintainability:** Microservices, containerization, CI/CD
- **Cost-Effectiveness:** Cloud-native, auto-scaling, optimized storage

The architecture is designed to start lean (MVP with manual review) and scale progressively (add AI, video verification, advanced features) as the platform grows.
