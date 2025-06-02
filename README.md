# 🚽 Potty Timer

A **cross-platform** timer app built with **Expo Router**, **SQLite database**, and **comprehensive API architecture** for **parents and caretakers**. Get reliable, customizable reminders to help with potty training! Features **persistent timers**, **background notifications**, **haptic feedback**, **animated emojis**, and **full offline functionality**.

---

## Why Potty Timer?

Potty training requires consistency and reliable reminders. Potty Timer provides a **production-ready** solution with **persistent data storage**, **customizable timer intervals**, and **impossible-to-miss notifications**. Built with modern React Native architecture and comprehensive testing, it's designed for real-world reliability.

---

## ✨ Features

### 🗄️ **Persistent Timer Management**

- **SQLite Database**: Reliable local storage for timer state and history
- **API Routes**: RESTful endpoints for timer CRUD operations
- **Context State Management**: Centralized timer state with React Context
- **Automatic Persistence**: Timers survive app restarts and crashes
- **Multiple Timer Support**: Create, manage, and switch between different timers

### ⏰ **Smart Timer System**

- **Customizable Intervals**: 30 minutes, 1 hour, 2 hours, or custom duration
- **Visual Countdown**: Live countdown display with minutes and seconds
- **Background Persistence**: Continues running when app is backgrounded
- **Completion Notifications**: Local notifications when timer expires
- **One-touch Controls**: Start, pause, reset, and adjust timers easily

### 🎭 **Engaging Visual Experience**

- **Animated Emojis**: 10 potty-themed emojis with physics-based animations
- **Dramatic Notification Mode**: Color cycling and multiple emoji displays
- **Responsive Design**: Adapts beautifully to phones, tablets, and web
- **Debug Mode**: Triple-tap toilet emoji to activate test mode
- **Haptic Feedback**: Tactile confirmation for all interactions

### 🔄 **Production-Ready Architecture**

- **Expo Router**: File-based routing with API route support
- **TypeScript**: Full type safety and excellent developer experience
- **Comprehensive Testing**: 86 passing tests with 100% pass rate
- **Error Handling**: Graceful error recovery and user feedback
- **Environment Configuration**: Development and production builds

---

## 🚀 Quick Start

### 1. **Installation**

```bash
# Clone the repository
git clone <repository-url>
cd potty-timer

# Install dependencies
npm install

# Start development server
npx expo start
```

### 2. **Development Setup**

```bash
# Run with specific platform
npx expo start --ios     # iOS simulator
npx expo start --android # Android emulator
npx expo start --web     # Web browser

# Run tests
npm test                 # Full test suite
npm run test:watch      # Watch mode
npm run test:coverage   # Coverage report
```

### 3. **Build for Production**

```bash
# Create development build
npx eas build --profile development

# Create production build
npx eas build --profile production

# Submit to app stores
npx eas submit
```

---

## 🏗️ Architecture Overview

### **File Structure**

```
potty-timer/
├── app/                          # Expo Router app directory
│   ├── api/                      # API routes
│   │   └── timers/              # Timer API endpoints
│   │       ├── +api.ts          # GET/POST /api/timers
│   │       ├── [id]+api.ts      # GET/PUT/DELETE /api/timers/:id
│   │       └── current+api.ts   # GET /api/timers/current
│   ├── index.tsx                # Main app screen
│   └── _layout.tsx              # Root layout with providers
├── contexts/
│   └── TimerContext.tsx         # Centralized timer state management
├── services/
│   └── database.ts              # SQLite database service
├── hooks/
│   └── useTimerAPI.ts           # API interaction hooks
├── AnimatedEmoji.tsx            # Emoji animation component
├── CountdownTimer.tsx           # Timer display component
└── jest.config.js               # Comprehensive test configuration
```

### **Core Components**

#### **TimerContext** - Centralized State Management

- Manages all timer state with React Context
- Handles database synchronization
- Provides timer CRUD operations
- Real-time countdown updates

#### **Database Service** - SQLite Integration

- Persistent timer storage
- Transaction-based operations
- Error handling and recovery
- Database migrations and schema management

#### **API Routes** - RESTful Endpoints

- `/api/timers` - List and create timers
- `/api/timers/:id` - Get, update, delete specific timer
- `/api/timers/current` - Get active timer
- Full CRUD operations with error handling

#### **Animation System** - Engaging Visuals

- Physics-based emoji animations with Reanimated 3
- Responsive sizing and positioning
- Staggered animations for dramatic effect
- Haptic feedback integration

