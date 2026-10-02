import pg from "pg";

// Return DATE columns (type id 1082) as plain "YYYY-MM-DD" text
pg.types.setTypeParser(1082, (value) => value);

export function createPool(connectionString: string) {
  return new pg.Pool({ connectionString });
}
