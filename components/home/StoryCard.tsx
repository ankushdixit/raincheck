"use client";

/**
 * Personal story card component
 * Displays the founder's running journey and platform purpose
 */
export function StoryCard() {
  return (
    <div
      className="bg-forest-deep/50 backdrop-blur-md rounded-lg p-6 h-full"
      data-testid="story-card"
    >
      <h2 className="text-lg font-semibold text-white mb-3">My Running Journey</h2>
      <p className="text-white/80 text-sm leading-relaxed">
        I&apos;m <span className="text-white font-medium">Ankush Dixit</span>. I started running for
        the first time in March 2025 and could barely run 300-400 meters before needing to catch my
        breath. Today, I can run 13km non-stop. AI has been my running coach, guiding me through
        building strength and endurance. Now I&apos;m using it to complete various training phases
        on my way to running a half-marathon in May 2026.
      </p>
    </div>
  );
}
