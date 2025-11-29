import { render, screen } from "@testing-library/react";
import { WeatherIcon, getWeatherIcon } from "../WeatherIcon";

describe("WeatherIcon", () => {
  describe("getWeatherIcon", () => {
    it("returns sun emoji for sunny conditions", () => {
      expect(getWeatherIcon("Sunny")).toBe("\u2600\uFE0F");
      expect(getWeatherIcon("sunny")).toBe("\u2600\uFE0F");
      expect(getWeatherIcon("Clear")).toBe("\u2600\uFE0F");
    });

    it("returns sun behind cloud for partly cloudy", () => {
      expect(getWeatherIcon("Partly cloudy")).toBe("\u26C5");
      expect(getWeatherIcon("Partly sunny")).toBe("\u26C5");
    });

    it("returns cloud emoji for cloudy/overcast", () => {
      expect(getWeatherIcon("Cloudy")).toBe("\u2601\uFE0F");
      expect(getWeatherIcon("Overcast")).toBe("\u2601\uFE0F");
    });

    it("returns rain cloud for rain conditions", () => {
      expect(getWeatherIcon("Light rain")).toBe("\uD83C\uDF27\uFE0F");
      expect(getWeatherIcon("Heavy rain")).toBe("\uD83C\uDF27\uFE0F");
      expect(getWeatherIcon("Drizzle")).toBe("\uD83C\uDF27\uFE0F");
      expect(getWeatherIcon("Rain shower")).toBe("\uD83C\uDF27\uFE0F");
    });

    it("returns snow cloud for snow conditions", () => {
      expect(getWeatherIcon("Snow")).toBe("\uD83C\uDF28\uFE0F");
      expect(getWeatherIcon("Light snow")).toBe("\uD83C\uDF28\uFE0F");
      expect(getWeatherIcon("Sleet")).toBe("\uD83C\uDF28\uFE0F");
      expect(getWeatherIcon("Blizzard")).toBe("\uD83C\uDF28\uFE0F");
    });

    it("returns thunder cloud for storm conditions", () => {
      expect(getWeatherIcon("Thunderstorm")).toBe("\u26C8\uFE0F");
      expect(getWeatherIcon("Thunder")).toBe("\u26C8\uFE0F");
      expect(getWeatherIcon("Storm")).toBe("\u26C8\uFE0F");
    });

    it("returns fog emoji for fog/mist conditions", () => {
      expect(getWeatherIcon("Fog")).toBe("\uD83C\uDF2B\uFE0F");
      expect(getWeatherIcon("Mist")).toBe("\uD83C\uDF2B\uFE0F");
      expect(getWeatherIcon("Haze")).toBe("\uD83C\uDF2B\uFE0F");
    });

    it("returns cloud emoji for unknown conditions", () => {
      expect(getWeatherIcon("Unknown")).toBe("\u2601\uFE0F");
      expect(getWeatherIcon("")).toBe("\u2601\uFE0F");
    });
  });

  describe("WeatherIcon component", () => {
    it("renders with correct aria-label", () => {
      render(<WeatherIcon condition="Sunny" />);
      expect(screen.getByRole("img", { name: "Sunny" })).toBeInTheDocument();
    });

    it("applies custom className", () => {
      render(<WeatherIcon condition="Sunny" className="text-6xl" />);
      const icon = screen.getByRole("img", { name: "Sunny" });
      expect(icon).toHaveClass("text-6xl");
    });

    it("renders correct icon for condition", () => {
      render(<WeatherIcon condition="Rain" />);
      const icon = screen.getByRole("img", { name: "Rain" });
      expect(icon).toHaveTextContent("\uD83C\uDF27\uFE0F");
    });
  });
});
