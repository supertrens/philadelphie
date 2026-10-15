/** Monogramme : croix dorée dans un cercle bleu royal. */
export function Logo({ size = 40, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true" className={className}>
      <circle cx="20" cy="20" r="19" fill="var(--night-2)" stroke="var(--gold)" strokeWidth="1.5" />
      <rect x="18.25" y="9" width="3.5" height="22" rx="1" fill="var(--gold)" />
      <rect x="11" y="15.5" width="18" height="3.5" rx="1" fill="var(--gold)" />
    </svg>
  );
}
