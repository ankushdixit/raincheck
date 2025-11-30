import { render } from "@testing-library/react";
import { WeatherEffectLayer } from "../WeatherEffectLayer";

describe("WeatherEffectLayer", () => {
  describe("rain conditions", () => {
    it('renders RainEffect for "Light Rain" condition', () => {
      render(<WeatherEffectLayer condition="Light Rain" />);
      const rainEffect = document.querySelector(".rain-effect");
      expect(rainEffect).toBeInTheDocument();
    });

    it('renders RainEffect with light intensity for "Light Rain"', () => {
      render(<WeatherEffectLayer condition="Light Rain" />);
      // Light rain has 30 particles
      const drops = document.querySelectorAll(".rain-drop");
      expect(drops.length).toBe(30);
    });

    it('renders RainEffect with heavy intensity for "Heavy Rain"', () => {
      render(<WeatherEffectLayer condition="Heavy Rain" />);
      // Heavy rain has 100 particles
      const drops = document.querySelectorAll(".rain-drop");
      expect(drops.length).toBe(100);
    });

    it('renders RainEffect with moderate intensity for "Rain"', () => {
      render(<WeatherEffectLayer condition="Rain" />);
      // Moderate rain has 60 particles
      const drops = document.querySelectorAll(".rain-drop");
      expect(drops.length).toBe(60);
    });

    it('renders RainEffect with moderate intensity for "Moderate Rain"', () => {
      render(<WeatherEffectLayer condition="Moderate Rain" />);
      const drops = document.querySelectorAll(".rain-drop");
      expect(drops.length).toBe(60);
    });

    it('renders RainEffect for "Thunderstorm"', () => {
      render(<WeatherEffectLayer condition="Thunderstorm" />);
      const rainEffect = document.querySelector(".rain-effect");
      expect(rainEffect).toBeInTheDocument();
    });
  });

  describe("snow conditions", () => {
    it('renders SnowEffect for "Light Snow" condition', () => {
      render(<WeatherEffectLayer condition="Light Snow" />);
      const snowEffect = document.querySelector(".snow-effect");
      expect(snowEffect).toBeInTheDocument();
    });

    it('renders SnowEffect with light intensity for "Light Snow"', () => {
      render(<WeatherEffectLayer condition="Light Snow" />);
      // Light snow has 25 particles
      const flakes = document.querySelectorAll(".snowflake");
      expect(flakes.length).toBe(25);
    });

    it('renders SnowEffect with heavy intensity for "Heavy Snow"', () => {
      render(<WeatherEffectLayer condition="Heavy Snow" />);
      // Heavy snow has 80 particles
      const flakes = document.querySelectorAll(".snowflake");
      expect(flakes.length).toBe(80);
    });

    it('renders SnowEffect with moderate intensity for "Snow"', () => {
      render(<WeatherEffectLayer condition="Snow" />);
      // Moderate snow has 50 particles
      const flakes = document.querySelectorAll(".snowflake");
      expect(flakes.length).toBe(50);
    });
  });

  describe("fog/mist conditions", () => {
    it('renders FogEffect for "Fog" condition', () => {
      render(<WeatherEffectLayer condition="Fog" />);
      const fogEffect = document.querySelector(".fog-effect");
      expect(fogEffect).toBeInTheDocument();
    });

    it('renders FogEffect for "Mist" condition', () => {
      render(<WeatherEffectLayer condition="Mist" />);
      const fogEffect = document.querySelector(".fog-effect");
      expect(fogEffect).toBeInTheDocument();
    });
  });

  describe("sunny/clear conditions", () => {
    it('renders SunEffect for "Sunny" condition', () => {
      render(<WeatherEffectLayer condition="Sunny" />);
      const sunEffect = document.querySelector(".sun-effect");
      expect(sunEffect).toBeInTheDocument();
    });

    it('renders SunEffect for "Clear" condition', () => {
      render(<WeatherEffectLayer condition="Clear" />);
      const sunEffect = document.querySelector(".sun-effect");
      expect(sunEffect).toBeInTheDocument();
    });
  });

  describe("cloudy conditions", () => {
    it('renders CloudEffect for "Cloudy" condition', () => {
      render(<WeatherEffectLayer condition="Cloudy" />);
      const cloudEffect = document.querySelector(".cloud-effect");
      expect(cloudEffect).toBeInTheDocument();
    });

    it('renders CloudEffect for "Overcast" condition', () => {
      render(<WeatherEffectLayer condition="Overcast" />);
      const cloudEffect = document.querySelector(".cloud-effect");
      expect(cloudEffect).toBeInTheDocument();
    });
  });

  describe("partly cloudy conditions", () => {
    it('renders both CloudEffect and SunEffect for "Partly Cloudy"', () => {
      render(<WeatherEffectLayer condition="Partly Cloudy" />);
      const cloudEffect = document.querySelector(".cloud-effect");
      const sunEffect = document.querySelector(".sun-effect");
      expect(cloudEffect).toBeInTheDocument();
      expect(sunEffect).toBeInTheDocument();
    });

    it('renders CloudEffect with light intensity for "Partly Cloudy"', () => {
      render(<WeatherEffectLayer condition="Partly Cloudy" />);
      // Light clouds have 3 cloud elements
      const clouds = document.querySelectorAll(".cloud");
      expect(clouds.length).toBe(3);
    });
  });

  describe("intensity from precipitation", () => {
    it("adjusts intensity based on precipitation percentage when no modifier", () => {
      render(<WeatherEffectLayer condition="Rain" weather={{ precipitation: 25 }} />);
      // 25% precipitation = light intensity = 30 particles
      const drops = document.querySelectorAll(".rain-drop");
      expect(drops.length).toBe(30);
    });

    it("uses heavy intensity for high precipitation", () => {
      render(<WeatherEffectLayer condition="Rain" weather={{ precipitation: 75 }} />);
      // 75% precipitation = heavy intensity = 100 particles
      const drops = document.querySelectorAll(".rain-drop");
      expect(drops.length).toBe(100);
    });

    it("prefers condition modifier over precipitation percentage", () => {
      render(<WeatherEffectLayer condition="Light Rain" weather={{ precipitation: 90 }} />);
      // "Light" modifier takes precedence = 30 particles
      const drops = document.querySelectorAll(".rain-drop");
      expect(drops.length).toBe(30);
    });
  });

  describe("unknown conditions", () => {
    it("renders nothing for unknown conditions", () => {
      const { container } = render(<WeatherEffectLayer condition="Unknown Weather" />);
      // Should render nothing (empty fragment)
      expect(container.firstChild).toBeNull();
    });

    it("renders nothing for empty condition", () => {
      const { container } = render(<WeatherEffectLayer condition="" />);
      expect(container.firstChild).toBeNull();
    });

    it("renders nothing for windy (unsupported condition)", () => {
      const { container } = render(<WeatherEffectLayer condition="Windy" />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe("effect isolation", () => {
    it("does not render snow effect for rain condition", () => {
      render(<WeatherEffectLayer condition="Rain" />);
      const snowEffect = document.querySelector(".snow-effect");
      expect(snowEffect).not.toBeInTheDocument();
    });

    it("does not render rain effect for snow condition", () => {
      render(<WeatherEffectLayer condition="Snow" />);
      const rainEffect = document.querySelector(".rain-effect");
      expect(rainEffect).not.toBeInTheDocument();
    });

    it("does not render fog effect for sunny condition", () => {
      render(<WeatherEffectLayer condition="Sunny" />);
      const fogEffect = document.querySelector(".fog-effect");
      expect(fogEffect).not.toBeInTheDocument();
    });
  });

  describe("case insensitivity", () => {
    it("handles uppercase conditions", () => {
      render(<WeatherEffectLayer condition="LIGHT RAIN" />);
      const rainEffect = document.querySelector(".rain-effect");
      expect(rainEffect).toBeInTheDocument();
    });

    it("handles mixed case conditions", () => {
      render(<WeatherEffectLayer condition="HeavY sNoW" />);
      const snowEffect = document.querySelector(".snow-effect");
      expect(snowEffect).toBeInTheDocument();
    });
  });
});
