# Fish Tournament Mobile App

React Native mobile app for iOS and Android.

## Features

- User authentication (signup/signin)
- Tournament browsing and joining
- In-app camera for catch submission
- GPS location tracking
- Real-time leaderboards
- User profile and stats
- Catch history

## Tech Stack

- **Framework:** React Native 0.72
- **Navigation:** React Navigation 6
- **State Management:** Redux Toolkit
- **HTTP Client:** Axios
- **Camera:** React Native Camera
- **Geolocation:** React Native Geolocation Service
- **Icons:** React Native Vector Icons
- **Storage:** AsyncStorage

## Prerequisites

- Node.js 16+
- React Native development environment
  - For iOS: Xcode, CocoaPods
  - For Android: Android Studio, JDK
- Backend API running (see `../backend/README.md`)

## Installation

1. **Install dependencies:**
```bash
cd mobile-app
npm install
```

2. **iOS specific (macOS only):**
```bash
cd ios
pod install
cd ..
```

3. **Configure API endpoint:**

Edit `src/services/api.js` and update the base URL:
```javascript
const API_BASE_URL = 'http://your-server-ip:3000/api';
```

For local development:
- iOS Simulator: `http://localhost:3000/api`
- Android Emulator: `http://10.0.2.2:3000/api`
- Physical device: `http://YOUR_COMPUTER_IP:3000/api`

## Running the App

**Start Metro bundler:**
```bash
npm start
```

**Run on iOS:**
```bash
npm run ios
```

**Run on Android:**
```bash
npm run android
```

## Project Structure

```
mobile-app/
├── src/
│   ├── screens/           # Screen components
│   │   ├── Auth/          # Authentication screens
│   │   │   ├── SignInScreen.js
│   │   │   └── SignUpScreen.js
│   │   ├── Home/          # Home/Tournament list
│   │   │   └── HomeScreen.js
│   │   ├── Tournaments/   # Tournament details
│   │   │   ├── TournamentDetailScreen.js
│   │   │   └── MyTournamentsScreen.js
│   │   ├── Catch/         # Catch submission flow
│   │   │   ├── CatchCameraScreen.js
│   │   │   └── CatchSubmitScreen.js
│   │   ├── Leaderboard/   # Leaderboards
│   │   │   └── LeaderboardScreen.js
│   │   └── Profile/       # User profile
│   │       └── ProfileScreen.js
│   ├── services/          # API and services
│   │   └── api.js         # Backend API client
│   ├── components/        # Reusable components
│   └── utils/             # Utility functions
├── App.js                 # Main app component
└── package.json
```

## Key Screens

### Authentication

**SignInScreen** - User login
- Email and password input
- Form validation
- JWT token storage
- Error handling

**SignUpScreen** - New user registration
- Email, username, password, region
- Password strength validation
- Automatic login after signup

### Main App

**HomeScreen** - Tournament list
- Browse active tournaments
- View tournament details
- Filter by species/status
- Pull to refresh

**TournamentDetailScreen** - Tournament details
- Tournament info and rules
- Join tournament button
- Leaderboard
- "Log a Catch" button
- User's catches for this tournament

**CatchCameraScreen** - Catch submission
- In-app camera (no gallery upload)
- GPS location capture
- Verification code display
- Photo capture with metadata

**CatchSubmitScreen** - Review and submit
- Preview captured photo
- Enter fish details (species, length)
- GPS and timestamp display
- Submit to backend

**LeaderboardScreen** - Rankings
- Real-time leaderboard
- User rankings
- Fish photos and lengths
- Tournament context

**ProfileScreen** - User profile
- User stats (tournaments, catches, winnings)
- Catch history
- Wallet balance
- Settings
- Logout

**MyTournamentsScreen** - User's tournaments
- Active tournaments user has joined
- Past tournament results
- Quick access to log catches

## API Integration

The app communicates with the backend via `src/services/api.js`.

**Key API functions:**

```javascript
// Authentication
authAPI.signUp(email, password, username, region, favorite_species)
authAPI.signIn(email, password)

// Tournaments
tournamentAPI.getTournaments(filters)
tournamentAPI.getTournamentById(id)
tournamentAPI.joinTournament(id)
tournamentAPI.getLeaderboard(id)
tournamentAPI.getMyCatches(id)

// Catches
catchAPI.startSession(tournament_id, gps_lat, gps_lon)
catchAPI.submitCatch(formData)

// User
userAPI.getProfile()
userAPI.getMyTournaments(status)
userAPI.getMyCatchHistory(tournament_id)
userAPI.getWalletBalance()
```

## Permissions

The app requires the following permissions:

**iOS (Info.plist):**
```xml
<key>NSCameraUsageDescription</key>
<string>We need access to your camera to submit fish catches</string>
<key>NSLocationWhenInUseUsageDescription</key>
<string>We need your location to verify catches are within tournament boundaries</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>We need access to save catch photos</string>
```

**Android (AndroidManifest.xml):**
```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
```

## Current Status

### ✅ Completed
- Project structure
- Authentication screens (signin/signup)
- API service integration
- Home screen with tournament list
- Navigation setup (tabs + stack)

### 🚧 In Progress
- Tournament detail screen
- Catch camera screen
- Profile screen
- My tournaments screen

### 📅 To Do (Phase 1 MVP)
- Leaderboard screen
- Catch submission flow completion
- Camera integration with GPS
- Photo upload with metadata
- Error handling and loading states
- Offline support

## Testing

**Run on iOS Simulator:**
```bash
npm run ios
```

**Run on Android Emulator:**
```bash
npm run android
```

**Test API connection:**
1. Ensure backend server is running
2. Update API_BASE_URL in src/services/api.js
3. Try signing up a new user
4. Check if tournaments load on home screen

## Troubleshooting

**Metro bundler issues:**
```bash
npm start -- --reset-cache
```

**iOS build errors:**
```bash
cd ios
pod deintegrate
pod install
cd ..
npm run ios
```

**Android build errors:**
```bash
cd android
./gradlew clean
cd ..
npm run android
```

**API connection fails:**
- Check backend server is running
- Verify API_BASE_URL is correct
- For Android emulator, use `10.0.2.2` instead of `localhost`
- For physical devices, use computer's IP address

## Next Steps (Phase 2-3)

- **Phase 2:** Anti-cheat integration
  - OCR for verification codes
  - EXIF data extraction
  - Duplicate image detection
- **Phase 3:** Computer vision
  - Automatic fish measurement
  - Measuring board detection
- **Phase 4+:** Advanced features
  - Video verification
  - Push notifications
  - Payment integration

## License

Proprietary - Fish Tournament App
