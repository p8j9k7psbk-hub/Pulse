import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const devices = sqliteTable("devices", {
  id: text("id").primaryKey(),
  tokenHash: text("token_hash").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const reminders = sqliteTable("reminders", {
  id: text("id").primaryKey(),
  deviceId: text("device_id").notNull().references(() => devices.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  scheduledAt: text("scheduled_at").notNull(),
  status: text("status", { enum: ["pending", "queued", "sent", "cancelled"] }).notNull().default("pending"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const pushSubscriptions = sqliteTable("push_subscriptions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  deviceId: text("device_id").notNull().references(() => devices.id, { onDelete: "cascade" }),
  endpoint: text("endpoint").notNull().unique(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
