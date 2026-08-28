import { sql } from "drizzle-orm";
import {
    mysqlTable, varchar, bigint,
    text, timestamp, boolean,
    json, unique,
} from "drizzle-orm/mysql-core";

export const memes = mysqlTable("memes", {
    mid: varchar("mid", { length: 256 }).primaryKey(),
    fileExt: varchar("file_ext", { length: 8 }).notNull(),
    likes: bigint("likes", { mode: "number", unsigned: true }).default(0),
    tagString: text("tagString").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
});

export const memeOfTheDay = mysqlTable("meme_of_the_day", {
    id: varchar("id", { length: 36 })
        .primaryKey()
        .$defaultFn(() => crypto.randomUUID()),
    mid: varchar("mid", { length: 256 }),
    updatedAt: timestamp("updatedAt"),
});

export const users = mysqlTable(
  "users",
  {
        id: varchar("id", { length: 36 })
        .primaryKey()
        .$defaultFn(() => crypto.randomUUID()),
        username: varchar("username", { length: 50 }).notNull(),
        email: varchar("email", { length: 100 }).notNull(),
        passwordHash: varchar("password_hash", { length: 255 }).notNull(),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        admin: boolean("admin").default(false).notNull(),
        likedMemes: json("liked_memes")
        .$type<string[]>()
        .notNull()
        .default(sql`(json_array())`),
  },
  (table) => ({
        usernameUnique: unique("username").on(table.username),
        emailUnique: unique("email").on(table.email),
  })
);

export const sessions = mysqlTable("sessions", {
    sid: varchar("sid", { length: 36 })
        .primaryKey()
        .$defaultFn(() => crypto.randomUUID()),
    uid: varchar("uid", { length: 36 })
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
});