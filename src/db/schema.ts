import {
  boolean,
  integer,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const members = pgTable("members", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  phone: text("phone"),
  email: text("email"),
  // Département principal (ex. "jeunesse"), null = membre général
  department: text("department"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const announcements = pgTable("announcements", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  published: boolean("published").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  startsAt: timestamp("starts_at").notNull(),
  location: text("location"),
  description: text("description"),
  department: text("department").notNull(),
  // Affiché sur la page publique
  isPublic: boolean("is_public").default(true).notNull(),
});

export const attendance = pgTable(
  "attendance",
  {
    eventId: integer("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    memberId: integer("member_id")
      .notNull()
      .references(() => members.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.eventId, t.memberId] })],
);

export const songs = pgTable("songs", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  artist: text("artist"),
  musicalKey: text("musical_key"),
  link: text("link"),
});

export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  date: timestamp("date").notNull(),
  theme: text("theme"),
});

export const rota = pgTable("rota", {
  id: serial("id").primaryKey(),
  serviceId: integer("service_id")
    .notNull()
    .references(() => services.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  person: text("person").notNull(),
});

export const setlist = pgTable("setlist", {
  id: serial("id").primaryKey(),
  serviceId: integer("service_id")
    .notNull()
    .references(() => services.id, { onDelete: "cascade" }),
  songId: integer("song_id")
    .notNull()
    .references(() => songs.id, { onDelete: "cascade" }),
  position: integer("position").notNull(),
});
