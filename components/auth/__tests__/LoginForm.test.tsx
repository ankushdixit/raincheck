/**
 * LoginForm component tests
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginForm } from "../LoginForm";

// Mock next-auth/react
const mockSignIn = jest.fn();
jest.mock("next-auth/react", () => ({
  signIn: (...args: unknown[]) => mockSignIn(...args),
}));

// Mock next/navigation
const mockPush = jest.fn();
const mockRefresh = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}));

describe("LoginForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("rendering", () => {
    it("renders password field", () => {
      render(<LoginForm />);

      expect(screen.getByPlaceholderText(/enter password/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/enter password/i)).toBeInTheDocument();
    });

    it("renders submit button", () => {
      render(<LoginForm />);

      expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
    });

    it("renders back to home link", () => {
      render(<LoginForm />);

      const link = screen.getByRole("link", { name: /back to home/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute("href", "/");
    });

    it("password field has correct attributes", () => {
      render(<LoginForm />);

      const passwordInput = screen.getByPlaceholderText(/enter password/i);
      expect(passwordInput).toHaveAttribute("type", "password");
      expect(passwordInput).toHaveAttribute("autocomplete", "current-password");
      expect(passwordInput).toBeRequired();
    });
  });

  describe("form interaction", () => {
    it("accepts password input", async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      const passwordInput = screen.getByPlaceholderText(/enter password/i);
      await user.type(passwordInput, "testpassword");

      expect(passwordInput).toHaveValue("testpassword");
    });

    it("submits form with password", async () => {
      const user = userEvent.setup();
      mockSignIn.mockResolvedValue({ error: null });
      render(<LoginForm />);

      const passwordInput = screen.getByPlaceholderText(/enter password/i);
      const submitButton = screen.getByRole("button", { name: /sign in/i });

      await user.type(passwordInput, "correctpassword");
      await user.click(submitButton);

      expect(mockSignIn).toHaveBeenCalledWith("credentials", {
        password: "correctpassword",
        redirect: false,
      });
    });

    it("submits form on enter key", async () => {
      const user = userEvent.setup();
      mockSignIn.mockResolvedValue({ error: null });
      render(<LoginForm />);

      const passwordInput = screen.getByPlaceholderText(/enter password/i);
      await user.type(passwordInput, "testpassword{enter}");

      expect(mockSignIn).toHaveBeenCalled();
    });
  });

  describe("loading state", () => {
    it("shows loading text during submission", async () => {
      const user = userEvent.setup();
      // Keep the promise pending
      mockSignIn.mockImplementation(() => new Promise(() => {}));
      render(<LoginForm />);

      const passwordInput = screen.getByPlaceholderText(/enter password/i);
      const submitButton = screen.getByRole("button", { name: /sign in/i });

      await user.type(passwordInput, "testpassword");
      await user.click(submitButton);

      expect(screen.getByRole("button", { name: /signing in/i })).toBeInTheDocument();
    });

    it("disables form during submission", async () => {
      const user = userEvent.setup();
      mockSignIn.mockImplementation(() => new Promise(() => {}));
      render(<LoginForm />);

      const passwordInput = screen.getByPlaceholderText(/enter password/i);
      const submitButton = screen.getByRole("button", { name: /sign in/i });

      await user.type(passwordInput, "testpassword");
      await user.click(submitButton);

      expect(passwordInput).toBeDisabled();
      expect(submitButton).toBeDisabled();
    });
  });

  describe("error handling", () => {
    it("displays error message on invalid credentials", async () => {
      const user = userEvent.setup();
      mockSignIn.mockResolvedValue({ error: "CredentialsSignin" });
      render(<LoginForm />);

      const passwordInput = screen.getByPlaceholderText(/enter password/i);
      const submitButton = screen.getByRole("button", { name: /sign in/i });

      await user.type(passwordInput, "wrongpassword");
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole("alert")).toHaveTextContent("Invalid credentials");
      });
    });

    it("re-enables form after error", async () => {
      const user = userEvent.setup();
      mockSignIn.mockResolvedValue({ error: "CredentialsSignin" });
      render(<LoginForm />);

      const passwordInput = screen.getByPlaceholderText(/enter password/i);
      const submitButton = screen.getByRole("button", { name: /sign in/i });

      await user.type(passwordInput, "wrongpassword");
      await user.click(submitButton);

      await waitFor(() => {
        expect(passwordInput).not.toBeDisabled();
        expect(submitButton).not.toBeDisabled();
      });
    });

    it("displays generic error on exception", async () => {
      const user = userEvent.setup();
      mockSignIn.mockRejectedValue(new Error("Network error"));
      render(<LoginForm />);

      const passwordInput = screen.getByPlaceholderText(/enter password/i);
      const submitButton = screen.getByRole("button", { name: /sign in/i });

      await user.type(passwordInput, "testpassword");
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole("alert")).toHaveTextContent("An error occurred. Please try again.");
      });
    });

    it("clears error on new submission", async () => {
      const user = userEvent.setup();
      mockSignIn
        .mockResolvedValueOnce({ error: "CredentialsSignin" })
        .mockImplementation(() => new Promise(() => {}));
      render(<LoginForm />);

      const passwordInput = screen.getByPlaceholderText(/enter password/i);
      const submitButton = screen.getByRole("button", { name: /sign in/i });

      // First submission - error
      await user.type(passwordInput, "wrong");
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole("alert")).toBeInTheDocument();
      });

      // Second submission - error should be cleared
      await user.clear(passwordInput);
      await user.type(passwordInput, "correct");
      // Submit the form directly via the form element
      const form = passwordInput.closest("form")!;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      });
    });
  });

  describe("successful login", () => {
    it("redirects to homepage after successful login", async () => {
      const user = userEvent.setup();
      mockSignIn.mockResolvedValue({ error: null });
      render(<LoginForm />);

      const passwordInput = screen.getByPlaceholderText(/enter password/i);
      const submitButton = screen.getByRole("button", { name: /sign in/i });

      await user.type(passwordInput, "correctpassword");
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/");
        expect(mockRefresh).toHaveBeenCalled();
      });
    });

    it("redirects to custom callback URL after successful login", async () => {
      const user = userEvent.setup();
      mockSignIn.mockResolvedValue({ error: null });
      render(<LoginForm callbackUrl="/dashboard" />);

      const passwordInput = screen.getByPlaceholderText(/enter password/i);
      const submitButton = screen.getByRole("button", { name: /sign in/i });

      await user.type(passwordInput, "correctpassword");
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/dashboard");
      });
    });
  });
});
