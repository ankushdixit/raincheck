# RainCheck: Development Roadmap v2.0

## Vertical Slice Development with Continuous Testing

**Philosophy:** Build thin slices through all layers (Database → API → UI) for each feature. Every phase delivers a testable, demonstrable capability. No more "integration sprints."

**Document Structure:** This roadmap defines _when_ to build. For _what_ to build (full story details, acceptance criteria, tests), see [PRD_v2.md](./PRD_v2.md).

---

## Quick Reference: Phase Summary

| Phase | Name                   | User Capability                  | Stories   |
| ----- | ---------------------- | -------------------------------- | --------- |
| 0     | Walking Skeleton       | App loads with placeholder       | 0.1-0.4   |
| 1     | See Today's Weather    | View weather on homepage         | 1.1-1.4   |
| 2     | See 7-Day Forecast     | View forecast, background reacts | 2.1-2.4   |
| 3     | Authentication         | Log in to modify data            | 3.1-3.4   |
| 4     | Get Run Suggestions    | View AI-suggested schedule       | 4.1-4.5   |
| 5     | Accept Suggestions     | Schedule runs from suggestions   | 5.1-5.4   |
| 6     | View Training Calendar | Navigate and view scheduled runs | 6.1-6.3   |
| 7     | Reschedule Runs        | Drag-drop or tap-to-move runs    | 7.1-7.3   |
| 8     | Track Race Progress    | See countdown and progress       | 8.1-8.4   |
| 9     | View Training Stats    | See charts and metrics           | 9.1-9.3   |
| 10    | Weather Effects        | Rain/snow/fog animations         | 10.1-10.3 |
| 11    | Polish & Deploy        | Production-ready experience      | 11.1-11.4 |

---

## Phase 0: Walking Skeleton

**Goal:** Prove the architecture works. Deploy a minimal app that touches all layers.

**User Capability:** "I can open the app and see a loading page with the RainCheck name."

**Stories:**

- Story 0.1: Project Initialization
- Story 0.2: Minimal Homepage
- Story 0.3: Health Check API
- Story 0.4: CI/CD Pipeline Verification

**Dependencies:** None (starting point)

**Definition of Done:**

- [ ] Database connection works
- [ ] Homepage displays correctly
- [ ] Health API returns status
- [ ] CI/CD pipeline passes
- [ ] App deployed to staging
- [ ] All team members can run locally

**Tests to Write:**

- Integration: Database connection test
- E2E: Homepage loads with correct title

---

## Phase 1: See Today's Weather

**Goal:** First real feature. Prove external API integration works end-to-end.

**User Capability:** "I can see today's weather conditions on the homepage."

**Stories:**

- Story 1.1: Weather Cache Schema
- Story 1.2: Weather API Client
- Story 1.3: Weather tRPC Endpoint
- Story 1.4: Current Weather Display

**Dependencies:** Phase 0

**Definition of Done:**

- [ ] Weather API client works
- [ ] tRPC endpoint returns weather
- [ ] Cache prevents excessive API calls
- [ ] Homepage displays current weather
- [ ] Loading and error states work
- [ ] Unit tests: 80%+ coverage on weather-client.ts
- [ ] Integration tests: Weather endpoint
- [ ] E2E test: See weather on homepage

**Critical Test Areas:**

- `lib/weather-client.ts` - Target 85%+ coverage

---

## Phase 2: See 7-Day Forecast

**Goal:** Display full forecast with interactive selection. Background reacts to selected day.

**User Capability:** "I can see a 7-day forecast and click on different days to see their weather."

**Stories:**

- Story 2.1: Forecast API Endpoint
- Story 2.2: Weather Forecast Cards
- Story 2.3: Trail Background Component
- Story 2.4: Background Reacts to Selected Day

**Dependencies:** Phase 1

**Definition of Done:**

