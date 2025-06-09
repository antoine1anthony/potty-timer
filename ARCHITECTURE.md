# Potty Timer Architecture

## 🏗 Overview

Potty Timer is a **production-ready**, **cross-platform** Expo Router application built with **modern React Native architecture**. It features **persistent SQLite storage**, **RESTful API routes**, **comprehensive testing**, and **engaging visual effects**. The architecture prioritizes **data persistence**, **type safety**, **testability**, and **scalable state management**.

---

## 🏛️ System Architecture

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Expo Router App                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │     UI      │    │   Context   │    │  Database   │     │
│  │  (index.tsx)│◄──►│(TimerContext)◄──►│  (SQLite)   │     │
│  │             │    │             │    │             │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│         │                   │                   │          │
│         ▼                   ▼                   ▼          │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │ Components  │    │ API Routes  │    │  Services   │     │
│  │ AnimatedEmoji│    │(/api/timers)│    │(database.ts)│     │
│  │CountdownTimer│    │             │    │             │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                    Platform Layer                           │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │     iOS     │    │   Android   │    │     Web     │     │
│  │ Haptics+    │    │ Haptics+    │    │ Visual Only │     │
│  │Notifications│    │Notifications│    │             │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

---

## 🗂️ File Structure & Routing

### Expo Router File Organization

```
app/
├── _layout.tsx                    # Root layout with providers
├── index.tsx                      # Main timer screen
└── api/                          # API route handlers
    └── timers/                   # Timer API endpoints
        ├── +api.ts              # GET/POST /api/timers
        ├── [id]+api.ts          # CRUD for /api/timers/:id
        ├── current+api.ts       # GET /api/timers/current
        └── [id]/                # Nested dynamic routes
            └── start+api.ts     # POST /api/timers/:id/start

contexts/
└── TimerContext.tsx             # Centralized state management

services/
└── database.ts                  # SQLite database service

hooks/
└── useTimerAPI.ts              # API interaction hooks

components/
├── AnimatedEmoji.tsx           # Emoji animation component
└── CountdownTimer.tsx          # Timer display component

tests/
├── services/database.test.ts   # Database service tests (15 tests)
├── app/api/**/*.test.ts       # API route tests (63 tests)
└── AnimatedEmoji.test.tsx     # Component tests (8 tests)
```

### Routing System

**File-based Routing with API Support:**

- `app/index.tsx` → `/` (main screen)
- `app/api/timers/+api.ts` → `/api/timers`
- `app/api/timers/[id]+api.ts` → `/api/timers/:id`
- `app/api/timers/current+api.ts` → `/api/timers/current`

---

## 🧩 Core Components

### 1. TimerContext - State Management Hub

**Purpose:** Centralized timer state management with database synchronization

**Key Responsibilities:**

- **State Management**: Manages all timer state with React Context
- **Database Sync**: Automatic persistence to SQLite database
- **Real-time Updates**: Live countdown with 1-second intervals
- **API Integration**: Coordinates with API routes for data operations
- **Error Handling**: Graceful error recovery and user feedback

**Core State:**

```typescript
interface TimerContextType {
  timer: Timer | null;
  loading: boolean;
  error: string | null;
  createTimer: (duration: number) => Promise<void>;
  startTimer: () => Promise<void>;
  pauseTimer: () => Promise<void>;
  resetTimer: () => Promise<void>;
  updateDuration: (duration: number) => Promise<void>;
  setNotificationMode: (isActive: boolean) => void;
}
```

**Performance Features:**

- Optimistic updates for immediate UI feedback
- Background timer persistence with AppState monitoring
- Automatic cleanup and memory management
- Debounced API calls to prevent excessive requests

### 2. Database Service - SQLite Integration

**Purpose:** Persistent data storage with transaction support

**Schema Design:**

```sql
CREATE TABLE IF NOT EXISTS timers (
  id TEXT PRIMARY KEY,
  duration INTEGER NOT NULL,
  remainingTime INTEGER NOT NULL,
  startTime INTEGER,
  isActive INTEGER DEFAULT 0,
  isNotificationMode INTEGER DEFAULT 0,
  createdAt INTEGER DEFAULT (strftime('%s', 'now')),
  updatedAt INTEGER DEFAULT (strftime('%s', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_timers_active
ON timers(isActive) WHERE isActive = 1;
```

**Key Features:**

- **Transaction Support**: ACID compliance for data integrity
- **Error Recovery**: Automatic retry logic with exponential backoff
- **Query Optimization**: Indexed queries for performance
- **Migration Support**: Schema versioning and upgrades
- **Concurrent Access**: Safe multi-threaded database operations

**API Surface:**

```typescript
class DatabaseService {
  async initialize(): Promise<void>;
  async createTimer(timer: CreateTimerRequest): Promise<Timer>;
  async getTimer(id: string): Promise<Timer | null>;
  async getCurrentTimer(): Promise<Timer | null>;
  async updateTimer(id: string, updates: UpdateTimerRequest): Promise<Timer>;
  async deleteTimer(id: string): Promise<void>;
  async getAllTimers(): Promise<Timer[]>;
  async clearAllTimers(): Promise<void>;
}
```

