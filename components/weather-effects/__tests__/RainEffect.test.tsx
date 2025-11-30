import { render } from "@testing-library/react";
import { RainEffect } from "../RainEffect";

describe("RainEffect", () => {
  it("renders without crashing", () => {
    render(<RainEffect />);
    const container = document.querySelector(".rain-effect");
    expect(container).toBeInTheDocument();
  });

  it("renders correct number of particles for light intensity", () => {
    render(<RainEffect intensity="light" />);
    const drops = document.querySelectorAll(".rain-drop");
    expect(drops.length).toBe(30);
  });

  it("renders correct number of particles for moderate intensity", () => {
    render(<RainEffect intensity="moderate" />);
    const drops = document.querySelectorAll(".rain-drop");
    expect(drops.length).toBe(60);
  });

  it("renders correct number of particles for heavy intensity", () => {
    render(<RainEffect intensity="heavy" />);
    const drops = document.querySelectorAll(".rain-drop");
    expect(drops.length).toBe(100);
  });

  it("defaults to moderate intensity when no prop provided", () => {
    render(<RainEffect />);
    const drops = document.querySelectorAll(".rain-drop");
    expect(drops.length).toBe(60);
  });

  it("has pointer-events none to not block interactions", () => {
    render(<RainEffect />);
    const container = document.querySelector(".rain-effect");
    expect(container).toHaveStyle({ pointerEvents: "none" });
  });

  it("has aria-hidden for accessibility", () => {
    render(<RainEffect />);
    const container = document.querySelector(".rain-effect");
    expect(container).toHaveAttribute("aria-hidden", "true");
  });

  it("applies rain-fall animation to drops", () => {
    render(<RainEffect intensity="light" />);
    const drop = document.querySelector(".rain-drop") as HTMLElement;
    expect(drop.style.animation).toContain("rain-fall");
  });

  it("applies will-change for GPU optimization", () => {
    render(<RainEffect intensity="light" />);
    const drop = document.querySelector(".rain-drop");
    expect(drop).toHaveStyle({ willChange: "transform" });
  });

  it("positions container as fixed overlay", () => {
    render(<RainEffect />);
    const container = document.querySelector(".rain-effect");
    expect(container).toHaveStyle({ position: "fixed" });
  });

  it("applies diagonal rotation to rain drops", () => {
    render(<RainEffect intensity="light" />);
    const drop = document.querySelector(".rain-drop") as HTMLElement;
    expect(drop.style.transform).toContain("rotate(15deg)");
  });
});
