export const DEPARTMENTS = [
  { slug: "secretariat", name: "Secrétariat", description: "Membres, annonces, documents et messages reçus." },
  { slug: "pastorat", name: "Pastorat & Anciens", description: "Demandes de prière, visites et planning des messages." },
  { slug: "jeunesse", name: "Jeunesse", description: "Activités, sorties et suivi des jeunes." },
  { slug: "enfants", name: "Enfants & École du Sabbat", description: "Classes, moniteurs et présences des enfants." },
  { slug: "louange", name: "Musique & Louange", description: "Planning des cultes, équipe et répertoire." },
  { slug: "tresorerie", name: "Trésorerie", description: "Offrandes, dépenses et rapports." },
  { slug: "media", name: "Média & Communication", description: "Messages vidéo, direct, bulletin et photos." },
] as const;

export type DeptSlug = (typeof DEPARTMENTS)[number]["slug"];

export const ROLES = ["admin", ...DEPARTMENTS.map((d) => d.slug)] as const;
export type Role = (typeof ROLES)[number];

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}

export function deptName(slug: string) {
  return DEPARTMENTS.find((d) => d.slug === slug)?.name ?? slug;
}
