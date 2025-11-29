/**
 * ProtectedAction component tests
 */

import { render, screen } from "@testing-library/react";
import { ProtectedAction } from "../ProtectedAction";
import { LoginPrompt } from "../LoginPrompt";

// Mock the useIsAuthenticated hook
jest.mock("@/hooks", () => ({
  useIsAuthenticated: jest.fn(),
}));

// Import the mock to control it in tests
import { useIsAuthenticated } from "@/hooks";

const mockUseIsAuthenticated = useIsAuthenticated as jest.MockedFunction<typeof useIsAuthenticated>;

describe("ProtectedAction", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("when authenticated", () => {
    beforeEach(() => {
      mockUseIsAuthenticated.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
      });
    });

    it("renders children when user is authenticated", () => {
      render(
        <ProtectedAction>
          <button>Accept</button>
        </ProtectedAction>
      );

      expect(screen.getByRole("button")).toBeInTheDocument();
      expect(screen.getByText("Accept")).toBeInTheDocument();
    });

    it("does not render fallback when authenticated", () => {
      render(
        <ProtectedAction fallback={<span>Login required</span>}>
          <button>Accept</button>
        </ProtectedAction>
      );

      expect(screen.getByRole("button")).toBeInTheDocument();
      expect(screen.queryByText("Login required")).not.toBeInTheDocument();
    });
  });

  describe("when not authenticated", () => {
    beforeEach(() => {
      mockUseIsAuthenticated.mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
      });
    });

    it("renders default LoginPrompt when not authenticated", () => {
      render(
        <ProtectedAction>
          <button>Accept</button>
        </ProtectedAction>
      );

      expect(screen.queryByRole("button")).not.toBeInTheDocument();
      expect(screen.getByRole("link")).toBeInTheDocument();
      expect(screen.getByText("Log in to schedule runs")).toBeInTheDocument();
    });

    it("renders custom fallback when provided", () => {
      render(
        <ProtectedAction fallback={<span>Custom login message</span>}>
          <button>Accept</button>
        </ProtectedAction>
      );

      expect(screen.queryByRole("button")).not.toBeInTheDocument();
      expect(screen.getByText("Custom login message")).toBeInTheDocument();
    });

    it("renders custom LoginPrompt with message", () => {
      render(
        <ProtectedAction fallback={<LoginPrompt message="Log in to accept suggestions" />}>
          <button>Accept</button>
        </ProtectedAction>
      );

      expect(screen.getByText("Log in to accept suggestions")).toBeInTheDocument();
    });

    it("renders nothing when hideWhenUnauthenticated is true", () => {
      const { container } = render(
        <ProtectedAction hideWhenUnauthenticated>
          <button>Accept</button>
        </ProtectedAction>
      );

      expect(screen.queryByRole("button")).not.toBeInTheDocument();
      expect(screen.queryByRole("link")).not.toBeInTheDocument();
      expect(container.firstChild).toBeNull();
    });
  });

  describe("when loading", () => {
    beforeEach(() => {
      mockUseIsAuthenticated.mockReturnValue({
        isAuthenticated: false,
        isLoading: true,
      });
    });

    it("renders nothing by default when loading", () => {
      const { container } = render(
        <ProtectedAction>
          <button>Accept</button>
        </ProtectedAction>
      );

      expect(screen.queryByRole("button")).not.toBeInTheDocument();
      expect(screen.queryByRole("link")).not.toBeInTheDocument();
      expect(container.firstChild).toBeNull();
    });

    it("renders loadingFallback when provided and loading", () => {
      render(
        <ProtectedAction loadingFallback={<span>Loading...</span>}>
          <button>Accept</button>
        </ProtectedAction>
      );

      expect(screen.queryByRole("button")).not.toBeInTheDocument();
      expect(screen.getByText("Loading...")).toBeInTheDocument();
    });
  });

  describe("transition styles", () => {
    it("applies transition classes to authenticated content", () => {
      mockUseIsAuthenticated.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
      });

      const { container } = render(
        <ProtectedAction>
          <button>Accept</button>
        </ProtectedAction>
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass("transition-opacity");
    });

    it("applies transition classes to fallback content", () => {
      mockUseIsAuthenticated.mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
      });

      const { container } = render(
        <ProtectedAction>
          <button>Accept</button>
        </ProtectedAction>
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass("transition-opacity");
    });
  });
});
