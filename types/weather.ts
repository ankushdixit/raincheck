/**
 * Weather Data Types
 *
 * Type definitions for weather data used throughout the application.
 * These types align with the WeatherCache Prisma model for consistency.
 */

/**
 * Hourly weather data for a specific hour
 */
export interface HourlyWeather {
  time: Date; // Hour timestamp (e.g., 2025-11-29T09:00:00)
  condition: string; // Weather condition
  temperature: number; // Temperature in Celsius
  feelsLike: number; // Feels-like temperature
  precipitation: number; // Precipitation probability 0-100
  humidity: number; // Humidity percentage 0-100
  windSpeed: number; // Wind speed in km/h
  isDay: boolean; // Whether it's daytime
}

/**
 * Weather data returned from the weather API client
 */
export interface WeatherData {
  location: string; // Location name, e.g., "Balbriggan, IE"
  latitude: number;
  longitude: number;
  datetime: Date; // Forecast date (midnight)
  condition: string; // Weather condition, e.g., "Clear", "Light Rain"
  description: string; // Detailed weather description
  temperature: number; // Average temperature in Celsius
  feelsLike: number; // Feels-like temperature in Celsius
  precipitation: number; // Precipitation probability 0-100
  humidity: number; // Humidity percentage 0-100
  windSpeed: number; // Wind speed in km/h
  windDirection: number; // Wind direction in degrees 0-360
  hourly?: HourlyWeather[]; // Hourly forecasts for the day
}

/**
 * Custom error class for weather API errors
 */
export class WeatherAPIError extends Error {
  public statusCode?: number;

  constructor(message: string, statusCode?: number) {
    super(message);
    this.name = "WeatherAPIError";
    this.statusCode = statusCode;
  }
}
