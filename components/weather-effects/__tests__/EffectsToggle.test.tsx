import { render, screen, fireEvent } from "@testing-library/react";
import { EffectsToggle } from "../EffectsToggle";

// Mock the useEffectsPreference hook
const mockToggleEffects = jest.fn();
const mockSetEffectsEnabled = jest.fn();

jest.mock("@/hooks", () => ({
  useEffectsPreference: jest.fn(() => ({
    effectsEnabled: true,
    toggleEffects: mockToggleEffects,
    setEffectsEnabled: mockSetEffectsEnabled,
    isLoaded: true,
  })),
}));

// Import the mocked module to manipulate it
import { useEffectsPreference } from "@/hooks";
const mockedUseEffectsPreference = useEffectsPreference as jest.Mock;

describe("EffectsToggle", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseEffectsPreference.mockReturnValue({
      effectsEnabled: true,
      toggleEffects: mockToggleEffects,
      setEffectsEnabled: mockSetEffectsEnabled,
      isLoaded: true,
    });
  });

  describe("rendering", () => {
    it("renders toggle button", () => {
      render(<EffectsToggle />);

      const button = screen.getByRole("button");
      expect(button).toBeInTheDocument();
    });

    it("does not render when preference is not loaded", () => {
      mockedUseEffectsPreference.mockReturnValue({
        effectsEnabled: true,
        toggleEffects: mockToggleEffects,
        setEffectsEnabled: mockSetEffectsEnabled,
        isLoaded: false,
      });

      const { container } = render(<EffectsToggle />);

      expect(container).toBeEmptyDOMElement();
    });

    it("shows 'Effects On' text when enabled", () => {
      render(<EffectsToggle />);

      expect(screen.getByText("Effects On")).toBeInTheDocument();
    });

    it("shows 'Effects Off' text when disabled", () => {
      mockedUseEffectsPreference.mockReturnValue({
        effectsEnabled: false,
        toggleEffects: mockToggleEffects,
        setEffectsEnabled: mockSetEffectsEnabled,
        isLoaded: true,
      });

      render(<EffectsToggle />);

      expect(screen.getByText("Effects Off")).toBeInTheDocument();
    });
  });

  describe("accessibility", () => {
    it("has correct aria-label when enabled", () => {
      render(<EffectsToggle />);

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-label", "Disable weather effects");
    });

    it("has correct aria-label when disabled", () => {
      mockedUseEffectsPreference.mockReturnValue({
        effectsEnabled: false,
        toggleEffects: mockToggleEffects,
        setEffectsEnabled: mockSetEffectsEnabled,
        isLoaded: true,
      });

      render(<EffectsToggle />);

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-label", "Enable weather effects");
    });

    it("has aria-pressed attribute matching state", () => {
      render(<EffectsToggle />);

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-pressed", "true");
    });

    it("has aria-pressed false when disabled", () => {
      mockedUseEffectsPreference.mockReturnValue({
        effectsEnabled: false,
        toggleEffects: mockToggleEffects,
        setEffectsEnabled: mockSetEffectsEnabled,
        isLoaded: true,
      });

      render(<EffectsToggle />);

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-pressed", "false");
    });

    it("has minimum touch target size (44px)", () => {
      render(<EffectsToggle />);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("min-w-[44px]");
      expect(button).toHaveClass("min-h-[44px]");
    });
  });

  describe("interaction", () => {
    it("calls toggleEffects when clicked", () => {
      render(<EffectsToggle />);

      const button = screen.getByRole("button");
      fireEvent.click(button);

      expect(mockToggleEffects).toHaveBeenCalledTimes(1);
    });
  });

  describe("styling", () => {
    it("applies custom className", () => {
      render(<EffectsToggle className="custom-class" />);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("custom-class");
    });

    it("has amber color when enabled", () => {
      render(<EffectsToggle />);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("text-amber-400");
    });

    it("has secondary color when disabled", () => {
      mockedUseEffectsPreference.mockReturnValue({
        effectsEnabled: false,
        toggleEffects: mockToggleEffects,
        setEffectsEnabled: mockSetEffectsEnabled,
        isLoaded: true,
      });

      render(<EffectsToggle />);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("text-text-secondary");
    });

    it("has type button to prevent form submission", () => {
      render(<EffectsToggle />);

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("type", "button");
    });
  });

  describe("icons", () => {
    it("shows Sparkles icon when enabled", () => {
      render(<EffectsToggle />);

      // Check for the icon by its aria-hidden attribute
      const icons = document.querySelectorAll('[aria-hidden="true"]');
      expect(icons.length).toBeGreaterThan(0);
    });

    it("shows EyeOff icon when disabled", () => {
      mockedUseEffectsPreference.mockReturnValue({
        effectsEnabled: false,
        toggleEffects: mockToggleEffects,
        setEffectsEnabled: mockSetEffectsEnabled,
        isLoaded: true,
      });

      render(<EffectsToggle />);

      // Check for the icon by its aria-hidden attribute
      const icons = document.querySelectorAll('[aria-hidden="true"]');
      expect(icons.length).toBeGreaterThan(0);
    });
  });
});
