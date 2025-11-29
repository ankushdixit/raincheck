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

describe("LoginPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("when session is loading", () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({ status: "loading" });
    });

    it("renders loading state", () => {
      render(<LoginPage />);

      // Should render minimal loading state
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

      expect(
        screen.getByRole("heading", { name: /ankush's training tracker/i })
      ).toBeInTheDocument();
    });

    it("renders the subtitle", () => {
      render(<LoginPage />);

      expect(screen.getByText(/sign in to manage your runs/i)).toBeInTheDocument();
    });

    it("renders the login form", () => {
      render(<LoginPage />);

      expect(screen.getByPlaceholderText(/enter password/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
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
