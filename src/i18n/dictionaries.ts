import "server-only";
import type { Locale } from "./locales";

const dictionaries = {
  fr: () => import("./fr.json").then((m) => m.default),
  en: () => import("./en.json").then((m) => m.default),
};

export type Dictionary = Awaited<ReturnType<(typeof dictionaries)["fr"]>>;

export const getDictionary = (locale: Locale): Promise<Dictionary> => dictionaries[locale]();
