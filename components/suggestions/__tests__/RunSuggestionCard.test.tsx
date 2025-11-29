import { render, screen, fireEvent } from "@testing-library/react";
import { RunSuggestionCard, RunSuggestionCardSkeleton } from "../RunSuggestionCard";
import type { RunSuggestionCardProps } from "../RunSuggestionCard";

// Sample suggestion data
const createMockSuggestion = (
  overrides?: Partial<RunSuggestionCardProps["suggestion"]>
): RunSuggestionCardProps["suggestion"] => ({
  date: new Date("2024-11-25T00:00:00Z"),
  runType: "EASY_RUN",
  distance: 8,
  weatherScore: 75,
  isOptimal: false,
  reason: "Monday has good conditions (75/100). Partly cloudy, 12°C.",
  weather: {
    condition: "Partly cloudy",
    temperature: 12,
    precipitation: 20,
    windSpeed: 15,
  },
  ...overrides,
});

const defaultProps: RunSuggestionCardProps = {
  suggestion: createMockSuggestion(),
};

describe("RunSuggestionCard", () => {
  describe("rendering", () => {
    it("renders the card", () => {
      render(<RunSuggestionCard {...defaultProps} />);

      expect(screen.getByTestId("run-suggestion-card")).toBeInTheDocument();
    });

    it("displays day name (Mon, Tue, etc.)", () => {
      render(<RunSuggestionCard {...defaultProps} />);

      expect(screen.getByText("Mon")).toBeInTheDocument();
    });

    it("displays short date format", () => {
      render(<RunSuggestionCard {...defaultProps} />);

      expect(screen.getByText("Nov 25")).toBeInTheDocument();
    });

    it("displays run type icon", () => {
      render(<RunSuggestionCard {...defaultProps} />);

      expect(screen.getByTestId("run-type-icon")).toBeInTheDocument();
    });

    it("displays run type label", () => {
      render(<RunSuggestionCard {...defaultProps} />);

      expect(screen.getByTestId("run-type-label")).toHaveTextContent("Easy");
    });

    it("displays distance in km", () => {
      render(<RunSuggestionCard {...defaultProps} />);

      expect(screen.getByTestId("distance")).toHaveTextContent("8 km");
    });

    it("displays weather score", () => {
      render(<RunSuggestionCard {...defaultProps} />);

      expect(screen.getByTestId("score-badge")).toHaveTextContent("75");
    });

    it("displays score scale (/100)", () => {
      render(<RunSuggestionCard {...defaultProps} />);

      expect(screen.getByText("/100")).toBeInTheDocument();
    });

    it("displays temperature", () => {
      render(<RunSuggestionCard {...defaultProps} />);

      const summary = screen.getByTestId("weather-summary");
      expect(summary).toHaveTextContent("12°C");
    });

    it("displays precipitation percentage", () => {
      render(<RunSuggestionCard {...defaultProps} />);

      const summary = screen.getByTestId("weather-summary");
      expect(summary).toHaveTextContent("20%");
    });

    it("displays precipitation emoji", () => {
      render(<RunSuggestionCard {...defaultProps} />);

      expect(screen.getByRole("img", { name: "Precipitation" })).toBeInTheDocument();
    });
  });

  describe("score colors", () => {
    it("shows green color for scores >= 80 (excellent)", () => {
      const props = {
        suggestion: createMockSuggestion({ weatherScore: 85, isOptimal: true }),
      };
      render(<RunSuggestionCard {...props} />);

      const badge = screen.getByTestId("score-badge");
      expect(badge).toHaveStyle({ color: "rgba(74, 222, 128, 1)" });
    });

    it("shows yellow color for scores 60-79 (good)", () => {
      const props = {
        suggestion: createMockSuggestion({ weatherScore: 65 }),
      };
      render(<RunSuggestionCard {...props} />);

      const badge = screen.getByTestId("score-badge");
      expect(badge).toHaveStyle({ color: "rgba(250, 204, 21, 1)" });
    });

    it("shows orange color for scores 40-59 (fair)", () => {
      const props = {
        suggestion: createMockSuggestion({ weatherScore: 50 }),
      };
      render(<RunSuggestionCard {...props} />);

      const badge = screen.getByTestId("score-badge");
      expect(badge).toHaveStyle({ color: "rgba(251, 146, 60, 1)" });
    });

    it("shows red color for scores < 40 (poor)", () => {
      const props = {
        suggestion: createMockSuggestion({ weatherScore: 30 }),
      };
      render(<RunSuggestionCard {...props} />);

      const badge = screen.getByTestId("score-badge");
      expect(badge).toHaveStyle({ color: "rgba(248, 113, 113, 1)" });
    });
  });

  describe("optimal badge", () => {
    it("shows OPTIMAL badge when isOptimal is true", () => {
      const props = {
        suggestion: createMockSuggestion({ weatherScore: 85, isOptimal: true }),
      };
      render(<RunSuggestionCard {...props} />);

      expect(screen.getByTestId("optimal-badge")).toBeInTheDocument();
      expect(screen.getByTestId("optimal-badge")).toHaveTextContent("OPTIMAL");
    });

    it("does not show OPTIMAL badge when isOptimal is false", () => {
      const props = {
        suggestion: createMockSuggestion({ weatherScore: 75, isOptimal: false }),
      };
      render(<RunSuggestionCard {...props} />);

      expect(screen.queryByTestId("optimal-badge")).not.toBeInTheDocument();
    });
  });

  describe("run types", () => {
    it("displays Long Run with correct icon", () => {
      const props = {
        suggestion: createMockSuggestion({ runType: "LONG_RUN" }),
      };
      render(<RunSuggestionCard {...props} />);

      const card = screen.getByTestId("run-suggestion-card");
      expect(card).toHaveAttribute("data-run-type", "LONG_RUN");
      expect(screen.getByTestId("run-type-label")).toHaveTextContent("Long");
      expect(screen.getByRole("img", { name: "Long" })).toHaveTextContent("🏃");
    });

    it("displays Easy Run with correct icon", () => {
      const props = {
        suggestion: createMockSuggestion({ runType: "EASY_RUN" }),
      };
      render(<RunSuggestionCard {...props} />);

      expect(screen.getByTestId("run-type-label")).toHaveTextContent("Easy");
      expect(screen.getByRole("img", { name: "Easy" })).toHaveTextContent("🚶");
    });

    it("displays Tempo Run with correct icon", () => {
      const props = {
        suggestion: createMockSuggestion({ runType: "TEMPO_RUN" }),
      };
      render(<RunSuggestionCard {...props} />);

      expect(screen.getByTestId("run-type-label")).toHaveTextContent("Tempo");
      expect(screen.getByRole("img", { name: "Tempo" })).toHaveTextContent("⚡");
    });

    it("displays Intervals with correct icon", () => {
      const props = {
        suggestion: createMockSuggestion({ runType: "INTERVAL_RUN" }),
      };
      render(<RunSuggestionCard {...props} />);

      expect(screen.getByTestId("run-type-label")).toHaveTextContent("Intervals");
      expect(screen.getByRole("img", { name: "Intervals" })).toHaveTextContent("⚡");
    });

    it("displays Recovery with correct icon", () => {
      const props = {
        suggestion: createMockSuggestion({ runType: "RECOVERY_RUN" }),
      };
      render(<RunSuggestionCard {...props} />);

      expect(screen.getByTestId("run-type-label")).toHaveTextContent("Recovery");
      expect(screen.getByRole("img", { name: "Recovery" })).toHaveTextContent("💚");
    });
  });

  describe("long run styling", () => {
    it("has amber border for long runs", () => {
      const props = {
        suggestion: createMockSuggestion({ runType: "LONG_RUN" }),
      };
      render(<RunSuggestionCard {...props} />);

      const card = screen.getByTestId("run-suggestion-card");
      expect(card).toHaveStyle({ border: "2px solid rgba(251, 191, 36, 0.5)" });
    });

    it("has transparent border for non-long runs", () => {
      const props = {
        suggestion: createMockSuggestion({ runType: "EASY_RUN" }),
      };
      render(<RunSuggestionCard {...props} />);

      const card = screen.getByTestId("run-suggestion-card");
      expect(card).toHaveStyle({ border: "2px solid transparent" });
    });
  });

  describe("accept button", () => {
    it("shows accept button when authenticated with onAccept callback", () => {
      const onAccept = jest.fn();
      render(<RunSuggestionCard {...defaultProps} isAuthenticated={true} onAccept={onAccept} />);

      expect(screen.getByTestId("accept-button")).toBeInTheDocument();
      expect(screen.getByTestId("accept-button")).toHaveTextContent("Accept & Schedule");
    });

    it("hides accept button when not authenticated", () => {
      render(<RunSuggestionCard {...defaultProps} isAuthenticated={false} />);

      expect(screen.queryByTestId("accept-button")).not.toBeInTheDocument();
    });

    it("hides accept button when no onAccept callback", () => {
      render(<RunSuggestionCard {...defaultProps} isAuthenticated={true} />);

      expect(screen.queryByTestId("accept-button")).not.toBeInTheDocument();
    });

    it("calls onAccept when accept button is clicked", () => {
      const onAccept = jest.fn();
      render(<RunSuggestionCard {...defaultProps} isAuthenticated={true} onAccept={onAccept} />);

      fireEvent.click(screen.getByTestId("accept-button"));

      expect(onAccept).toHaveBeenCalledTimes(1);
    });

    it("shows loading spinner when acceptState is loading", () => {
      const onAccept = jest.fn();
      render(
        <RunSuggestionCard
          {...defaultProps}
          isAuthenticated={true}
          onAccept={onAccept}
          acceptState="loading"
        />
      );

      expect(screen.getByTestId("accept-spinner")).toBeInTheDocument();
      expect(screen.getByTestId("accept-button")).toHaveTextContent("Scheduling...");
    });

    it("shows 'Scheduled ✓' when acceptState is success", () => {
      const onAccept = jest.fn();
      render(
        <RunSuggestionCard
          {...defaultProps}
          isAuthenticated={true}
          onAccept={onAccept}
          acceptState="success"
        />
      );

      expect(screen.getByTestId("accept-button")).toHaveTextContent("Scheduled ✓");
      expect(screen.queryByTestId("accept-spinner")).not.toBeInTheDocument();
    });

    it("disables button when loading", () => {
      const onAccept = jest.fn();
      render(
        <RunSuggestionCard
          {...defaultProps}
          isAuthenticated={true}
          onAccept={onAccept}
          acceptState="loading"
        />
      );

      expect(screen.getByTestId("accept-button")).toBeDisabled();
    });

    it("disables button after success", () => {
      const onAccept = jest.fn();
      render(
        <RunSuggestionCard
          {...defaultProps}
          isAuthenticated={true}
          onAccept={onAccept}
          acceptState="success"
        />
      );

      expect(screen.getByTestId("accept-button")).toBeDisabled();
    });

    it("shows error message when acceptState is error", () => {
      const onAccept = jest.fn();
      render(
        <RunSuggestionCard
          {...defaultProps}
          isAuthenticated={true}
          onAccept={onAccept}
          acceptState="error"
          acceptError="Run already scheduled for this date"
        />
      );

      expect(screen.getByTestId("accept-error")).toBeInTheDocument();
      expect(screen.getByTestId("accept-error")).toHaveTextContent(
        "Run already scheduled for this date"
      );
    });

    it("does not show error when no error message", () => {
      const onAccept = jest.fn();
      render(
        <RunSuggestionCard
          {...defaultProps}
          isAuthenticated={true}
          onAccept={onAccept}
          acceptState="error"
        />
      );

      expect(screen.queryByTestId("accept-error")).not.toBeInTheDocument();
    });

    it("has green background when accepted", () => {
      const onAccept = jest.fn();
      render(
        <RunSuggestionCard
          {...defaultProps}
          isAuthenticated={true}
          onAccept={onAccept}
          acceptState="success"
        />
      );

      const button = screen.getByTestId("accept-button");
      expect(button).toHaveStyle({ backgroundColor: "rgba(34, 197, 94, 0.8)" });
    });
  });

  describe("card dimming when accepted", () => {
    it("dims card to 60% opacity when accepted", () => {
      const onAccept = jest.fn();
      render(
        <RunSuggestionCard
          {...defaultProps}
          isAuthenticated={true}
          onAccept={onAccept}
          acceptState="success"
        />
      );

      const card = screen.getByTestId("run-suggestion-card");
      expect(card).toHaveStyle({ opacity: 0.6 });
    });

    it("has full opacity when not accepted", () => {
      const onAccept = jest.fn();
      render(<RunSuggestionCard {...defaultProps} isAuthenticated={true} onAccept={onAccept} />);

      const card = screen.getByTestId("run-suggestion-card");
      expect(card).toHaveStyle({ opacity: 1 });
    });

    it("sets data-accepted attribute when accepted", () => {
      const onAccept = jest.fn();
      render(
        <RunSuggestionCard
          {...defaultProps}
          isAuthenticated={true}
          onAccept={onAccept}
          acceptState="success"
        />
      );

      const card = screen.getByTestId("run-suggestion-card");
      expect(card).toHaveAttribute("data-accepted", "true");
    });
  });

  describe("different days", () => {
    it("displays correct day name for Tuesday", () => {
      const props = {
        suggestion: createMockSuggestion({ date: new Date("2024-11-26T00:00:00Z") }),
      };
      render(<RunSuggestionCard {...props} />);

      expect(screen.getByText("Tue")).toBeInTheDocument();
    });

    it("displays correct day name for Sunday", () => {
      const props = {
        suggestion: createMockSuggestion({ date: new Date("2024-11-24T00:00:00Z") }),
      };
      render(<RunSuggestionCard {...props} />);

      expect(screen.getByText("Sun")).toBeInTheDocument();
    });
  });

  describe("temperature rounding", () => {
    it("rounds temperature down correctly", () => {
      const props = {
        suggestion: createMockSuggestion({
          weather: { ...defaultProps.suggestion.weather, temperature: 10.4 },
        }),
      };
      render(<RunSuggestionCard {...props} />);

      expect(screen.getByTestId("weather-summary")).toHaveTextContent("10°C");
    });

    it("rounds temperature up correctly", () => {
      const props = {
        suggestion: createMockSuggestion({
          weather: { ...defaultProps.suggestion.weather, temperature: 10.6 },
        }),
      };
      render(<RunSuggestionCard {...props} />);

      expect(screen.getByTestId("weather-summary")).toHaveTextContent("11°C");
    });
  });

  describe("styling", () => {
    it("has backdrop blur for glass effect", () => {
      render(<RunSuggestionCard {...defaultProps} />);

      const card = screen.getByTestId("run-suggestion-card");
      expect(card).toHaveClass("backdrop-blur-md");
    });

    it("has dark background", () => {
      render(<RunSuggestionCard {...defaultProps} />);

      const card = screen.getByTestId("run-suggestion-card");
      expect(card).toHaveStyle({ backgroundColor: "rgba(10,15,10,0.5)" });
    });

    it("has min-width for consistent sizing", () => {
      render(<RunSuggestionCard {...defaultProps} />);

      const card = screen.getByTestId("run-suggestion-card");
      expect(card).toHaveStyle({ minWidth: "130px" });
    });

    it("has centered content", () => {
      render(<RunSuggestionCard {...defaultProps} />);

      const card = screen.getByTestId("run-suggestion-card");
      expect(card).toHaveClass("items-center");
    });
  });
});

describe("RunSuggestionCardSkeleton", () => {
  it("renders skeleton element", () => {
    render(<RunSuggestionCardSkeleton />);

    expect(screen.getByTestId("run-suggestion-skeleton")).toBeInTheDocument();
  });

  it("has animation class", () => {
    render(<RunSuggestionCardSkeleton />);

    const skeleton = screen.getByTestId("run-suggestion-skeleton");
    expect(skeleton).toHaveClass("animate-pulse");
  });

  it("has matching background color", () => {
    render(<RunSuggestionCardSkeleton />);

    const skeleton = screen.getByTestId("run-suggestion-skeleton");
    expect(skeleton).toHaveStyle({ backgroundColor: "rgba(10,15,10,0.5)" });
  });

  it("has min-width matching the card", () => {
    render(<RunSuggestionCardSkeleton />);

    const skeleton = screen.getByTestId("run-suggestion-skeleton");
    expect(skeleton).toHaveStyle({ minWidth: "130px" });
  });
});
