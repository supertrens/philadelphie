"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db, expenses, offerings } from "@/db";
import { logAction } from "@/lib/audit";
import { requireRole } from "@/lib/auth";
import { parseLocalDateTime } from "@/lib/dates";

const PATH = "/espace/tresorerie";
const text = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
// "12,50" ou "12.50" → 1250 centimes
const cents = (v: string) => Math.round(Number(v.replace(",", ".")) * 100);

export async function addOffering(formData: FormData) {
  const staff = await requireRole("tresorerie");
  const date = parseLocalDateTime(text(formData, "date"));
  const amountCents = cents(text(formData, "amount"));
  const fund = text(formData, "fund");
  if (!date || !fund || !Number.isFinite(amountCents) || amountCents <= 0) return;
  await db.insert(offerings).values({ date, fund, amountCents, countedBy: text(formData, "countedBy") || staff.name, notes: text(formData, "notes") || null });
  await logAction(staff, "ajout", "offrande");
  revalidatePath(PATH);
}

export async function deleteOffering(id: number) {
  const staff = await requireRole("tresorerie");
  await db.delete(offerings).where(eq(offerings.id, id));
  await logAction(staff, "suppression", "offrande", id);
  revalidatePath(PATH);
}

export async function addExpense(formData: FormData) {
  const staff = await requireRole("tresorerie");
  const date = parseLocalDateTime(text(formData, "date"));
  const amountCents = cents(text(formData, "amount"));
  const category = text(formData, "category");
  if (!date || !category || !Number.isFinite(amountCents) || amountCents <= 0) return;
  await db.insert(expenses).values({
    date, category, amountCents,
    description: text(formData, "description") || null,
    receiptPathname: text(formData, "receipt") || null,
  });
  await logAction(staff, "ajout", "dépense");
  revalidatePath(PATH);
}

export async function approveExpense(id: number) {
  const staff = await requireRole("tresorerie");
  await db.update(expenses).set({ approvedBy: staff.name }).where(eq(expenses.id, id));
  await logAction(staff, "approbation", "dépense", id);
  revalidatePath(PATH);
}

export async function deleteExpense(id: number) {
  const staff = await requireRole("tresorerie");
  await db.delete(expenses).where(eq(expenses.id, id));
  await logAction(staff, "suppression", "dépense", id);
  revalidatePath(PATH);
}
