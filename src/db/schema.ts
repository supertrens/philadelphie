import {
  boolean,
  date,
  integer,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";

// ---------- Secrétariat ----------
export const members = pgTable("members", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  phone: text("phone"),
  email: text("email"),
  // Département principal (ex. "jeunesse"), null = membre général
  department: text("department"),
  // membre / visiteur / ami
  status: text("status").default("membre").notNull(),
  birthday: timestamp("birthday"),
  baptized: boolean("baptized").default(false).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const announcements = pgTable("announcements", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  titleEn: text("title_en"),
  bodyEn: text("body_en"),
  published: boolean("published").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  // Chemin dans le stockage Blob (privé)
  pathname: text("pathname").notNull(),
  department: text("department").notNull(),
  uploadedBy: text("uploaded_by").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const contactMessages = pgTable("contact_messages", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  // nouveau / traité
  status: text("status").default("nouveau").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ---------- Jeunesse / Enfants (événements partagés) ----------
export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  titleEn: text("title_en"),
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
    eventId: integer("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
    memberId: integer("member_id").notNull().references(() => members.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.eventId, t.memberId] })],
);

// ---------- Enfants & École du Sabbat ----------
export const classes = pgTable("classes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  ageRange: text("age_range"),
  room: text("room"),
});

export const teachers = pgTable("teachers", {
  id: serial("id").primaryKey(),
  classId: integer("class_id").notNull().references(() => classes.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  phone: text("phone"),
});

export const classSessions = pgTable("class_sessions", {
  id: serial("id").primaryKey(),
  classId: integer("class_id").notNull().references(() => classes.id, { onDelete: "cascade" }),
  date: timestamp("date").notNull(),
  lesson: text("lesson"),
  childrenCount: integer("children_count").default(0).notNull(),
  notes: text("notes"),
});

// ---------- Louange ----------
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
  serviceId: integer("service_id").notNull().references(() => services.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  person: text("person").notNull(),
});

export const setlist = pgTable("setlist", {
  id: serial("id").primaryKey(),
  serviceId: integer("service_id").notNull().references(() => services.id, { onDelete: "cascade" }),
  songId: integer("song_id").notNull().references(() => songs.id, { onDelete: "cascade" }),
  position: integer("position").notNull(),
});

// ---------- Pastorat ----------
export const prayerRequests = pgTable("prayer_requests", {
  id: serial("id").primaryKey(),
  name: text("name"),
  email: text("email"),
  message: text("message").notNull(),
  // Visible seulement par le pastorat (et l'admin)
  isPrivate: boolean("is_private").default(false).notNull(),
  // nouveau / en_priere / exauce
  status: text("status").default("nouveau").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const visits = pgTable("visits", {
  id: serial("id").primaryKey(),
  memberId: integer("member_id").references(() => members.id, { onDelete: "set null" }),
  personName: text("person_name").notNull(),
  visitedBy: text("visited_by").notNull(),
  date: timestamp("date").notNull(),
  notes: text("notes"),
});

export const sermonPlans = pgTable("sermon_plans", {
  id: serial("id").primaryKey(),
  date: timestamp("date").notNull(),
  speaker: text("speaker").notNull(),
  title: text("title"),
  scripture: text("scripture"),
  notes: text("notes"),
});

// ---------- Trésorerie ----------
export const offerings = pgTable("offerings", {
  id: serial("id").primaryKey(),
  date: timestamp("date").notNull(),
  // dime / offrande / projet / autre
  fund: text("fund").notNull(),
  amountCents: integer("amount_cents").notNull(),
  countedBy: text("counted_by").notNull(),
  notes: text("notes"),
});

export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  date: timestamp("date").notNull(),
  category: text("category").notNull(),
  description: text("description"),
  amountCents: integer("amount_cents").notNull(),
  receiptPathname: text("receipt_pathname"),
  approvedBy: text("approved_by"),
});

// ---------- Média ----------
export const sermons = pgTable("sermons", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  speaker: text("speaker"),
  date: timestamp("date").notNull(),
  youtubeId: text("youtube_id"),
  audioPathname: text("audio_pathname"),
  series: text("series"),
  scripture: text("scripture"),
  published: boolean("published").default(true).notNull(),
});

export const bulletins = pgTable("bulletins", {
  id: serial("id").primaryKey(),
  weekOf: timestamp("week_of").notNull(),
  pathname: text("pathname").notNull(),
  notes: text("notes"),
});

export const mediaPosts = pgTable("media_posts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  // photo / social / annonce
  kind: text("kind").notNull(),
  pathname: text("pathname"),
  link: text("link"),
  publishAt: timestamp("publish_at"),
  // idee / pret / publie
  status: text("status").default("idee").notNull(),
});

// ---------- Vie de l'église (publications des départements) ----------
export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  // Département auteur (slug, ex. "jeunesse")
  department: text("department").notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  titleEn: text("title_en"),
  bodyEn: text("body_en"),
  // Photo dans le stockage Blob, dossier public/vie
  photoPathname: text("photo_pathname"),
  published: boolean("published").default(false).notNull(),
  publishedAt: timestamp("published_at"),
  createdBy: text("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ---------- Comptage du Sabbat (en direct) ----------
export const attendanceLive = pgTable(
  "attendance_live",
  {
    id: serial("id").primaryKey(),
    // Date du Sabbat (AAAA-MM-JJ, heure d'Indianapolis)
    date: date("date", { mode: "string" }).notNull(),
    // adultes / enfants / visiteurs
    category: text("category").notNull(),
    count: integer("count").default(0).notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [unique("attendance_live_date_category").on(t.date, t.category)],
);

// Historique des présences par Sabbat (après clôture)
export const servicesAttendance = pgTable("services_attendance", {
  id: serial("id").primaryKey(),
  date: date("date", { mode: "string" }).notNull().unique(),
  adultes: integer("adultes").default(0).notNull(),
  enfants: integer("enfants").default(0).notNull(),
  visiteurs: integer("visiteurs").default(0).notNull(),
  total: integer("total").default(0).notNull(),
  closedBy: text("closed_by"),
  closedAt: timestamp("closed_at").defaultNow().notNull(),
});

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

// ---------- Journal ----------
export const auditLog = pgTable("audit_log", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  userName: text("user_name").notNull(),
  action: text("action").notNull(),
  entity: text("entity").notNull(),
  entityId: text("entity_id"),
  at: timestamp("at").defaultNow().notNull(),
});
