# User Flows & App Screens

## Complete End-to-End User Journey

This document describes every screen, interaction, and user state in the mobile app (iPhone & Android).

---

## 1. Onboarding & Registration

### First Launch

**Welcome Screen**
- Hero image: Angler with big fish + phone
- Headline: "Compete. Win. Get Paid."
- Subheadline: "Enter daily fishing tournaments from anywhere"
- Primary CTA: "Sign Up"
- Secondary CTA: "Sign In"

**Sign Up Flow**
1. **Account Creation**
   - Email and password fields
   - OR "Continue with Apple" / "Continue with Google"
   - Checkbox: "I'm 18+ and agree to Terms of Service"
   - Button: "Create Account"

2. **Profile Setup**
   - Username (public display name)
   - Profile photo (optional)
   - State/Region selection
   - Favorite species (multi-select)
   - Button: "Continue"

3. **Tutorial Slides (Swipeable)**
   - Slide 1: "Join Daily Tournaments"
     - Shows tournament cards
     - "Pick your species, pay entry, go fish"

   - Slide 2: "Log Your Catches"
     - Shows in-app camera interface
     - "Use our camera to verify catches"

   - Slide 3: "Win Real Money"
     - Shows leaderboard with prizes
     - "Top finishers get paid automatically"

   - Slide 4: "Fair Competition"
     - Shows measuring board and verification
     - "Our anti-cheat system ensures legit competition"

   - Final: "Get Your Measuring Board"
     - Image of approved board
     - "You'll need an approved board to compete"
     - Button: "Shop Boards" (links to store)
     - Button: "I Already Have One"

4. **Permissions Requests**
   - Camera: "Required to submit catches"
   - Location: "Required to verify you're in tournament boundaries"
   - Notifications: "We'll notify you about tournaments and results"
   - Each permission explained before requesting

5. **Payment Setup (Optional)**
   - "Add payment method to enter tournaments"
   - Add card or link Apple Pay/Google Pay
   - Button: "Add Payment Method"
   - Link: "Skip for now" (can browse free tournaments)

**User lands on Home screen after onboarding**

---

## 2. Home Screen (Tournament Discovery)

### Main Navigation (Bottom Tabs)
- **Home** (tournament list)
- **My Tournaments** (entered tournaments)
- **Leaderboards** (global rankings)
- **Profile** (user settings)

### Home Screen Layout

**Header**
- App logo
- Current location (detected): "Tampa Bay, FL"
- Notification bell icon (badge if unread)

**Quick Stats Card**
- "Your Stats This Month"
- Total catches: 12
- Tournaments entered: 5
- Best finish: 2nd place
- Earnings: $45.00

**Filter Bar**
- Chips: All | Snook | Redfish | Trout | Tarpon
- "Filter" button (opens advanced filters)

**Tournament Cards (Scrollable List)**

Each card shows:
- Tournament badge icon (species illustration)
- Tournament name: "Biggest Snook Today"
- Species: "Snook only"
- Time remaining: "6h 32m left" (countdown timer)
- Entry fee: "$10"
- Prize pool: "$450" (updates live)
- Participants: "45 anglers entered"
- Status badge: "Open" (green) or "In Progress" (blue)
- Primary button: "View Details" or "Join" or "Log Catch" (if already entered)

**Advanced Filters (Modal)**
- Species (multi-select checklist)
- Entry fee range (slider: $0-$100)
- Tournament type: Open | Private | Championship
- Region: State/county selector
- Time: Today | This Week | Upcoming
- Apply and Reset buttons

---

## 3. Tournament Detail Screen

### Header
- Back arrow (to Home)
- Tournament name
- Share icon (invite friends)

### Hero Section
- Large species illustration or photo
- Tournament name: "Biggest Snook Today"
- Status: "Open - 5h 12m remaining" (countdown)
- Entry fee: "$10.00"

### Prize Pool Card
- Current pool: "$500"
- Prize breakdown:
  - 1st place: $350 (70%)
  - 2nd place: $100 (20%)
  - 3rd place: $50 (10%)