- [ ] 7-day forecast endpoint works
- [ ] Weather cards display correctly
- [ ] Card selection is visually clear
- [ ] Background images load correctly
- [ ] Background changes based on selected day
- [ ] Transitions are smooth
- [ ] Mobile scrolling works
- [ ] Unit tests for all new components
- [ ] E2E test: Select day, background changes

**E2E Journey Complete:** "View Weather" (Phases 1-2)

---

## Phase 3: Authentication

**Goal:** Protect write operations. Only authenticated user can modify data.

**User Capability:** "I can log in to accept suggestions and reschedule runs."

**Stories:**

- Story 3.1: NextAuth Setup
- Story 3.2: Protected tRPC Procedures
- Story 3.3: UI Access Control
- Story 3.4: Login Page

**Dependencies:** Phase 2

**Why Here (Before Write Operations):**

- Phases 0-2 are read-only (no auth needed)
- Phase 4+ involves write operations (accepting suggestions, creating runs)
- Building auth now means all write UIs are built with auth from the start
- Prevents retrofitting auth patterns later

**Definition of Done:**

- [ ] NextAuth configured
- [ ] Mutations require authentication
- [ ] Public visitors see read-only view
- [ ] Login page works
- [ ] Session persists correctly
- [ ] Protected UI components work
- [ ] Integration tests for auth
- [ ] E2E test: Login → modify data → logout

**E2E Journey Complete:** "Authentication" (Phase 3)

---

## Phase 4: Get Run Suggestions

**Goal:** The core intelligence. Algorithm suggests optimal run schedule based on weather.

**User Capability:** "I can see AI-suggested runs with weather scores and reasoning."

**Stories:**

- Story 4.1: Training Plan Schema and Seed
- Story 4.2: Weather Preferences Logic
- Story 4.3: Planning Algorithm Core
- Story 4.4: Planning tRPC Endpoint
- Story 4.5: Run Suggestions Display

**Dependencies:** Phase 3 (auth for protected actions in UI)

**Definition of Done:**

- [ ] Training plan seeded (27 weeks)
- [ ] Weather preferences seeded
- [ ] Planning algorithm works correctly
- [ ] Algorithm tests have 90%+ coverage
- [ ] tRPC endpoint returns suggestions
- [ ] UI displays suggestions with scores
- [ ] Color coding and badges work
- [ ] Long runs have special styling
- [ ] E2E test: See suggestions on homepage

**Critical Test Areas:**

- `lib/planning-algorithm.ts` - Target 90%+ coverage
- `lib/weather-preferences.ts` - Target 95%+ coverage

**E2E Journey Complete:** "Get Suggestions" (Phases 1-4)

---

## Phase 5: Accept Suggestions

**Goal:** First write operation. User can accept suggestions to create scheduled runs.

**User Capability:** "I can click 'Accept' on a suggestion and it appears on my calendar."

**Stories:**

- Story 5.1: Run Schema
- Story 5.2: Run tRPC Router
- Story 5.3: Accept Button on Suggestions
- Story 5.4: Minimal Calendar View

**Dependencies:** Phase 4

**Definition of Done:**

- [ ] Run model and migrations complete
- [ ] CRUD operations work via tRPC
- [ ] Accept button creates runs (authenticated only)
- [ ] Calendar displays scheduled runs
- [ ] Color coding by run type
- [ ] Optimistic updates for smooth UX
- [ ] Unit tests for all new code
- [ ] Integration tests for runs router
- [ ] E2E test: Accept suggestion → appears on calendar

**E2E Journey Complete:** "Accept and View Calendar" (Phases 1-5)

---

## Phase 6: View Training Calendar

**Goal:** Full-featured calendar with navigation and run details.

**User Capability:** "I can navigate between months and see all my scheduled and completed runs."

**Stories:**

- Story 6.1: Calendar Navigation
- Story 6.2: Run Details on Calendar
- Story 6.3: Week Headers and Layout

**Dependencies:** Phase 5