### 3. API Routes - RESTful Endpoints

**Purpose:** HTTP API layer for timer operations

**Endpoint Architecture:**

#### `/api/timers` (timers/+api.ts)

```typescript
// GET - List all timers
export async function GET(request: Request): Promise<Response>;

// POST - Create new timer
export async function POST(request: Request): Promise<Response>;
```

#### `/api/timers/:id` (timers/[id]+api.ts)

```typescript
// GET - Get specific timer
export async function GET(
  request: Request,
  { id }: { id: string },
): Promise<Response>;

// PUT - Update timer
export async function PUT(
  request: Request,
  { id }: { id: string },
): Promise<Response>;

// DELETE - Delete timer
export async function DELETE(
  request: Request,
  { id }: { id: string },
): Promise<Response>;
```

#### `/api/timers/current` (timers/current+api.ts)

```typescript
// GET - Get currently active timer
export async function GET(request: Request): Promise<Response>;
```

**Request/Response Types:**

```typescript
interface CreateTimerRequest {
  duration: number; // seconds
}

interface UpdateTimerRequest {
  duration?: number;
  remainingTime?: number;
  isActive?: boolean;
  isNotificationMode?: boolean;
}

interface TimerResponse {
  success: boolean;
  timer?: Timer;
  timers?: Timer[];
  count?: number;
  message?: string;
  error?: string;
}
```

### 4. Animation System - Visual Effects

**Purpose:** Engaging emoji animations with physics-based motion

**AnimatedEmoji Component:**

```typescript
interface AnimatedEmojiProps {
  screenWidth: number;
  screenHeight: number;
  delay?: number;
  isNotificationMode?: boolean;
  emojiIndex?: number;
  totalEmojis?: number;
}
```

**Animation Pipeline:**

1. **Initialization**: Random emoji selection and positioning
2. **Physics Animation**: Reanimated 3 with spring physics
3. **Staggered Timing**: Coordinated multi-emoji displays
4. **Responsive Sizing**: Device-appropriate scaling
5. **Haptic Integration**: Tactile feedback at key moments

**Performance Optimizations:**

- Hardware-accelerated animations with Reanimated 3
- Efficient memory cleanup after animation lifecycle
- Staggered rendering to prevent frame drops
- Responsive sizing calculations for all device types

---

## 📊 Data Flow Architecture

### State Flow Diagram

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│     UI      │───►│   Context   │───►│  Database   │
│  Actions    │    │    State    │    │   Storage   │
└─────────────┘    └─────────────┘    └─────────────┘
       ▲                   │                   │
       │                   ▼                   ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Component  │◄───│ API Routes  │◄───│  Services   │
│   Updates   │    │  Handlers   │    │   Layer     │
└─────────────┘    └─────────────┘    └─────────────┘
```

### Timer Lifecycle

1. **Creation**: User selects duration → Context calls API → Database creates record
2. **Start**: User starts timer → Context updates state → Database persists → Real-time countdown begins
3. **Tick**: Interval updates remaining time → Context state updated → UI re-renders
4. **Completion**: Timer reaches zero → Notification triggered → Dramatic mode activated
5. **Dismissal**: User interaction → Normal mode restored → Database updated

---

## 🧪 Testing Architecture

### Test Pyramid Structure

```
                    ┌─────────────┐
                    │    E2E      │ (Future)
                    │   Tests     │
                    └─────────────┘
                ┌───────────────────────┐
                │   Integration Tests   │ (Future)
                │  Component + API +    │
                │     Database          │
                └───────────────────────┘
            ┌─────────────────────────────────┐
            │           Unit Tests            │
            │  Database(15) + API(63) +      │
            │      Components(8)             │
            └─────────────────────────────────┘
