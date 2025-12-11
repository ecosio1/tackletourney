# Implementation Roadmap

## Overview

This roadmap breaks down the fishing tournament platform into 8 phased implementation stages. Each phase builds on the previous, allowing for iterative development, testing, and validation.

**Key Principles:**
- Start small, prove concept, scale gradually
- Anti-cheat must be strong from day one
- Get to MVP quickly (Phase 1-2: 8 weeks)
- Add automation progressively (reduce manual review)
- Revenue starts at Phase 6 (real money tournaments)

---

## Phase 1: MVP Core (Weeks 1-4)

### Goal
Build functional tournament app with basic catch submission and manual review. Prove core mechanics work.

### Scope
- Free tournaments only (no payments yet)
- Manual measurement entry (no CV yet)
- Basic anti-cheat (GPS, timestamps, no uploads)
- Admin reviews all catches manually

### Modules to Build

#### 1.1 User Authentication & Profiles
**Mobile App (iOS & Android):**
- Sign up / Sign in screens
- Email + password auth
- Social login (Apple, Google)
- Profile creation: username, region, favorite species
- Profile screen with basic stats

**Backend:**
- User authentication service (JWT tokens)
- User database (PostgreSQL)
- Password hashing (bcrypt)
- Session management

**Deliverables:**
- Users can create accounts and log in
- Profiles display username and basic info

---

#### 1.2 Tournament Browsing & Joining
**Mobile App:**
- Home screen: List of tournaments
- Tournament cards: Name, species, time, entry (FREE), participants
- Tournament detail screen: Rules, leaderboard, info
- "Join Tournament" button (no payment, just confirmation)

**Backend:**
- Tournament database schema
  - ID, name, species, region boundaries (GeoJSON), time window, rules
- Tournament management API
  - GET /tournaments (list active tournaments)
  - POST /tournaments/:id/join (user joins tournament)
- User-Tournament relationship (many-to-many)

**Deliverables:**
- Admin can create tournaments (via database or basic admin panel)
- Users can browse and join free tournaments
- Tournament rules displayed

---

#### 1.3 Basic Catch Submission
**Mobile App:**
- "Log a Catch" button in tournament detail
- Pre-flight checks:
  - GPS enabled?
  - Camera permission?
  - Within tournament time window?
  - Within geographic boundaries?
- In-app camera only (no gallery uploads)
- Capture photo with:
  - GPS coordinates
  - Timestamp (device + server)
  - Photo from camera
- Manual measurement entry: User types fish length
- Submit catch

**Backend:**
- Catch submission API
  - POST /catches
  - Receive: Photo, GPS, timestamp, user-entered length, tournament ID
  - Store photo in cloud storage (AWS S3, Google Cloud Storage)
  - Store metadata in database
- Basic validation:
  - GPS within tournament boundaries? (point-in-polygon check)
  - Timestamp within tournament window?
  - Photo uploaded (not from gallery - check EXIF if possible)
- All catches go to "pending review" status

**Deliverables:**
- Users can take photo in-app and submit catch
- GPS and time validated automatically
- Catches stored for admin review

---

#### 1.4 Simple Leaderboard
**Mobile App:**
- Leaderboard tab in tournament detail
- Display:
  - Rank, username, fish length, time submitted
  - Photo thumbnail
- Pull to refresh
- User's own rank highlighted
- Only shows "accepted" catches

**Backend:**
- Leaderboard calculation:
  - Query accepted catches for tournament
  - Order by length DESC, timestamp ASC (tie-breaker)
  - Return ranked list
- API: GET /tournaments/:id/leaderboard
- Cache results (simple in-memory cache or Redis)

**Deliverables:**
- Real-time leaderboard updates when catches approved
- Users can see rankings

---

#### 1.5 Admin Review Dashboard (Web)
**Web Admin Panel:**
- Login for admin users
- Review queue:
  - List all pending catches
  - Display: Photo, user, tournament, GPS, timestamp, user-entered length
  - Map showing GPS location
- Catch detail view:
  - Full-size photo
  - Metadata
  - GPS on map with tournament boundaries overlay
  - Time window check
- Admin actions:
  - **Approve:** Sets catch status to "accepted", updates leaderboard
  - **Reject:** Sets status to "rejected", user notified
  - Note field (reason for rejection)

**Backend:**
- Admin authentication (separate from users)
- Admin API:
  - GET /admin/catches/pending
  - POST /admin/catches/:id/approve
  - POST /admin/catches/:id/reject
- Notification service (push notification or in-app message to user)

**Deliverables:**
- Admins can review and approve/reject catches
- Users notified of decisions

---

### Phase 1 Testing
- Recruit 20-30 beta testers (friends, local fishing club)
- Run 3-5 free tournaments
- Gather feedback:
  - Is camera flow smooth?
  - Are GPS boundaries correct?
  - How long does admin review take?
- Iterate on UX

### Phase 1 Deliverables Summary
✓ Working mobile app (iOS & Android)
✓ Users can sign up, browse tournaments, join, submit catches
✓ Basic anti-cheat: GPS and time validation
✓ Admin can review and approve catches manually
✓ Leaderboards update in real-time
✓ No payments (free tournaments only)

**Timeline:** 4 weeks (MVP sprint)

---

