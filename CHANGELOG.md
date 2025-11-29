# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

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

### Changed

- Increased internal rate limit from 50 to 1000 calls/day for paid WeatherAPI plans
- Updated seed test to handle non-empty WeatherCache table

### Fixed

### Removed
