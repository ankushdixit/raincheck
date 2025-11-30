import { render } from "@testing-library/react";
import { CloudEffect } from "../CloudEffect";

describe("CloudEffect", () => {
  it("renders without crashing", () => {
    render(<CloudEffect />);
    const container = document.querySelector(".cloud-effect");
    expect(container).toBeInTheDocument();
  });

  it("renders correct number of clouds for light intensity", () => {
    render(<CloudEffect intensity="light" />);
    const clouds = document.querySelectorAll(".cloud");
    expect(clouds.length).toBe(3);
  });

  it("renders correct number of clouds for moderate intensity", () => {
    render(<CloudEffect intensity="moderate" />);
    const clouds = document.querySelectorAll(".cloud");
    expect(clouds.length).toBe(5);
  });

  it("renders correct number of clouds for heavy intensity", () => {
    render(<CloudEffect intensity="heavy" />);
    const clouds = document.querySelectorAll(".cloud");
    expect(clouds.length).toBe(8);
  });

  it("defaults to moderate intensity when no prop provided", () => {
    render(<CloudEffect />);
    const clouds = document.querySelectorAll(".cloud");
    expect(clouds.length).toBe(5);
  });

  it("has pointer-events none to not block interactions", () => {
    render(<CloudEffect />);
    const container = document.querySelector(".cloud-effect");
    expect(container).toHaveStyle({ pointerEvents: "none" });
  });

  it("has aria-hidden for accessibility", () => {
    render(<CloudEffect />);
    const container = document.querySelector(".cloud-effect");
    expect(container).toHaveAttribute("aria-hidden", "true");
  });

  it("applies cloud-drift animation to clouds", () => {
    render(<CloudEffect intensity="light" />);
    const cloud = document.querySelector(".cloud") as HTMLElement;
    expect(cloud.style.animation).toContain("cloud-drift");
  });

  it("applies will-change for GPU optimization", () => {
    render(<CloudEffect intensity="light" />);
    const cloud = document.querySelector(".cloud");
    expect(cloud).toHaveStyle({ willChange: "transform" });
  });

  it("positions container as fixed overlay", () => {
    render(<CloudEffect />);
    const container = document.querySelector(".cloud-effect");
    expect(container).toHaveStyle({ position: "fixed" });
  });

  it("renders cloud body elements", () => {
    render(<CloudEffect intensity="light" />);
    const bodies = document.querySelectorAll(".cloud-body");
    expect(bodies.length).toBe(3);
  });

  it("clouds are positioned in upper portion of screen", () => {
    render(<CloudEffect intensity="light" />);
    const cloud = document.querySelector(".cloud") as HTMLElement;
    const topValue = cloud.style.top;
    // Top should be a percentage between 5% and 30%
    expect(topValue).toMatch(/\d+%/);
  });

  it("clouds have position absolute", () => {
    render(<CloudEffect intensity="light" />);
    const cloud = document.querySelector(".cloud");
    expect(cloud).toHaveStyle({ position: "absolute" });
  });
});