## Phase 2: Anti-Cheat Foundation (Weeks 5-8)

### Goal
Add core anti-cheat mechanisms to prevent obvious fraud.

### Scope
- Unique catch codes (prevents photo reuse)
- EXIF validation (detects editing)
- Duplicate detection (catches repeat photos)
- Measuring board requirement (standardizes measurement)
- Automatic rejection for clear violations

### Modules to Build

#### 2.1 Catch Code System
**Mobile App:**
- "Log a Catch" now starts a session
- Server generates unique code (e.g., "XG7K")
- Code displayed prominently
- Instructions: "Write this code on paper, place in photo"
- Code shown in camera overlay as reminder
- Session expires in 10 minutes

**Backend:**
- Session generation:
  - POST /sessions/start
  - Generate random 4-6 character code (alphanumeric, avoid confusables)
  - Store: session ID, user ID, tournament ID, code, GPS at start, timestamp
  - Return code to app
  - Set expiration (10 min)
- Session validation on catch submission:
  - Does session exist?
  - Is code correct?
  - Is session still active (not expired)?
  - Has session been used already? (single-use)
- OCR to detect code in photo:
  - Use Google Cloud Vision OCR or Tesseract
  - Search for code string in detected text
  - If not found: Auto-reject

**Deliverables:**
- Every catch requires unique code visible in photo
- Old photos can't be reused (wrong code)
- Codes expire to prevent pre-planning

---

#### 2.2 EXIF Data Validation
**Backend:**
- Extract EXIF data from uploaded photo:
  - Python: Pillow or ExifRead library
  - Extract: Camera model, timestamp, GPS (if embedded), software tags
- Validation checks:
  - **EXIF exists:** If stripped, flag high risk
  - **Editing software detected:** Check for Photoshop, GIMP signatures
    - If found: Auto-reject or flag for review
  - **Timestamp match:** EXIF timestamp vs. submission time
    - Tolerance: ±5 minutes
    - If mismatch: Flag
  - **GPS match:** EXIF GPS vs. submitted GPS
    - Should be very close
    - If mismatch: Flag
  - **Device match:** If user has registered device, check EXIF camera model
    - Track user's device on first submission
    - Flag if different (may be legitimate device upgrade)

**Admin Dashboard:**
- Display EXIF data in catch review
- Show flags: "Editing software detected", "Timestamp mismatch"
- Admin can override if explainable

**Deliverables:**
- EXIF analysis catches obviously edited photos
- Automated rejection for critical flags
- Manual review for moderate flags

---

#### 2.3 Duplicate Photo Detection
**Backend:**
- Perceptual hashing (pHash):
  - Python: ImageHash library
  - Generate hash for each submitted photo
  - Store hash in database with catch ID
- On new submission:
  - Generate hash
  - Compare against ALL previous hashes (across all tournaments, all users)
  - Calculate similarity (Hamming distance)
  - Thresholds:
    - >95% similar: Likely duplicate → Auto-reject
    - 90-95% similar: Possible duplicate → Flag for review
    - <90%: Different photo → Accept
- Database optimization:
  - Index hashes for fast lookup
  - Use nearest-neighbor search (Annoy, FAISS libraries)

**Admin Dashboard:**
- When duplicate detected, show both photos side-by-side
- Display similarity percentage
- Admin can confirm duplicate or approve as different

**Deliverables:**
- Catches users reusing same photo
- Catches stolen photos
- Cross-tournament checking

---

#### 2.4 Measuring Board Requirement
**Mobile App:**
- Before joining tournament, user must confirm:
  - "I have an approved measuring board"
  - Checkbox required to join
- Link to "Approved Boards" page:
  - Images of approved board designs
  - Where to buy
  - DIY instructions (build your own)

**Approved Board Specifications (Document):**
- Define 2-3 approved board designs
- Specifications:
  - Length: 48+ inches
  - High-contrast colors (yellow + black recommended)
  - Clear inch markings
  - Bump stop for fish head
  - Standardized dimensions
- Provide to manufacturers for production
- Provide DIY template (printable PDF)

**Backend (Basic Board Validation):**
- For now: Admin manually checks if board is present in photo
- Future (Phase 3): CV model detects board automatically

**Deliverables:**
- Users required to have board
- Board specifications defined
- Manual admin check for board presence

---

#### 2.5 Automatic Rejection Rules
**Backend:**
- Implement auto-reject logic:
  - **Code not detected:** OCR finds no match → Reject
    - Message: "Verification code not found. Ensure code is visible."
  - **GPS out of bounds:** Outside tournament region → Reject
    - Message: "GPS location outside tournament boundaries."
  - **Time outside window:** Before/after tournament hours → Reject
    - Message: "Catch submitted outside tournament time window."
  - **Duplicate hash >95%:** Already used photo → Reject
    - Message: "Duplicate photo detected."
  - **Editing software detected:** EXIF shows Photoshop → Reject
    - Message: "Image appears to have been edited."
- Auto-rejected catches:
  - Do NOT go to admin queue (reduces workload)
  - User notified immediately
  - Logged for fraud score tracking

**Deliverables:**
- 50-70% of fraud attempts auto-rejected
- Admin queue has only borderline cases
- Faster user feedback

---

