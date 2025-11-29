/**
 * Login page tests
 */

import { render, screen } from "@testing-library/react";
import LoginPage from "../page";

// Mock next/navigation
const mockRedirect = jest.fn();
jest.mock("next/navigation", () => ({
  redirect: (url: string) => {
    mockRedirect(url);
    throw new Error("NEXT_REDIRECT");
  },
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn(),
  }),
}));

// Mock lib/auth
const mockAuth = jest.fn();
jest.mock("@/lib/auth", () => ({
  auth: () => mockAuth(),
}));

// Mock next-auth/react for LoginForm
jest.mock("next-auth/react", () => ({
  signIn: jest.fn(),
}));

describe("LoginPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("when user is not authenticated", () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue(null);
    });

    it("renders the page title", async () => {
      const Page = await LoginPage();
      render(Page);

      expect(
        screen.getByRole("heading", { name: /ankush's training tracker/i })
      ).toBeInTheDocument();
    });

    it("renders the subtitle", async () => {
      const Page = await LoginPage();
      render(Page);

      expect(screen.getByText(/sign in to manage your runs/i)).toBeInTheDocument();
    });

    it("renders the login form", async () => {
      const Page = await LoginPage();
      render(Page);

      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
    });

    it("does not redirect", async () => {
      const Page = await LoginPage();
      render(Page);

      expect(mockRedirect).not.toHaveBeenCalled();
    });
  });

  describe("when user is authenticated", () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue({
        user: { id: "owner", name: "Ankush" },
      });
    });

    it("redirects to homepage", async () => {
      await expect(LoginPage()).rejects.toThrow("NEXT_REDIRECT");

      expect(mockRedirect).toHaveBeenCalledWith("/");
    });
  });
});
