import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { getStaff } from "@/lib/auth";
import { isRole } from "@/lib/departments";

const TYPES: Record<string, string[]> = {
  pdf: ["application/pdf"],
  image: ["image/jpeg", "image/png", "image/webp"],
  audio: ["audio/mpeg", "audio/mp4", "audio/x-m4a"],
  document: ["application/pdf", "image/jpeg", "image/png", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
};

/**
 * Autorise un envoi direct navigateur → Blob (jusqu'à 100 Mo).
 * Le chemin commence par le département (ex. "media/bulletins/…") ou "public/…"
 * pour les fichiers consultables par tous (bulletin, audio des messages).
 */
export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadBody;
  try {
    const json = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const staff = await getStaff();
        if (!staff) throw new Error("Non connecté");
        const [root] = pathname.split("/");
        const dept = root === "public" ? (clientPayload ?? "") : root;
        if (!isRole(dept) || !(staff.roles.includes("admin") || staff.roles.includes(dept))) {
          throw new Error("Accès refusé pour ce dossier");
        }
        const kind = new URL(request.url).searchParams.get("kind") ?? "document";
        return {
          allowedContentTypes: TYPES[kind] ?? TYPES.document,
          maximumSizeInBytes: 100 * 1024 * 1024,
          addRandomSuffix: true,
          tokenPayload: staff.userId,
        };
      },
      onUploadCompleted: async () => {},
    });
    return Response.json(json);
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 400 });
  }
}