### Phase 2 Testing
- Run 5-10 free tournaments with beta testers
- Intentionally try to cheat (internal red team):
  - Submit old photos
  - Edit photos in Photoshop
  - Use GPS spoofer
  - Reuse photos
- Measure: What % of cheating attempts are caught?
- Target: >80% caught automatically

### Phase 2 Deliverables Summary
✓ Unique catch codes prevent photo reuse
✓ EXIF validation catches edited photos
✓ Duplicate detection catches repeat submissions
✓ Measuring board required (manual check for now)
✓ Automatic rejection for clear violations
✓ Admin workload reduced (only borderline cases)

**Timeline:** 4 weeks

---

## Phase 3: Computer Vision Measurement (Weeks 9-12)

### Goal
Automate fish length measurement using computer vision. Eliminate manual entry and disputes.

### Scope
- CV model detects measuring board
- CV model detects fish and measures length
- Automatic calculation and rounding
- User sees measurement before submitting

### Modules to Build

#### 3.1 Board Detection Model
**Training Data Collection:**
- Collect 500-1000 photos of fish on approved boards
- Label each photo:
  - Bounding box around board
  - Keypoints: Bump stop, calibration markers, end of board
- Use beta testers to submit training data
- Include variations: Lighting, angles, board wear

**Model Training:**
- Use object detection model: YOLO v8 or EfficientDet
- Train to detect:
  - Board presence (bounding box)
  - Board type (which approved design)
  - Calibration markers (for pixel-to-inch conversion)
- Frameworks: TensorFlow or PyTorch
- Training environment: Google Colab or AWS SageMaker

**Model Deployment:**
- Export trained model
- Deploy as API endpoint (Flask or FastAPI)
- Scalable: Containerize with Docker, deploy on AWS ECS or Google Cloud Run

**Deliverables:**
- CV model detects board in photo (>95% accuracy)
- Identifies board type
- Locates calibration markers

---

#### 3.2 Fish Segmentation & Measurement
**Fish Detection:**
- Train segmentation model (U-Net or Mask R-CNN)
- Detect:
  - Fish boundaries (head to tail)
  - Head position (should be at bump stop)
  - Tail tip position

**Length Calculation:**
- Steps:
  1. Detect board calibration markers (known positions)
  2. Calculate pixel-to-inch ratio (pixels per inch)
  3. Measure pixel distance from fish head to tail tip
  4. Convert pixels to inches using ratio
  5. Round DOWN to nearest 0.25 inch
- Handle perspective distortion (if photo taken at angle)
- Confidence scoring:
  - High confidence: Clear board, fish well-positioned, good lighting
  - Low confidence: Blurry, fish bent, tail obscured

**Validation Checks:**
- Fish head at bump stop? (If not, flag - could be adding inches)
- Entire fish visible? (Tail not cropped out)
- Fish aligned with board? (Not at angle)
- Single fish? (Not multiple fish)

**Deliverables:**
- CV model measures fish length
- Accuracy target: ±0.25 inch for 90% of cases
- Confidence score indicates measurement reliability

---

#### 3.3 User-Facing Measurement Flow
**Mobile App:**
- After user takes photo, "Analyzing photo..." screen
- CV processing (3-7 seconds):
  - ✓ Code detected
  - ✓ Board detected
  - ⏳ Measuring fish...
- Result screen:
  - Photo with overlay:
    - Green line from head to tail
    - Measurement: "23.75 inches"
    - Code highlighted (green box)
  - Info card:
    - Species: [Auto-detected or user selects]
    - Length: 23.75 in
    - Location, time, tournament
  - Buttons:
    - "Submit This Catch" (primary)
    - "Retake Photo" (if measurement seems wrong)

**Error Handling:**
- If board not detected:
  - "Measuring board not detected. Ensure board is fully visible."
  - "Retake Photo" button
- If fish not detected:
  - "Fish not clearly visible. Ensure entire fish is in frame."
- If measurement uncertain (low confidence):
  - "Cannot determine accurate measurement."
  - Tips: "Ensure fish is aligned, tail is visible, good lighting"

**Deliverables:**
- Users see measurement automatically
- Can retry if unsatisfied
- Clear error messages for failed detections

---

#### 3.4 Backend Integration
**CV Service:**
- Microservice architecture:
  - Separate CV service from main backend
  - API: POST /cv/measure
  - Input: Photo (base64 or URL)
  - Output: JSON
    ```json
    {
      "code_detected": true,
      "board_detected": true,
      "fish_detected": true,
      "length_inches": 23.75,
      "confidence": 0.92,
      "errors": []
    }
    ```
- Scalable: Horizontal scaling for high volume
- Queue: Use message queue (RabbitMQ, AWS SQS) to handle bursts

**Main Backend:**
- On catch submission:
  - Send photo to CV service
  - Receive measurement result
  - If successful (code + board + fish detected, confidence >0.8):
    - Store measurement
    - Accept catch (or flag for review if other signals present)
  - If failed:
    - Return specific error to user
    - Allow retry

**Admin Dashboard:**
- Display CV results:
  - Measurement with confidence score
  - Overlay visualization (head/tail points)
  - Can override measurement if needed

**Deliverables:**
- Automated measurement eliminates manual entry
- Users can't lie about length
- Admin can review CV decisions

---

