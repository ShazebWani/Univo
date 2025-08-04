# Firebase Setup for Univo (Web + Mobile)

This guide will help you set up Firebase authentication and Firestore for your Univo app across all platforms (Web, iOS, Android).

## 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter your project name (e.g., "univo-app")
4. Follow the setup wizard

**Note**: This single Firebase project will be used for Web, iOS, and Android apps.

## 2. Enable Authentication

1. In your Firebase project, go to "Authentication" in the left sidebar
2. Click "Get started"
3. Go to the "Sign-in method" tab
4. Enable the following providers:
   - **Email/Password**: Enable this for basic email/password authentication

### Email Verification Setup:
1. In the Authentication section, go to "Settings" tab
2. Under "Authorized domains", add your domain (localhost for development)
3. Under "Email verification", make sure it's enabled
4. You can customize the verification email template in the "Templates" tab



## 3. Get Your Firebase Configuration

### For Web App:
1. In your Firebase project, click the gear icon (⚙️) next to "Project Overview"
2. Select "Project settings"
3. Scroll down to "Your apps" section
4. Click the web icon (</>)
5. Register your app with a nickname (e.g., "univo-web")
6. Copy the configuration object

### For Android App:
1. In your Firebase project, click the gear icon (⚙️) next to "Project Overview"
2. Select "Project settings"
3. Scroll down to "Your apps" section
4. Click the Android icon (🤖)
5. Enter package name: `com.univomobile`
6. Download `google-services.json`
7. Place it in: `UnivoMobile/android/app/`

### For iOS App:
1. In your Firebase project, click the gear icon (⚙️) next to "Project Overview"
2. Select "Project settings"
3. Scroll down to "Your apps" section
4. Click the iOS icon (🍎)
5. Enter bundle ID: `com.univomobile`
6. Download `GoogleService-Info.plist`
7. Place it in: `UnivoMobile/ios/UnivoMobile/`

## 4. Set Up Environment Variables

### For Web App:
Create a `.env` file in your web project root (`/Users/shazebwani/Desktop/Univo/`) with the following variables:

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

Replace the values with your actual Firebase configuration.

### For Mobile Apps:
The configuration files (`google-services.json` for Android and `GoogleService-Info.plist` for iOS) will be placed in your mobile app project directories. The Firebase SDK will automatically read these files.

**Note**: All apps will use the same Firebase project, so users can sign in on any platform with the same credentials.

## 5. Security Rules (Optional for now)

For now, you can use the default Firestore security rules. Later, you'll want to set up proper rules for your data.

## 6. Testing the Authentication

### For Web App:
```bash
cd /Users/shazebwani/Desktop/Univo
npm run dev
```
1. Navigate to `/login` or `/signup`
2. Try creating an account with a .edu email address
3. Check your email for verification link
4. Verify your email and then sign in

### For Mobile App:
```bash
cd /Users/shazebwani/Desktop/Univo/UnivoMobile
npx react-native run-ios    # For iOS
npx react-native run-android # For Android
```
1. Try creating an account with a .edu email address
2. Check your email for verification link
3. Verify your email and then sign in

### Cross-Platform Testing:
- **Same Firebase project** = Same user database
- **Users can sign in** on web OR mobile with same credentials
- **All data syncs** between platforms
- **Check Firebase console** to see users from both platforms

**Note**: Only .edu email addresses are accepted for registration. Users must verify their email before they can sign in.

## 7. Production Deployment

### For Web App:
When deploying to production:

1. Add your production domain to the authorized domains in Firebase Authentication
2. Update your environment variables with production values
3. Consider setting up proper security rules for Firestore

### For Mobile Apps:
1. Build your app for production
2. Upload to App Store (iOS) and Google Play Store (Android)
3. Configure Firebase for production environments

### Cross-Platform Benefits:
- **Single Firebase project** = Easier management
- **Shared user database** = Users can use any platform
- **Unified data** = All platforms access same data
- **Consistent experience** = Same authentication across platforms

## Features Included

### Authentication:
- ✅ **School Email Validation** - Only .edu email addresses allowed
- ✅ **Email Verification** - Users must verify their email before signing in
- ✅ **Cross-Platform Auth** - Same credentials work on web, iOS, and Android
- ✅ Email/password authentication
- ✅ Password reset functionality
- ✅ Protected routes
- ✅ User context throughout the app
- ✅ Loading states
- ✅ Error handling

### UI/UX:
- ✅ **Web App** - Modern UI with shadcn/ui components
- ✅ **Mobile App** - Native React Native components
- ✅ **Consistent Design** - Same branding across platforms

### Data Management:
- ✅ **Single Firebase Project** - Unified user database
- ✅ **Cross-Platform Sync** - Data accessible from any platform
- ✅ **Real-time Updates** - Changes sync across all platforms

## Next Steps

After setting up authentication, you can:

### Web App:
1. Add user profile management
2. Set up Firestore for storing user data
3. Implement role-based access control
4. Add email verification
5. Set up user preferences and settings

### Mobile App:
1. Add more screens (Explore, Messages, Profile)
2. Implement product listing functionality
3. Add image upload capabilities
4. Implement real-time messaging
5. Add push notifications
6. Implement payment processing

### Cross-Platform Features:
1. **Shared User Profiles** - Same profile data across platforms
2. **Unified Messaging** - Messages sync between web and mobile
3. **Product Management** - List and manage products from any platform
4. **Real-time Updates** - Changes appear instantly across all platforms

## Troubleshooting

- **"Firebase: Error (auth/user-not-found)"**: User doesn't exist with that email
- **"Firebase: Error (auth/wrong-password)"**: Incorrect password
- **"Firebase: Error (auth/email-already-in-use)"**: Email is already registered
- **"Firebase: Error (auth/weak-password)"**: Password is too weak (must be at least 6 characters)

Make sure your environment variables are correctly set and that you've enabled the authentication methods you want to use in the Firebase console. 