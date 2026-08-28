import mysql2 from "mysql2/promise";
import crypto from "crypto";

function Hash_SHA256(input: string) {
    input = String(input);
    return crypto.createHash("sha256").update(input).digest("hex");
}

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
    // push default admin credential upon db init
    await connection.query(
        `INSERT IGNORE INTO users (username, email, password_hash, created_at, admin) 
        VALUES (?, ?, ?, ?, ?)`,
        [
            process.env.ADM_USER,
            process.env.ADM_EMAIL,
            Hash_SHA256(process.env.ADM_PASS),
            new Date(),
            true
        ]
    );

    await connection.query(`
        GRANT SELECT, INSERT, UPDATE, DELETE ON \`${DB_NAME}\`.* TO '${DB_USER}'@'%';
        FLUSH PRIVILEGES;
    `);
    console.log(`[+] Grants re-applied for ${DB_USER}`);
} finally {
    await connection.end();
}