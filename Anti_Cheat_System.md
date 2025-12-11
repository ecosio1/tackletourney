# Anti-Cheat System Architecture

## Overview

The anti-cheat system is the **most critical component** of the fishing tournament platform. One major fraud scandal could destroy user trust and kill the platform. This document describes a comprehensive, multi-layered approach to preventing, detecting, and responding to cheating attempts.

**Core Principle:** Make cheating harder than just going fishing.

---

## Threat Model

### Categories of Cheating

**1. Photo Reuse**
- Using old photos from previous catches
- Stealing photos from other anglers
- Reusing same photo across multiple tournaments

**2. Photo Manipulation**
- Photoshopping to make fish appear longer
- Digital stretching or cloning
- Composite images (fish from one photo, board from another)
- Editing tail or measurement markers

**3. Measurement Fraud**
- Using fake or manipulated measuring boards
- Manipulating fish position to appear longer
- Covering measurement markers with hands
- Using tape measure instead of approved board

**4. Location/Time Fraud**
- GPS spoofing (appearing to be in tournament area when not)
- Submitting catches outside tournament time window
- Using photos taken in different location

**5. Identity Fraud**
- Multiple accounts by same person
- Account sharing
- Bot/automated submissions

**6. Collusion & Fraud Rings**
- Groups working together to submit fake catches
- Sharing photos between accounts
- Coordinated attacks on tournament integrity

**7. Environmental Impossibilities**
- Photos showing conditions that don't match reality (sunny when it's raining)
- Species in wrong habitat
- Impossible catch timing/locations

---

## Defense Layers

The anti-cheat system operates in four layers:

1. **Preventive Controls** - Make cheating technically difficult
2. **Detective Controls** - Identify fraud attempts automatically
3. **Audit Controls** - Human review of suspicious cases
4. **Enforcement** - Consequences and deterrence

---

## Layer 1: Preventive Controls

These design choices make fraud technically difficult or impossible.

### 1.1 Unique Catch Codes

**How It Works:**
- Server generates unique alphanumeric code per catch session (e.g., "XG7K")
- Code is 4-6 characters, uses visually distinct characters (avoids 0/O, 1/I, 5/S)
- User must write code on paper and include in photo
- Code detected via OCR in photo
- Code expires after 10 minutes
- Each session gets a new code

