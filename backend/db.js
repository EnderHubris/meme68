import mysql from 'mysql2/promise';
import { Hash_SHA256, GenerateSID, GenerateSignature } from './utils.js';

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

async function query(sql, params) {
    const [rows] = await db.execute(sql, params);
    return rows; // rows is an array of objects
}

export async function VerifySession(sid, IP) {
    const sig = GenerateSignature(IP);
    if (sid && sig) {
        console.log(`Searching for Session with following (sid,sig) -> (${sid},${sig})`);
        const sessData = await query(
            "SELECT sid,uid FROM sessions WHERE (sid = ? AND signature = ?) LIMIT 1",
            [sid, sig]
        );
        return sessData.length > 0;
    }
    return false;
}

// user can use username or email with their password to login
export async function LoginUser(name, password, IP) {
    try {
        const password_hash = Hash_SHA256(password);
        const result = await query(
            "SELECT id,username FROM users WHERE (username = ? OR email = ?) and password_hash = ?",
            [name, name, password_hash]
        );
    
        if (result) {
            if (result.length > 0) {
                console.log("User logged in Successfully");
                const sess = await GetSession(result[0], IP);
                return sess.sid;
            } else {
                console.log("Failed to Login User");
                return null;
            }
        } else {
            console.error("Login Query Failed");
            return null;
        }
    } catch (err) {
        console.error(`Error: ${err}`);
        return null;
    }
}

async function CreateSession(user, IP) {
    try {
        const sid = GenerateSID();
        const sig = GenerateSignature(IP);

        if (!sig) {
            console.error("Error Occured generating session signature!");
            return null;
        }

        const result = await query(
            "INSERT INTO sessions (sid,uid,signature) VALUES (?, ?, ?)",
            [sid, user.id, sig]
        );
    
        if (result) {
            if (result.affectedRows === 1) {
                console.log("New Session Created!");
    
                const sessData = await query(
                    "SELECT sid, created_at, expires_at FROM sessions WHERE sid = ? AND signature = ? LIMIT 1",
                    [sid, sig]
                );

                const data = sessData[0];
    
                const sess = {
                    sid: data.sid,
                    sig: sig,
                    created_at: data.created_at,
                    expires_at: data.expires_at
                };
                return sess;
            } else {
                console.log("Failed to Create new Session");
                return null;
            }
        } else {
            console.error("Insertion Query Failed");
            return null;
        }
    } catch (err) {
        console.error(`Error: ${err}`);
        return null;
    }
}

// check if the session is expired
async function CheckSession(sess, IP) {
    try {
        if (!sess) return;
    
        if (Date.now() >= sess.expires_at) {
            // delete expired session from database
            const result = await query(
                "DELETE FROM sessions WHERE sid = ? AND signature = ?",
                [sess.sid, sess.sig]
            );
            if (result) {
                // create a new session for the user
                const rows = await query(
                    "SELECT id,username FROM users WHERE id = ?",
                    [sess.uid]
                );
                if (rows.length > 0) {
                    const user = rows[0];
                    const sess = await CreateSession(user, IP);
                    return sess;
                } else {
                    console.error(`Failed to find user with UID = ${sess.uid}`);
                    return null;
                }
            } else {
                console.error("Delete Query Failed");
                return null;
            }
        }
    
        return sess;
    } catch (err) {
        console.error(`Error: ${err}`);
        return null;
    }
}

export async function LogoutUser(sid) {
    return await DeleteSession(sid);
}
async function DeleteSession(sid) {
    const result = await query(
        "DELETE FROM sessions WHERE sid = ?",
        [sid]
    );
    if (result) {
        return true;
    } else {
        console.error("Delete Query Failed");
        return false;
    }
}

async function GetSession(user, IP) {
    try {
        // check if user has a session in the DB
        const rows = await query(
            "SELECT sid, created_at, expires_at, signature FROM sessions WHERE uid = (SELECT id FROM users WHERE username = ?)",
            [user.username]
        );
        if (rows.length > 0) {
            // grab stored session
            const data = rows[0];
    
            let sess = {
                sid: data.sid,
                sig: data.signature,
                created_at: data.created_at,
                expires_at: data.expires_at
            };
            sess = await CheckSession(sess, IP);
    
            console.log("FOUND PREVIOUS SESS:");
            console.log(sess);
            return sess;
        } else {
            // create new session
            const sess = await CreateSession(user, IP);
            console.log("NEWLY CREATED SESS:");
            console.log(sess);
            return sess;
        }
    } catch (err) {
        console.error(`Error: ${err}`);
        return null;
    }
}

export async function RegisterUser(username, email, password) {
    try {
        if (await UserExists(username, email)) {
            console.log(`User: ${username} already exists!`);
            return false;
        }

        const password_hash = Hash_SHA256(password);
        const result = await query(
            "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)",
            [username, email, password_hash]
        );
    
        if (result) {
            if (result.affectedRows === 1)
                console.log("User Registered Successfully");
            else
                console.log("Failed to Register User");
        } else {
            console.error("Insertion Query Failed");
        }
    
        return result && result.affectedRows === 1;
    } catch (err) {
        console.error(`Error: ${err}`);
        return false;
    }
}

async function UserExists(username, email) {
    try {
        const rows = await query(
            "SELECT id FROM users WHERE username = ? AND email = ?",
            [username, email]
        );
        return rows.length > 0;
    } catch (err) {
        console.error(`Error: ${err}`);
        return true;
    }
}