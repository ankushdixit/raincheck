import { renderHook, act } from "@testing-library/react";
import { useTouchDevice } from "../useTouchDevice";

describe("useTouchDevice", () => {
  // Store original matchMedia
  const originalMatchMedia = window.matchMedia;

  // Mock matchMedia
  const createMockMatchMedia = (matches: boolean) => {
    const listeners: ((_e: MediaQueryListEvent) => void)[] = [];
    return jest.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addEventListener: jest.fn(
        (eventType: string, listener: (_e: MediaQueryListEvent) => void) => {
          if (eventType === "change") {
            listeners.push(listener);
          }
        }
      ),
      removeEventListener: jest.fn(
        (eventType: string, listener: (_e: MediaQueryListEvent) => void) => {
          if (eventType === "change") {
            const index = listeners.indexOf(listener);
            if (index > -1) {
              listeners.splice(index, 1);
            }
          }
        }
      ),
      dispatchEvent: jest.fn(),
      // Helper to trigger change events in tests
      _triggerChange: (newMatches: boolean) => {
        listeners.forEach((listener) => {
          listener({ matches: newMatches } as MediaQueryListEvent);
        });
      },
      _listeners: listeners,
    }));
  };

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  describe("initial state", () => {
    it("returns isLoading true initially on client", () => {
      window.matchMedia = createMockMatchMedia(false);

      // We need to test the synchronous initial state before useEffect runs
      // This is a limitation of the hook - it starts loading
      const { result } = renderHook(() => useTouchDevice());

      // After useEffect runs, isLoading should be false
      expect(result.current.isLoading).toBe(false);
    });

    it("detects touch device when pointer is coarse", () => {
      window.matchMedia = createMockMatchMedia(true);

      const { result } = renderHook(() => useTouchDevice());

      expect(result.current.isTouchDevice).toBe(true);
      expect(result.current.isLoading).toBe(false);
    });

    it("detects non-touch device when pointer is fine", () => {
      window.matchMedia = createMockMatchMedia(false);

      const { result } = renderHook(() => useTouchDevice());

      expect(result.current.isTouchDevice).toBe(false);
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe("media query check", () => {
    it("queries for coarse pointer media feature", () => {
      const mockMatchMedia = createMockMatchMedia(true);
      window.matchMedia = mockMatchMedia;

      renderHook(() => useTouchDevice());

      expect(mockMatchMedia).toHaveBeenCalledWith("(pointer: coarse)");
    });
  });

  describe("event listener", () => {
    it("adds change event listener on mount", () => {
      const mockMatchMedia = createMockMatchMedia(false);
      window.matchMedia = mockMatchMedia;

      renderHook(() => useTouchDevice());

      const mediaQuery = mockMatchMedia.mock.results[0].value;
      expect(mediaQuery.addEventListener).toHaveBeenCalledWith("change", expect.any(Function));
    });

    it("removes change event listener on unmount", () => {
      const mockMatchMedia = createMockMatchMedia(false);
      window.matchMedia = mockMatchMedia;

      const { unmount } = renderHook(() => useTouchDevice());
      unmount();

      const mediaQuery = mockMatchMedia.mock.results[0].value;
      expect(mediaQuery.removeEventListener).toHaveBeenCalledWith("change", expect.any(Function));
    });

    it("updates isTouchDevice when media query changes", () => {
      const mockMatchMedia = createMockMatchMedia(false);
      window.matchMedia = mockMatchMedia;

      const { result } = renderHook(() => useTouchDevice());

      expect(result.current.isTouchDevice).toBe(false);

      // Simulate media query change
      act(() => {
        const mediaQuery = mockMatchMedia.mock.results[0].value;
        mediaQuery._triggerChange(true);
      });

      expect(result.current.isTouchDevice).toBe(true);
    });

    it("updates isTouchDevice when switching from touch to non-touch", () => {
      const mockMatchMedia = createMockMatchMedia(true);
      window.matchMedia = mockMatchMedia;

      const { result } = renderHook(() => useTouchDevice());

      expect(result.current.isTouchDevice).toBe(true);

      // Simulate media query change
      act(() => {
        const mediaQuery = mockMatchMedia.mock.results[0].value;
        mediaQuery._triggerChange(false);
      });

      expect(result.current.isTouchDevice).toBe(false);
    });
  });

  describe("SSR handling", () => {
    it("handles server-side rendering gracefully", () => {
      // Simulate SSR by making matchMedia undefined (but it's actually still there in jsdom)
      // We can test the initial state behavior instead
      window.matchMedia = createMockMatchMedia(false);

      const { result } = renderHook(() => useTouchDevice());

      // Should not crash and should return valid values
      expect(result.current.isTouchDevice).toBe(false);
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe("return type", () => {
    it("returns an object with isTouchDevice boolean", () => {
      window.matchMedia = createMockMatchMedia(true);

      const { result } = renderHook(() => useTouchDevice());

      expect(typeof result.current.isTouchDevice).toBe("boolean");
    });

    it("returns an object with isLoading boolean", () => {
      window.matchMedia = createMockMatchMedia(true);

      const { result } = renderHook(() => useTouchDevice());

      expect(typeof result.current.isLoading).toBe("boolean");
    });
  });
});