### Phase 3 Testing
- Run tournaments with automated measurement
- Compare CV measurements to manual measurements (ground truth)
- Track accuracy and confidence
- Collect edge cases (bent fish, poor lighting) to improve model
- Target: >90% of catches auto-measured successfully

### Phase 3 Deliverables Summary
✓ Computer vision automatically measures fish
✓ Users see measurement in real-time
✓ Manual entry eliminated (no user-entered lengths)
✓ Measurement disputes eliminated (objective calculation)
✓ Admin workload further reduced

**Timeline:** 4 weeks

---

## Phase 4: Advanced Fraud Detection (Weeks 13-16)

### Goal
Add AI-powered fraud detection to catch sophisticated cheating attempts.

### Scope
- Image manipulation detection (Photoshop, cloning)
- Behavioral analytics (user patterns)
- Environmental cross-reference (weather, tides)
- Fraud scoring system

### Modules to Build

#### 4.1 AI Image Manipulation Detection
**Approach:**
- Integrate third-party AI service (AWS Rekognition) OR
- Build custom model

**Option A: AWS Rekognition Custom Labels**
- Train on dataset:
  - Legitimate photos: Approved catches
  - Manipulated photos: Photoshopped images (create test set)
- Model detects manipulation probability

**Option B: Open-Source (ELA + Custom Model)**
- Error Level Analysis (ELA):
  - Python: Pillow + NumPy
  - Detects re-compressed regions (edited areas)
- Train CNN on ELA outputs to classify manipulated vs. real

**Techniques Implemented:**
- Clone stamp detection
- Lighting inconsistency detection
- Screen photo detection (moiré patterns)
- Proportion analysis (fish stretched digitally?)

**Backend Integration:**
- On catch submission, run manipulation detection
- Output: Manipulation confidence (0-100%)
- Thresholds:
  - <20%: Clean → Accept
  - 20-50%: Possible → Flag if other signals present
  - 50-80%: Likely → Hold for manual review
  - >80%: Almost certain → Auto-reject or critical review

**Deliverables:**
- AI detects Photoshopped images
- Catches sophisticated manipulation attempts
- Reduces false positives with confidence scoring

---

#### 4.2 Behavioral Analytics
**User-Level Metrics:**
- Track per user:
  - Total catches submitted
  - Acceptance rate (% approved)
  - Average fish size (percentile)
  - Geographic spread (locations fished)
  - Time-of-day patterns
  - Device consistency

**Anomaly Detection:**
- **High catch frequency:** >10 catches/hour (bot-like)
- **Impossible travel:** Two catches 50 miles apart in 15 minutes
- **Always large fish:** Every catch >80th percentile (suspicious)
- **Unusual times:** Fishing at 3 AM repeatedly (using old photos?)

**Fraud Score Calculation:**
- Start: 0 (neutral)
- Increase for violations/flags
- Decrease for clean catches
- Persistent over time
- Displayed in admin dashboard

**Backend:**
- User analytics table: Store metrics per user
- Background job: Calculate anomalies daily
- Update fraud score based on patterns

**Deliverables:**
- Detects suspicious user behavior
- Fraud score tracks user trustworthiness
- Admins can see user history in context

---

#### 4.3 Environmental Cross-Reference
**Integrations:**
- **Weather API:** OpenWeatherMap or Weather.com
  - Query weather for GPS + timestamp
  - Check if photo conditions match (sunny vs. rainy)
- **Sunrise/Sunset:** Calculate for location + date
  - Flag photos with daylight at night
- **Tide API (Optional):** NOAA Tides & Currents
  - Validate tidal conditions match claim

**Validation:**
- Not binary (weather can be localized)
- Use as supporting evidence, not primary
- Flag mismatches for admin to review context

**Deliverables:**
- Cross-references catch with environmental data
- Catches impossible conditions (night photos claimed as daytime)

---

#### 4.4 Automated Flagging System
**Combine All Signals:**
- EXIF flags
- Duplicate detection
- Manipulation confidence
- Behavioral anomalies
- Environmental mismatches
- GPS/time validation
- Fraud score

**Decision Tree:**
- If any critical flag (editing software, duplicate >95%): Auto-reject
- If multiple moderate flags: Hold for manual review
- If fraud score >60: All catches reviewed manually
- If single minor flag + clean history: Accept with flag (logged)
- If all clean + low fraud score: Auto-accept

**Priority Levels:**
- High priority: Top 3 finishers, large fish, critical flags
- Medium priority: Multiple moderate flags
- Low priority: Single minor flag
- Random audit: 5% of all catches

**Deliverables:**
- >95% of fraud attempts detected
- <10% of catches require manual review
- Admin queue organized by priority

---

### Phase 4 Testing
- Red team: Advanced cheating attempts (sophisticated Photoshop, subtle edits)
- Measure detection rates
- Track false positive rate (target: <2%)
- Optimize thresholds based on real data

### Phase 4 Deliverables Summary
✓ AI detects image manipulation
✓ Behavioral analytics catch suspicious patterns
✓ Environmental data validates photo conditions
✓ Comprehensive fraud scoring
✓ 95%+ fraud detection rate
✓ Minimal manual review needed

**Timeline:** 4 weeks

---

## Phase 5: Video Verification (Weeks 17-20)

### Goal
Add video verification layer for high-stakes catches and top finishers.

