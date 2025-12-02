import { renderHook, act } from "@testing-library/react";
import { useEffectsPreference } from "../useEffectsPreference";

describe("useEffectsPreference", () => {
  // Store for mocked localStorage
  let localStorageStore: Record<string, string>;

  beforeEach(() => {
    localStorageStore = {};

    // Mock localStorage
    jest.spyOn(Storage.prototype, "getItem").mockImplementation((key) => {
      return localStorageStore[key] || null;
    });

    jest.spyOn(Storage.prototype, "setItem").mockImplementation((key, value) => {
      localStorageStore[key] = value;
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("initial state", () => {
    it("defaults to effects enabled", () => {
      const { result } = renderHook(() => useEffectsPreference());

      expect(result.current.effectsEnabled).toBe(true);
    });

    it("respects custom default value", () => {
      const { result } = renderHook(() => useEffectsPreference(false));

      expect(result.current.effectsEnabled).toBe(false);
    });

    it("sets isLoaded to true after mount", () => {
      const { result } = renderHook(() => useEffectsPreference());

      expect(result.current.isLoaded).toBe(true);
    });
  });

  describe("localStorage integration", () => {
    it("reads from localStorage on mount", () => {
      localStorageStore["raincheck:effects-enabled"] = "false";

      const { result } = renderHook(() => useEffectsPreference());

      expect(result.current.effectsEnabled).toBe(false);
    });

    it("writes to localStorage when toggling", () => {
      const { result } = renderHook(() => useEffectsPreference());

      act(() => {
        result.current.toggleEffects();
      });

      expect(localStorageStore["raincheck:effects-enabled"]).toBe("false");
    });

    it("writes to localStorage when setting explicitly", () => {
      const { result } = renderHook(() => useEffectsPreference());

      act(() => {
        result.current.setEffectsEnabled(false);
      });

      expect(localStorageStore["raincheck:effects-enabled"]).toBe("false");
    });

    it("handles localStorage read errors gracefully", () => {
      jest.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
        throw new Error("Storage error");
      });

      const { result } = renderHook(() => useEffectsPreference());

      // Should use default value
      expect(result.current.effectsEnabled).toBe(true);
    });

    it("handles localStorage write errors gracefully", () => {
      jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
        throw new Error("Storage error");
      });

      const { result } = renderHook(() => useEffectsPreference());

      // Should not throw when toggling
      expect(() => {
        act(() => {
          result.current.toggleEffects();
        });
      }).not.toThrow();

      // State should still update
      expect(result.current.effectsEnabled).toBe(false);
    });
  });

  describe("toggleEffects", () => {
    it("toggles from enabled to disabled", () => {
      const { result } = renderHook(() => useEffectsPreference(true));

      act(() => {
        result.current.toggleEffects();
      });

      expect(result.current.effectsEnabled).toBe(false);
    });

    it("toggles from disabled to enabled", () => {
      const { result } = renderHook(() => useEffectsPreference(false));

      act(() => {
        result.current.toggleEffects();
      });

      expect(result.current.effectsEnabled).toBe(true);
    });

    it("toggles multiple times correctly", () => {
      const { result } = renderHook(() => useEffectsPreference(true));

      act(() => {
        result.current.toggleEffects();
        result.current.toggleEffects();
        result.current.toggleEffects();
      });

      expect(result.current.effectsEnabled).toBe(false);
    });
  });

  describe("setEffectsEnabled", () => {
    it("sets effects to enabled", () => {
      const { result } = renderHook(() => useEffectsPreference(false));

      act(() => {
        result.current.setEffectsEnabled(true);
      });

      expect(result.current.effectsEnabled).toBe(true);
    });

    it("sets effects to disabled", () => {
      const { result } = renderHook(() => useEffectsPreference(true));

      act(() => {
        result.current.setEffectsEnabled(false);
      });

      expect(result.current.effectsEnabled).toBe(false);
    });

    it("updates localStorage when setting", () => {
      const { result } = renderHook(() => useEffectsPreference());

      act(() => {
        result.current.setEffectsEnabled(false);
      });

      expect(localStorage.setItem).toHaveBeenCalledWith("raincheck:effects-enabled", "false");
    });
  });

  describe("persistence across remounts", () => {
    it("restores preference after remount", () => {
      const { result, unmount } = renderHook(() => useEffectsPreference());

      // Disable effects
      act(() => {
        result.current.setEffectsEnabled(false);
      });

      expect(result.current.effectsEnabled).toBe(false);

      // Unmount
      unmount();

      // Remount - should read from localStorage
      const { result: newResult } = renderHook(() => useEffectsPreference());

      expect(newResult.current.effectsEnabled).toBe(false);
    });
  });
});