**Definition of Done:**

- [ ] Month navigation works
- [ ] Run details display on cells
- [ ] Completed runs have checkmark
- [ ] Today is highlighted
- [ ] Day headers display
- [ ] Responsive on mobile
- [ ] Unit tests for calendar logic
- [ ] E2E test: Navigate months, view runs

---

## Phase 7: Reschedule Runs

**Goal:** Allow users to move runs to different days via drag-and-drop or tap.

**User Capability:** "I can drag a run to a different day to reschedule it."

**Stories:**

- Story 7.1: Drag-and-Drop Setup
- Story 7.2: Drop Validation
- Story 7.3: Mobile Tap-to-Move

**Dependencies:** Phase 6

**Definition of Done:**

- [ ] Drag-and-drop works on desktop (authenticated only)
- [ ] Invalid drops prevented
- [ ] Tap-to-move works on mobile (authenticated only)
- [ ] Visual feedback for all interactions
- [ ] Optimistic updates for responsiveness
- [ ] Unit tests for drag/drop logic
- [ ] E2E test: Reschedule run (both methods)

**E2E Journey Complete:** "Reschedule Run" (Phases 1-7)

---

## Phase 8: Track Race Progress

**Goal:** Countdown widget showing progress toward race day.

**User Capability:** "I can see how many days until the race and my training progress."

**Stories:**

- Story 8.1: Race Countdown Widget
- Story 8.2: Training Progress Bar
- Story 8.3: Current Phase Badge
- Story 8.4: Race Week and Weather

**Dependencies:** Phase 5 (needs training plan data)

**Definition of Done:**

- [ ] Days remaining calculates correctly
- [ ] Progress bar shows accurate percentage
- [ ] Phase badge displays with correct color
- [ ] Race week banner shows when appropriate
- [ ] Race day weather displays when in range
- [ ] Widget is fixed position on desktop
- [ ] Widget is inline on mobile
- [ ] Unit tests for all calculations
- [ ] E2E test: View countdown with progress

**E2E Journey Complete:** "Full Authenticated Flow" (Phases 1-8)

---

## Phase 9: View Training Stats

**Goal:** Charts and metrics showing training progress over time.

**User Capability:** "I can view my weekly mileage, pace progression, and completion rate."

**Stories:**

- Story 9.1: Stats tRPC Router
- Story 9.2: Weekly Mileage Chart
- Story 9.3: Stats Dashboard Page

**Dependencies:** Phase 5 (needs run data)

**Definition of Done:**

- [ ] Stats router with all endpoints
- [ ] Weekly mileage chart
- [ ] Pace progression chart
- [ ] Long run progression chart
- [ ] Completion rate widget
- [ ] Stats page layout
- [ ] Responsive design
- [ ] Unit tests for stat components
- [ ] E2E test: View stats page

**E2E Journey Complete:** "View Stats" (Phases 1-9)

---

## Phase 10: Weather Effects

**Goal:** Add immersive weather animations to the background.

**User Capability:** "I can see rain, snow, fog, or sun effects based on the weather."

**Stories:**

- Story 10.1: Weather Effect Components
- Story 10.2: Weather Effect Orchestrator
- Story 10.3: Mobile Performance Optimization

**Dependencies:** Phase 2 (needs background component)

**Definition of Done:**

- [ ] All 5 weather effects work
- [ ] Effects match weather conditions
- [ ] Intensity adjusts based on data
- [ ] Mobile optimization works
- [ ] Performance is acceptable
- [ ] User can disable effects
- [ ] Unit tests for effects
- [ ] E2E test: Effects display for different conditions

---

## Phase 11: Polish & Deploy

**Goal:** Production-ready application with all polish items.

**User Capability:** "I can use a polished, fast, accessible app in production."

**Stories:**

- Story 11.1: Loading States and Skeletons
- Story 11.2: Error Handling
- Story 11.3: SEO and Metadata
- Story 11.4: Production Deployment

