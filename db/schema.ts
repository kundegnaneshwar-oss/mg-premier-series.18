import { pgTable, integer, boolean, text } from 'drizzle-orm/pg-core';

export const eventSettings = pgTable('event_settings', {
  id: integer('id').primaryKey(),
  registrationsOpen: boolean('registrations_open').notNull().default(true),
  sessionNumber: text('session_number').notNull(),
  tournamentDate: text('tournament_date').notNull().default(''),
  location: text('location').notNull(),
  mapsUrl: text('maps_url').notNull(),
});
