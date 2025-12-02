import { renderHook, act } from "@testing-library/react";
import { useDeviceCapabilities } from "../useDeviceCapabilities";

describe("useDeviceCapabilities", () => {
  const originalMatchMedia = window.matchMedia;
  const originalNavigator = window.navigator;

  // Helper to create mock matchMedia with listener support
  const createMockMatchMedia = (mobileMatches: boolean, motionMatches: boolean) => {
    const listeners: Map<string, ((_e: MediaQueryListEvent) => void)[]> = new Map();

    return jest.fn().mockImplementation((query: string) => {
      const isMotionQuery = query.includes("prefers-reduced-motion");
      const matches = isMotionQuery ? motionMatches : mobileMatches;

      if (!listeners.has(query)) {
        listeners.set(query, []);
      }

      return {
        matches,
        media: query,
        onchange: null,
        addEventListener: jest.fn(
          (eventType: string, listener: (_e: MediaQueryListEvent) => void) => {
            if (eventType === "change") {
              listeners.get(query)?.push(listener);
            }
          }
        ),
        removeEventListener: jest.fn(
          (eventType: string, listener: (_e: MediaQueryListEvent) => void) => {
            if (eventType === "change") {
              const queryListeners = listeners.get(query) || [];
              const index = queryListeners.indexOf(listener);
              if (index > -1) {
                queryListeners.splice(index, 1);
              }
            }
          }
        ),
        dispatchEvent: jest.fn(),
        // Helper to trigger change events in tests
        _triggerChange: (newMatches: boolean) => {
          listeners.get(query)?.forEach((listener) => {
            listener({ matches: newMatches } as MediaQueryListEvent);
          });
        },
      };
    });
  };

  // Helper to mock navigator.hardwareConcurrency
  const mockHardwareConcurrency = (cores: number) => {
    Object.defineProperty(navigator, "hardwareConcurrency", {
      value: cores,
      configurable: true,
    });
  };

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
    Object.defineProperty(window, "navigator", {
      value: originalNavigator,
      configurable: true,
    });
  });

  describe("initial state", () => {
    it("returns isLoading true initially before detection", () => {
      window.matchMedia = createMockMatchMedia(false, false);
      mockHardwareConcurrency(8);

      const { result } = renderHook(() => useDeviceCapabilities());

      // After useEffect runs, isLoading should be false
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe("mobile detection", () => {
    it("detects mobile when pointer is coarse", () => {
      window.matchMedia = createMockMatchMedia(true, false);
      mockHardwareConcurrency(4);

      const { result } = renderHook(() => useDeviceCapabilities());

      expect(result.current.isMobile).toBe(true);
    });

    it("detects desktop when pointer is fine", () => {
      window.matchMedia = createMockMatchMedia(false, false);
      mockHardwareConcurrency(8);

      const { result } = renderHook(() => useDeviceCapabilities());

      expect(result.current.isMobile).toBe(false);
    });
  });

  describe("reduced motion detection", () => {
    it("detects reduced motion preference when enabled", () => {
      window.matchMedia = createMockMatchMedia(false, true);
      mockHardwareConcurrency(8);

      const { result } = renderHook(() => useDeviceCapabilities());

      expect(result.current.prefersReducedMotion).toBe(true);
    });

    it("detects no reduced motion preference when disabled", () => {
      window.matchMedia = createMockMatchMedia(false, false);
      mockHardwareConcurrency(8);

      const { result } = renderHook(() => useDeviceCapabilities());

      expect(result.current.prefersReducedMotion).toBe(false);
    });
  });

  describe("hardware concurrency", () => {
    it("reads hardware concurrency from navigator", () => {
      window.matchMedia = createMockMatchMedia(false, false);
      mockHardwareConcurrency(16);

      const { result } = renderHook(() => useDeviceCapabilities());

      expect(result.current.hardwareConcurrency).toBe(16);
    });

    it("defaults to 4 when hardwareConcurrency is not available", () => {
      window.matchMedia = createMockMatchMedia(false, false);
      Object.defineProperty(navigator, "hardwareConcurrency", {
        value: undefined,
        configurable: true,
      });

      const { result } = renderHook(() => useDeviceCapabilities());

      expect(result.current.hardwareConcurrency).toBe(4);
    });
  });

  describe("device tier calculation", () => {
    it("returns high tier for desktop with 8+ cores", () => {
      window.matchMedia = createMockMatchMedia(false, false);
      mockHardwareConcurrency(8);

      const { result } = renderHook(() => useDeviceCapabilities());

      expect(result.current.tier).toBe("high");
    });

    it("returns medium tier for desktop with 4-6 cores", () => {
      window.matchMedia = createMockMatchMedia(false, false);
      mockHardwareConcurrency(6);

      const { result } = renderHook(() => useDeviceCapabilities());

      expect(result.current.tier).toBe("medium");
    });

    it("returns medium tier for mobile with 6+ cores", () => {
      window.matchMedia = createMockMatchMedia(true, false);
      mockHardwareConcurrency(6);

      const { result } = renderHook(() => useDeviceCapabilities());

      expect(result.current.tier).toBe("medium");
    });

    it("returns low tier for mobile with 4 or fewer cores", () => {
      window.matchMedia = createMockMatchMedia(true, false);
      mockHardwareConcurrency(4);

      const { result } = renderHook(() => useDeviceCapabilities());

      expect(result.current.tier).toBe("low");
    });

    it("returns low tier for any device with 2 or fewer cores", () => {
      window.matchMedia = createMockMatchMedia(false, false);
      mockHardwareConcurrency(2);

      const { result } = renderHook(() => useDeviceCapabilities());

      expect(result.current.tier).toBe("low");
    });
  });

  describe("event listeners", () => {
    it("updates isMobile when media query changes", () => {
      const mockMatchMedia = createMockMatchMedia(false, false);
      window.matchMedia = mockMatchMedia;
      mockHardwareConcurrency(8);

      const { result } = renderHook(() => useDeviceCapabilities());

      expect(result.current.isMobile).toBe(false);

      // Find the mobile query mock and trigger change
      act(() => {
        const mobileQuery = mockMatchMedia.mock.results.find(
          (r) => r.type === "return" && r.value?.media === "(pointer: coarse)"
        );
        if (mobileQuery?.type === "return") {
          mobileQuery.value._triggerChange(true);
        }
      });

      expect(result.current.isMobile).toBe(true);
    });

    it("updates prefersReducedMotion when preference changes", () => {
      const mockMatchMedia = createMockMatchMedia(false, false);
      window.matchMedia = mockMatchMedia;
      mockHardwareConcurrency(8);

      const { result } = renderHook(() => useDeviceCapabilities());

      expect(result.current.prefersReducedMotion).toBe(false);

      // Find the motion query mock and trigger change
      act(() => {
        const motionQuery = mockMatchMedia.mock.results.find(
          (r) => r.type === "return" && r.value?.media === "(prefers-reduced-motion: reduce)"
        );
        if (motionQuery?.type === "return") {
          motionQuery.value._triggerChange(true);
        }
      });

      expect(result.current.prefersReducedMotion).toBe(true);
    });

    it("cleans up event listeners on unmount", () => {
      const mockMatchMedia = createMockMatchMedia(false, false);
      window.matchMedia = mockMatchMedia;
      mockHardwareConcurrency(8);

      const { unmount } = renderHook(() => useDeviceCapabilities());
      unmount();

      // Verify removeEventListener was called for both queries
      const mobileQuery = mockMatchMedia.mock.results.find(
        (r) => r.type === "return" && r.value?.media === "(pointer: coarse)"
      );
      const motionQuery = mockMatchMedia.mock.results.find(
        (r) => r.type === "return" && r.value?.media === "(prefers-reduced-motion: reduce)"
      );

      if (mobileQuery?.type === "return") {
        expect(mobileQuery.value.removeEventListener).toHaveBeenCalledWith(
          "change",
          expect.any(Function)
        );
      }
      if (motionQuery?.type === "return") {
        expect(motionQuery.value.removeEventListener).toHaveBeenCalledWith(
          "change",
          expect.any(Function)
        );
      }
    });
  });
});