- "Pool grows with each entry!"

### Tournament Info
- **Species:** Snook only
- **Region:** Florida West Coast (map thumbnail, tap to expand)
- **Time window:** Today, 6 AM - 8 PM EST
- **Current entrants:** 50 anglers
- **Measurement method:** Approved measuring board required

### Primary CTA (Context-Dependent)

**If NOT joined:**
- Large button: "Enter Tournament - $10"

**If joined but no catches:**
- Large button: "Log Your First Catch"
- Secondary: "View Rules"

**If joined with catches:**
- Button: "Log Another Catch"
- Button: "View My Catches"
- Button: "Leaderboard"

### Tabs

**Rules Tab**
- Expandable sections:
  1. **Eligible Species**
     - "Only Snook (Centropomus undecimatus)"
     - "Minimum length: 18 inches"
     - "Maximum length: No maximum"

  2. **Geographic Boundaries**
     - "Florida West Coast (Hillsborough, Pinellas, Manatee counties)"
     - Interactive map showing boundaries

  3. **Time Window**
     - "Tournament runs 6 AM - 8 PM EST today"
     - "Catches submitted outside this window will be rejected"

  4. **Measurement Requirements**
     - "Must use approved measuring board"
     - "Fish must be placed with head at bump stop"
     - "Entire fish from head to tail must be visible"
     - "Measurement is automatic via computer vision"
     - Link: "View approved boards"

  5. **Photo Requirements**
     - "Photos must be taken through the app (no uploads)"
     - "Verification code must be visible in photo"
     - "Fish must be alive or freshly caught"
     - "Good lighting and clear visibility required"

  6. **Video Verification**
     - "Top finishers may be required to submit verification video"
     - "10-second video showing face, board, and fish"
     - "Must be completed within 15 minutes of notification"

  7. **Anti-Cheat Policy**
     - "Zero tolerance for cheating"
     - "Automated fraud detection reviews all catches"
     - "Suspicious catches held for manual review"
     - "Violations result in bans and forfeiture"

  8. **Scoring**
     - "Longest fish wins"
     - "Measurements rounded down to nearest 0.25 inch"
     - "Ties: First submission wins"

  9. **Payouts**
     - "Winners paid within 1 hour of tournament end"
     - "Payment to method on file"
     - "Top finishers verified before payout"

