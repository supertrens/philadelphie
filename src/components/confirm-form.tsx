"use client";

import type { ReactNode } from "react";

/** Formulaire d'action serveur qui demande confirmation avant l'envoi. */
export function ConfirmForm({ action, message, className, children }: { action: () => Promise<void>; message: string; className?: string; children: ReactNode }) {
  return (
    <form action={action} className={className} onSubmit={(e) => { if (!window.confirm(message)) e.preventDefault(); }}>
      {children}
    </form>
  );
}
