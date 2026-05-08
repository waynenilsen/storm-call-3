-- Performant contact search: pg_trgm enables ILIKE %x% via GIN trigram indexes,
-- and the composite covers the (organizationId, createdAt DESC, id DESC) list path.
-- pg_trgm extension was already created by the prior employee-search-indexes migration.

CREATE INDEX "Contact_org_createdAt_id_idx"
  ON "Contact" ("organizationId", "createdAt" DESC, "id" DESC);

CREATE INDEX "Contact_name_trgm_idx"
  ON "Contact" USING GIN (lower("name") gin_trgm_ops);

CREATE INDEX "Contact_email_trgm_idx"
  ON "Contact" USING GIN (lower("email") gin_trgm_ops);

CREATE INDEX "Contact_phone_trgm_idx"
  ON "Contact" USING GIN ("phone" gin_trgm_ops);
