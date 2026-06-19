import mysql from 'mysql2/promise';

import * as dotenv from "dotenv";
import { expand } from "dotenv-expand";
expand(dotenv.config());

import { Hash_SHA256 } from "./utils.js";

import assert from "assert";

// ENV check
assert(process.env.DB_HOST && process.env.DB_USER && process.env.DB_PASS && process.env.DB_NAME, "[-] Missing ENV values!");
console.log("[+] ENV properly configured!");

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

/**
 * Alias Function to Query Database
 *
 * @param {string} sql - SQL-Query with PlaceHolders
 * @param {Array<any>} params
 * @returns {mysql.QueryResult} MySQL rows array
**/
export async function query(sql, params = []) {
    const [rows] = await db.execute(sql, params);
    return rows; // rows is an array of objects
}

// Initial DB setup
async function Initialize() {
    console.log("[*] Initializing. . .");

    try {
        await query(`
            CREATE TABLE IF NOT EXISTS \`memes\` (
                \`mid\` varchar(256) NOT NULL,
                \`file_ext\` varchar(8) NOT NULL,
                \`likes\` bigint unsigned DEFAULT '0',
                \`tagString\` text NOT NULL,
                \`created_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (\`mid\`),
                UNIQUE KEY \`mid\` (\`mid\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
        `);

        await query(`
            CREATE TABLE IF NOT EXISTS meme_of_the_day (
                id TINYINT NOT NULL PRIMARY KEY CHECK (id = 1),
                mid VARCHAR(256) NOT NULL,
                selected_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await query(`
            CREATE TABLE IF NOT EXISTS \`users\` (
                \`id\` int NOT NULL AUTO_INCREMENT,
                \`username\` varchar(50) NOT NULL,
                \`email\` varchar(100) NOT NULL,
                \`password_hash\` varchar(255) NOT NULL,
                \`created_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
                \`admin\` tinyint(1) DEFAULT '0',
                \`liked_memes\` JSON NOT NULL DEFAULT (JSON_ARRAY()),
                PRIMARY KEY (\`id\`),
                UNIQUE KEY \`username\` (\`username\`),
                UNIQUE KEY \`email\` (\`email\`)
            ) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
        `);

        // create default admin user
        const rows = await query(
            "SELECT * FROM users WHERE username = ?",
            [process.env.DEFAULT_ADM]
        );
        if (rows.length === 0) {
            const hashed_password = Hash_SHA256(process.env.DEFAULT_ADM_PASS);
            await query(
                "INSERT INTO users (username, email, password_hash, admin) VALUES (?, ?, ?, 1)",
                [process.env.DEFAULT_ADM, process.env.DEFAULT_ADM_EMAIL, hashed_password]
            );
            console.log("[+] Created Default Admin Account!")
        } else {
            console.log("[*] Default Admin Account Exists")
        }

        await query(`
            CREATE TABLE IF NOT EXISTS \`sessions\` (
                \`sid\` bigint unsigned NOT NULL,
                \`uid\` int NOT NULL,
                \`created_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
                \`expires_at\` timestamp NULL DEFAULT ((now() + interval 3 week)),
                \`signature\` varchar(24) NOT NULL,
                PRIMARY KEY (\`sid\`),
                KEY \`uid\` (\`uid\`),
                CONSTRAINT \`sessions_ibfk_1\` FOREIGN KEY (\`uid\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
        `);

        console.log("[+] Initialization DONE!");
    } catch (err) {
        console.error("[-] Initialization FAILED:", err);
    }
}
await Initialize();