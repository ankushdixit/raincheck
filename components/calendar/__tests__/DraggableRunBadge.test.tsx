import { render, screen } from "@testing-library/react";
import { DndContext } from "@dnd-kit/core";
import { DraggableRunBadge, RunBadgeOverlay } from "../DraggableRunBadge";
import type { Run, RunType } from "@prisma/client";

// Helper to create mock runs
const createMockRun = (overrides?: Partial<Run>): Run => ({
  id: `run-${Math.random().toString(36).substring(7)}`,
  date: new Date(),
  distance: 10,
  pace: "5:30",
  duration: "55:00",
  type: "EASY_RUN" as RunType,
  notes: null,
  completed: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

// Wrapper component that provides DndContext
const DndWrapper = ({ children }: { children: React.ReactNode }) => (
  <DndContext>{children}</DndContext>
);

describe("DraggableRunBadge", () => {
  describe("rendering", () => {
    it("renders the run badge with correct content", () => {
      const run = createMockRun({ type: "EASY_RUN", distance: 8 });

      render(
        <DndWrapper>
          <DraggableRunBadge run={run} />
        </DndWrapper>
      );

      const badge = screen.getByTestId("run-badge");
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent("Easy");
      expect(badge).toHaveTextContent("8km");
    });

    it("displays correct run type and data attributes", () => {
      const run = createMockRun({ type: "LONG_RUN", completed: false });

      render(
        <DndWrapper>
          <DraggableRunBadge run={run} />
        </DndWrapper>
      );

      const badge = screen.getByTestId("run-badge");
      expect(badge).toHaveAttribute("data-run-type", "LONG_RUN");
      expect(badge).toHaveAttribute("data-completed", "false");
    });

    it("shows checkmark for completed runs", () => {
      const run = createMockRun({ completed: true });

      render(
        <DndWrapper>
          <DraggableRunBadge run={run} />
        </DndWrapper>
      );

      expect(screen.getByTestId("checkmark-icon")).toBeInTheDocument();
    });

    it("does not show checkmark for incomplete runs", () => {
      const run = createMockRun({ completed: false });

      render(
        <DndWrapper>
          <DraggableRunBadge run={run} />
        </DndWrapper>
      );

      expect(screen.queryByTestId("checkmark-icon")).not.toBeInTheDocument();
    });
  });

  describe("drag states", () => {
    it("is marked as draggable when not disabled and not completed", () => {
      const run = createMockRun({ completed: false });

      render(
        <DndWrapper>
          <DraggableRunBadge run={run} isDragDisabled={false} />
        </DndWrapper>
      );

      const badge = screen.getByTestId("run-badge");
      expect(badge).toHaveAttribute("data-draggable", "true");
    });

    it("is marked as not draggable when disabled", () => {
      const run = createMockRun({ completed: false });

      render(
        <DndWrapper>
          <DraggableRunBadge run={run} isDragDisabled={true} />
        </DndWrapper>
      );

      const badge = screen.getByTestId("run-badge");
      expect(badge).toHaveAttribute("data-draggable", "false");
    });

    it("is marked as not draggable when run is completed", () => {
      const run = createMockRun({ completed: true });

      render(
        <DndWrapper>
          <DraggableRunBadge run={run} isDragDisabled={false} />
        </DndWrapper>
      );

      const badge = screen.getByTestId("run-badge");
      expect(badge).toHaveAttribute("data-draggable", "false");
    });

    it("is marked as not draggable when both disabled and completed", () => {
      const run = createMockRun({ completed: true });

      render(
        <DndWrapper>
          <DraggableRunBadge run={run} isDragDisabled={true} />
        </DndWrapper>
      );

      const badge = screen.getByTestId("run-badge");
      expect(badge).toHaveAttribute("data-draggable", "false");
    });

    it("has grab cursor when draggable", () => {
      const run = createMockRun({ completed: false });

      render(
        <DndWrapper>
          <DraggableRunBadge run={run} isDragDisabled={false} />
        </DndWrapper>
      );

      const badge = screen.getByTestId("run-badge");
      expect(badge).toHaveStyle({ cursor: "grab" });
    });

    it("has default cursor when drag is disabled", () => {
      const run = createMockRun({ completed: false });

      render(
        <DndWrapper>
          <DraggableRunBadge run={run} isDragDisabled={true} />
        </DndWrapper>
      );

      const badge = screen.getByTestId("run-badge");
      expect(badge).toHaveStyle({ cursor: "default" });
    });

    it("has default cursor when run is completed", () => {
      const run = createMockRun({ completed: true });

      render(
        <DndWrapper>
          <DraggableRunBadge run={run} isDragDisabled={false} />
        </DndWrapper>
      );

      const badge = screen.getByTestId("run-badge");
      expect(badge).toHaveStyle({ cursor: "default" });
    });
  });

  describe("run type colors", () => {
    const runTypeTests: { type: RunType; label: string; color: string }[] = [
      { type: "LONG_RUN", label: "Long", color: "rgba(59, 130, 246, 0.9)" },
      { type: "EASY_RUN", label: "Easy", color: "rgba(34, 197, 94, 0.9)" },
      { type: "TEMPO_RUN", label: "Tempo", color: "rgba(249, 115, 22, 0.9)" },
      { type: "INTERVAL_RUN", label: "Intervals", color: "rgba(168, 85, 247, 0.9)" },
      { type: "RECOVERY_RUN", label: "Recovery", color: "rgba(156, 163, 175, 0.9)" },
      { type: "RACE", label: "Race", color: "rgba(234, 179, 8, 0.9)" },
    ];

    runTypeTests.forEach(({ type, label, color }) => {
      it(`displays ${type} with ${label} label and correct color`, () => {
        const run = createMockRun({ type, distance: 10 });

        render(
          <DndWrapper>
            <DraggableRunBadge run={run} />
          </DndWrapper>
        );

        const badge = screen.getByTestId("run-badge");
        expect(badge).toHaveTextContent(label);
        expect(badge).toHaveAttribute("data-run-type", type);
        expect(badge).toHaveStyle({ backgroundColor: color });
      });
    });
  });

  describe("accessibility", () => {
    it("has touch-none class for better touch handling", () => {
      const run = createMockRun();

      render(
        <DndWrapper>
          <DraggableRunBadge run={run} />
        </DndWrapper>
      );

      const badge = screen.getByTestId("run-badge");
      expect(badge).toHaveClass("touch-none");
    });

    it("checkmark icon is aria-hidden", () => {
      const run = createMockRun({ completed: true });

      render(
        <DndWrapper>
          <DraggableRunBadge run={run} />
        </DndWrapper>
      );

      const checkmark = screen.getByTestId("checkmark-icon");
      expect(checkmark).toHaveAttribute("aria-hidden", "true");
    });
  });
});

describe("RunBadgeOverlay", () => {
  it("renders correctly", () => {
    const run = createMockRun({ type: "TEMPO_RUN", distance: 12 });

    render(<RunBadgeOverlay run={run} />);

    const badge = screen.getByTestId("run-badge-overlay");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent("Tempo");
    expect(badge).toHaveTextContent("12km");
  });

  it("displays correct color for run type", () => {
    const run = createMockRun({ type: "INTERVAL_RUN" });

    render(<RunBadgeOverlay run={run} />);

    const badge = screen.getByTestId("run-badge-overlay");
    expect(badge).toHaveStyle({ backgroundColor: "rgba(168, 85, 247, 0.9)" });
  });

  it("shows checkmark for completed runs", () => {
    const run = createMockRun({ completed: true });

    render(<RunBadgeOverlay run={run} />);

    expect(screen.getByTestId("checkmark-icon")).toBeInTheDocument();
  });

  it("has shadow for elevation effect", () => {
    const run = createMockRun();

    render(<RunBadgeOverlay run={run} />);

    const badge = screen.getByTestId("run-badge-overlay");
    expect(badge).toHaveClass("shadow-lg");
  });
});
