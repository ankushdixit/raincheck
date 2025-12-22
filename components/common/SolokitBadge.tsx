"use client";

import Script from "next/script";

/**
 * Solokit Badge Component
 *
 * Loads the badge script from getsolokit.com and renders the badge.
 * Automatically handles dark/light mode.
 */
export function SolokitBadge() {
  return (
    <>
      <Script src="https://getsolokit.com/badge.js" strategy="lazyOnload" />
      <div id="solokit-badge" />
    </>
  );
}