**Leaderboard Tab**
- Live rankings (updates every 2 seconds)
- Shows:
  - Rank (#1, #2, etc.)
  - Username
  - Fish length
  - Time submitted
  - Thumbnail photo (tap to enlarge)
  - "Under Review" badge if applicable
- Current user's rank highlighted
- Pull to refresh

**My Catches Tab**
- List of user's submissions this tournament
- Each catch shows:
  - Photo thumbnail
  - Length measurement
  - Status: Accepted | Under Review | Rejected
  - Timestamp
  - Leaderboard position (if accepted)
- If rejected, shows reason
- Empty state: "No catches yet. Tap 'Log a Catch' to get started!"

---

## 4. Tournament Entry & Payment

### Entry Flow (Modal)

**Step 1: Confirm Entry**
- Tournament name and details summary
- Entry fee: "$10.00"
- "By entering, you agree to tournament rules and anti-cheat policy"
- Checkboxes:
  - "I have an approved measuring board"
  - "I agree to the rules"
- Button: "Continue to Payment"

**Step 2: Payment Selection**
- Payment methods on file (radio buttons):
  - Visa ending in 1234
  - Platform wallet: $25.00 available
  - Apple Pay / Google Pay
- Link: "Add new payment method"
- Fee breakdown:
  - Entry fee: $10.00
  - Processing fee: $0.50
  - Total: $10.50
- Button: "Pay $10.50 & Enter"

**Step 3: Processing**
- Loading spinner
- "Processing payment..."

**Step 4: Confirmation**
- Success checkmark animation
- "You're in!"
- Tournament details
- Buttons:
  - "Log a Catch" (primary)
  - "View Leaderboard"
  - "Done" (dismiss modal)

**If payment fails:**
- Error message: "Payment failed. Please try another method."
- Option to retry or change payment

---

## 5. Logging a Catch (Core Flow)

### Phase 1: Starting a Catch Session

**User taps "Log a Catch" from any screen**

**Catch Session Pre-Flight Screen**
- Checklist (each item checks automatically or asks for confirmation):
  - ✓ You're in a tournament (shows which one)
  - ✓ Camera permission granted
  - ✓ Location permission granted
  - ? GPS location check (detecting...)

**If GPS disabled:**
- Alert: "Location Required"
- "Please enable location services to verify you're in tournament boundaries"
- Button: "Open Settings"
- Button: "Cancel"

**If outside tournament boundaries:**
- Alert: "Outside Tournament Area"
- "You're currently in [Location]. This tournament is for [Tournament Region] only."
- Button: "View Map"
- Button: "Cancel"

**If outside tournament time window:**
- Alert: "Tournament Not Active"
- "This tournament runs [Time Window]. Current time: [Current Time]."
- Button: "OK"

**If all checks pass:**
- Auto-advances to Session Started screen

### Phase 2: Session Started

**Session Started Screen**
- Large display of unique code: "XG7K"
- Code displayed in multiple formats:
  - Large text: "XG7K"
  - QR code (optional, for printing)
- Timer: "Session expires in 10:00"
- Instructions card:
  1. "Write code 'XG7K' on paper"
  2. "Place fish on measuring board"
  3. "Head at bump stop, tail visible"
  4. "Place code in frame where it's visible"
  5. "Tap 'Ready' when positioned"

- Collapsible "Tips for Best Results":
  - "Use natural light (avoid harsh shadows)"
  - "Photograph from directly above"
  - "Ensure entire fish and board are in frame"
  - "Keep code clearly visible"
  - "Remove any obstructions from tail"

- Buttons:
  - "Ready to Capture Photo" (primary, large)
  - "Cancel Session" (secondary, text link)

**If user taps "Cancel Session":**
- Confirmation: "Are you sure? This code will expire."
- "Yes, Cancel" / "No, Continue"

**Session expires (10 min):**
- Alert: "Session Expired"
- "This catch code is no longer valid. Start a new session to log a catch."
- Button: "Start New Session"

### Phase 3: Camera Capture

**Camera View (Full Screen)**
- Live camera preview
- Overlay elements:
  - Top bar:
    - "X" close button (top left)
    - Code reminder: "Show code: XG7K" (top center)
    - Session timer: "8:34" (top right)

  - Center area:
    - Framing guides (translucent rectangle showing ideal board placement)
    - Tips banner (auto-hides after 3 sec): "Position board within guides"

  - Bottom bar:
    - Gallery icon disabled (grayed out with "X")
    - Large circular capture button
    - Flash toggle
    - Grid toggle

**Real-Time Feedback (Optional AI Assist)**
- As user positions board, subtle hints appear:
  - "Move closer" (if board too small)
  - "Center the board" (if off-center)
  - "Reduce shadows" (if lighting poor)
  - Green outline on guides when well-positioned

**User taps capture button:**
- Shutter animation
- Haptic feedback
- Sound: Camera click
- Screen freezes on captured image

### Phase 4: Photo Review & Processing

**Processing Screen**
- Captured photo displayed (full screen)
- Semi-transparent overlay: "Analyzing photo..."
- Progress indicators (animated):
  - ✓ Code detected
  - ✓ Board detected
  - ⏳ Measuring fish...
  - ⏳ Validating image...

**Processing time: 3-7 seconds**

### Phase 5A: Success Path

**Measurement Success Screen**
- Photo displayed with overlays:
  - Green line from fish head to tail
  - Measurement callout: "23.75 inches"
  - Verification code highlighted (green box)
- Info cards:
  - Species: "Snook"
  - Length: "23.75 in"
  - Location: "Tampa Bay, FL"
  - Time: "2:34 PM EST"
  - Tournament: "Biggest Snook Today"
  - Current rank: "You'd be #3!"

- Buttons:
  - "Submit This Catch" (primary, large)
  - "Retake Photo" (secondary)

**User taps "Submit This Catch":**
- Loading screen: "Submitting catch..."
- Progress bar (or spinner)
- "This may take a few seconds"

**Submission Processing (5-10 seconds)**

**Submission Success:**
- Success animation (confetti or checkmark)
- "Catch Accepted!"
- Final measurement: "23.75 inch Snook"
- Leaderboard position: "You're now #3!"
- Prize position: "You're in the money! Currently $50"
- Buttons:
  - "View Leaderboard" (primary)
  - "Log Another Catch"
  - "Done"

### Phase 5B: Failure Paths

**If code not detected:**
- Alert icon
- "Verification Code Not Found"
- Explanation: "We couldn't find code 'XG7K' in your photo."
- Tips:
  - "Ensure code is clearly written"
  - "Place code where it's fully visible"
  - "Avoid shadows on the code"
- Photo displayed with problem areas highlighted
- Buttons:
  - "Retake Photo" (primary)
  - "Cancel Session"

**If board not detected:**
- Alert icon
- "Measuring Board Not Detected"
- Explanation: "We couldn't identify an approved measuring board."
- Tips:
  - "Ensure you're using an approved board"
  - "Entire board must be visible"
  - "Photograph from directly above"
- Link: "View approved boards"
- Buttons:
  - "Retake Photo" (primary)
  - "Cancel Session"

**If fish not clearly visible:**
- Alert icon
- "Fish Not Clearly Visible"
- Explanation: "We need to see the entire fish to measure accurately."
- Tips:
  - "Ensure fish head is at bump stop"
  - "Entire tail must be visible"
  - "Remove hands or obstructions"
  - "Fish should be centered on board"
- Photo with problem areas circled in red
- Buttons:
  - "Retake Photo" (primary)
  - "Cancel Session"

**If measurement uncertain:**
- Alert icon
- "Cannot Determine Accurate Measurement"
- Explanation: "We're unable to confidently measure this catch."
- Common issues:
  - "Fish not aligned with board"
  - "Tail is obscured or bent"
  - "Poor lighting or focus"
  - "Board markings not clear"
- Buttons:
  - "Retake Photo" (primary)
  - "Get Help" (opens support chat)
  - "Cancel Session"

**If image quality issues:**
- Alert icon
- "Image Quality Issue"
- Explanation: "Photo quality is insufficient for verification."
- Issues detected:
  - "Blurry or out of focus"
  - "Lighting too dark"
  - "Glare obscuring details"
- Buttons:
  - "Retake Photo" (primary)
  - "Tips" (lighting guide)

### Phase 5C: Under Review

**If catch flagged for manual review:**
- Info icon (not error)
- "Catch Under Review"
- Explanation: "Your catch is being reviewed by our team. This is normal for large fish and helps ensure fair competition."
- Details:
  - Photo thumbnail
  - Preliminary measurement: "23.75 inches (pending)"
  - Status: "Review in progress"
  - "Estimated review time: Within 30 minutes"
- "What happens now?"
  - "Our team will verify your photo meets all requirements"
  - "You'll receive a notification when review is complete"
  - "If approved, you'll appear on the leaderboard"
- Buttons:
  - "View My Catches"
  - "Done"

**Review notification (push):**
- "✓ Your catch was approved! 23.75 inch Snook - You're #3"
- OR
- "Your catch was not approved. [Reason]. You can submit another catch."

### Phase 5D: Rejection

**If catch rejected:**
- Error icon (red)
- "Catch Not Accepted"
- Reason (specific):
  - "Code not visible"
  - "Outside tournament boundaries"
  - "Submitted after tournament ended"
  - "Duplicate photo detected"
  - "Image appears to be edited"
  - "Measuring board not detected"
  - [Other specific reason]
- "What you can do:"
  - "Review the rules and photo requirements"
  - "Start a new catch session"
  - "Contact support if you believe this is an error"
- Buttons:
  - "Try Again" (starts new session)
  - "View Rules"
  - "Contact Support"
  - "Done"

---

## 6. Video Verification Flow

### Trigger

**User receives push notification:**
- "🎉 Your catch qualifies for video verification!"
- "23.75 inch Snook - Currently #2"
- "Complete video verification to be eligible for prizes"

**In-app notification banner (top of screen):**
- "Video Verification Required"
- Timer: "Complete within 14:23"
- "Tap to record"

**User taps notification:**

### Video Verification Instructions Screen

**Header:**
- "Video Verification"
- Timer: "Complete in 14:23"

**Explanation:**
- "Your catch qualifies for video verification to ensure fair competition."
- "This is required for all top finishers."

**Video Requirements:**
1. "Record one continuous 10-second video"
2. "Show your face clearly"
3. "Pan to measuring board with fish"
4. "Show verification code"
5. "Show entire fish from head to tail"
6. "No cuts or edits allowed"

**Example Video:**
- Thumbnail: "Watch example" (plays demo video)

**Buttons:**
- "Start Recording" (primary)
- "Why is this required?" (opens FAQ)

### Video Recording Screen

**Camera view (full screen):**
- Live preview
- Overlay elements:
  - Timer: "10 seconds" (counts down when recording)
  - Progress bar at top
  - Recording indicator (red dot when active)
  - Prompt text (changes as video progresses):
    - 0-2 sec: "Show your face clearly"
    - 3-5 sec: "Pan to the measuring board"
    - 6-8 sec: "Show fish and verification code"
    - 9-10 sec: "Show tail and measurement"

**Bottom controls:**
- Large red record button (tap to start/stop)
- "Cancel" link

**Recording starts:**
- Red recording indicator pulses
- Countdown: "10... 9... 8..."
- Haptic feedback at each prompt transition

**Recording completes (10 sec):**
- Auto-stops
- Preview screen appears

### Video Review Screen

**Video player:**
- Playback controls
- "Tap to replay"

**Checklist (auto-checked or user confirms):**
- Face visible: ✓
- Board visible: ✓
- Fish visible: ✓
- Code visible: ✓
- Continuous take (no cuts): ✓

**Buttons:**
- "Submit Video" (primary)
- "Re-Record" (if not satisfied)

**User taps "Submit Video":**
- Loading: "Uploading video..."
- Progress bar
- "This may take 30-60 seconds"

### Video Processing

**Processing screen:**
- "Analyzing video..."
- Progress indicators:
  - ✓ Upload complete
  - ⏳ Verifying authenticity...
  - ⏳ Matching to photo...
  - ⏳ Final checks...

**Success:**
- Checkmark animation
- "Video Verified!"
- "Your catch is confirmed. Good luck!"
- Current leaderboard position: "#2 - $100 prize"
- Button: "View Leaderboard"

**Failed verification:**
- "Video Verification Issue"
- Reason:
  - "Video appears to be edited"
  - "Fish doesn't match photo"
  - "Code not visible"
  - "Not a continuous take"
- "You may retry once"
- Buttons:
  - "Retry Video" (if retry available)
  - "Contact Support"

**Timeout (15 min expires):**
- Alert: "Verification Deadline Passed"
- "Your catch has been disqualified from prizes."
- "Complete verification promptly for future catches."

---

## 7. Leaderboards

### Tournament Leaderboard (Within Tournament Detail)

**Header:**
- Tournament name
- Time remaining or "Completed"
- Total participants

**Filter/Sort:**
- Dropdown: "All Catches" | "Top 10" | "My Position"
- Sort: Rank (default) | Time | Username

**Leaderboard List:**

Each entry shows:
- **Rank:** Large number (#1, #2, etc.)
  - Gold/Silver/Bronze icons for top 3
- **Username:** Display name
  - "You" badge if current user
  - "Verified Angler" badge if applicable
- **Fish length:** "24.25 inches"
- **Species:** "Snook" (if multi-species tournament)
- **Location:** "Tampa, FL" (city only)
- **Time:** "2 hours ago"
- **Photo thumbnail:** Tap to view full
- **Prize:** "$350" (for top positions)

**Special indicators:**
- "Under Review" badge (yellow)
- "Video Required" badge (blue)
- Your position highlighted (different background color)

**User's position card (pinned):**
- Always visible at top or bottom
- Shows: "You're #3 - $50 prize!"
- Quick stats: Your best catch this tournament

**Empty states:**
- No catches yet: "No catches submitted yet. Be the first!"
- You haven't submitted: "Submit a catch to appear on the leaderboard"

**Tap on leaderboard entry:**
- Opens catch detail modal:
  - Full-size photo
  - Measurement with overlay
  - Username and stats
  - Timestamp and location
  - "Report Issue" button (for suspected fraud)
  - Close button

### Global Leaderboard (App Tab)

**Header:**
- "Leaderboards"
- Tabs: Today | This Week | All Time | Hall of Fame

**Filter bar:**
- Species dropdown
- Region dropdown
- Time period selector

**Sections:**

**1. Top Anglers (by earnings)**
- Card-based layout
- Each card:
  - Rank
  - Profile photo
  - Username
  - Total earnings this period
  - Tournaments won
  - Verified Angler badge
- Tap to view angler profile

**2. Biggest Fish (by species)**
- Species selector tabs
- List of record catches:
  - Rank
  - Length
  - Username
  - Date caught
  - Tournament name
  - Photo thumbnail
- Tap to view catch details

**3. Hall of Fame (State Records)**
- Official state record for each species
- Historic catches
- Photo and story
- Link to tournament

---

## 8. My Tournaments

### My Tournaments Screen (App Tab)

**Header:**
- "My Tournaments"
- Tabs: Active | Completed

**Active Tab:**
- Tournaments user has entered and are still open
- Each card:
  - Tournament name
  - Time remaining (countdown)
  - Your best catch: "23.75 inches - #3"
  - Current prize position: "$50"
  - Button: "Log a Catch"
  - Button: "View Leaderboard"
- Pull to refresh

**Completed Tab:**
- Past tournaments
- Filter: This Week | This Month | All Time
- Each card:
  - Tournament name
  - Date
  - Your finish: "#3 of 52"
  - Your best catch: "23.75 inches"
  - Prize won: "$50" (or "No prize")
  - Status badge: "Paid" or "Pending Payment"
  - Button: "View Results"
- Empty state: "No completed tournaments yet"

**Tap "View Results":**
- Opens tournament detail (read-only)
- Shows final leaderboard
- Your catches listed
- Tournament stats

---

## 9. Profile & Settings

### Profile Screen (App Tab)

**Header:**
- Profile photo (tap to change)
- Username
- "Verified Angler" badge (if applicable)
- "Edit Profile" button

**Stats Dashboard:**
- **Total Earnings:** $245.00
  - "Withdraw" button
- **Tournaments Entered:** 23
- **Catches Logged:** 47
- **Best Finish:** 1st place (2x)
- **Current Streak:** 5 days

**Recent Catches:**
- Grid of photo thumbnails
- Tap to view full catch details

**Sections:**

**1. Account**
- Email: user@example.com
- Change password
- Verify email (if not verified)

**2. Payment & Payouts**
- Payment methods
  - List of cards on file
  - "Add payment method"
  - Default payment indicator
- Platform wallet: $25.00
  - "Deposit" | "Withdraw"
- Payout settings
  - Default payout method
  - Payout preferences (instant vs. standard)
- Transaction history
  - List of all entries, wins, withdrawals

**3. Measuring Board**
- "My Board:" [Photo of user's board]
- "Board certified" ✓
- Link: "Buy a new board"
- Link: "Board requirements"

**4. Notifications**
- Push notifications toggle
- Email notifications toggle
- Notification preferences:
  - Tournament reminders
  - Leaderboard updates
  - Catch accepted/rejected
  - Payment confirmations
  - New tournaments

**5. Preferences**
- Home region (affects tournament recommendations)
- Favorite species (multi-select)
- Units: Imperial (inches) | Metric (cm)
- Language

**6. Support & Legal**
- Help center / FAQs
- Contact support
- Report a problem
- Terms of service
- Privacy policy
- Anti-cheat policy

**7. Verified Angler Program**
- "Apply for Verified Status"
- Requirements:
  - 10+ tournaments completed
  - No violations
  - Identity verification
- Benefits displayed

**8. Referral Program**
- "Invite Friends"
- Your referral code
- Referrals this month: 3
- Bonus earned: $15
- "Share referral link"

**9. Sign Out**
- "Sign Out" button

---

## 10. Admin Review Dashboard (Web-Based)

This is the only web interface. Used by staff to review flagged catches.

### Dashboard Home

**Stats Overview:**
- Catches pending review: 12
- Average review time: 3m 42s
- Fraud detection accuracy: 96.3%
- Auto-accept rate: 87%

**Review Queue:**
- List of flagged catches
- Columns:
  - Thumbnail
  - User
  - Tournament
  - Length
  - Flags (icons)
  - Priority (high/medium/low)
  - Time submitted
  - Actions

**Sort & Filter:**
- Priority: High first
- Flags: Specific fraud types
- Tournament: Filter by tournament
- User: Search user

### Catch Review Screen

**Left panel: Photo Analysis**
- Full-size photo
- Zoom controls
- Measurement overlay toggle
- Multiple views (if available)

**Right panel: Metadata & Signals**

**1. Basic Info:**
- User: Username (link to profile)
- Tournament: Name and time window
- Species: Snook
- Measurement: 23.75 inches
- Timestamp: 2024-03-15 2:34 PM EST
- GPS: 27.9506° N, 82.4572° W (map link)

**2. Fraud Signals:**
- Overall fraud score: 68% (yellow/red indicator)
- Breakdown:
  - Image manipulation: 12% (green)
  - Duplicate photo: 89% (red) - "95% match to submission #4523"
  - GPS anomaly: 5% (green)
  - Temporal anomaly: 8% (green)
  - Behavioral anomaly: 45% (yellow)

**3. EXIF Data:**
- Camera: iPhone 14 Pro
- Capture time: 2024-03-15 2:34:12 PM
- GPS embedded: Yes
- Software: None detected
- Resolution: 4032x3024

**4. Session Data:**
- Session ID: abc123
- Code: XG7K
- Code detected: Yes
- Session start: 2:31 PM
- Photo taken: 2:34 PM (3min session)

**5. User History:**
- Total catches: 47
- Violations: 1 warning
- Success rate: 78%
- Account age: 3 months
- Tournaments entered: 23

**6. Similar Catches:**
- "Possible duplicates found:"
  - Thumbnail of match
  - Similarity: 95%
  - Submission: Tournament #45, User: "angler123", 2 weeks ago
  - Status: Rejected

**7. Environmental Data:**
- Weather: Sunny, 78°F
- Sunrise/sunset: 6:42 AM / 7:18 PM
- Tide: High tide at 2:15 PM
- Photo lighting: Consistent with outdoor daylight

**8. Video (if available):**
- Video player
- Verification status
- Manual review notes

**Actions (Bottom):**
- **Approve Catch** (green button)
  - Adds to leaderboard immediately
  - Notifies user
- **Reject Catch** (red button)
  - Must select reason from dropdown
  - Option to add note to user
  - Option to flag user for monitoring
- **Request Video Verification** (blue button)
  - Sends notification to user
  - Sets 15-min deadline
- **Flag for Investigation** (yellow button)
  - Escalates to senior admin
  - Does not immediately reject
- **Ban User** (critical action, requires confirmation)

**Notes Section:**
- Admin can add internal notes
- Notes history displayed
- Tagged to user and catch

### User Management

**User Profile View:**
- Full user history
- All catches (filterable)
- Fraud score timeline
- Payment history
- Violations and warnings
- Ban history
- Notes from admins

**Actions:**
- Warn user
- Temporary ban (duration selector)
- Permanent ban
- Reset fraud score (rare)
- Manual verification badge

---

## 11. Edge Cases & Error States

### Network Issues

**No internet connection:**
- Banner at top: "No internet connection"
- Cached data displayed (tournaments, leaderboards)
- "Retry" button
- If submitting catch: "Submission queued. Will upload when online."

**Slow connection:**
- Loading indicators
- "This is taking longer than usual..."
- Option to cancel

**Upload failed:**
- "Upload Failed"
- "Would you like to retry?"
- Catch data saved locally
- Auto-retry when connection restored

### App Crashes or Force-Quit

**During catch session:**
- Session data persists for 10 minutes
- On relaunch: "You have an unfinished catch session. Resume or cancel?"
- Resume: Returns to camera with same code
- Session expired: "Session expired. Start new session."

**During photo upload:**
- Photo saved locally
- On relaunch: "You have a pending catch submission. Upload now?"

### Device Issues

**Low storage:**
- Warning before capturing: "Low storage. Free up space for best results."
- Option to continue or cancel

**Low battery:**
- If <10%: "Low battery. Consider charging before fishing to avoid losing catches."

**Camera hardware failure:**
- "Camera unavailable. Check permissions or restart device."
- Link to troubleshooting

### GPS Issues

**GPS disabled:**
- Cannot start catch session
- Prompt to enable in settings

**Weak GPS signal:**
- "Searching for GPS signal..."
- Spinner with timeout
- After 30 sec: "GPS signal weak. Move to open area."

**GPS spoof detected:**
- Catch rejected
- "Location verification failed"
- User flagged for review

### Payment Issues

**Payment declined:**
- Error message with reason (insufficient funds, card expired)
- Option to try different method
- Entry not processed

**Payout failed:**
- User notified: "Payout issue. Check payment method."
- Support ticket auto-created
- Manual resolution

### Tournament Issues

**Tournament cancelled:**
- Push notification: "Tournament cancelled. Entry fee refunded."
- Refund processed automatically
- Explanation given (low participation, technical issue, etc.)

**Tournament extended:**
- Push notification: "Tournament extended by 2 hours!"
- Countdown timer updates
- All catches still valid

---

## 12. Notifications

### Push Notifications

**Tournament Related:**
- "Biggest Snook Today starts in 1 hour!"
- "5 minutes left in Redfish Challenge!"
- "You've been bumped to #4. Log another catch!"

**Catch Status:**
- "Your catch was accepted! 23.75 inch Snook"
- "Your catch is under review. Results within 30 min."
- "Your catch was not accepted. [Reason]"

**Verification:**
- "Video verification required! Complete within 15 min."
- "Video verified! You're confirmed for prizes."

**Results:**
- "Tournament ended! Final results available."
- "You won! $50 is on the way."
- "You finished #3! View final leaderboard."

**Payment:**
- "Payment received: $50"
- "Payout failed. Please update payment method."

**Social:**
- "You've been bumped to #1!"
- "New tournament: Tarpon Throwdown - $20 entry"

### In-App Banners

- Appear at top of screen
- Dismissible
- Tap to navigate to relevant screen
- Badge counts on tabs

### Email Notifications

- Tournament results summary
- Payment confirmations
- Security alerts (new device login)
- Weekly recap (tournaments entered, earnings)

---

This comprehensive user flow document covers every major screen, interaction, and state in the mobile fishing tournament app. The design prioritizes clarity, speed, and trust while maintaining robust anti-cheat measures throughout the user journey.
