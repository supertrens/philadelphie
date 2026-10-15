/**
 * Bandeau défilant en boucle continue.
 * Deux groupes identiques, chacun au moins aussi large que l'écran ; la piste
 * glisse de -50 % puis recommence, sans jamais laisser de trou.
 */
export function Marquee({ items, className = "" }: { items: string[]; className?: string }) {
  const group = Array.from({ length: 4 }, () => items).flat();
  return (
    <div className={`marquee overflow-hidden ${className}`} aria-label={items.join(", ")}>
      <div className="marquee-track" aria-hidden="true">
        {[0, 1].map((g) => (
          <div key={g} className="flex min-w-full shrink-0 justify-around">
            {group.map((t, i) => (
              <span key={i} className="flex items-center gap-6 px-6 font-display text-2xl font-medium whitespace-nowrap sm:text-3xl">
                {t} <span className="h-1.5 w-1.5 rounded-full bg-gold" />
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