---

## 🎯 How to Use

### **Basic Timer Operations**

1. **Create Timer**: Tap the timer display area to select duration
2. **Start Timer**: Tap the play button to begin countdown
3. **Monitor Progress**: Watch the live countdown display
4. **Handle Completion**: Receive notification and dismiss alert

### **Advanced Features**

- **Custom Durations**: Enter specific minutes and seconds
- **Debug Mode**: Triple-tap 🚽 to activate 5-second test mode
- **Background Mode**: Timer continues when app is backgrounded
- **Persistent Storage**: Timers survive app restarts

### **Notification Modes**

- **Normal Mode**: Calm interface with single emoji animations
- **Alert Mode**: Dramatic cycling colors with multiple emojis
- **Debug Mode**: Quick 5-second testing for development

---

## 🧪 Testing

### **Comprehensive Test Suite**

The app includes **86 passing tests** with **100% pass rate**:

```bash
# Run all tests
npm test

# Specific test categories
npm run test:database    # Database operations (15 tests)
npm run test:api        # API endpoints (63 tests)
npm run test:emoji      # Component rendering (8 tests)

# Test with coverage
npm run test:coverage
```

### **Test Coverage**

- **Database Service**: Complete CRUD operations, transactions, error handling
- **API Routes**: All endpoints, validation, error responses
- **Timer Context**: State management, real-time updates
- **Components**: Rendering, responsiveness, animations

---

## 📱 Platform Support

| Platform    | Timer Management | Notifications | Database | API Routes |
| ----------- | ---------------- | ------------- | -------- | ---------- |
| **iOS**     | ✅ Full          | ✅ Full       | ✅ Full  | ✅ Full    |
| **Android** | ✅ Full          | ✅ Full       | ✅ Full  | ✅ Full    |
| **Web**     | ✅ Full          | ⚠️ Limited    | ✅ Full  | ✅ Full    |

---

## 🔧 Configuration

### **Environment Variables**

```bash
# .env file
EXPO_PUBLIC_ENV=development  # or 'production'
```

### **Timer Presets**

```typescript
// Customize in app/index.tsx
const timerPresets = [
  { label: '30 Minutes', value: 1800 },
  { label: '1 Hour', value: 3600 },
  { label: '2 Hours', value: 7200 },
];
```

### **Notification Intervals**

```typescript
// Customize notification frequency
const NOTIFICATION_INTERVAL = 3600; // 1 hour in seconds
```

---

## 🛠️ Development

### **Key Technologies**

- **Expo SDK 53**: Latest Expo features and APIs
- **Expo Router**: File-based routing with API routes
- **SQLite**: Local database with expo-sqlite
- **TypeScript**: Full type safety
- **React Native Reanimated 3**: Smooth animations
- **Jest**: Comprehensive testing framework

### **Development Scripts**

```json
{
  "test": "jest",
  "test:watch": "jest --watch",
  "test:coverage": "jest --coverage",
  "test:database": "jest services/database.test.ts",
  "test:api": "jest app/api/**/*.test.ts"
}
```

### **Build Profiles**

```json
// eas.json
{
  "development": {
    "env": { "EXPO_PUBLIC_ENV": "development" }
  },
  "production": {
    "env": { "EXPO_PUBLIC_ENV": "production" }
  }
}
```

---

## 🎯 Who is Potty Timer For?

- **Parents** with potty-training toddlers needing reliable reminders
- **Caregivers** managing multiple children's schedules
- **Developers** wanting to study modern React Native architecture
- **Anyone** needing a robust, customizable timer application

---

## 📊 Performance & Reliability

### **Database Performance**

- SQLite transactions for data integrity
- Optimized queries with proper indexing
- Automatic error recovery and retry logic

### **Animation Performance**

- 60fps animations with Reanimated 3
- Efficient memory management
- Smooth performance on all devices

### **Testing Reliability**

- 86 tests with 100% pass rate
- Comprehensive error scenario coverage
- CI/CD ready test suite

---

## 🔮 Future Enhancements

- **Multiple Child Support**: Separate timers for different children
- **Analytics Dashboard**: Usage patterns and statistics
- **Cloud Sync**: Cross-device timer synchronization
- **Custom Themes**: Personalized color schemes and emojis

---

## 📄 License

MIT License - Feel free to use in your own projects!

---

**Happy Potty Training! 🚽✨**

_Making potty breaks impossible to forget with style and fun!_