**Dependencies:** All previous phases

**Definition of Done:**

- [ ] All loading states polished
- [ ] Error handling comprehensive
- [ ] SEO metadata complete
- [ ] Accessibility audit passed
- [ ] Production deployed
- [ ] All E2E tests pass in production
- [ ] Performance metrics met (Lighthouse >90)
- [ ] Final manual QA complete

---

## Testing Strategy Summary

### Test Distribution (Pyramid)

| Type              | Coverage Target  | When to Write               |
| ----------------- | ---------------- | --------------------------- |
| Unit Tests        | 70% of all tests | During development (TDD)    |
| Integration Tests | 20% of all tests | After each vertical slice   |
| E2E Tests         | 10% of all tests | After user journey complete |

### Critical Test Areas by Phase

| Phase | Critical File                | Target Coverage |
| ----- | ---------------------------- | --------------- |
| 1     | `lib/weather-client.ts`      | 85%+            |
| 4     | `lib/planning-algorithm.ts`  | 90%+            |
| 4     | `lib/weather-preferences.ts` | 95%+            |
| 5     | `server/api/routers/runs.ts` | 80%+            |

### E2E Test Journeys

| Journey                     | Phases Covered | Write After |
| --------------------------- | -------------- | ----------- |
| View weather                | 1, 2           | Phase 2     |
| Authentication              | 3              | Phase 3     |
| Get suggestions             | 1-4            | Phase 4     |
| Accept and view on calendar | 1-5            | Phase 5     |
| Reschedule run              | 1-7            | Phase 7     |
| Full authenticated flow     | 1-8            | Phase 8     |
| View stats                  | 1-9            | Phase 9     |

---

## Phase Dependencies Graph

```
Phase 0: Walking Skeleton
    │
    └── Phase 1: See Today's Weather
        │
        └── Phase 2: See 7-Day Forecast ─────────────────┐
            │                                            │
            └── Phase 3: Authentication                  │
                │                                        │
                └── Phase 4: Get Run Suggestions         │
                    │                                    │
                    └── Phase 5: Accept Suggestions      │
                        │                                │
                        ├── Phase 6: View Calendar       │
                        │   │                            │
                        │   └── Phase 7: Reschedule      │
                        │       │                        │
                        │       └── Phase 8: Race Progress
                        │                                │
                        └── Phase 9: View Stats          │
                                                         │
                        Phase 10: Weather Effects ◄──────┘
                            │
                            └── Phase 11: Polish & Deploy
```

**Read as:** Arrows show dependencies. Build left-to-right, top-to-bottom.

---

## Definition of Done (Global)

Every phase must satisfy:

**Code Quality:**

- [ ] All code follows style guide
- [ ] No linting errors
- [ ] Code reviewed (self-review for solo)
- [ ] No console.log statements in production code

**Testing:**

- [ ] Unit tests written and passing
- [ ] Integration tests written and passing
- [ ] E2E tests updated if journey affected
- [ ] Coverage meets targets

**Documentation:**

- [ ] README updated if setup changed
- [ ] API documentation current
- [ ] Complex logic has comments

**Deployment:**

- [ ] Deployed to staging
- [ ] Verified working in staging
- [ ] No errors in logs

---

## Document References

| Document          | Purpose                                        | Location                                                     |
| ----------------- | ---------------------------------------------- | ------------------------------------------------------------ |
| PRD v2.0          | Full story details, acceptance criteria, tests | [PRD_v2.md](./PRD_v2.md)                                     |
| PRD Writing Guide | How to write test-driven PRDs                  | [guides/PRD_WRITING_GUIDE.md](./guides/PRD_WRITING_GUIDE.md) |

---

**End of Roadmap v2.0**

_This roadmap defines when to build each feature. For full story details (acceptance criteria, technical tasks, tests), see PRD_v2.md. Each phase delivers demonstrable user value and is independently deployable._