**What It Prevents:**
- Reusing old photos (wrong code)
- Stealing photos from others (wrong code)
- Preparing photos in advance (code didn't exist yet)
- Trial-and-error attacks (new code each attempt)

**Implementation Details:**
- Codes generated server-side using cryptographically secure random
- Stored in database with session metadata
- Validated on submission (must match active session)
- Single-use only (marked as used after submission)

**Mobile Advantage:**
- Code displayed prominently in app
- Cannot be predicted or bypassed
- Session tied to device + user + timestamp

---

### 1.2 No Gallery Uploads

**How It Works:**
- App only allows in-app camera capture
- Gallery access intentionally disabled
- Photo capture locked to active catch session
- No "upload from files" option

**What It Prevents:**
- Using photos taken days/weeks earlier
- Using downloaded/stolen photos
- Pre-prepared or edited photos
- Stock photos or internet images

**Implementation Details:**
- Mobile camera API called directly
- File picker UI never exposed
- Image source validated server-side (EXIF camera data required)
- App permissions: Camera allowed, Photo Library blocked for catch submission

**Mobile Advantage:**
- Full control over camera interface
- Can capture metadata in real-time (GPS, sensors)
- Harder to inject fake images than on web

---

### 1.3 Mandatory Measuring Board

**How It Works:**
- Only approved measuring board designs accepted
- Boards have specific visual patterns for CV detection
- Standardized dimensions for pixel-to-inch calibration
- User must confirm they have board before entering tournament

**What It Prevents:**
- Using tape measures (easy to manipulate)
- Manual measurement entry (user could lie)
- Inconsistent measurement methods
- Measurement disputes ("my tape says 24 inches!")

**Approved Board Specifications:**
- **Length:** 48+ inches (covers most species)
- **Markings:** Clear inch increments, 0.25" divisions
- **Bump Stop:** Physical barrier for fish head placement
- **Color Pattern:** High-contrast colors for CV detection (e.g., yellow board with black markings)
- **Calibration Markers:** Specific patterns at known positions for pixel calibration
- **Branding:** Unique identifier (QR code or logo) to verify board authenticity

**Board Certification Program:**
- Manufacturers submit board designs for approval
- Platform tests CV detection accuracy
- Approved boards listed in app
- Link to purchase from certified vendors
- DIY plans available for budget-conscious users

**Implementation Details:**
- CV model trained on approved board designs
- Rejects photos without detectable board
- Validates board dimensions match approved specs
- Detects fake boards (printed images, scaled boards)

---

### 1.4 GPS + Time Anchoring

**How It Works:**
- GPS coordinates captured at two points:
  1. Session start (when code is generated)
  2. Photo capture (when photo taken)
- Device timestamp captured
- Server timestamp authoritative (not device time)
- All data encrypted and signed

**What It Prevents:**
- Fishing outside tournament boundaries (GPS out of bounds)
- Submitting catches outside tournament time window
- Teleporting (GPS changes impossible distance in short time)
- Time zone tricks

**GPS Validation Rules:**
- Both GPS readings must be within tournament boundaries
- GPS readings must be close to each other (<1 mile difference for 10 min session)
- GPS accuracy must be reasonable (<50 meters)
- Movement between readings must be physically possible (no 50 miles in 5 minutes)

**Time Validation Rules:**
- Photo capture must be within tournament time window
- Photo capture must be after session start
- Photo capture must be within 10 minutes of session start (session expiration)
- EXIF timestamp must match submission time (±5 min tolerance for clock drift)
- Server time is authoritative (device time used for validation only)

**Implementation Details:**
- Mobile GPS API provides coordinates + accuracy + timestamp
- Server validates all constraints
- Impossible patterns flagged (teleportation, time travel)
- Map boundary checking (point-in-polygon algorithm)

**Mobile Advantage:**
- Direct access to GPS hardware
- Multiple sensors for validation (GPS, network location, WiFi positioning)
- Harder to spoof location on mobile than desktop (requires jailbreak/root)
- Can detect location spoofing via sensor inconsistencies

---

### 1.5 Real-Time Processing

**How It Works:**
- Photo analyzed immediately after capture
- User gets instant feedback (accepted/rejected/retry)
- Cannot submit 50 photos and see which ones work
- Each retry requires new session + new code

**What It Prevents:**
- Trial-and-error attacks (spray and pray)
- Batch submission of old photos
- Learning from rejections to craft better fakes

**Implementation Details:**
- CV and fraud detection run during "analyzing photo" step
- Results returned in 5-10 seconds
- User cannot proceed without decision
- Failed attempts logged (repeated failures raise flags)

---

### 1.6 Session Expiration

**How It Works:**
- Catch sessions expire after 10 minutes
- Code becomes invalid after expiration
- User must start new session to get new code

**What It Prevents:**
- Taking photos at home hours later
- Preparing elaborate fakes with extended time
- Sharing codes between users

**Implementation Details:**
- Session start time stored server-side
- Submission timestamp must be within session validity window
- Expired sessions cannot be reused

---

## Layer 2: Detective Controls

Automated analysis identifies fraud attempts that bypass preventive controls.

### 2.1 Image Forensics

#### 2.1.1 EXIF Analysis

**Data Extracted:**
- Camera make/model
- Capture timestamp
- GPS coordinates (if embedded)
- Software used (editing apps leave signatures)
- Image dimensions and resolution
- Color profile
- Focal length, aperture, ISO, exposure
- Thumbnail data
- File modification history

**Fraud Signals:**
- **EXIF data missing or stripped**
  - Legitimate photos from phones have rich EXIF
  - Stripped EXIF suggests editing or screenshot
  - Flag: High

- **Editing software detected**
  - Adobe Photoshop, GIMP, Snapseed signatures
  - Even "save for web" leaves traces
  - Flag: Critical

- **Timestamp mismatch**
  - EXIF time differs from submission time by >5 minutes
  - Suggests old photo or clock manipulation
  - Flag: High

- **GPS mismatch**
  - EXIF GPS differs from submitted GPS
  - Suggests location spoofing or old photo
  - Flag: High

- **Device mismatch**
  - EXIF camera model doesn't match user's registered device
  - Suggests photo from different phone (borrowed or stolen)
  - Flag: Medium (user may have upgraded)

- **Impossible metadata**
  - Indoor photo settings (flash, low light) when claiming outdoor catch
  - Resolution doesn't match claimed device
  - Flag: Medium

**Implementation:**
- Python: Pillow or ExifRead library
- Extract all EXIF tags
- Compare against known profiles for device models
- Flag anomalies for manual review

---

#### 2.1.2 Perceptual Hashing (Duplicate Detection)

**How It Works:**
- Generate "perceptual hash" (pHash) of each photo
- pHash is fingerprint based on visual content, not file bytes
- Store hashes in database
- Compare new submission hash against all previous hashes
- Near-matches indicate duplicate or manipulated photo

**Hash Algorithms:**
- **pHash (Perceptual Hash):** Detects similar images even if resized, cropped, or slightly edited
- **dHash (Difference Hash):** Fast, detects duplicates
- **aHash (Average Hash):** Simplest, catches exact duplicates

**Similarity Scoring:**
- Hamming distance between hashes
- Threshold: >90% similarity = likely duplicate
- >95% similarity = almost certain duplicate
- 100% = exact duplicate

**What It Detects:**
- Exact duplicates (same photo submitted twice)
- Cropped versions (reframing to hide details)
- Rotated or flipped images
- Slightly color-adjusted photos
- Resized images

**Cross-Tournament Checking:**
- Compare against all tournaments, not just current
- Catches users reusing "trophy fish" photo across events
- Tracks photos over weeks/months

**Implementation:**
- Python: ImageHash library
- PostgreSQL or Redis for hash storage
- Efficient similarity search (nearest neighbor algorithms)
- Background job: check all new submissions against database

**Response to Duplicates:**
- >95% match: Auto-reject, notify user "Duplicate photo detected"
- 90-95% match: Flag for manual review
- Show admin both photos side-by-side for comparison

---

#### 2.1.3 AI-Powered Manipulation Detection

**What It Detects:**
- Digital alterations (cloning, healing, content-aware fill)
- Composite images (fish and board from different sources)
- Lighting inconsistencies (shadows don't match)
- Unnatural proportions (stretched or squeezed fish)
- Screen photos (taking photo of a screen showing another photo)
- AI-generated images (deepfakes, synthetic fish)

**Techniques:**

**A. Error Level Analysis (ELA)**
- Analyzes JPEG compression artifacts
- Re-compressed areas (edited regions) show different error levels
- Visualizes which parts of image have been modified
- Effective for clone stamp, copy-paste edits

**B. Noise Analysis**
- Natural photos have consistent sensor noise across image
- Edited regions have different noise patterns
- Detects copy-pasted elements

**C. Shadow/Lighting Consistency**
- ML model checks if shadows match light source direction
- Detects composite images with inconsistent lighting
- Flags physically impossible shadow angles

**D. JPEG Ghost Detection**
- Photos edited and re-saved show "ghosts" at different quality levels
- Reveals areas that were modified

**E. Deepfake Detection**
- Checks for AI-generated content
- Detects GAN artifacts
- Less relevant for fish photos but useful for video verification (face matching)

**F. Screen Photo Detection**
- Moiré patterns (interference between screen pixels and camera sensor)
- Uniform pixel structure (LCD/OLED grid visible)
- Reflections and glare characteristic of screens
- Lower dynamic range than real photos

**G. Proportion Analysis**
- Check fish body proportions against species norms
- Detect digital stretching (fish elongated to appear longer)
- Compare head-to-body ratios
- Flag unnatural dimensions

**Implementation Options:**

**Option 1: Cloud AI Services (Easiest)**
- **AWS Rekognition Custom Labels:** Train on manipulated vs. real fish photos
- **Google Cloud Vision AI:** Detect image properties, explicit content
- **Microsoft Azure Computer Vision:** Image analysis
- Pros: Easy integration, well-tested
- Cons: Cost per API call, less customizable

**Option 2: Open-Source Models (More Control)**
- **ImageMagick + OpenCV:** Error level analysis, noise analysis
- **TruFor (Trustworthy and Forged Image Detector):** Open-source manipulation detection
- **ELA-CNN:** CNN trained for error level analysis
- Pros: No per-call costs, customizable
- Cons: Requires ML expertise, training data

**Option 3: Hybrid**
- Use open-source for fast initial screening
- Route high-risk cases to cloud AI for deeper analysis
- Balance cost and accuracy

**Output:**
- Manipulation confidence score: 0-100%
- Heatmap showing suspicious regions
- Specific flags: "Clone stamp detected", "Lighting inconsistency"

**Thresholds:**
- <20%: Likely legitimate (auto-accept)
- 20-50%: Possible manipulation (flag if combined with other signals)
- 50-80%: Likely manipulated (hold for review)
- >80%: Almost certainly fake (auto-reject or critical review)

---

### 2.2 Computer Vision Measurement

The CV system not only measures fish length but also validates photo authenticity.

#### Measurement Process

**Step 1: Board Detection**
- Detect measuring board in image
- Identify board type (match against approved designs)
- Locate calibration markers (known positions)
- Calculate perspective transform (correct for camera angle)

**Step 2: Board Validation**
- Verify board matches approved design
- Check board dimensions are correct (not scaled)
- Detect fake boards (printed on paper, distorted)
- Confirm board is flat (not curved or folded)

**Step 3: Fish Segmentation**
- Detect fish in image (separate from background)
- Identify head position (should be at bump stop)
- Identify tail tip
- Verify entire fish is visible (no cropping)

**Step 4: Length Calculation**
- Measure pixel distance from head to tail
- Convert pixels to inches using board calibration
- Account for perspective distortion
- Round down to nearest 0.25 inch

**Step 5: Confidence Scoring**
- High confidence: Board clear, fish well-positioned, good lighting
- Low confidence: Blurry, poor lighting, fish bent, board partially occluded

**Fraud Detection via CV:**

**Missing Board:**
- No approved board detected = Auto-reject
- Prevents tape measure usage

**Wrong Board:**
- Board doesn't match approved designs = Reject
- Prevents fake boards

**Fish Position Issues:**
- Head not at bump stop = Flag (could be adding inches)
- Tail obscured or bent = Flag (could be hiding true length)
- Fish not aligned with board = Reject (can't measure accurately)

**Hand Covering Measurements:**
- Detect hands in image
- Flag if hand obscures tail or critical measurement points
- Prevents cheating by hiding true length

**Multiple Fish:**
- Detect if more than one fish in image
- Prevent submitting different fish's measurements

**Image Quality:**
- Blurry or out of focus = Reject (can't verify)
- Poor lighting = Reject
- Extreme angles = Reject (can distort length)

**Implementation:**
- **ML Framework:** TensorFlow or PyTorch
- **Models:**
  - Object detection: YOLO or EfficientDet (board, fish, hands)
  - Segmentation: U-Net or Mask R-CNN (fish boundaries)
  - Keypoint detection: PoseNet-style (head, tail, calibration markers)
- **Training Data:** 10,000+ labeled photos of fish on boards
- **Iterative Improvement:** User feedback loops, edge case collection

---

### 2.3 Behavioral Analytics

Analyze user patterns to detect suspicious behavior.

#### 2.3.1 User-Level Metrics

**Catch Frequency:**
- Legitimate: 3-5 catches per tournament
- Suspicious: 20+ catches in an hour (spray-and-pray)
- Bot-like: Submissions at exact intervals

**Success Rate:**
- Legitimate: 70-85% of catches accepted
- Suspicious: 100% accepted (unlikely) or <30% accepted (trying to cheat)

**Fish Size Distribution:**
- Legitimate: Normal distribution (some small, some big)
- Suspicious: Always large fish (top 10%)

**Geographic Patterns:**
- Legitimate: Fishing same area over time
- Suspicious: Submissions from widely different locations in short time
- Impossible: 100 miles apart in 30 minutes

**Time-of-Day Patterns:**
- Legitimate: Varied times, matches typical fishing hours (dawn, dusk)
- Suspicious: Always late night (using old photos?)

**Device Patterns:**
- Legitimate: Same device consistently
- Suspicious: Frequently changing devices, multiple accounts on one device

#### 2.3.2 Cross-User Analysis

**Collusion Detection:**
- Multiple users submitting similar photos
- Same photos from different accounts
- Users who "fish together" but photos don't match (no other people in background)

**Fraud Rings:**
- Accounts created around same time
- Same payment methods
- Same IP addresses
- Coordinated submission times

**Social Graph:**
- Users who frequently enter same tournaments
- Users who win together (suspicious)
- Referral patterns (fraud rings invite each other)

#### 2.3.3 Fraud Score

Each user has a cumulative fraud score (0-100):

**Score Increases:**
- +5: Minor flag (e.g., low GPS accuracy)
- +10: Moderate flag (e.g., EXIF timestamp mismatch)
- +25: Major flag (e.g., duplicate photo detected)
- +50: Critical flag (e.g., editing software detected)

**Score Decreases:**
- -2: Each clean catch accepted
- -10: Tournament completed without issues
- Reset to 0 after 6 months of clean record

**Score Thresholds:**
- 0-20: Trusted (auto-accept catches, minimal review)
- 21-40: Standard (normal fraud detection)
- 41-60: Elevated (extra scrutiny, more likely to trigger reviews)
- 61-80: High Risk (all catches manually reviewed)
- 81-100: Critical (account flagged, may be banned)

**Implementation:**
- Store fraud score in user profile
- Update after each catch
- Factor into auto-accept/reject decisions
- Display in admin dashboard

---

### 2.4 Environmental Cross-Reference

Validate that photo conditions match real-world conditions.

#### 2.4.1 Weather Validation

**Data Source:** Weather API (OpenWeatherMap, Weather.com)

**Checks:**
- **Lighting conditions:** Photo shows sunshine, but weather API reports heavy rain
- **Sky color:** Blue sky in photo, but weather shows overcast
- **Wet surfaces:** Everything dry in photo, but recent rainfall reported

**Implementation:**
- Query weather API for GPS location and timestamp
- Extract photo characteristics: brightness, shadows, sky color
- ML model trained to classify outdoor photo conditions
- Flag mismatches

**Limitations:**
- Weather can be localized (raining 5 miles away)
- Tolerances needed (not binary)
- Best as supporting evidence, not primary

---

#### 2.4.2 Sunrise/Sunset Validation

**Data Source:** Astronomical calculation (sunrise/sunset times)

**Checks:**
- Photo shows daylight at 3 AM (impossible)
- Photo shows darkness at noon (impossible)
- Shadow angles match sun position for time/location

**Implementation:**
- Calculate sunrise/sunset for GPS location and date
- Analyze photo brightness and color temperature
- Flag photos with daylight outside sun hours
- Shadow analysis: determine sun angle from shadows, compare to expected angle

---

#### 2.4.3 Tide Validation (Coastal Tournaments)

**Data Source:** Tide prediction APIs (NOAA)

**Checks:**
- User claims beach catch at low tide, but tide chart shows high tide
- Background water level inconsistent with tide time

**Limitations:**
- Hard to verify from photo alone
- Best used if user specifies catch location type (surf, pier, kayak)

---

#### 2.4.4 Species Behavior

**Knowledge Base:** Fish biology and habitat

**Checks:**
- Species caught in wrong habitat (freshwater fish claimed from ocean)
- Wrong season (species not active this time of year)
- Wrong temperature (cold-water fish in 90°F water)

**Implementation:**
- Database of species ranges, habitats, seasonal patterns
- Cross-reference catch species with location and time
- Flag biological impossibilities

---

### 2.5 Metadata Consistency

**Device Fingerprinting:**
- User registers device on first use
- Track: Device model, OS version, screen resolution, unique ID
- Flag if photo EXIF shows different device without user notification

**Camera Characteristics:**
- Each camera sensor has subtle characteristics (noise pattern, color response)
- Can fingerprint cameras and detect when photo is from different camera

**Image Dimensions:**
- iPhone 14 Pro produces 4032x3024 photos
- If user has iPhone 14 Pro but submits 1920x1080 photo (screenshot?)
- Flag dimension mismatches

**File Size:**
- Unedited photos from phones are typically 2-5 MB
- Much smaller = compressed/screenshotted
- Much larger = edited and re-saved at high quality

---

## Layer 3: Audit Controls (Human Review)

Some cases require human judgment.

### 3.1 When Catches Are Flagged

**Automatic Flagging Triggers:**

**High Priority (Manual Review Required):**
- Manipulation confidence >50%
- Duplicate photo match >90%
- User in top 3 of leaderboard
- Fish length in top 5% for species
- Fraud score >60
- Critical EXIF anomalies (editing software detected)
- GPS anomaly (impossible movement)

**Medium Priority (Review if Time Permits):**
- Manipulation confidence 30-50%
- Duplicate match 80-90%
- First-time user placing
- Minor EXIF inconsistencies
- Behavioral anomalies (high catch rate, unusual timing)

**Low Priority (Random Audit):**
- 5% of all catches randomly selected
- Helps train models and catch unknown attack vectors

### 3.2 Admin Review Queue

**Queue Dashboard:**
- List of flagged catches sorted by priority
- Filters: Tournament, user, flag type, date
- Search: Username, tournament name

**Catch Review Interface:**

**Left Panel: Photo & Analysis**
- Full-size photo with zoom
- Measurement overlay toggle
- Side-by-side with suspected duplicate (if applicable)
- ELA heatmap toggle (shows edited regions)

**Right Panel: Evidence**
- Fraud score and breakdown
- All flags with severity
- EXIF data dump
- GPS coordinates on map
- Weather data for time/place
- User history (past catches, violations)
- Similar catches (duplicates, same user's other submissions)

**Decision Options:**
1. **Approve Catch**
   - Adds to leaderboard
   - Notifies user
   - Clears flags

2. **Reject Catch**
   - Must select reason from dropdown:
     - Duplicate photo
     - Image manipulated
     - GPS out of bounds
     - Time outside window
     - Board not detected
     - Code not visible
     - Other (specify)
   - Option to add note to user
   - Option to adjust fraud score (+10, +25, etc.)

3. **Request Video Verification**
   - Sends notification to user
   - 15-minute deadline
   - Catch stays in review until video submitted

4. **Flag for Investigation**
   - Escalates to senior admin
   - Does not immediately reject
   - User not notified

5. **Ban User**
   - Permanent or temporary
   - Requires confirmation
   - Logged for audit trail

**Review SLAs:**
- High priority: 15 minutes
- Medium priority: 30 minutes
- Low priority: 24 hours

**Admin Training:**
- Onboarding: How to spot manipulated photos
- Examples of common fraud techniques
- When to approve vs. reject borderline cases
- Escalation procedures for uncertain cases

---

### 3.3 Video Verification Review

**When Required:**
- User in top 3
- Fish >80th percentile length
- High fraud score
- Random 5% audit

**Review Process:**
- Admin watches 10-second video
- Checks:
  - Continuous take (no cuts)
  - Face visible and matches profile (if available)
  - Fish matches photo
  - Board visible with code
  - Measurement visible
  - Ambient matches photo (lighting, location)

**Video Forensics:**
- Check for editing artifacts (cuts, splices)
- Verify metadata (GPS, timestamp)
- Deepfake detection (if face matching)

**Decision:**
- Approve: Catch confirmed, leaderboard updated
- Reject: Video doesn't match photo, catch disqualified
- Request Retry: Technical issue (blurry, audio only), one retry allowed

---

### 3.4 Community Reporting

**User-Submitted Reports:**
- Any user can report suspicious catch via "Report Issue" button
- Must select reason:
  - I recognize this photo (stolen)
  - Fish looks edited
  - I was fishing there, conditions don't match
  - Other

- Optional: Add details and evidence
- Report is anonymous to reported user

**Report Handling:**
- All reports go to manual review queue
- Admins investigate
- Patterns: If 3+ users report same catch, prioritize

**False Reports:**
- Track users who frequently report legitimate catches
- May penalize repeated false reports (reputation system)

**Incentives:**
- "Fraud Hunter" badge for users who successfully report fraud
- Small reward (free entry) for verified reports

---

## Layer 4: Enforcement & Deterrence

### 4.1 Violation Consequences

**Warning (First Offense):**
- Catch rejected
- User notified of violation
- Fraud score +25
- Recorded in user history
- No ban

**Temporary Ban (Second Offense):**
- 30-day suspension
- Cannot enter tournaments
- Fraud score +50
- Entry fees from current tournament forfeited

**Permanent Ban (Third Offense or Severe):**
- Account terminated
- Cannot create new accounts (device ban)
- All winnings forfeited
- Reported to payment processor if fraud involved

**Immediate Permanent Ban (Critical):**
- Proven fraud ring participation
- Blatant manipulation (Photoshop evidence)
- Payment fraud (stolen credit cards)
- Threatening other users/admins

### 4.2 Appeals Process

**User Can Appeal:**
- Rejected catch
- Ban/suspension
- Must submit within 7 days

**Appeal Submission:**
- Written explanation
- Additional evidence (e.g., different angle photo, video)
- Context (why flags were triggered)

**Appeal Review:**
- Reviewed by different admin than original
- Senior admin or committee for bans
- Decision within 7 days
- Final and binding

**Appeal Outcomes:**
- **Upheld:** Original decision stands
- **Overturned:** Catch accepted or ban lifted
- **Modified:** Reduced penalty (ban → warning)

### 4.3 Transparency & Communication

**Public Fraud Statistics:**
- Monthly report:
  - Total catches submitted
  - % auto-accepted
  - % flagged for review
  - % rejected
  - Violations and bans (anonymized)
- Builds trust: "We're catching cheaters"

**Fraud Update Blog Posts:**
- "This month we detected 23 fraud attempts"
- "New anti-cheat feature: Shadow analysis"
- Educates users on what to avoid (unintentionally triggering flags)

**Clear Messaging:**
- Rejection messages educational, not punitive
- "Here's why your catch was rejected and how to fix it"
- Link to FAQ and photo tips

### 4.4 Positive Incentives

**Verified Angler Badge:**
- Requirements:
  - 10+ tournaments completed
  - Zero violations
  - Fraud score <10
  - Optional: Identity verification (driver's license)
- Benefits:
  - Badge on profile and leaderboard
  - Lower entry fees (10% discount)
  - Priority customer support
  - Featured catches
  - Exclusive tournaments

**Clean Record Rewards:**
- Every 10 clean tournaments: Bonus entry credit
- Annual "Most Trusted Angler" awards
- Community recognition

**Transparency Benefits:**
- Users who consent to open catch history get "Open Book" badge
- Shows confidence in legitimacy

---

## Special Cases & Edge Cases

### New Users

**Challenge:** No history to assess fraud risk

**Approach:**
- Start with neutral fraud score (20)
- Extra scrutiny on first 3 catches
- Video verification required if placing in first tournament
- Payout delays (24 hours for first win)
- Builds trust gradually

### High-Value Tournaments

**Challenge:** Big prizes attract sophisticated cheaters

**Approach:**
- Video verification required for all top 10
- Extended review period before payout (24-48 hours)
- Higher fraud detection thresholds (more sensitive)
- Senior admin reviews all podium finishes

### Regional Species

**Challenge:** Species common in one area, rare in another

**Approach:**
- Species-region database
- Flag unlikely species for location
- Not auto-reject (rare doesn't mean impossible)
- Manual review with species expert consultation

### Board Variations

**Challenge:** Boards wear, fade, get customized

**Approach:**
- CV model trained on board variations (worn, dirty, etc.)
- Tolerances for minor differences
- Reject only if clearly not approved design
- Allow users to submit board photo for certification

### GPS Accuracy Issues

**Challenge:** GPS in canyons, under bridges, near buildings

**Approach:**
- Tolerances: 50-100 meter accuracy acceptable
- Don't auto-reject for weak GPS if other signals clean
- Consider WiFi/cell tower triangulation
- Manual review if GPS quality poor but photo looks legit

### Identical Fish from Multiple Angles

**Challenge:** User catches fish, takes multiple photos, submits best one

**Approach:**
- Allowed! User can retry same fish
- Each attempt needs new code (prevents old photo reuse)
- Duplicate detection won't flag (different angle + different code)
- Track retries (excessive retries suspicious)

---

## Machine Learning & Continuous Improvement

### Model Training

**Training Data Collection:**
- All accepted catches → Positive examples (legitimate)
- All rejected catches → Negative examples (fraud)
- Admin review decisions → Ground truth labels
- User reports → Additional labels

**Model Retraining:**
- Monthly: Retrain manipulation detection on new data
- Weekly: Update fraud score thresholds based on false positive/negative rates
- Continuous: A/B testing new models vs. current production

**Feedback Loops:**
- Admin overrides (approve when model rejected) → False positives
- Missed fraud (community reports) → False negatives
- Use to improve models

### Attack Adaptation

**Monitoring for New Attack Vectors:**
- Track rejection reasons (clusters indicate new attack)
- Example: Sudden spike in "board not detected" → Users trying tape measures
- Community reports of new techniques

**Rapid Response:**
- When new attack detected, fast-track model update
- Temporary stricter rules while model trains
- Communicate to users: "We're aware of X technique, don't try it"

### Explainability

**Why It Matters:**
- Users want to understand rejections
- Admins need to explain decisions
- Legal/compliance may require transparency

**Approach:**
- For each fraud flag, provide human-readable explanation
- "Photo shows editing artifacts in the tail region"
- "GPS coordinates don't match tournament boundaries"
- Not just "fraud score 72%"

---

## Privacy & Ethics

### Data Collection

**What We Collect:**
- Photos (obviously)
- GPS location (precise)
- Device info (fingerprinting)
- EXIF data (detailed)

**Privacy Considerations:**
- Disclosed in Terms of Service and Privacy Policy
- Necessary for anti-cheat (not gratuitous)
- Data retention policy (delete after 1 year? Keep indefinitely?)
- User can request data deletion (GDPR, CCPA)

**Data Security:**
- Photos encrypted in transit (HTTPS) and at rest
- GPS data considered sensitive (don't publicly expose exact locations)
- Access controls (only admins see full data)

### Bias & Fairness

**Risk:** ML models may be biased

**Mitigations:**
- Train on diverse data (different regions, devices, species)
- Monitor for disparate impact (are certain user groups flagged more?)
- Regular bias audits
- Human review catches algorithmic bias

### False Positives

**Risk:** Legitimate users incorrectly accused

**Mitigations:**
- Multiple signals required (not one flag = rejection)
- Human review for borderline cases
- Clear appeal process
- Err on side of caution (approve if uncertain)
- Track false positive rate, aim for <2%

---

## Success Metrics

### Anti-Cheat KPIs

**Fraud Detection Rate:**
- Target: >95% of fraud attempts detected
- Measure: (Caught fraud) / (Total fraud attempts)
- Challenge: Unknown denominator (how many attempts we don't know about?)

**False Positive Rate:**
- Target: <2% of legitimate catches incorrectly flagged
- Measure: (False positives) / (Total legitimate)
- Tracked via: Admin overrides, user appeals

**Auto-Accept Rate:**
- Target: >85% of catches auto-accepted (no manual review)
- Measure: (Auto-accepted) / (Total submissions)
- Higher = more efficient (less manual review cost)

**Average Review Time:**
- Target: <5 minutes per flagged catch
- Measure: Time from submission to admin decision
- Important for user experience (waiting for results)

**Repeat Offenders:**
- Target: <5% of users receive multiple violations
- Measure: Users with 2+ violations / Total users
- Lower = deterrent is working

**User Trust:**
- Survey: "I trust this platform prevents cheating" (1-5 scale)
- Target: >4.0 average
- Tracked quarterly

---

## Technical Implementation Summary

### Tech Stack Recommendations

**Image Processing:**
- Python: Pillow, OpenCV, ImageHash
- ML: TensorFlow or PyTorch
- Cloud: AWS Lambda or Google Cloud Functions for serverless processing

**Computer Vision:**
- Object Detection: YOLO v8 or EfficientDet
- Segmentation: U-Net
- Training: Google Colab or AWS SageMaker

**Fraud Detection:**
- EXIF: ExifRead (Python)
- Manipulation Detection: ELA (custom), or AWS Rekognition
- Hashing: ImageHash library
- Storage: PostgreSQL for hashes, S3 for images

**Behavioral Analytics:**
- Database: PostgreSQL with time-series extension
- Analytics: Python pandas, scikit-learn
- Real-time: Redis for fraud score caching

**Admin Dashboard:**
- Web: React or Vue.js
- Backend: Node.js or Python Flask/Django
- Real-time updates: WebSockets

### Scalability

**High Volume (1000 catches/hour):**
- Message queue (RabbitMQ, AWS SQS) to buffer submissions
- Horizontal scaling: Multiple CV workers
- Caching: Redis for fraud scores, duplicate hashes
- CDN for image delivery to admins

**Cost Optimization:**
- Run expensive AI models only on flagged catches
- Use lightweight checks first (EXIF, hashing), escalate to AI
- Archive old catches to cheaper storage (S3 Glacier)

---

## Conclusion

This anti-cheat system is **comprehensive, layered, and adaptive**. No single layer is perfect, but together they create a robust defense that makes cheating:

1. **Technically difficult** (preventive controls)
2. **Likely to be caught** (detective controls)
3. **Manually verified when uncertain** (audit controls)
4. **Not worth the risk** (enforcement and deterrence)

The key to success:
- **Start strong:** Implement core layers (codes, no uploads, CV measurement) from day one
- **Iterate:** Add AI and behavioral analytics as you collect data
- **Be transparent:** Users trust systems they understand
- **Stay vigilant:** Cheaters adapt; so must you

With this system in place, the platform can provide legitimate, fair competition that anglers trust with their time and money.