### Scope
- In-app video recording (10 seconds)
- Video analysis (editing detection, matching)
- Selective verification (top 3, large fish, random audits)

### Modules to Build

#### 5.1 In-App Video Recording
**Mobile App:**
- Video verification triggered by:
  - User in top 3 of leaderboard
  - Fish length >80th percentile
  - Random 5% audit
- Push notification: "Video verification required!"
- Video recording screen:
  - 10-second countdown
  - Prompts: "Show face" → "Show board" → "Show fish" → "Show tail"
  - Single continuous take (no pausing/editing)
  - GPS + timestamp captured with video

**Video Upload:**
- Compress video (H.264, reasonable quality)
- Upload to cloud storage (S3)
- Progress indicator (may take 30-60 sec)

**Deliverables:**
- Users can record verification video in-app
- Video tied to catch submission
- 15-minute deadline enforced

---

#### 5.2 Video Analysis
**Checks:**
- **Editing detection:**
  - Analyze for cuts/splices (frame-by-frame analysis)
  - Detect discontinuities (jumpcuts)
  - Tools: FFmpeg for frame extraction, OpenCV for analysis
- **Face matching (Optional):**
  - If user has profile photo, compare face in video to profile
  - AWS Rekognition or Face++ API
  - Not required (privacy concerns) but adds verification
- **Fish matching:**
  - Compare fish in video to fish in photo
  - Visual similarity check
  - Ensure same fish
- **Metadata validation:**
  - GPS + timestamp must match photo
  - Video file EXIF checked for editing software

**Admin Review:**
- Admin watches video (or reviews analysis results)
- Side-by-side: Video still vs. photo
- Approve/reject/retry options

**Deliverables:**
- Video analysis detects editing
- Ensures video matches photo submission
- Adds strong verification layer for prizes

---

#### 5.3 Selective Verification Triggers
**When Required:**
- Leaderboard position: Top 3
- Fish size: >80th percentile for species
- User fraud score: >40
- Random: 5% of all catches
- Admin request: Manual trigger

**User Flow:**
- Notification sent via push + in-app banner
- Timer: 15 minutes to complete
- If completed: Catch eligible for prizes
- If deadline passes: Catch disqualified from prizes (removed from leaderboard or ineligible for payout)

**Deliverables:**
- Video verification scales (not required for all catches)
- Focuses on high-value situations
- Random audits deter all users from cheating

---

### Phase 5 Testing
- Run tournaments requiring video verification for podium
- Measure compliance rate (% of users who complete)
- Test video upload performance (network reliability)
- Gather user feedback (is 15 min enough time?)

### Phase 5 Deliverables Summary
✓ Video verification for high-stakes catches
✓ Editing detection prevents fake videos
✓ Selective triggers (not all catches)
✓ Strong deterrent for top-level fraud

**Timeline:** 4 weeks

---

## Phase 6: Payment & Payouts (Weeks 21-24)

### Goal
Enable real-money tournaments with automated entry fees and prize payouts.

### Scope
- Payment integration (Stripe)
- Entry fee collection
- Prize pool calculation
- Automated payouts
- Wallet system

### Modules to Build

#### 6.1 Payment Integration (Stripe)
**Mobile App:**
- Add payment method screen:
  - Credit/debit card form (Stripe Elements)
  - Apple Pay / Google Pay integration
  - Save card securely (tokenized)
- Payment method management:
  - List saved cards
  - Add/remove cards
  - Set default payment method

**Backend:**
- Stripe integration:
  - Stripe SDK (Node.js, Python, etc.)
  - Create customer profiles
  - Tokenize payment methods (never store raw card numbers)
  - PCI compliance (Stripe handles this)

**Deliverables:**
- Users can add payment methods securely
- Cards tokenized and stored

---

#### 6.2 Entry Fee Collection
**Mobile App:**
- Tournament entry flow:
  - Display entry fee (e.g., "$10")
  - Show total with processing fee (e.g., "$10.50")
  - Payment method selection
  - "Pay & Enter" button
  - Processing spinner
  - Confirmation screen

**Backend:**
- On tournament join:
  - Charge entry fee via Stripe
  - If successful: Add user to tournament
  - If failed: Show error, do not join
- Transaction logging:
  - Store: User, tournament, amount, Stripe transaction ID, timestamp
  - For accounting and disputes

**Prize Pool Calculation:**
- Sum all entry fees for tournament
- Deduct platform commission (e.g., 15%)
- Remaining = prize pool
- Split per payout structure (e.g., 70/20/10 for top 3)
- Display live prize pool on tournament card

**Deliverables:**
- Users charged entry fee when joining
- Prize pool grows with each entry
- Real-time display of prizes

---

#### 6.3 Automated Payouts
**Payout Trigger:**
- Tournament ends (time window closes)
- Final leaderboard calculated
- Top finishers identified
- Pre-payout verification:
  - All top 10 catches reviewed (if not already)
  - Video verifications complete
  - No pending disputes

**Payout Processing:**
- Calculate winner payouts (based on prize structure)
- Initiate payouts via Stripe:
  - Transfer to user's bank account (ACH - 2-3 days)
  - Instant payout option (small fee, <1 hour)
  - Credit to platform wallet (instant, no fee)

**User Notifications:**
- "Congratulations! You won $50 in [Tournament]"
- "Payout sent to [payment method]"
- Transaction ID for reference

