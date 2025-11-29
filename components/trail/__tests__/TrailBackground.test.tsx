import { getTrailImage, getTintColor } from "../TrailBackground";

describe("Trail Background Utilities", () => {
  describe("getTrailImage", () => {
    it("returns sunny trail for sunny conditions", () => {
      expect(getTrailImage("Sunny")).toBe("sunny-trail.webp");
      expect(getTrailImage("sunny")).toBe("sunny-trail.webp");
      expect(getTrailImage("Clear")).toBe("sunny-trail.webp");
    });

    it("returns cloudy trail for partly cloudy", () => {
      expect(getTrailImage("Partly cloudy")).toBe("cloudy-trail.webp");
      expect(getTrailImage("Partly sunny")).toBe("cloudy-trail.webp");
    });

    it("returns cloudy trail for cloudy/overcast", () => {
      expect(getTrailImage("Cloudy")).toBe("cloudy-trail.webp");
      expect(getTrailImage("Overcast")).toBe("cloudy-trail.webp");
    });

    it("returns rainy trail for rain conditions", () => {
      expect(getTrailImage("Light rain")).toBe("rainy-trail.webp");
      expect(getTrailImage("Heavy rain")).toBe("rainy-trail.webp");
      expect(getTrailImage("Drizzle")).toBe("rainy-trail.webp");
      expect(getTrailImage("Rain shower")).toBe("rainy-trail.webp");
    });

    it("returns snowy trail for snow conditions", () => {
      expect(getTrailImage("Snow")).toBe("snowy-trail.webp");
      expect(getTrailImage("Light snow")).toBe("snowy-trail.webp");
      expect(getTrailImage("Sleet")).toBe("snowy-trail.webp");
      expect(getTrailImage("Blizzard")).toBe("snowy-trail.webp");
    });

    it("returns foggy trail for fog/mist conditions", () => {
      expect(getTrailImage("Fog")).toBe("foggy-trail.webp");
      expect(getTrailImage("Mist")).toBe("foggy-trail.webp");
      expect(getTrailImage("Haze")).toBe("foggy-trail.webp");
    });

    it("returns default trail for unknown conditions", () => {
      expect(getTrailImage("Unknown")).toBe("default-trail.webp");
      expect(getTrailImage("")).toBe("default-trail.webp");
    });
  });

  describe("getTintColor", () => {
    it("returns warm golden tint for sunny conditions", () => {
      expect(getTintColor("Sunny")).toBe("rgba(255, 183, 77, 0.15)");
      expect(getTintColor("Clear")).toBe("rgba(255, 183, 77, 0.15)");
    });

    it("returns neutral gray tint for cloudy conditions", () => {
      expect(getTintColor("Cloudy")).toBe("rgba(158, 158, 158, 0.2)");
      expect(getTintColor("Overcast")).toBe("rgba(158, 158, 158, 0.2)");
      expect(getTintColor("Partly cloudy")).toBe("rgba(158, 158, 158, 0.2)");
    });

    it("returns cool blue-gray tint for rain conditions", () => {
      expect(getTintColor("Rain")).toBe("rgba(96, 125, 139, 0.25)");
      expect(getTintColor("Light rain")).toBe("rgba(96, 125, 139, 0.25)");
    });

    it("returns light gray tint for foggy conditions", () => {
      expect(getTintColor("Fog")).toBe("rgba(200, 200, 200, 0.3)");
      expect(getTintColor("Mist")).toBe("rgba(200, 200, 200, 0.3)");
    });

    it("returns cool white-blue tint for snowy conditions", () => {
      expect(getTintColor("Snow")).toBe("rgba(179, 229, 252, 0.2)");
    });

    it("returns dark tint for unknown/default conditions", () => {
      expect(getTintColor("Unknown")).toBe("rgba(10, 15, 10, 0.6)");
      expect(getTintColor("")).toBe("rgba(10, 15, 10, 0.6)");
    });
  });
});