```

### Test Categories

#### **Database Tests (15 tests)**

- CRUD operations validation
- Transaction integrity testing
- Error handling scenarios
- Connection management
- Query optimization verification

#### **API Route Tests (63 tests)**

- HTTP method handling (GET, POST, PUT, DELETE)
- Request validation and sanitization
- Response format consistency
- Error response handling
- Database integration testing

#### **Component Tests (8 tests)**

- Rendering validation
- Responsive design testing
- Animation behavior verification
- Props and state management
- User interaction handling

### Test Configuration

**Multi-Environment Setup:**

```javascript
// jest.config.js
module.exports = {
  projects: [
    {
      displayName: 'React Components',
      testEnvironment: 'jsdom',
      testMatch: [
        '<rootDir>/**/*.test.{ts,tsx}',
        '!<rootDir>/app/api/**/*.test.{ts,tsx}',
      ],
    },
    {
      displayName: 'API Routes',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/app/api/**/*.test.{ts,tsx}'],
    },
  ],
};
```

---

## ⚡ Performance Architecture

### Optimization Strategies

#### **Database Performance**

- **Indexed Queries**: Optimized search patterns for active timers
- **Transaction Batching**: Grouped operations for efficiency
- **Connection Pooling**: Managed database connections
- **Query Caching**: Memoized frequent queries

#### **State Management Performance**

- **Selective Re-renders**: Context value optimization
- **Memoization**: Expensive calculation caching
- **Optimistic Updates**: Immediate UI feedback
- **Background Sync**: Non-blocking database operations

#### **Animation Performance**

- **Hardware Acceleration**: Reanimated 3 native bridge
- **60fps Target**: Smooth animation guarantee
- **Memory Management**: Automatic cleanup after lifecycle
- **Staggered Rendering**: Prevents simultaneous expensive operations

### Memory Management

```typescript
// Cleanup patterns
useEffect(() => {
  const interval = setInterval(updateTimer, 1000);
  return () => {
    clearInterval(interval);
    // Cleanup animations, listeners, database connections
  };
}, []);
```

---

## 🌐 Platform Adaptations

### Cross-Platform Feature Matrix

| Feature                   | iOS     | Android | Web                 |
| ------------------------- | ------- | ------- | ------------------- |
| **Timer Management**      | ✅ Full | ✅ Full | ✅ Full             |
| **SQLite Database**       | ✅ Full | ✅ Full | ✅ Full (IndexedDB) |
| **API Routes**            | ✅ Full | ✅ Full | ✅ Full             |
| **Haptic Feedback**       | ✅ Full | ✅ Full | ❌ Not Available    |
| **Local Notifications**   | ✅ Full | ✅ Full | ⚠️ Limited          |
| **Background Processing** | ✅ Full | ✅ Full | ⚠️ Limited          |

### Platform-Specific Implementations

#### **iOS Optimizations**

- Native haptic feedback integration
- Background app refresh support
- App Store Connect integration
- TestFlight distribution

#### **Android Optimizations**

- Adaptive icon support
- Edge-to-edge display
- Android notification channels
- Google Play Console integration

#### **Web Adaptations**

- IndexedDB for data persistence
- Service Worker for background sync
- Progressive Web App features
- Responsive design breakpoints

---

## 🔮 Extensibility & Scalability

### Plugin Architecture

The system is designed for easy extension:

```typescript
// Plugin interface example
interface TimerPlugin {
  name: string;
  version: string;
  initialize(context: TimerContext): Promise<void>;
  onTimerCreate?(timer: Timer): Promise<void>;
  onTimerComplete?(timer: Timer): Promise<void>;
}
```

### Future Architecture Enhancements

#### **Planned Features**

- **Multi-tenant Support**: Multiple user profiles
- **Cloud Synchronization**: Cross-device timer sync
- **Plugin System**: Extensible functionality
- **Analytics Integration**: Usage pattern tracking
- **Advanced Notifications**: Rich push notifications

#### **Scalability Considerations**

- **Database Sharding**: For multiple users
- **API Rate Limiting**: Request throttling
- **Caching Layers**: Redis/MemoryStore integration
- **Microservices**: Service decomposition
- **Event Sourcing**: Audit trail and history

---

## 📈 Monitoring & Observability

### Performance Metrics

#### **Key Performance Indicators**

- **Database Query Time**: <100ms for CRUD operations
- **API Response Time**: <200ms for all endpoints
- **Animation Frame Rate**: 60fps sustained
- **Memory Usage**: <100MB during peak usage
- **Battery Impact**: <5% per hour active use

#### **Error Tracking**

- Database connection failures
- API request failures
- Animation performance drops
- Memory leaks detection
- Crash reporting integration

### Logging Strategy

```typescript
// Structured logging
const logger = {
  database: (operation: string, time: number) =>
    console.log(`🗄️ Database ${operation} completed in ${time}ms`),
  api: (endpoint: string, status: number, time: number) =>
    console.log(`🌐 API ${endpoint} responded ${status} in ${time}ms`),
  timer: (event: string, timerId: string) =>
    console.log(`⏰ Timer ${event} for ${timerId}`),
};
```

---

## 🛡️ Security & Data Privacy

### Data Protection

- **Local-First Architecture**: Sensitive data stays on device
- **No Cloud Storage**: Complete offline functionality
- **Encrypted Storage**: SQLite database encryption (configurable)
- **Permission Management**: Minimal permission requests

### Security Best Practices

- **Input Validation**: All API endpoints validate inputs
- **SQL Injection Prevention**: Parameterized queries only
- **XSS Protection**: Sanitized user inputs
- **Memory Safety**: Automatic cleanup and garbage collection

---

## 🔧 Development & Build Architecture

### Development Tools

```json
{
  "expo": "~53.0.9",
  "typescript": "~5.8.3",
  "jest": "^29.7.0",
  "expo-router": "~5.0.7",
  "expo-sqlite": "~15.2.10",
  "react-native-reanimated": "~3.17.4"
}
```

### Build Pipeline

#### **EAS Build Configuration**

```json
// eas.json
{
  "build": {
    "development": {
      "env": { "EXPO_PUBLIC_ENV": "development" },
      "developmentClient": true
    },
    "production": {
      "env": { "EXPO_PUBLIC_ENV": "production" }
    }
  }
}
```

#### **CI/CD Integration**

- Automated testing on push
- Build verification
- Test coverage reporting
- Deployment automation

---

**Built with 💎 for production-grade timer management**

_Modern architecture designed for scalability, reliability, and developer joy_ 🚽✨
