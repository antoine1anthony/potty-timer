# 🚽 Potty Timer

A **dramatic**, **engaging**, and **responsive** app for **parents and caretakers**---get an unforgettable, hourly reminder to help put your potty-training child or dependent on the potty! With **cycling rainbow backgrounds**, **multiple animated emojis**, **haptic feedback**, and gentle local notifications, Potty Timer turns the sometimes stressful routine of potty training into an interactive, fun experience.

---

## Why Potty Timer?

Potty training is a big milestone, but even the most attentive adult can lose track of time in a busy day. Potty Timer gives you a **dramatic, impossible-to-miss** hourly reminder that cycles through vibrant colors and fills your screen with animated emojis so your child or dependent never misses a scheduled trip to the potty. Just open the app, grant notification permissions, and let the timer handle the rest.

---

## ✨ Features

### 🎨 **Dramatic Notification Mode**

- **Cycling rainbow backgrounds**: When it's potty time, your screen transforms with 8 vibrant colors cycling every 800ms
- **Multiple animated emojis**: 8 different potty-themed emojis appear simultaneously in random positions with staggered animations
- **Attention-grabbing text**: "🚽 Time for Potty Break!! 🚽" replaces the normal message
- **Tap to dismiss**: Touch anywhere on the screen to return to normal mode

### 📳 **Enhanced Haptic Feedback**

- **Notification alerts**: Strong haptic feedback when potty time activates
- **Color changes**: Gentle haptic pulse with each background color change
- **User interactions**: Tactile feedback for all taps and dismissals
- **Success confirmations**: Satisfying haptic feedback when dismissing alerts

### 🎭 **Interactive Animations**

- **10 potty emojis**: 🚽🧻💧🛁🧼🚿🧴🪥🧽🪒 for variety and fun
- **Responsive sizes**: Emojis scale based on device size with random variations
- **Bounce effects**: Subtle scale animations with spring physics
- **Staggered timing**: Multiple emojis animate with 200ms delays for visual flow

### ⏰ **Smart Timing System**

- **Hourly notifications**: Persistent reminders every 60 minutes
- **Instant test mode**: 5-second trigger for immediate testing
- **Background persistence**: Continues working when app is backgrounded
- **Manual triggers**: Tap for instant single emoji animation in normal mode

### 📱 **Platform Excellence**

- **Cross-platform**: iOS, Android, and Web support
- **Responsive design**: Adapts beautifully to phones, tablets, and web browsers
- **Offline operation**: No internet required after installation
- **Modern architecture**: Built on Expo SDK 53 with latest React Native

---

## 🚀 How to Use

### 1. **Quick Start**

```bash
# Clone or create the project
npx create-expo-app@latest potty-timer --template
cd potty-timer

# Install all dependencies
npx expo install react-native-reanimated react-native-safe-area-context expo-notifications expo-device expo-haptics
```

### 2. **Add the Code**

- Replace `App.tsx` and add `AnimatedEmoji.tsx` from this repository
- The app includes all necessary configurations for Expo SDK 53

### 3. **Configure Your Environment**

Your `babel.config.js` should be:

```js
module.exports = {
  presets: ['babel-preset-expo'],
};
```

### 4. **Run the App**

```bash
# For testing in Expo Go (visual features work)
npx expo start

# For full notification support (recommended)
npx expo run:ios    # iOS
npx expo run:android # Android
```

### 5. **Experience the Magic**

1. **Grant notification permissions** when prompted
2. **Wait 5 seconds** for the test dramatic notification mode
3. **Tap anywhere** to dismiss or trigger animations
4. **Enjoy hourly reminders** that are impossible to miss!

---

## 🎯 User Experience Flow

### Normal Mode

- Calm blue background with "🚽 Potty Timer is running!"
- Single emoji animation when you tap the screen
- Gentle haptic feedback for interactions

### **Dramatic Notification Mode** (Every Hour)

1. **Background transforms** into cycling rainbow colors
2. **Text changes** to "🚽 Time for Potty Break!! 🚽"
3. **8 emojis appear** simultaneously with staggered animations
4. **Screen pulses** with haptic feedback on each color change
5. **Continues until** user taps anywhere to dismiss
6. **Success feedback** confirms dismissal

---

## 🛠 Technical Highlights

### **Performance Optimized**

- React Native Reanimated 3 for smooth 60fps animations
- Efficient color cycling with minimal re-renders
- Staggered animations prevent performance bottlenecks

### **Accessibility Friendly**

- Strong haptic feedback for users with visual impairments
- High contrast color combinations
- Large touch targets for easy interaction

### **Battery Conscious**

- Local JavaScript timers (no background processing)
- Haptic feedback optimized to avoid battery drain
- Efficient animation cleanup and memory management

---

## 📋 Customization Options

### **Timing Adjustments**

```typescript
// Change notification interval (App.tsx line ~89)
const interval = setInterval(() => {
  triggerNotificationMode();
}, 30 * 60 * 1000); // 30 minutes instead of 60
```

### **Color Schemes**

```typescript
// Customize notification colors (App.tsx line ~48)
const notificationColors = [
  '#FF6B6B', // Add your favorite colors
  '#4ECDC4',
  // ... more colors
];
```

### **Emoji Selection**

```typescript
// Update emoji selection (AnimatedEmoji.tsx line ~22)
const emojis = ['🚽', '🧻', '💧', '🛁', '🧼', '🚿', '🧴', '🪥', '🧽', '🪒'];
```

---

## 🎯 Who is Potty Timer For?

- **Parents** with potty-training toddlers who need reliable reminders
- **Caretakers** for young children or special needs dependents
- **Educators** in daycare or preschool settings
- **Anyone** who wants an engaging, impossible-to-miss hourly reminder system

---

## 🌐 Platform Support

| Platform    | Visual Features | Haptic Feedback | Notifications |
| ----------- | --------------- | --------------- | ------------- |
| **iOS**     | ✅ Full         | ✅ Full         | ✅ Full\*     |
| **Android** | ✅ Full         | ✅ Full         | ✅ Full\*     |
| **Web**     | ✅ Full         | ❌ Limited      | ❌ Limited    |

\*Requires development build for full notification support in production

---

## 📝 Notes

- **Expo Go Limitations**: Push notifications have limited support in Expo Go (SDK 53+)
- **Development Builds**: For full notification functionality, use `npx expo run:ios/android`
- **Web Testing**: Perfect for testing animations and visual features
- **Haptic Support**: Requires physical device (simulators have limited haptic support)

---

## 📄 License

MIT

---

**Happy Potty Training! 🚽✨🌈**

_Making potty breaks impossible to forget with style and fun!_
