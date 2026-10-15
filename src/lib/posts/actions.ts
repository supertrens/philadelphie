"use server";

import { eq } from "drizzle-orm";
import { revalidatePath, updateTag } from "next/cache";
import { db, posts } from "@/db";
import { logAction } from "@/lib/audit";
import { requireRole } from "@/lib/auth";
import { type DeptSlug, isRole } from "@/lib/departments";

const text = (f: FormData, k: string) => String(f.get(k) ?? "").trim();

function refresh(dept: string) {
  updateTag("public");
  revalidatePath(`/espace/${dept}`);
  revalidatePath("/espace/admin");
}

/** Charge la publication et vérifie que l'utilisateur a accès à son département. */
async function authorize(id: number) {
  const [post] = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
  if (!post || !isRole(post.department) || post.department === "admin") return null;
  const staff = await requireRole(post.department);
  return { post, staff };
}

export async function createPost(dept: DeptSlug, formData: FormData) {
  const staff = await requireRole(dept);
  const title = text(formData, "title");
  const body = text(formData, "body");
  if (!title || !body) return;
  const published = formData.get("published") === "on";
  const [row] = await db
    .insert(posts)
    .values({
      department: dept,
      title,
      body,
      titleEn: text(formData, "titleEn") || null,
      bodyEn: text(formData, "bodyEn") || null,
      photoPathname: text(formData, "photo") || null,
      published,
      publishedAt: published ? new Date() : null,
      createdBy: staff.name,
    })
    .returning({ id: posts.id });
  await logAction(staff, published ? "publication" : "brouillon", "vie", row.id);
  refresh(dept);
}

export async function togglePost(id: number, published: boolean) {
  const ctx = await authorize(id);
  if (!ctx) return;
  await db
    .update(posts)
    .set({ published, publishedAt: published ? (ctx.post.publishedAt ?? new Date()) : ctx.post.publishedAt })
    .where(eq(posts.id, id));
  await logAction(ctx.staff, published ? "publication" : "dépublication", "vie", id);
  refresh(ctx.post.department);
}

export async function deletePost(id: number) {
  const ctx = await authorize(id);
  if (!ctx) return;
  await db.delete(posts).where(eq(posts.id, id));
  await logAction(ctx.staff, "suppression", "vie", id);
  refresh(ctx.post.department);
}
