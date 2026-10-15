"use client";

import { useActionState } from "react";
import { Button, Field, Input, Select } from "@/components/ui";
import { DEPARTMENTS } from "@/lib/departments";
import { login } from "./actions";

export function LoginForm() {
  const [state, action, pending] = useActionState(login, {});
  return (
    <form action={action} className="flex flex-col gap-4">
      <Field label="Département">
        <Select name="role" defaultValue="secretariat">
          {DEPARTMENTS.map((d) => <option key={d.slug} value={d.slug}>{d.name}</option>)}
          <option value="admin">Administration (tous les départements)</option>
        </Select>
      </Field>
      <Field label="Mot de passe">
        <Input name="password" type="password" required autoComplete="current-password" />
      </Field>
      {state.error && <p className="text-sm text-red-600" role="alert">{state.error}</p>}
      <Button type="submit" disabled={pending}>{pending ? "Connexion…" : "Se connecter"}</Button>
    </form>
  );
}
