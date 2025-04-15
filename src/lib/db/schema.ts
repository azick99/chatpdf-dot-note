import {
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core'

export const userSystemEnum = pgEnum('user_system_enum', ['user', 'system'])

export const chats = pgTable('chats', {
  id: serial('id').primaryKey(),
  pdfName: text('pdf_name').notNull(),
  pdfUrl: text('pdf_url').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  fileKey: text('file_key').notNull(),
})

export const messages = pgTable('messages', {
  id: serial('id').primaryKey(),
  chatId: text('chat_id').references(() => chats.id),
  role: userSystemEnum('role').notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})
