import { render, screen } from "@testing-library/react";
import { PhaseBadge, formatPhaseName, getPhaseColor } from "../PhaseBadge";

// Mock the tRPC api
const mockGetCurrentPhaseQuery = jest.fn();

jest.mock("@/lib/api", () => ({
  api: {
    planning: {
      getCurrentPhase: {
        useQuery: () => mockGetCurrentPhaseQuery(),
      },
    },
  },
}));

describe("formatPhaseName", () => {
  it("formats BASE_BUILDING correctly", () => {
    expect(formatPhaseName("BASE_BUILDING")).toBe("Base Building");
  });

  it("formats BASE_EXTENSION correctly", () => {
    expect(formatPhaseName("BASE_EXTENSION")).toBe("Base Extension");
  });

  it("formats SPEED_DEVELOPMENT correctly", () => {
    expect(formatPhaseName("SPEED_DEVELOPMENT")).toBe("Speed Development");
  });

  it("formats PEAK_TAPER correctly", () => {
    expect(formatPhaseName("PEAK_TAPER")).toBe("Peak Taper");
  });
});

describe("getPhaseColor", () => {
  it("returns correct color for BASE_BUILDING", () => {
    expect(getPhaseColor("BASE_BUILDING")).toBe("#3b82f6");
  });

  it("returns correct color for BASE_EXTENSION", () => {
    expect(getPhaseColor("BASE_EXTENSION")).toBe("#22c55e");
  });

  it("returns correct color for SPEED_DEVELOPMENT", () => {
    expect(getPhaseColor("SPEED_DEVELOPMENT")).toBe("#f97316");
  });

  it("returns correct color for PEAK_TAPER", () => {
    expect(getPhaseColor("PEAK_TAPER")).toBe("#f59e0b");
  });
});

describe("PhaseBadge", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("loading state", () => {
    it("displays loading skeleton while fetching", () => {
      mockGetCurrentPhaseQuery.mockReturnValue({
        data: undefined,
        isLoading: true,
      });

      render(<PhaseBadge />);

      expect(screen.getByTestId("phase-badge-skeleton")).toBeInTheDocument();
    });

    it("skeleton has animate-pulse class", () => {
      mockGetCurrentPhaseQuery.mockReturnValue({
        data: undefined,
        isLoading: true,
      });

      render(<PhaseBadge />);

      const skeleton = screen.getByTestId("phase-badge-skeleton");
      expect(skeleton).toHaveClass("animate-pulse");
    });
  });

  describe("no training plan", () => {
    it("renders nothing when no training plan exists", () => {
      mockGetCurrentPhaseQuery.mockReturnValue({
        data: null,
        isLoading: false,
      });

      const { container } = render(<PhaseBadge />);

      expect(container).toBeEmptyDOMElement();
    });
  });

  describe("with training plan", () => {
    it("displays BASE_BUILDING phase correctly", () => {
      mockGetCurrentPhaseQuery.mockReturnValue({
        data: { phase: "BASE_BUILDING", weekNumber: 3 },
        isLoading: false,
      });

      render(<PhaseBadge />);

      const badge = screen.getByTestId("phase-badge");
      expect(badge).toHaveTextContent("Base Building");
      expect(badge).toHaveStyle({ backgroundColor: "#3b82f6" });
      expect(badge).toHaveAttribute("data-phase", "BASE_BUILDING");
    });

    it("displays BASE_EXTENSION phase correctly", () => {
      mockGetCurrentPhaseQuery.mockReturnValue({
        data: { phase: "BASE_EXTENSION", weekNumber: 10 },
        isLoading: false,
      });

      render(<PhaseBadge />);

      const badge = screen.getByTestId("phase-badge");
      expect(badge).toHaveTextContent("Base Extension");
      expect(badge).toHaveStyle({ backgroundColor: "#22c55e" });
      expect(badge).toHaveAttribute("data-phase", "BASE_EXTENSION");
    });

    it("displays SPEED_DEVELOPMENT phase correctly", () => {
      mockGetCurrentPhaseQuery.mockReturnValue({
        data: { phase: "SPEED_DEVELOPMENT", weekNumber: 18 },
        isLoading: false,
      });

      render(<PhaseBadge />);

      const badge = screen.getByTestId("phase-badge");
      expect(badge).toHaveTextContent("Speed Development");
      expect(badge).toHaveStyle({ backgroundColor: "#f97316" });
      expect(badge).toHaveAttribute("data-phase", "SPEED_DEVELOPMENT");
    });

    it("displays PEAK_TAPER phase correctly", () => {
      mockGetCurrentPhaseQuery.mockReturnValue({
        data: { phase: "PEAK_TAPER", weekNumber: 24 },
        isLoading: false,
      });

      render(<PhaseBadge />);

      const badge = screen.getByTestId("phase-badge");
      expect(badge).toHaveTextContent("Peak Taper");
      expect(badge).toHaveStyle({ backgroundColor: "#f59e0b" });
      expect(badge).toHaveAttribute("data-phase", "PEAK_TAPER");
    });

    it("badge has correct styling classes", () => {
      mockGetCurrentPhaseQuery.mockReturnValue({
        data: { phase: "BASE_BUILDING", weekNumber: 1 },
        isLoading: false,
      });

      render(<PhaseBadge />);

      const badge = screen.getByTestId("phase-badge");
      expect(badge).toHaveClass("rounded-full");
      expect(badge).toHaveClass("text-white");
      expect(badge).toHaveClass("text-xs");
      expect(badge).toHaveClass("font-medium");
    });
  });
});
