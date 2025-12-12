import mysql from 'mysql2/promise';

import * as dotenv from "dotenv";
import { expand } from "dotenv-expand";
expand(dotenv.config());

import assert from "assert";

// ENV check
assert(process.env.DB_USER && process.env.DB_PASS && process.env.DB_NAME, "[-] Missing ENV values!");
console.log("[+] ENV properly configured!");

const db = mysql.createPool({
    host: 'localhost',
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
 * @param {Array} params
 * @returns {mysql.QueryResult} MySQL rows array
**/
export async function query(sql, params) {
    const [rows] = await db.execute(sql, params);
    return rows; // rows is an array of objects
}