import { render } from "@testing-library/react";
import { SnowEffect } from "../SnowEffect";

describe("SnowEffect", () => {
  it("renders without crashing", () => {
    render(<SnowEffect />);
    const container = document.querySelector(".snow-effect");
    expect(container).toBeInTheDocument();
  });

  it("renders correct number of snowflakes for light intensity", () => {
    render(<SnowEffect intensity="light" />);
    const flakes = document.querySelectorAll(".snowflake");
    expect(flakes.length).toBe(25);
  });

  it("renders correct number of snowflakes for moderate intensity", () => {
    render(<SnowEffect intensity="moderate" />);
    const flakes = document.querySelectorAll(".snowflake");
    expect(flakes.length).toBe(50);
  });

  it("renders correct number of snowflakes for heavy intensity", () => {
    render(<SnowEffect intensity="heavy" />);
    const flakes = document.querySelectorAll(".snowflake");
    expect(flakes.length).toBe(80);
  });

  it("defaults to moderate intensity when no prop provided", () => {
    render(<SnowEffect />);
    const flakes = document.querySelectorAll(".snowflake");
    expect(flakes.length).toBe(50);
  });

  it("has pointer-events none to not block interactions", () => {
    render(<SnowEffect />);
    const container = document.querySelector(".snow-effect");
    expect(container).toHaveStyle({ pointerEvents: "none" });
  });

  it("has aria-hidden for accessibility", () => {
    render(<SnowEffect />);
    const container = document.querySelector(".snow-effect");
    expect(container).toHaveAttribute("aria-hidden", "true");
  });

  it("applies snow-fall animation to snowflakes", () => {
    render(<SnowEffect intensity="light" />);
    const flake = document.querySelector(".snowflake") as HTMLElement;
    expect(flake.style.animation).toContain("snow-fall");
  });

  it("applies will-change for GPU optimization", () => {
    render(<SnowEffect intensity="light" />);
    const flake = document.querySelector(".snowflake");
    expect(flake).toHaveStyle({ willChange: "transform" });
  });

  it("renders snowflakes with circular shape", () => {
    render(<SnowEffect intensity="light" />);
    const flake = document.querySelector(".snowflake");
    expect(flake).toHaveStyle({ borderRadius: "50%" });
  });

  it("positions container as fixed overlay", () => {
    render(<SnowEffect />);
    const container = document.querySelector(".snow-effect");
    expect(container).toHaveStyle({ position: "fixed" });
  });
});
