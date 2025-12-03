/**
 * Login page tests
 */

import { render, screen } from "@testing-library/react";
import LoginPage from "../page";

// Mock next/navigation
const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: jest.fn(),
  }),
}));

// Mock next-auth/react
const mockUseSession = jest.fn();
jest.mock("next-auth/react", () => ({
  useSession: () => mockUseSession(),
  signIn: jest.fn(),
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

// Mock tRPC api
jest.mock("@/lib/api", () => ({
  api: {
    weather: {
      getCurrentWeather: {
        useQuery: jest.fn(() => ({
          data: { condition: "sunny", temperature: 15, precipitation: 0, windSpeed: 10 },
          isLoading: false,
          isError: false,
        })),
      },
    },
  },
}));

describe("LoginPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("when session is loading", () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({ status: "loading" });
    });

    it("renders loading state with spinner", () => {
      render(<LoginPage />);

      // Should render loading spinner, not the form
      expect(screen.queryByRole("heading")).not.toBeInTheDocument();
      expect(screen.queryByPlaceholderText(/enter password/i)).not.toBeInTheDocument();
    });
  });

  describe("when user is not authenticated", () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({ status: "unauthenticated" });
    });

    it("renders the page title", () => {
      render(<LoginPage />);

      expect(screen.getByRole("heading", { name: /welcome back/i })).toBeInTheDocument();
    });

    it("renders the subtitle", () => {
      render(<LoginPage />);

      expect(screen.getByText(/sign in to manage your training/i)).toBeInTheDocument();
    });

    it("renders the login form", () => {
      render(<LoginPage />);

      expect(screen.getByPlaceholderText(/enter password/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
    });

    it("renders the logo", () => {
      render(<LoginPage />);

      expect(screen.getByAltText(/raincheck/i)).toBeInTheDocument();
    });

    it("does not redirect", () => {
      render(<LoginPage />);

      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe("when user is authenticated", () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({ status: "authenticated" });
    });

    it("redirects to homepage", () => {
      render(<LoginPage />);

      expect(mockPush).toHaveBeenCalledWith("/");
    });

    it("does not render the login form", () => {
      render(<LoginPage />);

      expect(screen.queryByPlaceholderText(/enter password/i)).not.toBeInTheDocument();
    });
  });
});
