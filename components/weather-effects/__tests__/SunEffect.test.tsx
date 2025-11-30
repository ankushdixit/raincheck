import { render } from "@testing-library/react";
import { SunEffect } from "../SunEffect";

describe("SunEffect", () => {
  it("renders without crashing", () => {
    render(<SunEffect />);
    const container = document.querySelector(".sun-effect");
    expect(container).toBeInTheDocument();
  });

  it("renders sun glow element", () => {
    render(<SunEffect />);
    const glow = document.querySelector(".sun-glow");
    expect(glow).toBeInTheDocument();
  });

  it("renders correct number of rays for light intensity", () => {
    render(<SunEffect intensity="light" />);
    const rays = document.querySelectorAll(".sun-ray");
    expect(rays.length).toBe(4);
  });

  it("renders correct number of rays for moderate intensity", () => {
    render(<SunEffect intensity="moderate" />);
    const rays = document.querySelectorAll(".sun-ray");
    expect(rays.length).toBe(6);
  });

  it("renders correct number of rays for heavy intensity", () => {
    render(<SunEffect intensity="heavy" />);
    const rays = document.querySelectorAll(".sun-ray");
    expect(rays.length).toBe(8);
  });

  it("defaults to moderate intensity when no prop provided", () => {
    render(<SunEffect />);
    const rays = document.querySelectorAll(".sun-ray");
    expect(rays.length).toBe(6);
  });

  it("renders lens flare elements", () => {
    render(<SunEffect />);
    const flares = document.querySelectorAll(".lens-flare");
    expect(flares.length).toBe(2);
  });

  it("has pointer-events none to not block interactions", () => {
    render(<SunEffect />);
    const container = document.querySelector(".sun-effect");
    expect(container).toHaveStyle({ pointerEvents: "none" });
  });

  it("has aria-hidden for accessibility", () => {
    render(<SunEffect />);
    const container = document.querySelector(".sun-effect");
    expect(container).toHaveAttribute("aria-hidden", "true");
  });

  it("applies sun-pulse animation to glow", () => {
    render(<SunEffect />);
    const glow = document.querySelector(".sun-glow") as HTMLElement;
    expect(glow.style.animation).toContain("sun-pulse");
  });

  it("applies ray-shimmer animation to rays", () => {
    render(<SunEffect intensity="light" />);
    const ray = document.querySelector(".sun-ray") as HTMLElement;
    expect(ray.style.animation).toContain("ray-shimmer");
  });

  it("applies flare-pulse animation to lens flares", () => {
    render(<SunEffect />);
    const flare = document.querySelector(".lens-flare-1") as HTMLElement;
    expect(flare.style.animation).toContain("flare-pulse");
  });

  it("applies will-change for GPU optimization", () => {
    render(<SunEffect />);
    const glow = document.querySelector(".sun-glow");
    expect(glow).toHaveStyle({ willChange: "opacity, transform" });
  });

  it("positions container as fixed overlay", () => {
    render(<SunEffect />);
    const container = document.querySelector(".sun-effect");
    expect(container).toHaveStyle({ position: "fixed" });
  });

  it("positions sun glow in top-right corner", () => {
    render(<SunEffect />);
    const glow = document.querySelector(".sun-glow");
    expect(glow).toHaveStyle({ top: "-100px", right: "-100px" });
  });

  it("renders glow with circular shape", () => {
    render(<SunEffect />);
    const glow = document.querySelector(".sun-glow");
    expect(glow).toHaveStyle({ borderRadius: "50%" });
  });
});