**Deliverables:**
- Winners paid automatically after tournament
- Multiple payout options
- Transaction records for users

---

#### 6.4 Platform Wallet
**Wallet System:**
- Users can keep winnings on platform
- Wallet balance displayed in profile
- Use wallet to enter tournaments (no transaction fees)
- Withdraw to bank anytime

**Backend:**
- Wallet table: User ID, balance
- Transactions table: Deposits, withdrawals, entries, winnings
- API:
  - GET /wallet (check balance)
  - POST /wallet/withdraw (send to bank)
  - POST /wallet/deposit (add funds - optional)

**Mobile App:**
- Wallet screen in profile:
  - Current balance
  - "Withdraw" button
  - "Transaction History"
- Use wallet as payment method for entries

**Deliverables:**
- Users can accumulate winnings
- Reduces transaction fees (fewer bank transfers)
- Convenient for frequent players

---

#### 6.5 Financial Compliance
**KYC (Know Your Customer):**
- For high earners (>$600/year), collect:
  - Full name
  - SSN or Tax ID
  - Address
- Required for IRS reporting (1099 forms)

**Tax Reporting:**
- Generate 1099-MISC forms for users earning >$600
- File with IRS
- Provide copy to users

**Fraud Prevention:**
- Stripe Radar: Detects fraudulent credit cards
- Velocity limits: Max entries per day (prevent stolen card abuse)
- Payout delays for new accounts (first win held 24 hours)

**Deliverables:**
- Legal compliance (tax reporting, KYC)
- Fraud prevention for payment side
- User trust in financial transactions

---

### Phase 6 Testing
- Run small real-money tournaments ($5-10 entry)
- Test payment flow end-to-end
- Verify payouts work correctly
- Monitor for payment fraud
- Track transaction fees and profitability

### Phase 6 Deliverables Summary
✓ Real-money tournaments enabled
✓ Entry fees collected automatically
✓ Prize pools calculated and displayed
✓ Winners paid out automatically
✓ Wallet system for convenience
✓ Financial compliance (KYC, tax reporting)

**Timeline:** 4 weeks

---

## Phase 7: Community & Growth Features (Weeks 25-28)

### Goal
Build engagement, trust, and viral growth through community features.

### Scope
- Social features (follow, feed, sharing)
- Verified Angler program
- Community reporting
- Educational content
- Referral program

### Modules to Build

#### 7.1 Social Features
**Mobile App:**
- **Catch Feed (Home Tab):**
  - Instagram-style feed of recent catches
  - Filter: Everyone | Following | Top Catches
  - Each post: Photo, username, species, length, tournament
  - Like and comment buttons
- **User Profiles (Public):**
  - Tap username anywhere to view profile
  - Shows: Stats, recent catches, tournaments entered, verified badge
  - "Follow" button
- **Following/Followers:**
  - Follow other anglers
  - Get notified when they catch fish
- **Share to Social Media:**
  - Share catch to Instagram, Facebook, Twitter
  - Pre-formatted image with tournament branding
  - Link back to app (viral growth)

**Backend:**
- Social graph: User-User relationships (following)
- Feed generation: Query catches from followed users
- Like/comment storage and API

**Deliverables:**
- Community engagement (users interact)
- Viral sharing drives new user acquisition

---

