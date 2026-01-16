# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **RECOVERY training phase** for injury rehabilitation periods
  - New phase type in Prisma schema with teal color theme
  - Phase-specific metadata: science explanation, success criteria, common mistakes, coach's tip
  - IT Band recovery resources linked (Runner's World, Physiopedia)
  - Supports split/interrupted phases in training timeline
- **Split phase handling** in training phases display
  - Phases can now be interrupted and resumed (e.g., BASE_EXTENSION → RECOVERY → BASE_EXTENSION)
  - "Interrupted" status badge (amber) for phases cut short by injury
  - "Resumed" label for phases continuing after recovery
  - Timeline visualization correctly shows non-contiguous phase segments
- Teal color scheme for Recovery phase across all components

### Changed

- Training plan structure updated for IT Band injury recovery:
  - Week 16: Base Extension (Interrupted)
  - Weeks 17-19: Recovery phase
  - Weeks 20-23: Base Extension (Resumed)
- Recovery runs (Jan 12, 16, 18, 20, 22, 25) changed from LONG_RUN/EASY_RUN to RECOVERY_RUN type
- IT Band recommendations moved to RECOVERY phase (previously GENERAL)
- Updated recommendation content with current recovery timeline (Jan 27-31 walk-run tests)
- Timeline legend now shows "Interrupted" status indicator
- "In Progress" legend color updated to teal to match Recovery phase

### Fixed

- Phase grouping now handles non-contiguous weeks of same phase type
- Stats router `getCompletionRate` includes RECOVERY in phase breakdown
- All phase-related components updated with RECOVERY support:
  - PhaseBadge.tsx, InfoBoxes.tsx, RecommendationsPage.tsx
  - PhaseExpandedContent.tsx, TrainingPhasesPage.tsx
  - recommendations.ts router
- Runs with 0 distance now correctly have "-" for pace and duration
- Test expectations updated for new phase structure

---

## Previous Changes

### Added

- Public stats API endpoint (`GET /api/public/stats`) for external consumers (e.g., portfolio website)
  - Returns training statistics: longestRun, totalRuns, totalDistance, updatedAt
  - CORS enabled for ankushdixit.com, www.ankushdixit.com, and localhost:3000
  - Cache headers for 5-minute caching with stale-while-revalidate
  - No authentication required (public read-only data)
  - Comprehensive test coverage (35 tests, 100% coverage)
- IT Band recovery recommendations with detailed protocols for stretching, foam rolling, ice treatment, return to running, and warning signs
- `FormattedDescription` component for markdown-like text formatting in recommendations (supports bold, bullet points, headers, emoji indicators)

### Changed

- Recommendations page now displays cards in a responsive 3-column grid layout (3 cols on large screens, 2 on medium, 1 on mobile)
- Recommendations within each phase are now grouped by category (Injury Prevention, Recovery, Nutrition, Pacing, Mental, Gear)
- All 15 recommendations reformatted with structured content using headers, bullet points, and bold text for better readability
- Category badges hidden on cards when already grouped by category to reduce visual redundancy
- Cards now use flexbox with equal heights for consistent grid appearance
- Updated seed tests to handle real-world data patterns (skipped runs with 0 distance and "-" for pace/duration, recovery weeks with 0 long run target)

### Fixed

- ESLint error with emoji regex in FormattedDescription (changed character class to non-capturing group)
- Stats page Average Pace card and Pace Progression chart displaying `NaN:NaN` when runs have invalid/empty pace values
  - Added validation in `paceToSeconds()` to return NaN for empty or malformed pace strings
  - Added `isFinite()` checks in `secondsToPace()` to handle NaN inputs gracefully
  - Updated `formatPace()` in PaceProgressionChart to display `--:--` for invalid values
  - Fixed `getSummary` and `getPaceProgression` procedures to skip runs with invalid pace data
  - Added proper filtering for NaN values in chart data using `isFinite()` checks

---

## Previous Changes

### Changed

- Updated logo to new whimsical cloud illustration design matching cover art aesthetic
- Scaled down logo display size to 60% across all pages for better visual balance
  - Header: 260-350px → 156-210px
  - Stats page: 200-350px → 120-210px
  - Training Phases page: 200-350px → 120-210px
  - Recommendations page: 200-350px → 120-210px
  - Login page: 180-280px → 108-168px
  - Settings page: 120-200px → 72-120px

### Fixed

- Timeline coloring for in-progress phases now displays correctly (Base Extension shows blue instead of gray)
- Replaced dynamic Tailwind class generation with explicit class names for phase status colors
- Legend "In Progress" indicator color now matches in-progress phase color (blue instead of green)

### Added

- Training Recommendations page (`/recommendations`) for storing personalized training advice
- Recommendations organized by training phase (General, Base Building, Base Extension, Speed Development, Peak & Taper)
- Six recommendation categories: Injury Prevention, Nutrition, Pacing, Recovery, Gear, Mental
- Priority levels (High, Medium, Low) for recommendations with visual indicators
- Public access to recommendations page (no authentication required to view)
- Recommendations button (lightbulb icon) in header navigation
- `Recommendation` database model with category, phase, priority, and source fields
- `recommendationsRouter` tRPC router with full CRUD operations
- Seed script for initial recommendations (`scripts/seed-recommendations.ts`)
- Phase-specific rich content for all training phases (Base Building, Base Extension, Speed Development, Peak & Taper)
- Science explanations for each training phase with research-backed information
- Success criteria checklists for each phase showing what good progress looks like
- Common mistakes warnings for each phase to help avoid training pitfalls
- Coach's tip callout boxes with actionable advice per phase
- External resource links to credible sources (TrainingPeaks, Jack Daniels VDOT, Marathon Handbook, Laura Norris, Runner's World)
- Phase-specific table columns that adapt based on training focus:
  - Base Building: Runs Completed column showing activity status
  - Base Extension: Volume Trend column (when data available)
  - Speed Development: Average Pace column
  - Peak & Taper: Volume % column (when data available)
- `PhaseExpandedContent` component for structured phase content display
- `PhaseTableColumns` module with configurable column definitions and renderers
- `PhaseWeeklyTable` component for dynamic phase-specific table rendering
- Type exports for `PhaseResource`, `PhaseMetadata`, and `TableColumnKey` from stats router

### Changed

- Training phases page now uses dark solid background instead of dynamic trail image
- Stats page now uses dark solid background instead of dynamic trail image
- Updated all card components to use visible borders (`border-white/10`) on dark backgrounds
- Card backgrounds changed from `bg-forest-deep/50` to `bg-white/5` for better visibility
- Phase cards now show colored borders when in-progress, white borders when upcoming
- Coach's tip and resource link buttons now have phase-colored borders

### Fixed

- React hydration error caused by browser extensions adding attributes to body tag (added `suppressHydrationWarning`)
- Card visibility issues on training-phases and stats pages with dark backgrounds

### Fixed

- Run suggestions now correctly show 6 cards (3 scheduled + 3 new suggestions) instead of only showing scheduled runs
- Fixed `calculateSuggestionStartDate` pushing start date beyond 21-day forecast window when many runs were accepted
- Fixed `generateSuggestions` returning empty array when no training plan exists for current week (now uses defaults)
- Fixed `getCurrentPhase` failing to find training plan due to timezone edge cases
- Phase card now correctly shows upcoming phases (Base Extension, Speed Development, etc.) instead of "Final Phase"

### Changed

- Standardized card component styling across all pages (homepage, stats, training-phases)
- Unified background color to `bg-forest-deep/50` (removed `bg-forest-dark`, `bg-black/40`, `bg-black/20`)
- Unified backdrop blur to `backdrop-blur-md` (removed `backdrop-blur-sm`)
- Unified border radius to `rounded-lg` (removed `rounded-xl` on cards)
- Removed all card borders (`border-white/10`, `border-forest-medium`, `border-amber-600/30`)
- Updated 11 component files with 37 styling changes for visual consistency

### Added

- Training Phases detail page at `/training-phases` showing comprehensive training plan overview
- `TrainingPhasesPage` component with weather-reactive background matching home/stats pages
- Phase timeline visualization with proportional range bars for each training phase
- Current week position marker on timeline with "Week N" indicator
- Expandable phase cards showing weekly breakdown with targets vs actuals
- Current phase highlight card with this week's mileage and long run targets
- Summary stats row (total weeks, completed weeks, completion rate, days until race)
- Race day card with countdown at bottom of page
- `stats.getTrainingPhases` tRPC procedure returning all phases with weekly data and actuals
- Phase metadata (descriptions, focus areas, colors) for each training phase
- Clickable phase cards on homepage and stats page linking to training phases detail
- Hover states with subtle scale and brightness effects on clickable cards
- ChevronRight indicator appearing on hover to show clickability
- Cache invalidation for `stats.getTrainingPhases` on run create/update/delete/complete

### Changed

- Updated training plan from 24 weeks to 34 weeks (Sep 21, 2025 - May 16, 2026)
- Base Building phase extended to 15 weeks (was 6 weeks)
- Training plan now starts at 7km long run target (was 12km)
- Seed data updated to reflect 34-week training structure
- Seed tests updated to match new training plan structure

### Changed

- Overhauled run suggestion algorithm with smarter scheduling logic
- Weather scoring weights now prioritize precipitation (60%) and wind (30%) over temperature (5%) and condition (5%)
- Long runs now scheduled only on Sundays or Mondays based on best hourly weather in 10am-3pm window
- Short runs fixed at 6km, scheduled 3 days after long runs (2 rest days + 1) and 2 days after previous short run
- Long run distance progression: floor(longest completed or scheduled run) + 1km
- Suggestions now start from tomorrow, respecting rest gaps from last completed run
- No unaccepted suggestions appear between today and last accepted run date
- Accepted runs now display in the suggestions area with real weather data and scores
- Time window for hourly weather scoring changed from 9am-5pm/9am-2pm to 10am-3pm for all runs
- Algorithm generates suggestions for 21 days (up from 14) to ensure adequate planning horizon
- Cache invalidation added to Settings page (on complete/update/delete) and Calendar (on drag-drop)

### Added

- Hourly weather forecast view with expand/collapse functionality
- "See Hourly Forecast" button below weather cards to toggle between daily and hourly views
- `WeatherHourCard` component for displaying individual hourly forecasts
- `getHourlyForecast` tRPC endpoint returning current hour + next 6 hours of weather data
- Hourly cards show "Today" or "Tomorrow" labels based on the hour's date
- Clicking hourly cards triggers background weather effects like daily cards
- Slide animation when transitioning between daily and hourly views
- "Today" label on first daily card, "Tomorrow" on second, dates on rest for consistency

### Security

- Updated @trpc/client, @trpc/next, @trpc/react-query, and @trpc/server from 11.7.1 to 11.8.0 to fix prototype pollution vulnerability (GHSA-43p4-m455-4f4j)

### Fixed

- Fixed bug where second short run was not scheduled when first short run was already accepted
- Algorithm now correctly schedules remaining short runs even when some runs in the week are already accepted
- WeatherHourCard tests now use dynamic dates instead of hardcoded dates to prevent test failures on date change
- Fixed React hydration error in TrainingCalendar skeleton by replacing `Math.random()` with deterministic pattern
- Run cards on Settings page now display properly on mobile devices with stacked layout
- Added `cursor-pointer` to all interactive buttons (effects toggle, logout, weather cards, run suggestion cards, settings page buttons)
- Weather dates now display in the location's timezone instead of the browser's timezone
- Added `timezone` field to `WeatherData` type, parsed from Open-Meteo API response
- Added `timezone` column to `WeatherCache` database table with migration
- Updated `WeatherDayCard` and `RunSuggestionCard` to format dates using location timezone
- Updated planning algorithm to include timezone in run suggestions
- When viewing Balbriggan weather from Paris, dates now correctly show in Dublin time

### Added

- Comprehensive design system with Tailwind CSS v4 theme (`@theme` directive in globals.css)
- Design tokens for colors (forest palette, surface, text, state, border), border radius, and shadows
- Style utility file (`lib/styles.ts`) with common component style patterns
- Autoprefixer for vendor prefixing support
- Mobile Performance Optimization for weather effects
- `useDeviceCapabilities` hook for detecting mobile devices, reduced motion preference, and hardware concurrency
- `useFPSMonitor` hook for real-time frame rate monitoring with configurable thresholds
- `useEffectsPreference` hook for persisting user effects toggle to localStorage
- `EffectsToggle` component for manual enable/disable of weather effects with 44px touch targets
- Device tier classification (high/medium/low) for adaptive particle rendering
- Particle count reduction on mobile: 50% on medium tier, 75% on low tier devices
- Auto-disable effects when FPS drops below 20 for 3+ seconds with toast notification
- `particleMultiplier` prop on RainEffect, SnowEffect, CloudEffect, and SunEffect components
- Respect for `prefers-reduced-motion` OS preference (renders no effects when enabled)
- 95 new tests for performance optimization hooks and components
- Weather Effect Orchestrator (`WeatherEffectLayer`) for dynamic weather effect display based on conditions
- `parseCondition()` and `parseConditions()` utility functions in `lib/weather-effects.ts` for condition string parsing
- `getIntensityFromPrecipitation()` function for calculating effect intensity from precipitation percentage
- Support for compound conditions (e.g., "Partly Cloudy" displays both cloud and sun effects)
- Intensity adjustment based on condition modifiers ("Light", "Heavy", "Moderate") or precipitation percentage
- Graceful handling of unknown weather conditions (no effect rendered)
- Integration of WeatherEffectLayer into HomePage, activating effects when forecast days are selected
- 85 new tests for weather effect orchestrator with 100% coverage on parsing utilities
- Weather effect components for immersive weather animations (`components/weather-effects/`)
- `RainEffect` component rendering diagonal rain streaks with configurable intensity (30/60/100 particles)
- `SnowEffect` component rendering drifting snowflakes with horizontal movement (25/50/80 particles)
- `FogEffect` component rendering 3-layer animated mist overlay with intensity-based opacity
- `SunEffect` component rendering sun glow, light rays (4/6/8 rays), and lens flare effects
- `CloudEffect` component rendering drifting cloud shapes in upper screen area (3/5/8 clouds)
- `Intensity` type export for `"light" | "moderate" | "heavy"` effect strength control
- CSS animation keyframes for all weather effects (rain-fall, snow-fall, fog-drift, fog-pulse, sun-pulse, ray-shimmer, flare-pulse, cloud-drift)
- GPU-accelerated animations using `transform`, `opacity`, and `will-change` properties
- `prefers-reduced-motion` media query support disabling animations for accessibility
- 64 unit tests for weather effect components with 100% statement coverage
- Stats Dashboard Page at `/stats` displaying all training analytics in a comprehensive layout
- `StatsSummaryCard` component showing Total Runs, Total Distance, Average Pace, and Current Streak
- `CompletionRateCard` component with circular progress indicator for completion rate visualization
- Navigation link "View All Stats" on main page linking to stats dashboard
- Back navigation from stats page to main dashboard
- Responsive grid layout for stats page (single column mobile, multi-column desktop)
- 31 new tests for stats page and components with 100% coverage
- `lucide-react` dependency for icon components (ArrowLeft, BarChart3, Route, Timer, Flame, Trophy)
- Weekly Mileage Chart component with Recharts line chart visualization
- `WeeklyMileageChart` component displaying actual vs target mileage trends
- Amber line for actual mileage, dashed gray line for target mileage
- Current week highlighting with glowing amber dot effect
- Responsive chart heights (250px mobile, 300px tablet, 350px desktop)
- Loading skeleton, empty state, and error state handling
- Pre-training weeks support showing historical runs before training plan start
- Pre-training weeks labeled as "Pre 1", "Pre 2", etc. with zero targets
- 11 unit tests for WeeklyMileageChart component
- Stats tRPC router with five aggregation endpoints for training analytics
- `stats.getWeeklyMileage` returning weekly totals with targets for last N weeks
- `stats.getPaceProgression` returning pace data points with dates and run types
- `stats.getLongRunProgression` returning long run distances with training plan targets
- `stats.getCompletionRate` returning completion statistics overall and by training phase
- `stats.getSummary` returning aggregate stats (totalRuns, totalDistance, avgPace, streak, longestRun)
- Helper functions: `paceToSeconds`, `secondsToPace`, `getWeekNumberForDate`
- 31 new integration tests for stats router with full coverage
- Race week features with "RACE WEEK!" banner when race is ≤7 days away
- Race day weather forecast display when race is within 10-day forecast range
- Taper reminder messages during race week (race day, 1 day, 2-3 days, 4-7 days)
- `isRaceWeek()`, `shouldShowRaceWeather()`, and `getTaperReminder()` utility functions
- `RaceWeekBanner`, `RaceDayWeather`, and `TaperReminder` sub-components
- Weather forecast integration using existing `weather.getForecast` tRPC endpoint
- 29 new tests for race week features with full coverage
- Current phase badge displaying training phase (Base Building, Base Extension, Speed Development, Peak & Taper)
- `PhaseBadge` component with color-coded phase display (Blue, Green, Orange, Amber)
- `formatPhaseName` utility for converting enum values to human-readable format
- `getPhaseColor` utility for mapping phases to their respective colors
- `planning.getCurrentPhase` tRPC procedure returning current phase and week number
- 26 new tests for PhaseBadge component and getCurrentPhase procedure
- Training progress metrics showing real performance indicators instead of week-based progress
- `TrainingProgress` component displaying longest run distance vs 21.1 km target and best long run pace vs target pace
- `runs.getProgressStats` tRPC procedure returning longest completed run distance and best long run pace
- Helper functions: `parseTimeToMinutes`, `formatPace`, `calculateTargetPace`, `calculateDistanceProgress`, `calculatePaceProgress`
- Target pace calculated dynamically from user's target finish time (e.g., 2:00:00 → 5:41/km)
- Progress bars for both distance and pace metrics with smooth animations
- 35 new tests for training progress functionality with full coverage
- Race countdown widget displaying days until race day (May 17, 2026)
- `RaceCountdown` component with prominent countdown number, race name, and date display
- `calculateDaysUntil()` utility function with date normalization for accurate day counting
- `formatRaceDate()` utility function for human-readable date formatting
- Amber accent styling with subtle pulse animation on countdown number
- Race day and past race handling with appropriate label changes
- Target time display showing sub-2:00 goal
- Loading skeleton and error states with retry functionality
- 28 unit tests for RaceCountdown component with edge case coverage
- Mobile tap-to-move feature for touch-friendly run rescheduling
- `useTouchDevice` hook for detecting touch devices via `(pointer: coarse)` media query
- `MoveInstructions` component showing guidance when run is selected for moving
- Tap-to-select run badges with visual selection state (pulsing ring, scale effect)
- Tap-to-move workflow: tap run to select, tap destination cell to move
- Cancel selection via tap-again, cancel button, or Escape key
- 44px minimum touch targets for accessibility on mobile devices
- Visual highlighting of valid/invalid target cells during tap-to-move mode
- 26 new tests for tap-to-move functionality with full coverage
- Drop validation for calendar drag-and-drop preventing invalid moves
- Calendar validation utilities (`lib/calendar-utils.ts`) with `isValidDropTarget`, `isPastDate`, `hasExistingRun` functions
- Visual feedback for valid drop targets (green highlight) and invalid targets (red highlight, dimmed during drag)
- Past date validation preventing runs from being scheduled in the past
- Existing run collision detection preventing drops on dates that already have a run
- `data-valid-target` attribute on calendar cells for testing and accessibility
- 45 new tests for drop validation covering utility functions and component behavior
- Drag-and-drop functionality for rescheduling runs on the training calendar
- @dnd-kit/core and @dnd-kit/utilities dependencies for accessible drag-and-drop
- DraggableRunBadge component wrapping run badges with drag capability
- DroppableCalendarCell component making calendar cells valid drop targets
- Visual drag overlay showing the dragged run badge during drag operations
- Drop target highlighting with amber glow when dragging over valid cells
- Authentication check for drag-and-drop (only authenticated users can reschedule)
- Completed run protection (completed runs cannot be dragged/rescheduled)
- Integration with runs.update tRPC mutation for persisting date changes
- 116 tests for calendar drag-and-drop functionality with 94.95% coverage
- Adjacent month days display in calendar (previous/next month days shown in muted style)
- Responsive calendar design for mobile devices with breakpoints at `sm` (640px)
- Mobile-optimized touch targets (44px minimum) for navigation buttons
- Responsive calendar cell heights (60px mobile, 80px desktop)
- Responsive day headers with smaller font sizes on mobile
- Responsive legend with smaller icons and text on mobile
- 12 new tests for adjacent month days and responsive design
- Checkmark indicator (✓) for completed runs on calendar badges
- Visual distinction between completed runs (with checkmark) and scheduled runs (without)
- 10 new tests for completed run indicator and today highlight behavior
- Calendar navigation with Previous/Next month buttons and Today button
- Month navigation state management using React useState hook
- Dynamic date range queries that update when navigating between months
- Today button appears only when viewing a different month, returns to current month on click
- Navigation wraps correctly between years (December to January, January to December)
- 10 new navigation tests for TrainingCalendar component with 100% coverage
- Training calendar component displaying scheduled runs on a monthly grid view
- Run type color coding: Long (blue), Easy (green), Tempo (orange), Intervals (purple), Recovery (gray), Race (gold)
- Run badges showing abbreviated type and distance (e.g., "Long 16km")
- Today's date highlighting with amber text and background
- Calendar loading skeleton with animated placeholders
- Empty state with helpful message when no runs scheduled
- Legend showing all run type colors when runs are present
- Integration with `runs.getByDateRange` tRPC query for fetching monthly runs
- Training Calendar section on homepage below Run Suggestions
- 32 comprehensive tests for TrainingCalendar component with 100% coverage
- 4 additional historical runs to seed data (Nov 16, 20, 23, 26) from runs.csv
- "Accept & Schedule" button on RunSuggestionCard for converting suggestions to scheduled runs
- Accept button state management (idle, loading, success, error) with visual feedback
- Loading spinner animation during run creation
- Success state showing "Scheduled ✓" with green button background
- Card dimming (60% opacity) after successful acceptance to indicate scheduled status
- Error message display for duplicate date conflicts and other errors
- Automatic pace and duration calculation based on run type and distance
- Cache invalidation of runs query after successful acceptance
- 20 new tests for accept button functionality and integration
- Runs tRPC router (`server/api/routers/runs.ts`) with full CRUD operations for training runs
- `runs.getAll` query with optional limit and completed filter parameters
- `runs.getById` query returning single run by ID
- `runs.getByDateRange` query for fetching runs within a date range
- `runs.create` mutation with Zod validation for date, distance, pace, duration, type, notes, completed
- `runs.update` mutation with partial updates and date conflict detection
- `runs.delete` mutation with existence check
- `runs.markComplete` mutation for toggling run completion status
- Duplicate date detection on create/update throwing TRPCError with CONFLICT code
- Pace format validation (M:SS or MM:SS regex) and duration format validation
- Public procedures for queries (portfolio visibility) and protected procedures for mutations
- 35 comprehensive tests for runs router with 100% code coverage
- Run model in Prisma schema for storing scheduled and completed runs
- Historical runs seed data with 18 completed runs from Sept-Nov 2025 (based on actual training data)
- Unique constraint on Run date field (one run per day)
- Indexes on Run date and completed fields for efficient queries
- Integration tests for Run seeding (9 new tests)
- Run suggestions UI components (`RunSuggestionCard`, `RunSuggestions`) with glass-effect styling matching weather cards
- Info icon tooltip with reasoning displayed via React Portal for proper z-index handling
- Time range display for each suggestion showing optimal running windows
- Hybrid weather fetching combining WeatherAPI.com (days 1-5) and Open-Meteo (days 6-16)
- `fetchFromOpenMeteo()` function for free extended 16-day forecasts
- `fetchHybridForecast()` function merging paid and free API data
- WMO weather code mapping for Open-Meteo condition text conversion
- Open-Meteo hourly data parsing with temperature, precipitation, wind, humidity
- Weekend-only long run scheduling with 2-day rest enforcement
- Easy run scheduling with hourly weather scoring and 1-day rest enforcement
- Time window constraints: 9am-5pm for easy runs, 9am-2pm for long runs (Ireland winter daylight)
- Planning tRPC endpoint (`planning.generateSuggestions`) for frontend access to run suggestions
- Cache-first weather fetching in planning router for performance optimization
- Input validation for days (1-14) and optional location parameters
- Graceful degradation returning empty array when no training plan exists
- Comprehensive test suite with 21 tests for the planning router
- Planning algorithm core for generating optimal run suggestions based on weather and training plan
- `generateSuggestions()` function implementing multi-stage scheduling algorithm
- Weather scoring integration using `lib/weather-preferences.ts` functions
- Long run prioritization for best weather days with weekend preference
- Easy run distribution with gap prevention (no 4+ day gaps between runs)
- Rest day enforcement after long runs
- Human-readable reasoning generation for each suggestion
- Validation utilities (`validateNoLargeGaps`, `validateNoBackToBackHardDays`)
- Comprehensive test suite with 72 tests and 100% statement coverage
- Login page at `/login` with password-only authentication form
- `LoginForm` component with NextAuth signIn integration, loading states, and error handling
- Automatic redirect for authenticated users visiting login page
- "Back to home" link on login page for guest navigation
- UI access control components for read-only views for unauthenticated users
- `ProtectedAction` wrapper component for conditionally rendering protected UI elements
- `LoginPrompt` component displaying "Log in to schedule runs" link for guests
- `useIsAuthenticated` hook for simple authentication state checking
- Smooth CSS transitions for auth state changes in protected components
- Protected tRPC procedures with `protectedProcedure` middleware for authenticated mutations
- Settings tRPC router with public read and protected write operations
- Session context integration in tRPC for authentication checks
- NextAuth.js v5 authentication with credentials provider for single-user password login
- SessionProvider component for client-side session access throughout the app
- Auth API route (`/api/auth/[...nextauth]`) handling signin, signout, session, and CSRF
- NEXTAUTH_SECRET and AUTH_PASSWORD environment variable validation in `lib/env.ts`
- JWT session strategy for stateless authentication
- Custom login page configuration (`/login`)
- Initial project setup with Session-Driven Development
- UserSettings model in Prisma schema for race configuration
- Database seed script for initial UserSettings data
- Supabase PostgreSQL database integration
- RainCheck homepage with dark forest theme and trail background image
- Custom color palette (forest-deep, forest-dark, text-primary) in Tailwind config
- App metadata with RainCheck branding and description
- Health check tRPC endpoint (`health.check`) with database connectivity status
- CI/CD pipeline with GitHub Actions (Tests, Build, Quality Check, Security, Deploy workflows)
- WeatherCache model for caching weather API responses with 1-hour TTL
- Composite unique constraint on WeatherCache (location, datetime) to prevent duplicates
- Index on WeatherCache expiresAt for efficient cache cleanup queries
- Integration tests for database seed script verification
- Weather API client (`lib/weather-client.ts`) with WeatherAPI.com integration
- Rate limiting (50 calls/day safety limit) and retry logic (3 retries with exponential backoff)
- WeatherData type and WeatherAPIError class for type-safe weather handling
- WEATHER_API_KEY environment variable validation
- Weather tRPC endpoint (`weather.getCurrentWeather`) with cache-first strategy
- Cache hit/miss logic with 1-hour TTL for weather data
- Default location fallback to UserSettings when not provided
- Error mapping from WeatherAPIError to TRPCError codes
- CurrentWeather component (`components/weather/CurrentWeather.tsx`) with loading/error/success states
- WeatherIcon component (`components/weather/WeatherIcon.tsx`) mapping conditions to emoji icons
- Homepage integration displaying current weather data
- Skeleton loading animation for weather card
- Error state with retry functionality
- Weather forecast tRPC endpoint (`weather.getForecast`) for 7-day weather forecasts
- Weather-reactive trail background that changes based on current weather condition
- Trail background utility functions (`getTrailImage`, `getTintColor`) for condition-to-asset mapping
- Support for sunny, rainy, cloudy, foggy, snowy, and default trail images with matching tint overlays
- Background reacts to selected forecast day - clicking a day changes the trail background
- WeatherForecast onDaySelect callback to notify parent of day selection
- `fetchForecast` function in weather client for multi-day forecast API calls
- Cache-first strategy for forecast data with per-day caching and 1-hour TTL
- Partial cache hit handling (fetches only missing days from API)
- WeatherDayCard component (`components/weather/WeatherDayCard.tsx`) for individual forecast day display
- WeatherForecast component (`components/weather/WeatherForecast.tsx`) displaying 5-day forecast grid
- Glass-effect card styling with semi-transparent backgrounds and backdrop blur
- Card selection state with visual feedback
- Smooth 2-second cross-fade background transitions when switching forecast days
- Layered background system with opacity-based transitions for seamless image changes
- Enhanced WeatherDayCard spacing and typography with larger temperature display
- Inset ring highlight for selected forecast cards
- Hover effect with border highlight on unselected cards
- Loading skeleton for forecast cards
- Error and empty states for forecast component
- Homepage integration with WeatherForecast below CurrentWeather
- TrainingPlan model with 24-week half-marathon training structure (Nov 30, 2025 - May 17, 2026)
- WeatherPreference model with weather tolerance thresholds for each run type
- RunType enum (LONG_RUN, EASY_RUN, TEMPO_RUN, INTERVAL_RUN, RECOVERY_RUN, RACE)
- Phase enum (BASE_BUILDING, BASE_EXTENSION, SPEED_DEVELOPMENT, PEAK_TAPER)
- Seed data for 24-week training plan with progressive long run targets (12km → 20km peak)
- Seed data for weather preferences matching PRD specifications
- Integration tests for TrainingPlan and WeatherPreference seeding
- Weather preferences logic module (`lib/weather-preferences.ts`) with scoring and acceptability functions
- `getWeatherScore()` function calculating 0-100 quality score based on precipitation, wind, temperature, conditions
- `isAcceptableWeather()` function checking if weather meets run type thresholds
- `getWeatherQuality()` function mapping scores to "excellent"/"good"/"fair"/"poor" labels
- `getRejectionReason()` function generating human-readable explanations for unacceptable weather
- 74 unit tests for weather preferences logic with 100% code coverage

### Changed

- Migrated Tailwind CSS configuration from v3 format (`tailwind.config.ts`) to v4 CSS-based `@theme` directive
- Refactored inline styles to Tailwind classes across 12+ component files
- Replaced hardcoded hex values with semantic theme classes in stats page and components
- Updated tests to use class-based assertions instead of style-based assertions
- Increased internal rate limit from 50 to 1000 calls/day for paid WeatherAPI plans
- Updated seed test to handle non-empty WeatherCache table

### Removed

- `tailwind.config.ts` file (migrated to CSS-based configuration)

### Fixed

- Tailwind v4 configuration incompatibility causing theme colors not to apply
- Missing `bg-surface` and `text-text-secondary` classes (now properly defined in theme)
- Seed tests now resilient to user-accepted run suggestions (using minimum counts and date filters)
