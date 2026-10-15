import { Cake } from "lucide-react";
import { Card, Empty } from "@/components/ui";
import { getUpcomingBirthdays } from "@/lib/birthdays";

/** Anniversaires des 30 prochains jours (membres, jeunes, visiteurs, moniteurs). */
export async function BirthdaysCard({ days = 30 }: { days?: number }) {
  const list = await getUpcomingBirthdays(days);
  return (
    <Card title={`Anniversaires à venir (${days} jours)`}>
      {list.length === 0 ? (
        <Empty>Aucun anniversaire dans les {days} prochains jours. Renseignez les dates de naissance en inscrivant les personnes.</Empty>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2">
          {list.map((p) => (
            <li key={`${p.name}-${p.monthDay}`} className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-sm ${p.inDays === 0 ? "border-gold bg-gold/10" : "border-line"}`}>
              <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${p.inDays === 0 ? "bg-gold text-night" : "bg-night text-gold"}`}><Cake className="h-4 w-4" /></span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{p.name}</span>
                <span className="block text-xs text-muted">{p.role} · {p.label}</span>
              </span>
              <span className="shrink-0 text-xs font-semibold uppercase tracking-wider text-muted">{p.inDays === 0 ? "Aujourd’hui" : p.inDays === 1 ? "Demain" : `J-${p.inDays}`}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
