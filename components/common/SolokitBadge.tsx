import Image from "next/image";
import Link from "next/link";

/**
 * Solokit Badge Component
 *
 * Displays "Built with [logo] solokit" badge that links to getsolokit.com
 */
export function SolokitBadge() {
  return (
    <Link
      href="https://www.getsolokit.com/"
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 text-white/40 hover:text-white/60 transition-colors text-sm"
    >
      <span>Built with</span>
      <Image
        src="/images/solokit-logo.svg"
        alt="Solokit"
        width={18}
        height={18}
        className="opacity-60"
      />
      <span className="font-medium">solokit</span>
    </Link>
  );
}
