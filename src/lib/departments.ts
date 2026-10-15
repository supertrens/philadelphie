export const DEPARTMENTS = [
  {
    slug: "secretariat",
    name: "Secrétariat",
    description: "Membres, annonces et administration de l'église.",
  },
  {
    slug: "jeunesse",
    name: "Jeunesse",
    description: "Activités, sorties et suivi des jeunes.",
  },
  {
    slug: "louange",
    name: "Musique & Louange",
    description: "Planning des cultes, équipe et répertoire.",
  },
] as const;

export type DeptSlug = (typeof DEPARTMENTS)[number]["slug"];
