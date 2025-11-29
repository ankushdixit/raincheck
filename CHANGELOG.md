# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

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
- `fetchForecast` function in weather client for multi-day forecast API calls
- Cache-first strategy for forecast data with per-day caching and 1-hour TTL
- Partial cache hit handling (fetches only missing days from API)

### Changed

### Fixed

### Removed
