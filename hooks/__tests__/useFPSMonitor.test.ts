import { renderHook, act } from "@testing-library/react";
import { useFPSMonitor } from "../useFPSMonitor";

describe("useFPSMonitor", () => {
  let rafCallbacks: ((_timestamp: number) => void)[];
  let currentTime: number;
  let rafId: number;

  beforeEach(() => {
    rafCallbacks = [];
    currentTime = 0;
    rafId = 0;

    // Mock requestAnimationFrame
    jest.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
      rafCallbacks.push(callback);
      return ++rafId;
    });

    // Mock cancelAnimationFrame
    jest.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {
      rafCallbacks = [];
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // Helper to simulate frames
  const simulateFrames = (count: number, frameTime: number = 16.67) => {
    for (let i = 0; i < count; i++) {
      currentTime += frameTime;
      const callbacks = [...rafCallbacks];
      rafCallbacks = [];
      callbacks.forEach((callback) => callback(currentTime));
    }
  };

  describe("initial state", () => {
    it("starts with fps of 60", () => {
      const { result } = renderHook(() => useFPSMonitor());

      expect(result.current.fps).toBe(60);
    });

    it("starts with isLowFPS false", () => {
      const { result } = renderHook(() => useFPSMonitor());

      expect(result.current.isLowFPS).toBe(false);
    });

    it("auto-starts monitoring when enabled (default)", () => {
      const { result } = renderHook(() => useFPSMonitor());

      expect(result.current.isMonitoring).toBe(true);
    });

    it("does not start monitoring when enabled is false", () => {
      const { result } = renderHook(() => useFPSMonitor(undefined, { enabled: false }));

      expect(result.current.isMonitoring).toBe(false);
    });
  });

  describe("FPS calculation", () => {
    it("calculates approximately 60 FPS at 16.67ms frame time", () => {
      const { result } = renderHook(() => useFPSMonitor());

      // Simulate enough frames to get a stable FPS reading
      act(() => {
        simulateFrames(30, 16.67); // 60 FPS frame time
      });

      // FPS should be around 60 (within tolerance)
      expect(result.current.fps).toBeGreaterThanOrEqual(58);
      expect(result.current.fps).toBeLessThanOrEqual(62);
    });

    it("calculates approximately 30 FPS at 33.33ms frame time", () => {
      const { result } = renderHook(() => useFPSMonitor());

      // Simulate frames at 30 FPS rate
      act(() => {
        simulateFrames(30, 33.33);
      });

      // FPS should be around 30 (within tolerance)
      expect(result.current.fps).toBeGreaterThanOrEqual(28);
      expect(result.current.fps).toBeLessThanOrEqual(32);
    });
  });

  describe("low FPS detection", () => {
    it("triggers onLowFPS callback when FPS below threshold for sustained duration", () => {
      const onLowFPS = jest.fn();
      const { result } = renderHook(() =>
        useFPSMonitor(onLowFPS, { threshold: 20, sustainedDuration: 1 })
      );

      // Simulate very low FPS (10 FPS = 100ms per frame) for more than 1 second
      act(() => {
        simulateFrames(20, 100); // 10 FPS for 2 seconds
      });

      expect(onLowFPS).toHaveBeenCalled();
      expect(result.current.isLowFPS).toBe(true);
    });

    it("does not trigger callback if FPS recovers before sustained duration", () => {
      const onLowFPS = jest.fn();
      renderHook(() => useFPSMonitor(onLowFPS, { threshold: 20, sustainedDuration: 3 }));

      // Simulate low FPS briefly then recover
      act(() => {
        simulateFrames(10, 100); // 10 FPS for 1 second
        simulateFrames(30, 16.67); // 60 FPS recovery
      });

      expect(onLowFPS).not.toHaveBeenCalled();
    });

    it("uses default threshold of 20 FPS", () => {
      const onLowFPS = jest.fn();
      renderHook(() => useFPSMonitor(onLowFPS, { sustainedDuration: 1 }));

      // 25 FPS should not trigger (above 20)
      act(() => {
        simulateFrames(30, 40); // 25 FPS
      });

      expect(onLowFPS).not.toHaveBeenCalled();
    });

    it("uses default sustained duration of 3 seconds", () => {
      const onLowFPS = jest.fn();
      renderHook(() => useFPSMonitor(onLowFPS, { threshold: 20 }));

      // Low FPS for 2 seconds should not trigger
      act(() => {
        simulateFrames(20, 100); // 10 FPS for 2 seconds
      });

      expect(onLowFPS).not.toHaveBeenCalled();
    });
  });

  describe("start and stop", () => {
    it("can manually start monitoring", () => {
      const { result } = renderHook(() => useFPSMonitor(undefined, { enabled: false }));

      expect(result.current.isMonitoring).toBe(false);

      act(() => {
        result.current.start();
      });

      expect(result.current.isMonitoring).toBe(true);
    });

    it("can manually stop monitoring", () => {
      const { result } = renderHook(() => useFPSMonitor());

      expect(result.current.isMonitoring).toBe(true);

      act(() => {
        result.current.stop();
      });

      expect(result.current.isMonitoring).toBe(false);
    });

    it("cancels animation frame when stopping", () => {
      const { result } = renderHook(() => useFPSMonitor());

      act(() => {
        result.current.stop();
      });

      expect(window.cancelAnimationFrame).toHaveBeenCalled();
    });

    it("resets state when starting", () => {
      const onLowFPS = jest.fn();
      const { result } = renderHook(() =>
        useFPSMonitor(onLowFPS, { threshold: 20, sustainedDuration: 1 })
      );

      // Trigger low FPS
      act(() => {
        simulateFrames(20, 100);
      });

      expect(result.current.isLowFPS).toBe(true);

      // Stop and restart
      act(() => {
        result.current.stop();
        result.current.start();
      });

      expect(result.current.isLowFPS).toBe(false);
      expect(result.current.fps).toBe(60);
    });
  });

  describe("cleanup", () => {
    it("cancels animation frame on unmount", () => {
      const { unmount } = renderHook(() => useFPSMonitor());

      unmount();

      expect(window.cancelAnimationFrame).toHaveBeenCalled();
    });

    it("stops monitoring on enabled change to false", () => {
      const { result, rerender } = renderHook(
        ({ enabled }) => useFPSMonitor(undefined, { enabled }),
        { initialProps: { enabled: true } }
      );

      expect(result.current.isMonitoring).toBe(true);

      rerender({ enabled: false });

      expect(result.current.isMonitoring).toBe(false);
    });
  });

  describe("callback handling", () => {
    it("only triggers callback once per low FPS period", () => {
      const onLowFPS = jest.fn();
      renderHook(() => useFPSMonitor(onLowFPS, { threshold: 20, sustainedDuration: 1 }));

      // Simulate sustained low FPS
      act(() => {
        simulateFrames(50, 100); // 10 FPS for 5 seconds
      });

      // Should only be called once
      expect(onLowFPS).toHaveBeenCalledTimes(1);
    });
  });
});
