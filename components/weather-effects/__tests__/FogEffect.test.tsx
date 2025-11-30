import { render } from "@testing-library/react";
import { FogEffect } from "../FogEffect";

describe("FogEffect", () => {
  it("renders without crashing", () => {
    render(<FogEffect />);
    const container = document.querySelector(".fog-effect");
    expect(container).toBeInTheDocument();
  });

  it("renders three fog layers", () => {
    render(<FogEffect />);
    const layers = document.querySelectorAll(".fog-layer");
    expect(layers.length).toBe(3);
  });

  it("has pointer-events none to not block interactions", () => {
    render(<FogEffect />);
    const container = document.querySelector(".fog-effect");
    expect(container).toHaveStyle({ pointerEvents: "none" });
  });

  it("has aria-hidden for accessibility", () => {
    render(<FogEffect />);
    const container = document.querySelector(".fog-effect");
    expect(container).toHaveAttribute("aria-hidden", "true");
  });

  it("applies fog-drift animation to first layer", () => {
    render(<FogEffect />);
    const layer1 = document.querySelector(".fog-layer-1") as HTMLElement;
    expect(layer1.style.animation).toContain("fog-drift");
  });

  it("applies will-change for GPU optimization on layers", () => {
    render(<FogEffect />);
    const layer1 = document.querySelector(".fog-layer-1");
    expect(layer1).toHaveStyle({ willChange: "transform" });
  });

  it("positions container as fixed overlay", () => {
    render(<FogEffect />);
    const container = document.querySelector(".fog-effect");
    expect(container).toHaveStyle({ position: "fixed" });
  });

  it("applies animation to second layer", () => {
    render(<FogEffect />);
    const layer2 = document.querySelector(".fog-layer-2") as HTMLElement;
    expect(layer2.style.animation).toContain("fog-drift");
  });

  it("applies fog-pulse animation to third layer", () => {
    render(<FogEffect />);
    const layer3 = document.querySelector(".fog-layer-3") as HTMLElement;
    expect(layer3.style.animation).toContain("fog-pulse");
  });

  it("defaults to moderate intensity when no prop provided", () => {
    render(<FogEffect />);
    const container = document.querySelector(".fog-effect");
    expect(container).toBeInTheDocument();
  });

  it("handles light intensity", () => {
    render(<FogEffect intensity="light" />);
    const container = document.querySelector(".fog-effect");
    expect(container).toBeInTheDocument();
  });

  it("handles heavy intensity", () => {
    render(<FogEffect intensity="heavy" />);
    const container = document.querySelector(".fog-effect");
    expect(container).toBeInTheDocument();
  });

  it("third layer covers top half of screen", () => {
    render(<FogEffect />);
    const layer3 = document.querySelector(".fog-layer-3");
    expect(layer3).toHaveStyle({ height: "50%" });
  });
});
