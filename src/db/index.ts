import { createDatabase } from "@kilocode/app-builder-db";
import * as schema from "./schema";

// Lazy initialization to avoid build-time database connection
let _db: ReturnType<typeof createDatabase<typeof schema>> | null = null;

export function getDb() {
  if (!_db) {
    _db = createDatabase(schema);
  }
  return _db;
}

export const db = {
  get query() {
    return getDb().query;
  },
  get insert() {
    return getDb().insert;
  },
  get update() {
    return getDb().update;
  },
  get delete() {
    return getDb().delete;
  },
  get select() {
    return getDb().select;
  },
};
