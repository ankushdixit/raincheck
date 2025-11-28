/**
 * Weather Data Types
 *
 * Type definitions for weather data used throughout the application.
 * These types align with the WeatherCache Prisma model for consistency.
 */

/**
 * Weather data returned from the weather API client
 */
export interface WeatherData {
  location: string; // Location name, e.g., "Balbriggan, IE"
  latitude: number;
  longitude: number;
  datetime: Date; // Forecast timestamp
  condition: string; // Weather condition, e.g., "Clear", "Light Rain"
  description: string; // Detailed weather description
  temperature: number; // Temperature in Celsius
  feelsLike: number; // Feels-like temperature in Celsius
  precipitation: number; // Precipitation probability 0-100
  humidity: number; // Humidity percentage 0-100
  windSpeed: number; // Wind speed in km/h
  windDirection: number; // Wind direction in degrees 0-360
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
