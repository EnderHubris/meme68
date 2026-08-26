import mysql2 from "mysql2/promise";

const DB_HOST = process.env.DB_HOST;
const DB_NAME = process.env.DB_NAME;
const DB_USER = process.env.DB_USER;
const DBA_PASS = process.env.DBA_PASS;

if (!DB_NAME) {
    console.error("[-] Missing DB_NAME - skipping app-user grant step");
    process.exit(1);
}

const connection = await mysql2.createConnection({
  host: DB_HOST,
  user: "root",
  password: DBA_PASS,
  database: DB_NAME,
  multipleStatements: true,
});

try {
    await connection.query(`
        GRANT SELECT, INSERT, UPDATE, DELETE ON \`${DB_NAME}\`.* TO '${DB_USER}'@'%';
        FLUSH PRIVILEGES;
    `);
    console.log(`[+] Grants re-applied for ${DB_USER}`);
} finally {
    await connection.end();
}