-- Performant employee search: pg_trgm enables ILIKE %x% via GIN trigram indexes,
-- and the composite covers the (organizationId, createdAt DESC, id DESC) list path.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX "Employee_org_createdAt_id_idx"
  ON "Employee" ("organizationId", "createdAt" DESC, "id" DESC);

CREATE INDEX "Employee_name_trgm_idx"
  ON "Employee" USING GIN (lower("name") gin_trgm_ops);

CREATE INDEX "Employee_email_trgm_idx"
  ON "Employee" USING GIN (lower("email") gin_trgm_ops);

CREATE INDEX "Employee_phone_trgm_idx"
  ON "Employee" USING GIN ("phone" gin_trgm_ops);
