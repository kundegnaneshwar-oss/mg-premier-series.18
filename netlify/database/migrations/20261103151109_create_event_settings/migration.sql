CREATE TABLE "event_settings" (
	"id" integer PRIMARY KEY,
	"registrations_open" boolean DEFAULT true NOT NULL,
	"session_number" text NOT NULL,
	"location" text NOT NULL,
	"maps_url" text NOT NULL
);
