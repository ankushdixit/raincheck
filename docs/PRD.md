# RainCheck - Product Requirements Document v2.0

**Version:** 2.0
**Last Updated:** November 26, 2025
**Author:** Ankush Dixit
**Document Type:** Test-Driven PRD with Vertical Slice Structure

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement & Goals](#2-problem-statement--goals)
3. [User Personas](#3-user-personas)
4. [MVP Definition (MoSCoW)](#4-mvp-definition-moscow)
5. [User Story Map](#5-user-story-map)
6. [Technical Architecture](#6-technical-architecture)
7. [Data Models](#7-data-models)
8. [API Specifications](#8-api-specifications)
9. [User Stories](#9-user-stories)
10. [Testing Strategy](#10-testing-strategy)
11. [Definition of Done](#11-definition-of-done)
12. [Success Metrics](#12-success-metrics)
13. [Risks and Mitigations](#13-risks-and-mitigations)
14. [Visual Design Specification](#14-visual-design-specification)

---

## 1. Executive Summary

### What is RainCheck?

RainCheck is a weather-aware half-marathon training tracker that optimizes run scheduling based on weather forecasts. It combines beautiful, immersive UI with intelligent algorithms to help a runner train consistently despite Ireland's unpredictable weather.

### Core Value Proposition

> **"Never let weather derail your training again."**

RainCheck intelligently suggests optimal days to run based on:

- 7-day weather forecasts from WeatherAPI.com
- Training plan structure (long runs, easy runs, rest days)
- Personalized weather preferences per run type
- Training consistency (minimizing gaps)

### Target Users

| User Type                  | Access Level | Primary Goals                                 |
| -------------------------- | ------------ | --------------------------------------------- |
| **Ankush** (Authenticated) | Full access  | Plan runs, track progress, adjust schedule    |
| **Public Visitors**        | Read-only    | View training progress, understand the system |

### Key Differentiators

1. **Weather-Reactive UI**: Full-bleed trail backgrounds with live weather effects (rain, snow, fog, sun)
2. **Intelligent Scheduling**: Algorithm respects training structure while optimizing for weather
3. **Public Transparency**: All training data publicly viewable (portfolio showcase)
4. **Immersive Experience**: Not just functional—beautiful and emotionally engaging

---

## 2. Problem Statement & Goals

### The Problem

Training for a half-marathon in Ireland means dealing with unpredictable weather. The current approach:

- Check weather each morning
- Decide day-by-day whether to run
- Miss long runs due to surprise rain
- Lose training consistency with 4+ day gaps
- No forward planning beyond tomorrow

**Impact:** Inconsistent training, missed key workouts, frustration, potential injury from rushing to catch up.

### Goals

#### Primary Goals (Must Achieve)

| Goal                           | Measurable Outcome            |
| ------------------------------ | ----------------------------- |
| Enable consistent training     | <4 day gaps between runs      |
| Protect long runs from weather | 0 weather-cancelled long runs |
| Complete half-marathon         | Finish May 17, 2026 race      |
| Achieve target time            | Sub-2:00 finish               |

#### Secondary Goals (Should Achieve)

| Goal                        | Measurable Outcome                 |
| --------------------------- | ---------------------------------- |
| High completion rate        | 80%+ of scheduled runs completed   |
| Showcase technical skills   | Portfolio piece on ankushdixit.com |
| Create immersive experience | Positive feedback from visitors    |

### Non-Goals (Explicitly Out of Scope)

| Non-Goal                 | Reason                            |
| ------------------------ | --------------------------------- |
| Multi-user support       | Single user focus (Ankush)        |
| Social features          | Not a social app                  |
| Multiple races           | Focused on May 17, 2026 race only |
| Mobile native app        | Web-only, responsive design       |
| GPS tracking             | Manual run entry only             |
| Nutrition/sleep tracking | Weather + running only            |

---

## 3. User Personas

### Primary Persona: Ankush (The Runner)

**Demographics:**

- Software engineer in Ireland
- Training for first half-marathon
- Lives in Balbriggan (coastal town, variable weather)
- Runs 3-4 times per week

**Goals:**

- Complete half-marathon on May 17, 2026 in under 2 hours
- Train consistently without weather disruptions
- Track progress over 27-week training plan
- Have flexibility to adjust schedule when life interferes

**Pain Points:**

- Weather changes daily, hard to plan ahead
- Missing long runs sets back training significantly
- Manual spreadsheet tracking is tedious
- No way to visualize progress toward race day

**Tech Savviness:** High (builds software for a living)

**Device Usage:** Laptop (primary), Phone (checking weather)

---

### Secondary Persona: Visitor (Portfolio Viewer)

**Demographics:**

- Recruiters, colleagues, friends, family
- Varying technical backgrounds
- Interested in seeing Ankush's work or training progress

**Goals:**

- Understand what RainCheck does
- See the quality of Ankush's work
- Check on training progress (friends/family)
- Evaluate technical skills (recruiters)

**Pain Points:**

- Need to understand the app quickly
- Want to see it "working" (not just static)
- Don't want to sign up for anything

**Needs:**

- Read-only access to all features
- Clear explanation of the system
- Visible tech stack information

---

## 4. MVP Definition (MoSCoW)

### Must Have (MVP - Launch Blocker)

Without these, the product cannot launch:

| Feature                     | User Story                     | Rationale                             |
| --------------------------- | ------------------------------ | ------------------------------------- |
| Authentication              | Log in to modify data          | Must come before any write operations |
| 7-day weather forecast      | View weather for planning      | Core value proposition                |
| Run suggestions             | Get AI-recommended schedule    | Core value proposition                |
| Accept suggestions          | Schedule runs from suggestions | Creates actionable data               |
| Training calendar           | View scheduled/completed runs  | Track progress                        |
| Race countdown              | See days until race            | Motivation                            |
| Weather-reactive background | Immersive experience           | Differentiator                        |
| Public read access          | Showcase to visitors           | Portfolio requirement                 |

### Should Have (v1.1 - High Priority Post-MVP)

Important but not blocking launch:

| Feature                | User Story                            | Rationale         |
| ---------------------- | ------------------------------------- | ----------------- |
| Drag-drop rescheduling | Move runs to different days           | Flexibility       |
| Weather effects        | Rain/snow/fog animations              | Polish, immersion |
| Stats dashboard        | View weekly mileage, pace trends      | Progress tracking |
| Training phase display | See current phase, progress           | Context           |
| Race day weather       | See forecast for May 17 when in range | Preparation       |

### Could Have (v1.2 - Nice to Have)

If time permits:

| Feature                   | User Story                    | Rationale        |
| ------------------------- | ----------------------------- | ---------------- |
| Hourly weather breakdown  | See detailed forecast per day | Better planning  |
| Run entry form            | Log completed runs manually   | Flexibility      |
| Location selector         | Change weather location       | Travel support   |
| Weather preference tuning | Adjust thresholds             | Personalization  |
| Export data               | Download training history     | Data portability |

### Won't Have (Out of Scope)

Explicitly not building:

| Feature                 | Reason                     |
| ----------------------- | -------------------------- |
| User registration       | Single user only           |
| Social sharing          | Not a social app           |
| GPS integration         | Manual tracking sufficient |
| Multiple training plans | One race focus             |
| Offline mode            | Internet required          |

---

## 5. User Story Map

### Story Map Overview

```
User Journey (Left to Right) →
═══════════════════════════════════════════════════════════════════════════════════════════

OPEN APP     SEE WEATHER     AUTHENTICATE     GET SUGGESTIONS     SCHEDULE     VIEW CALENDAR     TRACK PROGRESS
    │             │               │                  │                │              │                 │
    │             │               │                  │                │              │                 │
────┼─────────────┼───────────────┼──────────────────┼────────────────┼──────────────┼─────────────────┼────
MVP │   View      │   View        │   Log in to      │   See AI       │   Accept     │   View          │  See
    │   today's   │   7-day       │   modify data    │   suggestions  │   suggestion │   monthly       │  countdown
    │   weather   │   forecast    │                  │   with scores  │   to schedule│   calendar      │  to race
────┼─────────────┼───────────────┼──────────────────┼────────────────┼──────────────┼─────────────────┼────
    │             │               │                  │                │              │                 │
v1.1│   See       │   Select day  │   Protected      │   See reasoning│   Drag-drop  │   Navigate      │  See
    │   weather   │   to preview  │   actions        │   for each     │   to         │   between       │  training
    │   effects   │   weather     │   in UI          │   suggestion   │   reschedule │   months        │  phase
────┼─────────────┼───────────────┼──────────────────┼────────────────┼──────────────┼─────────────────┼────
    │             │               │                  │                │              │                 │
v1.2│   Toggle    │   See hourly  │                  │   Refresh      │   Tap-to-move│   See run       │  View
    │   effects   │   breakdown   │                  │   suggestions  │   on mobile  │   details       │  stats
    │   off       │               │                  │                │              │                 │  charts
────┴─────────────┴───────────────┴──────────────────┴────────────────┴──────────────┴─────────────────┴────
```

### Story Dependencies (Critical Path)

```
Story 0.1: Project Initialization
    └── Story 0.2: Minimal Homepage
        └── Story 0.3: Health Check API
            └── Story 0.4: CI/CD Verification
                └── Story 1.1: Weather Cache Schema
                    └── Story 1.2: Weather API Client
                        └── Story 1.3: Weather tRPC Endpoint
                            └── Story 1.4: Current Weather Display
                                └── Story 2.1: Forecast API Endpoint
                                    └── Story 2.2: Weather Forecast Cards
                                        └── Story 2.3: Trail Background
                                            └── Story 2.4: Background Reacts to Selection
                                                └── Story 3.1: NextAuth Setup
                                                    └── Story 3.2: Protected Procedures
                                                        └── Story 3.3: UI Access Control
                                                            └── Story 3.4: Login Page
                                                                └── Story 4.1: Training Plan Schema
                                                                    └── Story 4.2: Weather Preferences
                                                                        └── Story 4.3: Planning Algorithm
                                                                            └── Story 4.4: Planning Endpoint
                                                                                └── Story 4.5: Suggestions UI
                                                                                    └── Story 5.1: Run Schema
                                                                                        └── ...
```

**Read this as:** Each story depends on the stories above it. Build top-to-bottom.

---

## 6. Technical Architecture

### Technology Stack

| Layer           | Technology   | Version | Rationale                |
| --------------- | ------------ | ------- | ------------------------ |
| **Framework**   | Next.js      | 16.0.1  | App Router, RSC, best DX |
| **UI Library**  | React        | 19.2.0  | Latest features          |
| **Language**    | TypeScript   | 5.x     | Type safety end-to-end   |
| **API Layer**   | tRPC         | 11.7.1  | Type-safe APIs, great DX |
| **Validation**  | Zod          | 3.x     | Runtime validation       |
| **Database**    | PostgreSQL   | 15+     | Reliable, Prisma support |
| **ORM**         | Prisma       | 6.19.0  | Type-safe DB access      |
| **Styling**     | Tailwind CSS | 4.x     | Utility-first, fast      |
| **Charts**      | Recharts     | 2.x     | React-native charts      |
| **Drag-Drop**   | @dnd-kit     | 6.3.1   | Accessible DnD           |
| **Auth**        | NextAuth     | 5.x     | Simple auth              |
| **Testing**     | Jest         | 29.x    | Unit/integration         |
| **E2E Testing** | Playwright   | 1.x     | Cross-browser E2E        |
| **Deployment**  | Vercel       | -       | Zero-config deployment   |

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT (Browser)                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         Next.js App Router                           │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │                                                                       │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────┐│   │
│  │  │ Trail        │  │ Weather      │  │ Run          │  │ Race     ││   │
│  │  │ Background   │  │ Forecast     │  │ Suggestions  │  │ Countdown││   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  └──────────┘│   │
│  │                                                                       │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐               │   │
│  │  │ Weather      │  │ Training     │  │ Stats        │               │   │
│  │  │ Effects      │  │ Calendar     │  │ Dashboard    │               │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘               │   │
│  │                                                                       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                      │                                       │
│                                      │ tRPC Client                           │
│                                      ▼                                       │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       │ HTTPS
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              SERVER (Next.js API)                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                           tRPC Routers                               │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │                                                                       │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐│   │
│  │  │ weather  │  │ planning │  │ runs     │  │ training │  │ stats  ││   │
│  │  │ router   │  │ router   │  │ router   │  │ Plan     │  │ router ││   │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬───┘│   │
│  │       │             │             │             │             │     │   │
│  └───────┼─────────────┼─────────────┼─────────────┼─────────────┼─────┘   │
│          │             │             │             │             │          │
│          ▼             ▼             ▼             ▼             ▼          │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                          Business Logic                              │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐               │   │
│  │  │ weather      │  │ planning     │  │ weather      │               │   │
│  │  │ client       │  │ algorithm    │  │ preferences  │               │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘               │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                      │                                       │
│                                      │ Prisma Client                         │
│                                      ▼                                       │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       │ PostgreSQL Protocol
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              DATABASE (PostgreSQL)                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │ Run      │  │ Training │  │ Weather  │  │ Weather  │  │ User     │      │
│  │          │  │ Plan     │  │ Cache    │  │ Prefs    │  │ Settings │      │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘      │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       │ HTTPS
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          EXTERNAL API (WeatherAPI.com)                       │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Integration Points

| Integration           | Contract                          | Owner    | Testing Strategy                   |
| --------------------- | --------------------------------- | -------- | ---------------------------------- |
| Frontend ↔ tRPC      | TypeScript types (auto-generated) | Backend  | Type checking, integration tests   |
| tRPC ↔ Database      | Prisma schema                     | Backend  | Migration tests, integration tests |
| Backend ↔ WeatherAPI | WeatherAPI.com docs               | External | Mock responses, contract snapshots |

---

## 7. Data Models

### Entity Relationship Diagram

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   UserSettings  │     │  TrainingPlan   │     │      Run        │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ id              │     │ id              │     │ id              │
│ defaultLocation │     │ phase           │     │ date (unique)   │
│ latitude        │     │ weekNumber      │     │ distance        │
│ longitude       │     │ weekStart       │     │ pace            │
│ raceDate        │     │ weekEnd         │     │ duration        │
│ raceName        │     │ longRunTarget   │     │ type            │
│ targetTime      │     │ weeklyMileage   │     │ notes           │
└─────────────────┘     │ notes           │     │ completed       │
                        └─────────────────┘     └─────────────────┘

┌─────────────────┐     ┌─────────────────┐
│  WeatherCache   │     │WeatherPreference│
├─────────────────┤     ├─────────────────┤
│ id              │     │ id              │
│ location        │     │ runType (unique)│
│ latitude        │     │ maxPrecipitation│
│ longitude       │     │ maxWindSpeed    │
│ datetime        │     │ minTemperature  │
│ condition       │     │ maxTemperature  │
│ temperature     │     │ avoidConditions │
│ precipitation   │     └─────────────────┘
│ windSpeed       │
│ cachedAt        │
│ expiresAt       │
└─────────────────┘
```

### Model Specifications

#### Run Model

```prisma
model Run {
  id        String   @id @default(cuid())
  date      DateTime @unique // One run per day max
  distance  Float    // Kilometers
  pace      String   // Format: "6:30" (min:sec per km)
  duration  String   // Format: "45:30" (min:sec total)
  type      RunType
  notes     String?
  completed Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([date])
  @@index([completed])
}

enum RunType {
  LONG_RUN      // Weekly key workout, builds endurance
  EASY_RUN      // Maintenance runs, conversational pace
  TEMPO_RUN     // Comfortably hard, sustained effort
  INTERVAL_RUN  // Repeated hard efforts with recovery
  RECOVERY_RUN  // Very easy, active recovery
  RACE          // Goal event
}
```

**Business Rules:**

- `date` must be unique (one run per day)
- `distance` must be positive
- `pace` format: `M:SS` or `MM:SS` (validated by regex `/^\d{1,2}:\d{2}$/`)
- `duration` format: same as pace
- `completed` is false for future scheduled runs

---

#### TrainingPlan Model

```prisma
model TrainingPlan {
  id                  String   @id @default(cuid())
  phase               Phase
  weekNumber          Int      @unique // Week 1-27
  weekStart           DateTime
  weekEnd             DateTime
  longRunTarget       Float    // Target long run distance (km)
  weeklyMileageTarget Float    // Target weekly total (km)
  notes               String?
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  @@index([weekStart])
}

enum Phase {
  BASE_BUILDING      // Nov 7 - Jan 1 (Weeks 1-8)
  BASE_EXTENSION     // Jan 2 - Feb 26 (Weeks 9-16)
  SPEED_DEVELOPMENT  // Mar 1 - Apr 19 (Weeks 17-24)
  PEAK_TAPER         // Apr 20 - May 17 (Weeks 25-27)
}
```

**Training Plan Structure:**

| Phase             | Weeks | Long Run Target | Weekly Mileage |
| ----------------- | ----- | --------------- | -------------- |
| BASE_BUILDING     | 1-8   | 10km → 15km     | 15-25km        |
| BASE_EXTENSION    | 9-16  | 15km → 18km     | 25-35km        |
| SPEED_DEVELOPMENT | 17-24 | 16-18km         | 30-40km        |
| PEAK_TAPER        | 25-27 | 18km → 10km     | 40km → 14km    |

---

#### WeatherCache Model

```prisma
model WeatherCache {
  id            String   @id @default(cuid())
  location      String   // "Balbriggan, IE"
  latitude      Float
  longitude     Float
  datetime      DateTime // Forecast timestamp
  condition     String   // "Clear", "Light Rain", "Heavy Snow"
  description   String   // Detailed description
  temperature   Float    // Celsius
  feelsLike     Float    // Celsius
  precipitation Float    // Probability 0-100
  humidity      Int      // Percentage 0-100
  windSpeed     Float    // km/h
  windDirection Int      // Degrees 0-360
  cachedAt      DateTime @default(now())
  expiresAt     DateTime

  @@unique([location, datetime])
  @@index([location, datetime])
  @@index([expiresAt])
}
```

**Caching Rules:**

- TTL: 1 hour (expiresAt = cachedAt + 1 hour)
- Unique constraint on location + datetime prevents duplicates
- Index on expiresAt for cleanup queries
- Cleanup: Delete entries where expiresAt < now (daily cron)

---

#### WeatherPreference Model

```prisma
model WeatherPreference {
  id               String   @id @default(cuid())
  runType          RunType  @unique
  maxPrecipitation Float    // Max acceptable precipitation (0-100)
  maxWindSpeed     Float?   // Max wind speed (km/h), null = no limit
  minTemperature   Float?   // Min temp (°C), null = no limit
  maxTemperature   Float?   // Max temp (°C), null = no limit
  avoidConditions  String[] // ["Heavy Rain", "Thunderstorm"]
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
}
```

**Default Preferences:**

| Run Type     | Max Precip | Max Wind | Min Temp | Max Temp | Avoid                                |
| ------------ | ---------- | -------- | -------- | -------- | ------------------------------------ |
| LONG_RUN     | 20%        | 25 km/h  | 0°C      | 25°C     | Heavy Rain, Thunderstorm, Heavy Snow |
| EASY_RUN     | 50%        | 35 km/h  | -5°C     | 30°C     | Thunderstorm, Heavy Snow             |
| TEMPO_RUN    | 30%        | 25 km/h  | 5°C      | 25°C     | Heavy Rain, Thunderstorm, Heavy Snow |
| INTERVAL_RUN | 30%        | 25 km/h  | 5°C      | 25°C     | Heavy Rain, Thunderstorm, Heavy Snow |
| RECOVERY_RUN | 60%        | 40 km/h  | -5°C     | 30°C     | Thunderstorm                         |
| RACE         | 100%       | 100 km/h | -20°C    | 40°C     | (none - race happens regardless)     |

---

#### UserSettings Model

```prisma
model UserSettings {
  id              String   @id @default(cuid())
  defaultLocation String   @default("Balbriggan, IE")
  latitude        Float    @default(53.6108)
  longitude       Float    @default(-6.1817)
  raceDate        DateTime @default("2026-05-17T10:00:00Z")
  raceName        String   @default("Life Style Sports Fastlane Summer Edition 2026")
  targetTime      String   @default("2:00:00") // HH:MM:SS
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

**Rules:**

- Singleton pattern (only one row)
- Created during seed, never deleted
- Updates via `weather.updateLocation` mutation

---

## 8. API Specifications

### tRPC Router Overview

| Router         | Purpose                        | Procedures   |
| -------------- | ------------------------------ | ------------ |
| `weather`      | Weather data and preferences   | 6 procedures |
| `planning`     | Run suggestions and scheduling | 3 procedures |
| `runs`         | Run CRUD operations            | 7 procedures |
| `trainingPlan` | Training plan data             | 4 procedures |
| `stats`        | Analytics and aggregations     | 5 procedures |

### Weather Router (`server/api/routers/weather.ts`)

#### `weather.getForecast`

**Type:** Query (Public)

**Input:**

```typescript
z.object({
  location: z.string().optional(), // Defaults to UserSettings.defaultLocation
  days: z.number().min(1).max(14).default(7),
});
```

**Output:**

```typescript
WeatherData[] // Array of weather entries for each day
```

**Behavior:**

1. Check cache for unexpired entries
2. If cache miss or expired, fetch from WeatherAPI.com
3. Save to cache with 1-hour TTL
4. Return weather data

**Error Handling:**

```typescript
// API key invalid
throw new TRPCError({ code: "UNAUTHORIZED", message: "Weather API key invalid" });

// Location not found
throw new TRPCError({ code: "BAD_REQUEST", message: "Location not found" });

// API unavailable
throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Weather service unavailable" });
```

---

#### `weather.getForDate`

**Type:** Query (Public)

**Input:**

```typescript
z.object({
  date: z.date(),
  location: z.string().optional(),
});
```

**Output:**

```typescript
WeatherData | null;
```

---

#### `weather.getPreferences`

**Type:** Query (Public)

**Output:**

```typescript
WeatherPreference[]
```

---

#### `weather.updatePreference`

**Type:** Mutation (Protected)

**Input:**

```typescript
z.object({
  runType: z.enum(["LONG_RUN", "EASY_RUN", "TEMPO_RUN", "INTERVAL_RUN", "RECOVERY_RUN"]),
  maxPrecipitation: z.number().min(0).max(100).optional(),
  maxWindSpeed: z.number().positive().optional(),
  minTemperature: z.number().optional(),
  maxTemperature: z.number().optional(),
  avoidConditions: z.array(z.string()).optional(),
});
```

**Output:**

```typescript
WeatherPreference;
```

---

#### `weather.updateLocation`

**Type:** Mutation (Protected)

**Input:**

```typescript
z.object({
  location: z.string(),
  latitude: z.number(),
  longitude: z.number(),
});
```

**Output:**

```typescript
UserSettings;
```

---

### Planning Router (`server/api/routers/planning.ts`)

#### `planning.generateSuggestions`

**Type:** Query (Public)

**Input:**

```typescript
z.object({
  days: z.number().min(1).max(14).default(7),
  location: z.string().optional(),
});
```

**Output:**

```typescript
Suggestion[]

interface Suggestion {
  date: Date
  runType: RunType
  distance: number // km
  reason: string // Human-readable explanation
  weatherScore: number // 0-100
  isOptimal: boolean // true if score >= 80
  weather: {
    condition: string
    temperature: number
    precipitation: number
    windSpeed: number
  }
}
```

**Algorithm Steps:**

1. Fetch current training plan week(s)
2. Get weather forecasts for period
3. Load weather preferences
4. Call `generateSuggestions()` from planning-algorithm.ts
5. Return sorted suggestions

---

#### `planning.getSchedule`

**Type:** Query (Public)

**Input:**

```typescript
z.object({
  startDate: z.date().optional(),
  endDate: z.date().optional(),
});
```

**Output:**

```typescript
Run[] // Scheduled runs in date range
```

---

#### `planning.saveSchedule`

**Type:** Mutation (Protected)

**Input:**

```typescript
z.array(
  z.object({
    id: z.string().optional(), // For updates
    date: z.date(),
    type: z.enum(["LONG_RUN", "EASY_RUN", "TEMPO_RUN", "INTERVAL_RUN", "RECOVERY_RUN"]),
    distance: z.number().positive(),
    notes: z.string().optional(),
  })
);
```

**Output:**

```typescript
Run[]
```

---

### Runs Router (`server/api/routers/runs.ts`)

#### `runs.getAll`

**Type:** Query (Public)

**Input:**

```typescript
z.object({
  limit: z.number().optional(),
  completed: z.boolean().optional(),
});
```

**Output:**

```typescript
Run[]
```

---

#### `runs.getById`

**Type:** Query (Public)

**Input:**

```typescript
z.string(); // Run ID
```

**Output:**

```typescript
Run | null;
```

---

#### `runs.getByDateRange`

**Type:** Query (Public)

**Input:**

```typescript
z.object({
  startDate: z.date(),
  endDate: z.date(),
});
```

**Output:**

```typescript
Run[]
```

---

#### `runs.create`

**Type:** Mutation (Protected)

**Input:**

```typescript
z.object({
  date: z.date(),
  distance: z.number().positive(),
  pace: z.string().regex(/^\d{1,2}:\d{2}$/),
  duration: z.string().regex(/^\d{1,2}:\d{2}$/),
  type: z.enum(["LONG_RUN", "EASY_RUN", "TEMPO_RUN", "INTERVAL_RUN", "RECOVERY_RUN", "RACE"]),
  notes: z.string().optional(),
  completed: z.boolean().default(false),
});
```

**Output:**

```typescript
Run;
```

**Errors:**

```typescript
// Duplicate date
throw new TRPCError({ code: "CONFLICT", message: "A run already exists on this date" });
```

---

#### `runs.update`

**Type:** Mutation (Protected)

**Input:**

```typescript
z.object({
  id: z.string(),
  data: z.object({
    date: z.date().optional(),
    distance: z.number().positive().optional(),
    pace: z.string().regex(/^\d{1,2}:\d{2}$/).optional(),
    duration: z.string().regex(/^\d{1,2}:\d{2}$/).optional(),
    type: z.enum([...]).optional(),
    notes: z.string().optional(),
    completed: z.boolean().optional(),
  }),
})
```

---

#### `runs.delete`

**Type:** Mutation (Protected)

**Input:**

```typescript
z.string(); // Run ID
```

**Output:**

```typescript
{
  success: boolean;
}
```

---

#### `runs.markComplete`

**Type:** Mutation (Protected)

**Input:**

```typescript
z.object({
  id: z.string(),
  completed: z.boolean(),
});
```

**Output:**

```typescript
Run;
```

---

### Training Plan Router (`server/api/routers/trainingPlan.ts`)

All procedures are **Query (Public)**.

| Procedure         | Input                       | Output                                            |
| ----------------- | --------------------------- | ------------------------------------------------- |
| `getCurrent`      | none                        | `TrainingPlan \| null`                            |
| `getWeek`         | `z.number().min(1).max(27)` | `TrainingPlan \| null`                            |
| `getAll`          | none                        | `TrainingPlan[]`                                  |
| `getCurrentPhase` | none                        | `{ phase, weekNumber, weeksInPhase, totalWeeks }` |

---

### Stats Router (`server/api/routers/stats.ts`)

All procedures are **Query (Public)**.

| Procedure               | Input                   | Output                                                      |
| ----------------------- | ----------------------- | ----------------------------------------------------------- |
| `getWeeklyMileage`      | `{ weeks?: number }`    | `{ week, mileage, target }[]`                               |
| `getPaceProgression`    | `{ runType?: RunType }` | `{ date, pace, type }[]`                                    |
| `getLongRunProgression` | none                    | `{ date, distance, target }[]`                              |
| `getCompletionRate`     | `{ phase?: Phase }`     | `{ total, completed, rate, byPhase }`                       |
| `getSummary`            | none                    | `{ totalRuns, totalDistance, avgPace, streak, longestRun }` |

---

## 9. User Stories

This section contains all user stories with full acceptance criteria, technical tasks, and test requirements. Stories are organized by phase and referenced by ID.

---

### Phase 0: Walking Skeleton

#### Story 0.1: Project Initialization

**As a** developer
**I want** the T3 stack configured with database connection
**So that** I can build features on solid foundation

**Technical Tasks:**

- Configure PostgreSQL connection (DATABASE_URL)
- Create minimal Prisma schema (UserSettings model only)
- Run initial migration
- Verify Prisma Studio works

**Acceptance Criteria:**

```gherkin
Given the project is cloned
When I run `npm install && npm run dev`
Then the app starts without errors
And Prisma can connect to the database
```

**Tests:**

- Unit: None (infrastructure)
- Integration: Database connection test
- E2E: None yet

---

#### Story 0.2: Minimal Homepage

**As a** visitor
**I want** to see a homepage with the app name
**So that** I know the app is working

**Technical Tasks:**

- Create `app/page.tsx` with "RainCheck" title
- Add basic styling in `globals.css`
- Configure layout.tsx with metadata

**Acceptance Criteria:**

```gherkin
Given I navigate to the homepage
When the page loads
Then I see "RainCheck" as the title
And I see "Weather-aware half-marathon training" as subtitle
And the page has dark forest theme colors
```

**Tests:**

- Unit: None
- Integration: None
- E2E: Homepage loads with correct title

---

#### Story 0.3: Health Check API

**As a** developer
**I want** a health check endpoint
**So that** I can verify the API layer works

**Technical Tasks:**

- Create `server/api/routers/health.ts`
- Add health router to root router
- Return database connection status

**Acceptance Criteria:**

```gherkin
Given the API server is running
When I call the health check endpoint
Then I receive a 200 response
And the response includes database status: "connected"
```

**Tests:**

- Unit: None
- Integration: Health endpoint returns correct status
- E2E: None

---

#### Story 0.4: CI/CD Pipeline Verification

**As a** developer
**I want** the CI/CD pipeline to pass
**So that** I can deploy with confidence

**Technical Tasks:**

- Ensure all linting passes
- Ensure type-check passes
- Configure deployment to staging

**Acceptance Criteria:**

```gherkin
Given I push code to the main branch
When the CI pipeline runs
Then all checks pass (lint, types, tests)
And the app deploys to staging
```

**Tests:**

- All existing tests pass
- Deployment verification (manual)

---

### Phase 1: See Today's Weather

#### Story 1.1: Weather Cache Schema

**As a** system
**I want** to cache weather data
**So that** I don't hit rate limits on the weather API

**Technical Tasks:**

- Add WeatherCache model to Prisma schema
- Add UserSettings model with defaultLocation
- Create migration
- Seed UserSettings with Balbriggan, IE

**Acceptance Criteria:**

```gherkin
Given the database schema is updated
When I run the seed script
Then UserSettings exists with location "Balbriggan, IE"
And WeatherCache table exists and is empty
```

**Tests:**

- Unit: None
- Integration: Seed script creates expected data
- E2E: None

---

#### Story 1.2: Weather API Client

**As a** system
**I want** to fetch weather from WeatherAPI.com
**So that** I have accurate forecast data

**Technical Tasks:**

- Create `lib/weather-client.ts`
- Implement `fetchCurrentWeather(location)`
- Implement response parsing
- Add error handling and retry logic
- Add rate limiting (50 calls/day)

**Acceptance Criteria:**

```gherkin
Given a valid location "Balbriggan, IE"
When I call fetchCurrentWeather
Then I receive weather data with:
  | field         | type    |
  | temperature   | number  |
  | condition     | string  |
  | precipitation | number  |
  | windSpeed     | number  |

Given the API returns an error
When I call fetchCurrentWeather
Then the error is caught gracefully
And a WeatherAPIError is thrown with message
```

**Tests:**

- Unit: Parse weather response correctly
- Unit: Handle API errors gracefully
- Unit: Rate limiting prevents excessive calls
- Integration: Real API call (limited, in CI)

---

#### Story 1.3: Weather tRPC Endpoint

**As a** frontend
**I want** a tRPC endpoint to get current weather
**So that** I can display it on the page

**Technical Tasks:**

- Create `server/api/routers/weather.ts`
- Implement `getCurrentWeather` procedure
- Check cache first, fetch if stale (1-hour TTL)
- Save to cache after fetch

**Acceptance Criteria:**

```gherkin
Given no cached weather data exists
When I call weather.getCurrentWeather
Then the API fetches from WeatherAPI.com
And the result is cached in database
And weather data is returned

Given cached weather data exists and is fresh (<1 hour old)
When I call weather.getCurrentWeather
Then the cached data is returned
And no API call is made
```

**Tests:**

- Unit: Cache hit/miss logic
- Integration: Endpoint returns weather data
- Integration: Cache is populated after fetch

---

#### Story 1.4: Current Weather Display

**As a** user
**I want** to see today's weather on the homepage
**So that** I know the current conditions

**Technical Tasks:**

- Create `app/components/CurrentWeather.tsx`
- Display: condition icon, temperature, precipitation, wind
- Add loading state (skeleton)
- Add error state with retry button
- Integrate into `app/page.tsx`

**Acceptance Criteria:**

```gherkin
Given weather data is loading
When I view the homepage
Then I see a loading skeleton

Given weather data has loaded
When I view the homepage
Then I see the weather icon matching the condition
And I see the temperature in Celsius
And I see precipitation percentage
And I see wind speed in km/h

Given weather API fails
When I view the homepage
Then I see an error message
And I see a "Retry" button
When I click "Retry"
Then the weather is fetched again
```

**Tests:**

- Unit: Component renders with mock data
- Unit: Loading state shows skeleton
- Unit: Error state shows retry button
- Integration: Component fetches from tRPC
- E2E: Homepage shows current weather

---

### Phase 2: See 7-Day Forecast

#### Story 2.1: Forecast API Endpoint

**As a** frontend
**I want** a tRPC endpoint for 7-day forecast
**So that** I can display multiple days

**Technical Tasks:**

- Extend `weather.ts` router with `getForecast` procedure
- Fetch 7 days from WeatherAPI.com
- Cache each day separately
- Return array of WeatherData

**Acceptance Criteria:**

```gherkin
Given I request a 7-day forecast
When I call weather.getForecast({ days: 7 })
Then I receive an array of 7 weather entries
And each entry has: datetime, condition, temperature, precipitation, windSpeed
```

**Tests:**

- Unit: Parse 7-day response
- Integration: Endpoint returns 7 days
- Integration: Cache works for multiple days

---

#### Story 2.2: Weather Forecast Cards

**As a** user
**I want** to see weather cards for each day
**So that** I can plan my week

**Technical Tasks:**

- Create `app/components/WeatherDayCard.tsx`
- Create `app/components/WeatherForecast.tsx`
- Display 7 cards in a grid (desktop) or scrollable row (mobile)
- Each card shows: day name, date, icon, temp, precip, wind
- Add hover and click interactions

**Acceptance Criteria:**

```gherkin
Given I view the homepage on desktop
When forecast data loads
Then I see 7 weather cards in a row
And each card shows day name, date, weather icon, and temperature

Given I hover over a weather card
When my mouse enters the card
Then the card lifts slightly (scale effect)
And the background brightens

Given I click a weather card
When the card is clicked
Then the card shows a highlighted border
And the card is visually selected
```

**Tests:**

- Unit: WeatherDayCard renders correctly
- Unit: WeatherForecast renders 7 cards
- Unit: Selection state works
- Integration: Forecast fetches from tRPC
- E2E: Can click to select different days

---

#### Story 2.3: Trail Background Component

**As a** user
**I want** to see a beautiful forest trail background
**So that** the app feels immersive

**Technical Tasks:**

- Create `app/components/TrailBackground.tsx`
- Add trail images to `public/images/trails/`
- Map weather conditions to images (sunny, rainy, cloudy, foggy, snowy, default)
- Add smooth transition on image change (2s fade)
- Add optional parallax scroll effect

**Acceptance Criteria:**

```gherkin
Given sunny weather is selected
When I view the background
Then I see the sunny trail image
And the image has a warm golden tint overlay

Given I select a different day with rainy weather
When the selection changes
Then the background smoothly fades to rainy trail image
And the image has a cool blue-gray tint overlay

Given I scroll the page
When I scroll down 100 pixels
Then the background moves up 30 pixels (parallax effect)
```

**Tests:**

- Unit: Correct image URL returned for each condition
- Unit: Correct tint color returned for each condition
- Integration: Background changes when day selected
- E2E: Background visually changes on day selection

---

#### Story 2.4: Background Reacts to Selected Day

**As a** user
**I want** the background to change based on the day I select
**So that** I get an immersive preview of that day's weather

**Technical Tasks:**

- Connect WeatherForecast selection to TrailBackground
- Pass selected day's weather condition to background
- Ensure smooth transitions

**Acceptance Criteria:**

```gherkin
Given I am on the homepage
When I click on Wednesday's weather card
Then the background changes to match Wednesday's weather
And the transition is smooth (2 seconds)
```

**Tests:**

- Integration: Selection state propagates to background
- E2E: Clicking day changes background

---

### Phase 3: Authentication

#### Story 3.1: NextAuth Setup

**As a** developer
**I want** authentication configured
**So that** I can protect actions

**Technical Tasks:**

- Install and configure NextAuth
- Set up credentials provider (simple password)
- Configure session strategy (JWT)
- Add NEXTAUTH_SECRET to environment

**Acceptance Criteria:**

```gherkin
Given valid credentials
When I submit the login form
Then I am authenticated
And a session is created
```

**Tests:**

- Integration: Auth flow works

---

#### Story 3.2: Protected tRPC Procedures

**As a** system
**I want** mutations to require authentication
**So that** data is protected

**Technical Tasks:**

- Create `protectedProcedure` in tRPC context
- Protect: runs.create, runs.update, runs.delete
- Return 401 for unauthenticated requests

**Acceptance Criteria:**

```gherkin
Given I am not authenticated
When I try to create a run
Then I receive a 401 UNAUTHORIZED error

Given I am authenticated
When I try to create a run
Then the run is created successfully
```

**Tests:**

- Integration: Protected procedures require auth
- Integration: Public procedures don't require auth

---

#### Story 3.3: UI Access Control

**As a** visitor
**I want** to see read-only view
**So that** I can view but not modify

**Technical Tasks:**

- Create `app/components/ProtectedAction.tsx` wrapper
- Hide Accept buttons for unauthenticated users
- Hide drag-and-drop for unauthenticated users
- Show "Log in to schedule runs" message

**Acceptance Criteria:**

```gherkin
Given I am not logged in
When I view run suggestions
Then I see the suggestions (read-only)
And the Accept button is not visible
And I see "Log in to schedule runs" link

Given I am logged in
When I view run suggestions
Then I see the Accept buttons
```

**Tests:**

- Unit: ProtectedAction hides content when unauthenticated
- E2E: Guest cannot modify, authenticated can

---

#### Story 3.4: Login Page

**As a** user
**I want** a simple login page
**So that** I can authenticate

**Technical Tasks:**

- Create `app/login/page.tsx`
- Simple form with password field
- Redirect to homepage after login
- Show error on invalid credentials

**Acceptance Criteria:**

```gherkin
Given I navigate to /login
When the page loads
Then I see "Ankush's Training Tracker" message
And I see a password field
And I see a login button

Given I enter incorrect password
When I submit
Then I see "Invalid credentials" error
```

**Tests:**

- Unit: Login form validation
- E2E: Login flow works

---

### Phase 4: Get Run Suggestions

#### Story 4.1: Training Plan Schema and Seed

**As a** system
**I want** a training plan structure
**So that** the algorithm knows what runs are needed

**Technical Tasks:**

- Add TrainingPlan model to Prisma schema
- Add Phase enum (BASE_BUILDING, BASE_EXTENSION, SPEED_DEVELOPMENT, PEAK_TAPER)
- Add WeatherPreference model
- Create seed data for 27 weeks (Nov 2025 - May 2026)
- Create default weather preferences for each run type

**Acceptance Criteria:**

```gherkin
Given I run the seed script
When seeding completes
Then 27 TrainingPlan entries exist (weeks 1-27)
And WeatherPreference entries exist for all run types
```

**Tests:**

- Integration: Seed creates correct number of entries
- Integration: Phases progress correctly through weeks

---

#### Story 4.2: Weather Preferences Logic

**As a** system
**I want** to evaluate if weather is acceptable for a run type
**So that** I can score days appropriately

**Technical Tasks:**

- Create `lib/weather-preferences.ts`
- Implement `isAcceptableWeather(runType, weather, preferences)`
- Implement `getWeatherQuality(score)` → excellent/good/fair/poor
- Implement `getRejectionReason(weather, preferences)`

**Acceptance Criteria:**

```gherkin
Given a long run and weather with 50% precipitation
When I check isAcceptableWeather
Then it returns false (exceeds 20% threshold)

Given weather with score 85
When I call getWeatherQuality
Then it returns "excellent"

Given weather with high wind (40 km/h)
When I call getRejectionReason for long run
Then it returns "Wind speed exceeds maximum threshold"
```

**Tests:**

- Unit: isAcceptableWeather for all run types (many test cases)
- Unit: getWeatherQuality boundaries
- Unit: getRejectionReason returns correct messages
- Coverage target: 95%+ on this file

---

#### Story 4.3: Planning Algorithm Core

**As a** system
**I want** to generate optimal run suggestions
**So that** users get the best schedule

**Technical Tasks:**

- Create `lib/planning-algorithm.ts`
- Implement multi-stage algorithm:
  1. Gather requirements from training plan
  2. Score each day's weather (0-100)
  3. Apply training constraints (rest after long run, no back-to-back hard days)
  4. Prioritize long runs to best weather
  5. Minimize gaps (no 4+ day breaks)
  6. Generate human-readable reasoning

**Acceptance Criteria:**

```gherkin
Given a 7-day forecast and training plan week
When I call generateSuggestions
Then I receive suggestions with:
  | field        | description                    |
  | date         | Date of suggested run          |
  | runType      | Type (LONG_RUN, EASY_RUN, etc) |
  | distance     | Target distance in km          |
  | weatherScore | 0-100 score                    |
  | isOptimal    | true if score >= 80            |
  | reason       | Human-readable explanation     |
  | weather      | Weather data for that day      |

Given all days have poor weather (<40 score)
When I call generateSuggestions
Then I still receive suggestions
And the reasoning explains why these days were chosen
```

**Tests:**

- Unit: Weather scoring formula (many test cases)
- Unit: Training constraints are respected
- Unit: Long runs get prioritized
- Unit: Gap minimization works
- Unit: Reasoning generation
- Integration: Full algorithm with real data
- Performance: Algorithm completes in <500ms
- Coverage target: 90%+ on this file

---

#### Story 4.4: Planning tRPC Endpoint

**As a** frontend
**I want** a tRPC endpoint for suggestions
**So that** I can display them

**Technical Tasks:**

- Create `server/api/routers/planning.ts`
- Implement `generateSuggestions` procedure
- Fetch training plan, weather, preferences
- Call algorithm and return results

**Acceptance Criteria:**

```gherkin
Given I call planning.generateSuggestions({ days: 7 })
When the endpoint processes
Then I receive an array of run suggestions
And each suggestion has weatherScore, reason, isOptimal
```

**Tests:**

- Integration: Endpoint returns suggestions
- Integration: Error handling for missing data

---

#### Story 4.5: Run Suggestions Display

**As a** user
**I want** to see suggested runs with weather scores
**So that** I can decide which days to run

**Technical Tasks:**

- Create `app/components/RunSuggestionCard.tsx`
- Create `app/components/RunSuggestions.tsx`
- Display: date, run type, distance, weather summary, score badge, reasoning
- Color-code scores (green/yellow/orange/red)
- Add "OPTIMAL" badge for scores >= 80
- Add loading and error states
- Long runs get special styling (amber border)

**Acceptance Criteria:**

```gherkin
Given suggestions have loaded
When I view the suggestions section
Then I see cards for each suggested run
And each card shows the date and run type
And each card shows a color-coded score badge
And optimal days (score >= 80) have an "OPTIMAL" badge

Given a long run suggestion
When I view its card
Then the card has an amber/gold border

Given I view a suggestion card
When I read the reasoning
Then it explains why this day was chosen
```

**Tests:**

- Unit: Card renders with mock data
- Unit: Score colors are correct
- Unit: Long run styling applied
- Integration: Component fetches from tRPC
- E2E: Suggestions display on homepage

---

### Phase 5: Accept Suggestions

#### Story 5.1: Run Schema

**As a** system
**I want** to store scheduled and completed runs
**So that** users can track their training

**Technical Tasks:**

- Add Run model to Prisma schema
- Add RunType enum
- Add indexes on date field
- Create migration
- Seed historical runs (18 runs from Sept-Nov 2025)

**Acceptance Criteria:**

```gherkin
Given I run the seed script
When seeding completes
Then 18 historical runs exist in the database
And runs have: date, distance, pace, duration, type, completed
```

**Tests:**

- Integration: Seed creates historical runs

---

#### Story 5.2: Run tRPC Router

**As a** frontend
**I want** CRUD operations for runs
**So that** I can manage training data

**Technical Tasks:**

- Create `server/api/routers/runs.ts`
- Implement: getAll, getById, getByDateRange, create, update, delete, markComplete
- Add Zod validation for inputs
- Use TRPCError consistently for errors

**Acceptance Criteria:**

```gherkin
Given valid run data
When I call runs.create
Then a new run is created in the database
And the run is returned

Given I call runs.create with a duplicate date
When the mutation executes
Then a TRPCError is thrown with code CONFLICT
And message indicates date is already scheduled
```

**Tests:**

- Unit: Validation schemas
- Integration: CRUD operations work
- Integration: Date uniqueness enforced
- Integration: Error handling correct

---

#### Story 5.3: Accept Button on Suggestions

**As a** user
**I want** to accept a suggestion
**So that** it becomes a scheduled run

**Technical Tasks:**

- Add "Accept & Schedule" button to RunSuggestionCard
- Call runs.create mutation on click
- Show loading state while saving
- Change button to "Scheduled ✓" after success
- Dim the card after acceptance

**Acceptance Criteria:**

```gherkin
Given I am authenticated and viewing a run suggestion
When I click "Accept & Schedule"
Then the button shows loading state
And a run is created in the database

Given the run is created successfully
When the mutation completes
Then the button changes to "Scheduled ✓" in green
And the card dims slightly (60% opacity)

Given I try to accept the same day twice
When I click "Accept & Schedule"
Then I see an error message
And the suggestion remains unchanged
```

**Tests:**

- Unit: Button state changes correctly
- Integration: Mutation creates run
- E2E: Accept suggestion, verify run created

---

#### Story 5.4: Minimal Calendar View

**As a** user
**I want** to see my accepted runs on a calendar
**So that** I can verify they're scheduled

**Technical Tasks:**

- Create `app/components/TrainingCalendar.tsx` (basic version)
- Display current month grid
- Show scheduled runs on their dates
- Color-code by run type

**Acceptance Criteria:**

```gherkin
Given I have scheduled runs for this month
When I view the calendar
Then I see a monthly grid with days
And scheduled runs appear on their dates
And run types are color-coded (blue=long, green=easy, etc.)
```

**Tests:**

- Unit: Calendar grid renders correctly
- Unit: Runs display on correct dates
- Integration: Calendar fetches runs from tRPC
- E2E: Accept suggestion → appears on calendar

---

### Phase 6: View Training Calendar

#### Story 6.1: Calendar Navigation

**As a** user
**I want** to navigate between months
**So that** I can see past and future runs

**Technical Tasks:**

- Add Previous/Next month buttons
- Add "Today" button to return to current month
- Update date range query on navigation
- Preserve selection state

**Acceptance Criteria:**

```gherkin
Given I am viewing November 2025
When I click "Next"
Then I see December 2025
And runs for December are displayed

When I click "Previous"
Then I see November 2025 again

When I click "Today"
Then I see the current month
```

**Tests:**

- Unit: Navigation updates month state
- Integration: Date range query updates

---

#### Story 6.2: Run Details on Calendar

**As a** user
**I want** to see run details on the calendar
**So that** I know what's scheduled

**Technical Tasks:**

- Show run type badge on calendar cells
- Show distance for each run
- Distinguish completed vs scheduled (checkmark)
- Highlight "today" cell

**Acceptance Criteria:**

```gherkin
Given a completed run exists on Nov 15
When I view that day on the calendar
Then I see the run type badge
And I see a checkmark indicating completion

Given today is Nov 26
When I view the calendar
Then today's cell has a distinctive highlight
```

**Tests:**

- Unit: Completed state shown correctly
- Unit: Today highlighted correctly

---

#### Story 6.3: Week Headers and Layout

**As a** user
**I want** clear week structure
**So that** I can scan the calendar easily

**Technical Tasks:**

- Add day-of-week headers (Sun-Sat)
- Show days from adjacent months in muted style
- Responsive sizing for mobile

**Acceptance Criteria:**

```gherkin
Given I view the calendar on desktop
When looking at the grid
Then I see Sun-Sat headers
And days fill a 7-column grid

Given I view on mobile
When looking at the calendar
Then the grid adapts to screen width
And days are still readable
```

**Tests:**

- Unit: Headers render correctly
- E2E: Calendar is responsive

---

### Phase 7: Reschedule Runs

#### Story 7.1: Drag-and-Drop Setup

**As a** user (desktop)
**I want** to drag runs to different days
**So that** I can reschedule easily

**Technical Tasks:**

- Integrate @dnd-kit/core
- Make run badges draggable
- Make calendar cells droppable
- Show drag overlay while dragging

**Acceptance Criteria:**

```gherkin
Given I am authenticated and have a run scheduled on Wednesday
When I drag the run badge
Then I see a visual overlay following my cursor
And valid drop targets highlight

When I drop on Friday
Then the run's date updates to Friday
And the calendar reflects the change
```

**Tests:**

- Unit: Drag state management
- Integration: Drop updates run via mutation
- E2E: Drag run to different day

---

#### Story 7.2: Drop Validation

**As a** system
**I want** to validate drop targets
**So that** invalid moves are prevented

**Technical Tasks:**

- Prevent dropping on past dates
- Prevent dropping on days with existing runs
- Show visual feedback for invalid targets

**Acceptance Criteria:**

```gherkin
Given I try to drop a run on a past date
When I release the drag
Then the run returns to original position
And no database update occurs

Given a day already has a run scheduled
When I drag another run over it
Then the day does not highlight as valid
```

**Tests:**

- Unit: Validation logic
- Integration: Invalid drops rejected

---

#### Story 7.3: Mobile Tap-to-Move

**As a** user (mobile)
**I want** to tap to reschedule runs
**So that** I can reschedule without drag-and-drop

**Technical Tasks:**

- Detect touch devices
- First tap: select run (show "move mode" UI)
- Second tap: select target day
- Show instructions when in move mode
- Cancel on tap outside or tap same run

**Acceptance Criteria:**

```gherkin
Given I am authenticated and on mobile
When I tap a run badge
Then the run is selected
And I see instructions: "Tap a day to move this run"

When I tap an empty valid day
Then the run moves to that day
And selection is cleared

When I tap the same run again
Then selection is cleared (cancelled)
```

**Tests:**

- Unit: Selection state management
- Integration: Mobile move updates run
- E2E: Tap-to-move workflow

---

### Phase 8: Track Race Progress

#### Story 8.1: Race Countdown Widget

**As a** user
**I want** to see days until race day
**So that** I stay motivated

**Technical Tasks:**

- Create `app/components/RaceCountdown.tsx`
- Calculate days remaining until May 17, 2026
- Display prominently on homepage
- Update daily

**Acceptance Criteria:**

```gherkin
Given today is November 26, 2025
When I view the countdown
Then I see "172 days until race day"
And I see the race name and date
```

**Tests:**

- Unit: Days calculation is correct
- Unit: Renders with mock date

---

#### Story 8.2: Training Progress Bar

**As a** user
**I want** to see my progress through the training plan
**So that** I know how far I've come

**Technical Tasks:**

- Query current week from training plan
- Calculate percentage: week / 27
- Display progress bar
- Show "Week X of 27"

**Acceptance Criteria:**

```gherkin
Given I am in week 3 of training
When I view the countdown widget
Then I see "Week 3 of 27"
And the progress bar shows ~11% filled
```

**Tests:**

- Unit: Progress calculation
- Integration: Fetches current week from tRPC

---

#### Story 8.3: Current Phase Badge

**As a** user
**I want** to see my current training phase
**So that** I understand my focus

**Technical Tasks:**

- Add TrainingPlan router with getCurrentPhase
- Display phase as colored badge
- Phase colors: Base=blue, Extension=green, Speed=orange, Taper=amber

**Acceptance Criteria:**

```gherkin
Given I am in BASE_BUILDING phase
When I view the countdown widget
Then I see "Base Building" badge in blue
```

**Tests:**

- Unit: Phase formatting
- Unit: Correct color per phase

---

#### Story 8.4: Race Week and Weather

**As a** user
**I want** race week warnings and weather
**So that** I prepare properly

**Technical Tasks:**

- Show "RACE WEEK!" banner when <7 days
- Show race day weather when <10 days (fetch if in range)
- Add taper reminders

**Acceptance Criteria:**

```gherkin
Given race day is in 5 days
When I view the countdown
Then I see "RACE WEEK!" banner
And I see race day weather forecast
And I see taper reminders
```

**Tests:**

- Unit: Race week detection
- Integration: Weather query for race date

---

### Phase 9: View Training Stats

#### Story 9.1: Stats tRPC Router

**As a** frontend
**I want** stat aggregation endpoints
**So that** I can display charts

**Technical Tasks:**

- Create `server/api/routers/stats.ts`
- Implement: getWeeklyMileage, getPaceProgression, getLongRunProgression, getCompletionRate, getSummary

**Acceptance Criteria:**

```gherkin
Given I call stats.getWeeklyMileage
Then I receive weekly totals with targets for last 12 weeks
```

**Tests:**

- Integration: All stats endpoints return data
- Integration: Empty data handled gracefully

---

#### Story 9.2: Weekly Mileage Chart

**As a** user
**I want** to see weekly mileage trend
**So that** I track volume progression

**Technical Tasks:**

- Create `app/components/stats/WeeklyMileageChart.tsx`
- Use Recharts for visualization
- Show actual vs target lines
- Highlight current week

**Acceptance Criteria:**

```gherkin
Given I view the stats page
When weekly mileage chart loads
Then I see a line chart with actual mileage
And I see a target line
And current week is highlighted
```

**Tests:**

- Unit: Chart renders with mock data
- Integration: Chart fetches from tRPC

---

#### Story 9.3: Stats Dashboard Page

**As a** user
**I want** a dedicated stats page
**So that** I can see all metrics

**Technical Tasks:**

- Create `app/stats/page.tsx`
- Add navigation from main page
- Compose all stat components
- Responsive grid layout

**Acceptance Criteria:**

```gherkin
Given I navigate to /stats
Then I see all stat charts
And I can navigate back to main page
```

**Tests:**

- E2E: Navigate to stats, view charts

---

### Phase 10: Weather Effects

#### Story 10.1: Weather Effect Components

**As a** user
**I want** to see weather animations
**So that** the experience is immersive

**Technical Tasks:**

- Create `app/components/weather-effects/RainEffect.tsx`
- Create `app/components/weather-effects/SnowEffect.tsx`
- Create `app/components/weather-effects/FogEffect.tsx`
- Create `app/components/weather-effects/SunEffect.tsx`
- Create `app/components/weather-effects/CloudEffect.tsx`
- Add CSS animations to globals.css

**Acceptance Criteria:**

```gherkin
Given rainy weather is displayed
When effects are enabled
Then I see diagonal rain streaks falling
And the effect is GPU-accelerated
```

**Tests:**

- Unit: Each effect renders correctly
- Performance: 60fps on desktop, 30fps on mobile

---

#### Story 10.2: Weather Effect Orchestrator

**As a** system
**I want** to show appropriate effects
**So that** effects match conditions

**Technical Tasks:**

- Create `app/components/WeatherEffectLayer.tsx`
- Parse weather condition string
- Activate appropriate effect(s)
- Adjust intensity based on precipitation/temperature

**Acceptance Criteria:**

```gherkin
Given condition is "Light Rain"
When effects layer renders
Then rain effect is shown at light intensity

Given condition is "Heavy Snow"
When effects layer renders
Then snow effect is shown at heavy intensity
```

**Tests:**

- Unit: Condition parsing
- Unit: Correct effect activated

---

#### Story 10.3: Mobile Performance Optimization

**As a** mobile user
**I want** effects to not hurt performance
**So that** the app remains usable

**Technical Tasks:**

- Detect mobile devices
- Reduce particle counts on mobile
- Monitor FPS, disable if <20fps
- Add user preference to disable effects

**Acceptance Criteria:**

```gherkin
Given I am on a mobile device
When effects are rendering
Then particle counts are reduced
And FPS remains above 30

Given FPS drops below 20
When performance check runs
Then effects are automatically disabled
```

**Tests:**

- Unit: Mobile detection
- Unit: Intensity adjustment

---

### Phase 11: Polish & Deploy

#### Story 11.1: Loading States and Skeletons

**As a** user
**I want** smooth loading experiences
**So that** the app feels responsive

**Technical Tasks:**

- Add skeleton screens for all async components
- Smooth transitions when data loads
- Loading indicators for mutations

**Acceptance Criteria:**

```gherkin
Given data is loading
When I view a component
Then I see an appropriate skeleton
And the skeleton animates subtly
```

**Tests:**

- Unit: Skeletons render correctly

---

#### Story 11.2: Error Handling

**As a** user
**I want** graceful error recovery
**So that** errors don't break the app

**Technical Tasks:**

- Add error boundaries around sections
- Provide retry buttons
- Clear error messages

**Acceptance Criteria:**

```gherkin
Given the weather API fails
When the error occurs
Then I see a helpful error message
And I see a "Retry" button
And other sections continue to work
```

**Tests:**

- Unit: Error boundaries catch errors
- Integration: Retry functionality works

---

#### Story 11.3: SEO and Metadata

**As a** visitor
**I want** proper page metadata
**So that** the page shares well

**Technical Tasks:**

- Add Open Graph tags
- Add Twitter card tags
- Create favicon
- Add page descriptions

**Acceptance Criteria:**

```gherkin
Given I share the link on social media
When the preview generates
Then I see the RainCheck title
And I see a description
And I see a preview image
```

**Tests:**

- Manual: Verify social previews

---

#### Story 11.4: Production Deployment

**As a** developer
**I want** production deployment
**So that** users can access the app

**Technical Tasks:**

- Configure Vercel project
- Set all environment variables
- Configure production database
- Deploy and verify

**Acceptance Criteria:**

```gherkin
Given the app is deployed
When I navigate to the production URL
Then all features work correctly
And performance is good (Lighthouse >90)
```

**Tests:**

- E2E: Full test suite passes in production
- Manual: Lighthouse audit

---

## 10. Testing Strategy

### Testing Pyramid

```
                    ▲
                   /E\        E2E Tests (10%)
                  /2E \       - 5-10 critical journeys
                 /-----\      - Cross-browser
                /       \     - Before deployment
               /Integra- \
              /  tion     \   Integration Tests (20%)
             /-------------\  - API endpoints
            /               \ - Database queries
           /                 \- Component + API
          /    Unit Tests     \
         /                     \ Unit Tests (70%)
        /                       \- Business logic
       /                         \- Algorithm (90%+ coverage)
      /---------------------------\- Utilities
```

### Test Coverage Targets

| Component                    | Target Coverage | Rationale           |
| ---------------------------- | --------------- | ------------------- |
| `lib/planning-algorithm.ts`  | 90%+            | Core business logic |
| `lib/weather-preferences.ts` | 95%+            | Safety critical     |
| `lib/weather-client.ts`      | 85%+            | External dependency |
| `server/api/routers/*.ts`    | 80%+            | All data flows      |
| UI Components                | 60%+            | Rendering tests     |
| **Overall**                  | 80%+            | Quality gate        |

### When to Write Each Test Type

#### Unit Tests (During Development)

Write **before or during** implementation for:

- Pure functions (no side effects)
- Business logic (algorithms, scoring)
- Validation logic
- Data transformations

#### Integration Tests (After Vertical Slice)

Write **immediately after** completing a vertical slice:

- API endpoint tests
- Database queries
- Component + API interactions

#### E2E Tests (After User Journey Complete)

Write **after related stories form a workflow**:

| Journey                     | Phases Covered | When to Write |
| --------------------------- | -------------- | ------------- |
| View weather                | 1, 2           | After Phase 2 |
| Authentication              | 3              | After Phase 3 |
| Get suggestions             | 1-4            | After Phase 4 |
| Accept and view on calendar | 1-5            | After Phase 5 |
| Reschedule run              | 1-7            | After Phase 7 |
| View stats                  | 1-9            | After Phase 9 |

### Continuous Integration

**Quality Gates:**

- All tests must pass
- Coverage must meet thresholds
- No lint errors
- No type errors

---

## 11. Definition of Done

### Story-Level Definition of Done

A story is **DONE** when:

**Code Quality:**

- [ ] Code follows style guide (ESLint passes)
- [ ] No TypeScript errors
- [ ] No `console.log` in production code
- [ ] Complex logic has comments
- [ ] Code reviewed (self-review for solo)

**Testing:**

- [ ] Unit tests written for new logic
- [ ] Unit tests passing (coverage meets target)
- [ ] Integration tests written for API changes
- [ ] Integration tests passing
- [ ] E2E tests updated if user journey affected
- [ ] E2E tests passing

**Functionality:**

- [ ] All acceptance criteria met
- [ ] Works on desktop Chrome
- [ ] Works on mobile Safari
- [ ] No console errors in browser
- [ ] Loading states work
- [ ] Error states work

**Deployment:**

- [ ] Deployed to staging
- [ ] Verified working in staging
- [ ] No errors in logs

---

### Phase-Level Definition of Done

A phase is **DONE** when:

- [ ] All stories in the phase are done
- [ ] Phase can be demonstrated to stakeholder
- [ ] No critical bugs
- [ ] Documentation updated
- [ ] Ready for next phase dependencies

---

### Release Definition of Done

A release is **READY** when:

- [ ] All MVP features complete
- [ ] All tests passing (unit, integration, E2E)
- [ ] Coverage meets 80% target
- [ ] Performance acceptable (Lighthouse >90)
- [ ] Accessibility audit passed
- [ ] Security review complete
- [ ] Production environment configured
- [ ] Deployment successful
- [ ] Smoke tests pass in production

---

## 12. Success Metrics

### Product Success Metrics

| Metric                           | Target      | Measurement                                 |
| -------------------------------- | ----------- | ------------------------------------------- |
| Zero weather-cancelled long runs | 0           | Count of long runs cancelled due to weather |
| Training consistency             | <4 day gaps | Max days between runs                       |
| Completion rate                  | 80%+        | Completed / Scheduled runs                  |
| Race completion                  | Finish      | Complete May 17, 2026 race                  |
| Race time                        | <2:00:00    | Official finish time                        |

### Technical Success Metrics

| Metric                   | Target | Measurement           |
| ------------------------ | ------ | --------------------- |
| Test coverage            | 80%+   | Jest coverage report  |
| Lighthouse Performance   | 90+    | Lighthouse audit      |
| Lighthouse Accessibility | 90+    | Lighthouse audit      |
| Lighthouse SEO           | 90+    | Lighthouse audit      |
| Page load time           | <2.5s  | Core Web Vitals (LCP) |
| Algorithm response time  | <500ms | API timing            |
| Uptime                   | 99.9%  | Vercel monitoring     |

### Portfolio Success Metrics

| Metric                    | Target | Measurement       |
| ------------------------- | ------ | ----------------- |
| Unique visitors (Month 1) | 100+   | Analytics         |
| GitHub stars              | 10+    | GitHub            |
| Interview mentions        | 3+     | Self-reported     |
| Positive feedback         | 5+     | Comments/messages |

---

## 13. Risks and Mitigations

### Technical Risks

| Risk                               | Likelihood | Impact | Mitigation                                              |
| ---------------------------------- | ---------- | ------ | ------------------------------------------------------- |
| Weather API goes down              | Medium     | High   | Cache aggressively, fallback to stale data, retry logic |
| Weather API changes format         | Low        | Medium | Snapshot tests on response format, abstraction layer    |
| Database connection issues         | Low        | High   | Connection pooling, error handling, fallback read-only  |
| Algorithm produces bad suggestions | Medium     | Medium | Extensive unit tests, manual override capability        |

### External Risks

| Risk                         | Likelihood | Impact | Mitigation                             |
| ---------------------------- | ---------- | ------ | -------------------------------------- |
| Weather API free tier limits | Low        | Medium | Rate limiting, caching, monitor usage  |
| Race cancelled/postponed     | Low        | High   | Feature flag to update race date       |
| Injury prevents training     | Medium     | High   | Out of scope for app (real-world risk) |

### Project Risks

| Risk               | Likelihood | Impact | Mitigation                                         |
| ------------------ | ---------- | ------ | -------------------------------------------------- |
| Scope creep        | Medium     | Medium | Strict MoSCoW adherence, say no to "nice to haves" |
| Over-engineering   | Medium     | Medium | Follow YAGNI, build only what's needed             |
| Burnout (solo dev) | Medium     | High   | Time-box phases, take breaks                       |

---

## 14. Visual Design Specification

### Design System

#### Color Palette

| Name                | Hex       | Usage            |
| ------------------- | --------- | ---------------- |
| Background (Deep)   | `#0a0f0a` | Page background  |
| Background (Forest) | `#1a2e1a` | Card backgrounds |
| Text (Primary)      | `#f5f5f5` | All main text    |
| Accent (Amber)      | `#ffa726` | CTAs, highlights |
| Accent (Warm)       | `#ffd54f` | Sunny weather    |
| Weather (Rain)      | `#607d8b` | Rainy conditions |
| Weather (Snow)      | `#b3e5fc` | Snow conditions  |
| Weather (Fog)       | `#9e9e9e` | Fog conditions   |
| Score (Excellent)   | `#4caf50` | Score 80-100     |
| Score (Good)        | `#ffd54f` | Score 60-79      |
| Score (Fair)        | `#ff9800` | Score 40-59      |
| Score (Poor)        | `#f44336` | Score 0-39       |

#### Typography

| Element      | Font             | Weight   | Size                            |
| ------------ | ---------------- | -------- | ------------------------------- |
| H1 (Title)   | System           | Bold     | 4rem (desktop), 2.5rem (mobile) |
| H2 (Section) | System           | Bold     | 2rem                            |
| H3 (Card)    | System           | Semibold | 1.25rem                         |
| Body         | System           | Regular  | 1rem                            |
| Small        | System           | Regular  | 0.875rem                        |
| Data         | System (tabular) | Regular  | 1rem                            |

#### Spacing

- Base unit: 4px
- Component padding: 16px (4 units)
- Section gaps: 32px (8 units)
- Card border radius: 8px

#### Breakpoints

| Name    | Width      | Usage                            |
| ------- | ---------- | -------------------------------- |
| Mobile  | <768px     | Single column, horizontal scroll |
| Tablet  | 768-1023px | Two columns, inline widgets      |
| Desktop | ≥1024px    | Full layout, fixed countdown     |

---

## Appendices

### A. Weather API Selection

**Chosen Provider:** WeatherAPI.com

| Feature          | WeatherAPI.com | OpenWeatherMap  |
| ---------------- | -------------- | --------------- |
| Free tier        | 1M calls/month | 1,000 calls/day |
| Forecast range   | 14 days        | 5 days (3-hour) |
| Hourly data      | Yes            | Yes             |
| Response quality | Excellent      | Good            |
| Documentation    | Excellent      | Good            |

**Decision:** WeatherAPI.com chosen for longer forecast range and generous free tier.

### B. Training Plan Details

**Race:** Life Style Sports Fastlane Summer Edition 2026
**Date:** May 17, 2026
**Distance:** 21.1km (Half Marathon)
**Target Time:** 2:00:00 (Sub-2 hours)
**Pace Target:** 5:41/km

**Phase Breakdown:**

| Phase             | Dates           | Focus                      | Long Run Range | Weekly Mileage |
| ----------------- | --------------- | -------------------------- | -------------- | -------------- |
| Base Building     | Nov 7 - Jan 1   | Build endurance foundation | 10-15km        | 15-25km        |
| Base Extension    | Jan 2 - Feb 26  | Increase distance          | 15-18km        | 25-35km        |
| Speed Development | Mar 1 - Apr 19  | Add tempo and intervals    | 16-18km        | 30-40km        |
| Peak & Taper      | Apr 20 - May 17 | Reduce volume, sharpen     | 18→10km        | 40→14km        |

### C. Run Type Definitions

| Type             | Purpose                           | Typical Pace               | Weekly Frequency |
| ---------------- | --------------------------------- | -------------------------- | ---------------- |
| **Long Run**     | Build endurance, mental toughness | Easy (6:30/km)             | 1x (weekend)     |
| **Easy Run**     | Recovery, base mileage            | Conversational (6:00/km)   | 2-3x             |
| **Tempo Run**    | Improve lactate threshold         | Comfortably hard (5:30/km) | 0-1x             |
| **Interval Run** | Improve VO2 max                   | Hard efforts (5:00/km)     | 0-1x             |
| **Recovery Run** | Active recovery                   | Very easy (7:00/km)        | After hard days  |
| **Race**         | Goal event                        | Target pace (5:41/km)      | Race day only    |

---

**End of PRD v2.0**

_This document contains all user stories with full acceptance criteria, technical tasks, and test requirements. Stories are referenced by ID in the ROADMAP._
