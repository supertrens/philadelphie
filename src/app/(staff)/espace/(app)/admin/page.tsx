import { clerkClient } from "@clerk/nextjs/server";
import type { Metadata } from "next";
import { Suspense } from "react";
import { Button, Card, Empty, Field, Input, PageHeader } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { DEPARTMENTS, isRole } from "@/lib/departments";
import { inviteUser, revokeInvitation, setBanned, updateRoles } from "./actions";

export const metadata: Metadata = { title: "Utilisateurs & accès" };

export default function AdminPage() {
  return (
    <>
      <PageHeader title="Utilisateurs & accès" subtitle="Invitez les responsables et choisissez les départements auxquels chacun accède." />
      <Suspense fallback={<p className="text-sm text-muted">Chargement…</p>}>
        <Content />
      </Suspense>
    </>
  );
}

async function Content() {
  const me = await requireRole("admin");
  const client = await clerkClient();
  const [users, invitations] = await Promise.all([
    client.users.getUserList({ limit: 100, orderBy: "-created_at" }),
    client.invitations.getInvitationList({ status: "pending" }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <Card title="Inviter un responsable">
        <form action={inviteUser} className="grid gap-4 rounded-xl bg-subtle p-4">
          <Field label="Adresse e-mail"><Input name="email" type="email" required placeholder="prenom.nom@exemple.com" /></Field>
          <RoleChecks />
          <div className="text-right"><Button type="submit">Envoyer l’invitation</Button></div>
        </form>
        {invitations.data.length > 0 && (
          <ul className="mt-4 divide-y divide-line text-sm">
            {invitations.data.map((inv) => (
              <li key={inv.id} className="flex items-center justify-between gap-3 py-2">
                <span><span className="font-medium">{inv.emailAddress}</span> <span className="text-muted">· invitation en attente</span></span>
                <form action={revokeInvitation.bind(null, inv.id)}><Button variant="danger">Annuler</Button></form>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title={`Comptes (${users.totalCount})`}>
        {users.data.length === 0 ? <Empty>Aucun compte.</Empty> : (
          <ul className="divide-y divide-line">
            {users.data.map((u) => {
              const email = u.emailAddresses.find((e) => e.id === u.primaryEmailAddressId)?.emailAddress ?? "";
              const roles = ((u.publicMetadata as { roles?: unknown }).roles as unknown[] | undefined)?.filter(isRole) ?? [];
              const isMe = u.id === me.userId;
              return (
                <li key={u.id} className="py-4">
                  <details>
                    <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-2">
                      <span>
                        <span className="font-medium">{[u.firstName, u.lastName].filter(Boolean).join(" ") || email}</span>
                        {isMe && <span className="ml-2 rounded-full bg-subtle px-2 py-0.5 text-xs text-muted">vous</span>}
                        {u.banned && <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">suspendu</span>}
                        <span className="block text-sm text-muted">{email}</span>
                      </span>
                      <span className="text-sm text-muted">
                        {roles.length === 0 ? "aucun accès" : roles.map((r) => (r === "admin" ? "Administration" : DEPARTMENTS.find((d) => d.slug === r)?.name)).join(", ")}
                      </span>
                    </summary>
                    <div className="mt-4 rounded-xl bg-subtle p-4">
                      <form action={updateRoles.bind(null, u.id)} className="grid gap-4">
                        <RoleChecks selected={roles} />
                        <div className="text-right"><Button type="submit">Enregistrer les accès</Button></div>
                      </form>
                      {!isMe && (
                        <form action={setBanned.bind(null, u.id, !u.banned)} className="mt-2 text-right">
                          <Button variant="danger">{u.banned ? "Rétablir l’accès" : "Suspendre l’accès"}</Button>
                        </form>
                      )}
                    </div>
                  </details>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}

function RoleChecks({ selected = [] }: { selected?: string[] }) {
  return (
    <fieldset>
      <legend className="mb-2 text-xs font-medium text-muted">Accès</legend>
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input type="checkbox" name="roles" value="admin" defaultChecked={selected.includes("admin")} className="accent-accent" /> Administration (tout)
        </label>
        {DEPARTMENTS.map((d) => (
          <label key={d.slug} className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="roles" value={d.slug} defaultChecked={selected.includes(d.slug)} className="accent-accent" /> {d.name}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
