import { render, screen, fireEvent } from "@testing-library/react";
import { MoveInstructions } from "../MoveInstructions";

describe("MoveInstructions", () => {
  describe("visibility", () => {
    it("renders nothing when isVisible is false", () => {
      const { container } = render(<MoveInstructions isVisible={false} />);

      expect(container).toBeEmptyDOMElement();
    });

    it("renders the instructions when isVisible is true", () => {
      render(<MoveInstructions isVisible={true} />);

      expect(screen.getByTestId("move-instructions")).toBeInTheDocument();
    });

    it("displays the correct instruction text", () => {
      render(<MoveInstructions isVisible={true} />);

      expect(screen.getByText("Tap a day to move this run")).toBeInTheDocument();
    });
  });

  describe("cancel button", () => {
    it("shows cancel button when onCancel is provided", () => {
      const onCancel = jest.fn();
      render(<MoveInstructions isVisible={true} onCancel={onCancel} />);

      expect(screen.getByTestId("move-cancel-button")).toBeInTheDocument();
    });

    it("does not show cancel button when onCancel is not provided", () => {
      render(<MoveInstructions isVisible={true} />);

      expect(screen.queryByTestId("move-cancel-button")).not.toBeInTheDocument();
    });

    it("calls onCancel when cancel button is clicked", () => {
      const onCancel = jest.fn();
      render(<MoveInstructions isVisible={true} onCancel={onCancel} />);

      const cancelButton = screen.getByTestId("move-cancel-button");
      fireEvent.click(cancelButton);

      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it("cancel button has correct text", () => {
      const onCancel = jest.fn();
      render(<MoveInstructions isVisible={true} onCancel={onCancel} />);

      expect(screen.getByText("Cancel")).toBeInTheDocument();
    });
  });

  describe("styling", () => {
    it("has amber background styling", () => {
      render(<MoveInstructions isVisible={true} />);

      const container = screen.getByTestId("move-instructions");
      expect(container).toHaveClass("bg-amber-500/20");
    });

    it("has border styling", () => {
      render(<MoveInstructions isVisible={true} />);

      const container = screen.getByTestId("move-instructions");
      expect(container).toHaveClass("border-b");
      expect(container).toHaveClass("border-amber-500/30");
    });

    it("instruction text has amber color", () => {
      render(<MoveInstructions isVisible={true} />);

      const text = screen.getByText("Tap a day to move this run");
      expect(text).toHaveClass("text-amber-200");
    });

    it("cancel button has minimum touch target size", () => {
      const onCancel = jest.fn();
      render(<MoveInstructions isVisible={true} onCancel={onCancel} />);

      const cancelButton = screen.getByTestId("move-cancel-button");
      expect(cancelButton).toHaveClass("min-w-[44px]");
      expect(cancelButton).toHaveClass("min-h-[44px]");
    });
  });

  describe("accessibility", () => {
    it("cancel button has accessible label", () => {
      const onCancel = jest.fn();
      render(<MoveInstructions isVisible={true} onCancel={onCancel} />);

      const cancelButton = screen.getByTestId("move-cancel-button");
      expect(cancelButton).toHaveAttribute("aria-label", "Cancel move");
    });

    it("instruction container uses semantic paragraph for text", () => {
      render(<MoveInstructions isVisible={true} />);

      const text = screen.getByText("Tap a day to move this run");
      expect(text.tagName).toBe("P");
    });
  });
});
