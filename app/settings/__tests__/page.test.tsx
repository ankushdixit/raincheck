/**
 * Settings page tests
 */

import { render, screen } from "@testing-library/react";
import SettingsPage from "../page";

// Mock next/navigation
const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: jest.fn(),
  }),
}));

// Mock next/image
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: { alt: string; src: string }) => <img alt={props.alt} src={props.src} />,
}));

// Mock trail background utilities
jest.mock("@/components/trail", () => ({
  getTrailImage: jest.fn(() => "default-trail.webp"),
  getTintColor: jest.fn(() => "rgba(10, 15, 10, 0.6)"),
  getNightTint: jest.fn(() => "transparent"),
}));

// Mock WeatherEffectLayer
jest.mock("@/components/weather-effects", () => ({
  WeatherEffectLayer: () => <div data-testid="weather-effects" />,
}));

// Mock useIsAuthenticated hook
const mockUseIsAuthenticated = jest.fn();
jest.mock("@/hooks", () => ({
  useIsAuthenticated: () => mockUseIsAuthenticated(),
  useEffectsPreference: () => ({
    effectsEnabled: true,
    toggleEffects: jest.fn(),
    isLoaded: true,
  }),
}));

// Mock tRPC api
jest.mock("@/lib/api", () => ({
  api: {
    weather: {
      getCurrentWeather: {
        useQuery: jest.fn(() => ({
          data: { condition: "sunny", temperature: 15 },
          isLoading: false,
        })),
      },
    },
    settings: {
      get: {
        useQuery: jest.fn(() => ({
          data: {
            defaultLocation: "Dublin, IE",
            raceName: "Dublin Half Marathon",
            raceDate: new Date("2026-05-17"),
            targetTime: "2:00:00",
          },
          isLoading: false,
        })),
      },
      updateLocation: {
        useMutation: jest.fn(() => ({
          mutate: jest.fn(),
          isPending: false,
        })),
      },
      updateRace: {
        useMutation: jest.fn(() => ({
          mutate: jest.fn(),
          isPending: false,
        })),
      },
    },
    runs: {
      getAll: {
        useQuery: jest.fn(() => ({
          data: [
            {
              id: "1",
              date: new Date("2025-12-01"),
              distance: 10,
              pace: "5:30",
              duration: "55:00",
              type: "LONG_RUN",
              completed: false,
              notes: null,
            },
          ],
          isLoading: false,
        })),
      },
      delete: {
        useMutation: jest.fn(() => ({
          mutate: jest.fn(),
          isPending: false,
        })),
      },
      markComplete: {
        useMutation: jest.fn(() => ({
          mutate: jest.fn(),
          isPending: false,
        })),
      },
      update: {
        useMutation: jest.fn(() => ({
          mutate: jest.fn(),
          isPending: false,
        })),
      },
    },
    useUtils: jest.fn(() => ({
      settings: { get: { invalidate: jest.fn() } },
      weather: {
        getCurrentWeather: { invalidate: jest.fn() },
        getForecast: { invalidate: jest.fn() },
      },
      runs: {
        getAll: { invalidate: jest.fn() },
        getByDateRange: { invalidate: jest.fn() },
      },
    })),
  },
}));

describe("SettingsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("when user is not authenticated", () => {
    beforeEach(() => {
      mockUseIsAuthenticated.mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
      });
    });

    it("redirects to login page", () => {
      render(<SettingsPage />);
      expect(mockPush).toHaveBeenCalledWith("/login");
    });
  });

  describe("when auth is loading", () => {
    beforeEach(() => {
      mockUseIsAuthenticated.mockReturnValue({
        isAuthenticated: false,
        isLoading: true,
      });
    });

    it("shows loading spinner", () => {
      render(<SettingsPage />);
      // Should not redirect while loading
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe("when user is authenticated", () => {
    beforeEach(() => {
      mockUseIsAuthenticated.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
      });
    });

    it("renders the page title", () => {
      render(<SettingsPage />);
      expect(screen.getByRole("heading", { name: /settings/i })).toBeInTheDocument();
    });

    it("renders the back link", () => {
      render(<SettingsPage />);
      expect(screen.getByText(/back to dashboard/i)).toBeInTheDocument();
    });

    it("renders the Location section", () => {
      render(<SettingsPage />);
      expect(screen.getByText("Location")).toBeInTheDocument();
      expect(screen.getByText("Dublin, IE")).toBeInTheDocument();
    });

    it("renders the Race section", () => {
      render(<SettingsPage />);
      expect(screen.getByText("Race")).toBeInTheDocument();
      expect(screen.getByText("Dublin Half Marathon")).toBeInTheDocument();
    });

    it("renders the Runs section", () => {
      render(<SettingsPage />);
      expect(screen.getByText("Runs")).toBeInTheDocument();
      expect(screen.getByText(/Long Run/)).toBeInTheDocument();
    });

    it("does not redirect", () => {
      render(<SettingsPage />);
      expect(mockPush).not.toHaveBeenCalled();
    });
  });
});
