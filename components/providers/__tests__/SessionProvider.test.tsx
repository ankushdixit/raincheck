/**
 * SessionProvider component tests
 */

import { render, screen } from "@testing-library/react";
import { SessionProvider } from "../SessionProvider";

// Mock next-auth/react
jest.mock("next-auth/react", () => ({
  SessionProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mock-session-provider">{children}</div>
  ),
}));

describe("SessionProvider", () => {
  it("renders children within NextAuth SessionProvider", () => {
    render(
      <SessionProvider>
        <div data-testid="child-content">Test Content</div>
      </SessionProvider>
    );

    expect(screen.getByTestId("mock-session-provider")).toBeInTheDocument();
    expect(screen.getByTestId("child-content")).toBeInTheDocument();
    expect(screen.getByText("Test Content")).toBeInTheDocument();
  });

  it("wraps multiple children", () => {
    render(
      <SessionProvider>
        <div data-testid="child-1">Child 1</div>
        <div data-testid="child-2">Child 2</div>
      </SessionProvider>
    );

    expect(screen.getByTestId("child-1")).toBeInTheDocument();
    expect(screen.getByTestId("child-2")).toBeInTheDocument();
  });
});