#### 7.2 Verified Angler Program
**Requirements:**
- 10+ tournaments completed
- Zero violations
- Fraud score <10
- Optional: Identity verification (upload driver's license photo)

**Benefits:**
- "Verified Angler" badge (checkmark) on profile and leaderboard
- 10% discount on entry fees
- Priority customer support
- Exclusive tournaments (verified-only)
- Featured catches (higher visibility)

**Application Flow:**
- User taps "Apply for Verified Status" in profile
- System checks requirements
- If eligible, approve automatically (or manual review if identity verification required)
- Badge awarded

**Deliverables:**
- Trust indicator for legitimate anglers
- Incentivizes clean play
- Reduces fraud (verified users have more to lose)

---

#### 7.3 Community Reporting
**Mobile App:**
- "Report Issue" button on any leaderboard entry
- Report reasons:
  - I recognize this photo (stolen)
  - Fish looks edited
  - I was fishing there, conditions don't match
  - Other (free text)
- Submission is anonymous to reported user

**Backend:**
- Reports go to admin review queue (high priority)
- Track: Reporter, reported user, catch, reason
- Admins investigate and decide
- If report confirmed (catch was fraudulent):
  - Reporter gets "Fraud Hunter" badge
  - Small reward (free tournament entry)
- If report false (catch was legitimate):
  - Track false reports
  - Repeated false reporters may be penalized

**Deliverables:**
- Crowdsourced fraud detection
- Community self-polices
- Engages users as partners in anti-cheat

---

#### 7.4 Educational Content
**In-App Guides:**
- **How to Take Great Photos:**
  - Lighting tips
  - Board positioning
  - Common mistakes
- **Species Identification:**
  - Photos and descriptions of common species
  - Helps users select correct species
- **Tournament Rules Explained:**
  - FAQ on anti-cheat
  - What triggers flags and how to avoid
- **Measuring Board Setup:**
  - Video tutorial: How to use board correctly

**Content Formats:**
- Text articles
- Video tutorials
- Illustrated guides
- Interactive tips in-app (tooltips, onboarding)

**Deliverables:**
- Reduces user errors (unintentional violations)
- Builds trust (transparency about process)
- Improves photo quality (easier CV measurement)

---

#### 7.5 Referral Program
**Referral Flow:**
- User invites friends via unique referral code
- Invitee signs up using code
- Both users get reward:
  - Referrer: $5 credit or free entry
  - Invitee: First tournament entry free

**Mobile App:**
- "Invite Friends" screen in profile
- Display referral code
- "Share Link" button (text, email, social)
- Track: Referrals this month, total bonus earned

**Backend:**
- Referral codes: Unique per user
- Track signups via referral code
- Credit accounts when milestones hit (invitee enters first tournament)

**Deliverables:**
- Viral growth mechanism
- Lower customer acquisition cost (organic referrals)
- Rewards engaged users

---

### Phase 7 Testing
- Launch social features with existing user base
- Monitor engagement (likes, comments, follows)
- Track referral conversions
- Measure impact on retention

### Phase 7 Deliverables Summary
✓ Social features drive engagement
✓ Verified Angler program builds trust
✓ Community reporting leverages users
✓ Educational content reduces errors
✓ Referral program drives growth

**Timeline:** 4 weeks

---

## Phase 8: Custom Tournaments & Monetization (Weeks 29-32)

### Goal
Let users create tournaments, expand revenue streams, enable long-term sustainability.

### Scope
- User-created tournaments
- Private tournaments
- Sponsorships
- Merchandise integration
- Premium subscriptions

### Modules to Build

#### 8.1 User-Created Tournaments
**Mobile App:**
- "Create Tournament" button on home screen
- Tournament creation wizard:
  - Name your tournament
  - Select species
  - Set geographic boundaries (map picker)
  - Set time window (date picker)
  - Set entry fee ($5-50 range)
  - Choose payout structure (70/20/10 or custom)
  - Review and submit

**Backend:**
- User-created tournaments stored separately (flagged as user-created)
- Platform approval workflow:
  - Admin reviews new tournament requests
  - Approve or reject (with reason)
  - Prevents inappropriate tournaments
- Creator earns percentage of entries (e.g., 5%)
- Platform still takes commission (10%)

**Deliverables:**
- Fishing clubs can create their own events
- Expands tournament variety
- Creator incentive drives engagement

---

#### 8.2 Private Tournaments
**Private Tournament Features:**
- Invite-only (creator provides invite codes)
- Custom branding (club logo, custom name)
- Entry fees optional (can be free for club members)
- Private leaderboards (not visible to public)

**Mobile App:**
- "Private" badge on tournament card
- Requires invite code to join
- Creator manages invites

**Backend:**
- Invite code generation and validation
- Access control: Only invited users see tournament

**Use Cases:**
- Fishing clubs hosting internal competitions
- Corporate team-building events
- Friend groups competing privately

**Deliverables:**
- Private competition option
- Attracts organizations and groups
- Additional revenue stream (clubs pay setup fee)

---

#### 8.3 Sponsorships
**Sponsor Integration:**
- Brands can sponsor tournaments
- Sponsor contributes to prize pool
- Sponsor logo displayed on tournament card
- Featured placement in app

**Tournament Sponsorship Tiers:**
- Bronze ($500): Logo on tournament card
- Silver ($1000): Logo + featured placement
- Gold ($2500): Logo + featured + social media shoutout

**Mobile App:**
- "Sponsored by [Brand]" badge
- Sponsor logo on tournament detail screen
- Tap logo → Link to sponsor website

**Backend:**
- Sponsor management system
- Track sponsorship spend and ROI for brands

**Deliverables:**
- Additional revenue stream
- Larger prize pools (more attractive tournaments)
- Brand partnerships legitimize platform

---

#### 8.4 Merchandise Integration
**In-App Store:**
- Measuring boards (required equipment)
- Branded apparel (t-shirts, hats)
- Fishing gear (partner with brands for affiliate sales)

**Mobile App:**
- "Shop" tab
- Product catalog
- Link to external store OR in-app purchases

**Revenue Model:**
- Direct sales (platform sells boards)
- Affiliate links (commission on gear sales)

**Deliverables:**
- Convenience (users buy board where they join)
- Additional revenue
- Brand building (branded merchandise)

---

#### 8.5 Premium Subscription
**Subscription Tiers:**
- **Free:** Standard access
- **Premium ($20/month):**
  - Unlimited tournament entries (no per-entry fee)
  - Lower commission (5% vs. 15%)
  - Exclusive premium-only tournaments
  - Priority customer support
  - Ad-free experience (if ads added later)
  - Advanced stats and analytics

**Mobile App:**
- "Upgrade to Premium" prompts
- Subscription management in profile
- Benefits clearly listed

**Backend:**
- Subscription billing via Stripe
- Entitlement checks (is user premium?)
- Track MRR (monthly recurring revenue)

**Deliverables:**
- Predictable revenue (subscriptions)
- Value for power users (frequent entrants)
- Higher LTV per user

---

### Phase 8 Testing
- Beta test user-created tournaments with select clubs
- Launch sponsorship program with 1-2 pilot brands
- A/B test premium subscription pricing
- Track conversion rates and revenue

### Phase 8 Deliverables Summary
✓ User-created tournaments expand variety
✓ Private tournaments attract groups
✓ Sponsorships increase prize pools and revenue
✓ Merchandise sales add revenue stream
✓ Premium subscriptions provide recurring revenue
✓ Platform becomes self-sustaining

**Timeline:** 4 weeks

---

## Post-Phase 8: Ongoing Operations

### Continuous Improvement
- **Model Retraining:** Monthly updates to CV and fraud detection models
- **Feature Iteration:** Add new species, regions, tournament types
- **User Feedback:** Regular surveys and feature requests
- **Performance Optimization:** Reduce latency, improve scalability
- **Security Audits:** Regular penetration testing, vulnerability scanning

### Geographic Expansion
- Launch in new states (one at a time)
- Adapt to local regulations
- Partner with local fishing clubs for credibility
- Add regional species

### Advanced Features (Year 2+)
- **Live Tournaments:** Real-time competitions (catch most fish in 2 hours)
- **Team Competitions:** Multi-angler teams
- **Championship Series:** Multi-week events with overall standings
- **AR Measuring:** Use ARKit/ARCore to measure fish without board (future tech)
- **AI Species Identification:** Auto-detect species from photo
- **Global Leaderboards:** Worldwide rankings
- **Internationalization:** Support languages, currencies, regions outside US

---

## Timeline Summary

| Phase | Duration | Cumulative Weeks | Key Deliverable |
|-------|----------|------------------|-----------------|
| Phase 1: MVP Core | 4 weeks | Week 4 | Functional app with manual review |
| Phase 2: Anti-Cheat Foundation | 4 weeks | Week 8 | Codes, EXIF, duplicate detection |
| Phase 3: Computer Vision | 4 weeks | Week 12 | Automated measurement |
| Phase 4: Advanced Fraud Detection | 4 weeks | Week 16 | AI manipulation detection |
| Phase 5: Video Verification | 4 weeks | Week 20 | Video layer for high stakes |
| Phase 6: Payments & Payouts | 4 weeks | Week 24 | Real money tournaments |
| Phase 7: Community & Growth | 4 weeks | Week 28 | Social features, referrals |
| Phase 8: Custom Tournaments | 4 weeks | Week 32 | User-created, subscriptions |

**Total:** 32 weeks (8 months) to full-featured platform

---

## Resource Requirements

### Team Composition

**Months 1-4 (MVP + Anti-Cheat):**
- 2 Mobile Developers (iOS + Android or 2 React Native)
- 1 Backend Developer
- 1 UI/UX Designer
- 1 Product Manager
- 0.5 DevOps Engineer (part-time)

**Months 5-8 (CV + AI):**
- Same team +
- 1 ML Engineer (computer vision)
- 1 Data Scientist (fraud detection)

**Months 9+ (Scale):**
- +1 Mobile Developer (features, maintenance)
- +1 Backend Developer (scalability)
- +1 Customer Support (community management)
- +1 Marketing (growth)

### Technology Stack

**Mobile:**
- React Native or Flutter (cross-platform)
- OR Swift (iOS) + Kotlin (Android) (native)

**Backend:**
- Node.js (Express) or Python (Django/Flask)
- PostgreSQL (database)
- Redis (caching, real-time)
- AWS or Google Cloud (hosting)

**Computer Vision:**
- Python (TensorFlow, PyTorch, OpenCV)
- Cloud GPU instances for training
- Containerized inference (Docker)

**Payments:**
- Stripe (payment processing)

**Storage:**
- AWS S3 or Google Cloud Storage (images, videos)

**Third-Party Services:**
- Push notifications: Firebase Cloud Messaging
- Analytics: Mixpanel or Amplitude
- Monitoring: Sentry, Datadog

---

## Budget Estimate (Rough)

**Development (8 months):**
- Team salaries: ~$500K (depends on location, seniority)
- Infrastructure: ~$10K
- Third-party services: ~$5K
- Legal/compliance: ~$10K
- **Total Dev:** ~$525K

**Post-Launch (Ongoing):**
- Server costs: $2-5K/month (scales with users)
- Support/ops: $10-20K/month (team)
- Marketing: $10-50K/month (growth)

**Funding Options:**
- Bootstrapped: Start small, reinvest revenue
- Angel/Seed Round: $500K-1M to accelerate
- VC Series A (Year 2): $3-5M for national expansion

---

## Success Criteria

**Phase 1-2 (MVP):**
- 100 beta users
- 10 tournaments run successfully
- <5% catch rejection rate (user error)
- Admin review time <5 min/catch

**Phase 3-4 (Automation):**
- 90% of catches auto-measured
- 95% fraud detection rate
- <2% false positive rate

**Phase 5-6 (Real Money):**
- 500 paying users
- $10K+ in entry fees collected
- Payouts processed successfully (100%)
- Positive unit economics (revenue > costs)

**Phase 7-8 (Growth):**
- 2,000+ MAU (monthly active users)
- 20% month-over-month growth
- $50K+ monthly revenue
- <$10 CAC (customer acquisition cost)
- >$180 LTV (lifetime value)

---

This roadmap provides a clear, phased path from concept to full-featured platform. Each phase builds on the previous, allowing for validation, iteration, and sustainable growth.