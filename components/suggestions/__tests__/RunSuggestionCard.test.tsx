import { render, screen, fireEvent } from "@testing-library/react";
import { RunSuggestionCard, RunSuggestionCardSkeleton } from "../RunSuggestionCard";
import type { RunSuggestionCardProps } from "../RunSuggestionCard";

// Sample suggestion data
const createMockSuggestion = (
  overrides?: Partial<RunSuggestionCardProps["suggestion"]>
): RunSuggestionCardProps["suggestion"] => ({
  date: new Date("2024-11-25T00:00:00Z"),
  timezone: "Europe/Dublin",
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
      const card = screen.getByTestId("run-suggestion-card");
      // Score text uses text-green-400, card bg uses bg-green-500/30
      expect(badge).toHaveClass("text-green-400");
      expect(card).toHaveClass("bg-green-500/30");
    });

    it("shows yellow color for scores 60-79 (good)", () => {
      const props = {
        suggestion: createMockSuggestion({ weatherScore: 65 }),
      };
      render(<RunSuggestionCard {...props} />);

      const badge = screen.getByTestId("score-badge");
      const card = screen.getByTestId("run-suggestion-card");
      // Score text uses text-yellow-400, card bg uses bg-yellow-500/30
      expect(badge).toHaveClass("text-yellow-400");
      expect(card).toHaveClass("bg-yellow-500/30");
    });

    it("shows orange color for scores 40-59 (fair)", () => {
      const props = {
        suggestion: createMockSuggestion({ weatherScore: 50 }),
      };
      render(<RunSuggestionCard {...props} />);

      const badge = screen.getByTestId("score-badge");
      const card = screen.getByTestId("run-suggestion-card");
      // Score text uses text-orange-400, card bg uses bg-orange-500/30
      expect(badge).toHaveClass("text-orange-400");
      expect(card).toHaveClass("bg-orange-500/30");
    });

    it("shows red color for scores < 40 (poor)", () => {
      const props = {
        suggestion: createMockSuggestion({ weatherScore: 30 }),
      };
      render(<RunSuggestionCard {...props} />);

      const badge = screen.getByTestId("score-badge");
      const card = screen.getByTestId("run-suggestion-card");
      // Score text uses text-red-400, card bg uses bg-red-500/30
      expect(badge).toHaveClass("text-red-400");
      expect(card).toHaveClass("bg-red-500/30");
    });
  });

  describe("info icon for reasoning", () => {
    it("displays info icon for showing reasoning tooltip", () => {
      render(<RunSuggestionCard {...defaultProps} />);

      expect(screen.getByTestId("info-icon")).toBeInTheDocument();
    });

    it("shows tooltip with reasoning on hover", () => {
      render(<RunSuggestionCard {...defaultProps} />);

      const infoIcon = screen.getByTestId("info-icon");

      // Hover over the icon using fireEvent
      fireEvent.mouseEnter(infoIcon);

      // Tooltip should appear with the reason text (rendered via portal to document.body)
      expect(screen.getByTestId("reason-tooltip")).toBeInTheDocument();
      expect(screen.getByTestId("reason-tooltip")).toHaveTextContent(
        defaultProps.suggestion.reason
      );
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

  describe("card background styling", () => {
    it("card background color is based on weather score, not run type", () => {
      // Long run with high score should have green background
      const props = {
        suggestion: createMockSuggestion({ runType: "LONG_RUN", weatherScore: 85 }),
      };
      render(<RunSuggestionCard {...props} />);

      const card = screen.getByTestId("run-suggestion-card");
      // Background is determined by score (85 >= 80), not run type
      expect(card).toHaveClass("bg-green-500/30");
    });

    it("run type is stored in data attribute", () => {
      const props = {
        suggestion: createMockSuggestion({ runType: "LONG_RUN" }),
      };
      render(<RunSuggestionCard {...props} />);

      const card = screen.getByTestId("run-suggestion-card");
      expect(card).toHaveAttribute("data-run-type", "LONG_RUN");
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

    it("has darker green background when accepted", () => {
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
      // When accepted, button has bg-green-500/60
      expect(button).toHaveClass("bg-green-500/60");
    });

    it("has lighter green background when not accepted", () => {
      const onAccept = jest.fn();
      render(<RunSuggestionCard {...defaultProps} isAuthenticated={true} onAccept={onAccept} />);

      const button = screen.getByTestId("accept-button");
      // When not accepted, button has bg-green-500/30
      expect(button).toHaveClass("bg-green-500/30");
    });
  });

  describe("accepted state tracking", () => {
    it("sets data-accepted attribute to true when accepted", () => {
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

    it("sets data-accepted attribute to false when not accepted", () => {
      const onAccept = jest.fn();
      render(<RunSuggestionCard {...defaultProps} isAuthenticated={true} onAccept={onAccept} />);

      const card = screen.getByTestId("run-suggestion-card");
      expect(card).toHaveAttribute("data-accepted", "false");
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

    it("has score-based background color", () => {
      render(<RunSuggestionCard {...defaultProps} />);

      const card = screen.getByTestId("run-suggestion-card");
      // Background is score-based (75 is yellow range)
      expect(card).toHaveClass("bg-yellow-500/30");
    });

    it("has centered content", () => {
      render(<RunSuggestionCard {...defaultProps} />);

      const card = screen.getByTestId("run-suggestion-card");
      expect(card).toHaveClass("items-center");
    });

    it("has rounded corners", () => {
      render(<RunSuggestionCard {...defaultProps} />);

      const card = screen.getByTestId("run-suggestion-card");
      expect(card).toHaveClass("rounded-lg");
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

  it("has semi-transparent white background", () => {
    render(<RunSuggestionCardSkeleton />);

    const skeleton = screen.getByTestId("run-suggestion-skeleton");
    // Background uses bg-white/10
    expect(skeleton).toHaveClass("bg-white/10");
  });

  it("has rounded corners matching the card", () => {
    render(<RunSuggestionCardSkeleton />);

    const skeleton = screen.getByTestId("run-suggestion-skeleton");
    expect(skeleton).toHaveClass("rounded-lg");
  });
});
