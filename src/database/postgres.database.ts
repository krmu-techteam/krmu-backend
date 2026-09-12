import "dotenv/config";
import { Pool } from "pg";

export const postgresDb = new Pool({
  host: process.env.POSTGRES_HOST,
  port: Number(process.env.POSTGRES_PORT),
  user: process.env.POSTGRES_USERNAME,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DATABASE,
  max: 10,
});

postgresDb
  .query("SELECT current_database() AS database, NOW() AS time")
  .then((result) => {
    console.log("✅ PostgreSQL connected");
    console.log("Database:", result.rows[0].database);
    console.log("Time:", result.rows[0].time);
  })
  .catch((error) => {
    console.error("❌ PostgreSQL connection failed");
    console.error(error.message);
  });