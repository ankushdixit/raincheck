/**
 * LoginPrompt component tests
 */

import { render, screen } from "@testing-library/react";
import { LoginPrompt } from "../LoginPrompt";

describe("LoginPrompt", () => {
  it("renders with default message", () => {
    render(<LoginPrompt />);

    const link = screen.getByRole("link");
    expect(link).toHaveTextContent("Log in to schedule runs");
    expect(link).toHaveAttribute("href", "/login");
  });

  it("renders with custom message", () => {
    render(<LoginPrompt message="Log in to accept suggestions" />);

    const link = screen.getByRole("link");
    expect(link).toHaveTextContent("Log in to accept suggestions");
  });

  it("applies custom className", () => {
    render(<LoginPrompt className="custom-class" />);

    const link = screen.getByRole("link");
    expect(link).toHaveClass("custom-class");
  });

  it("has correct link styling", () => {
    render(<LoginPrompt />);

    const link = screen.getByRole("link");
    expect(link).toHaveClass("text-sm");
    expect(link).toHaveClass("text-blue-600");
  });

  it("links to /login", () => {
    render(<LoginPrompt />);

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/login");
  });
});
