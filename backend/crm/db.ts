import { SQLDatabase } from 'encore.dev/storage/sqldb';

export const crmDB = new SQLDatabase("crm", {
  migrations: "./migrations",
});
