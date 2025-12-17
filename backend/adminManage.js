import { query } from './db.js';
import { Hash_SHA256 } from './utils.js';
import { UserExists } from './userManage.js'

/**
 * Takes in username, email, and plain-text password to attempt creating a new user-account
 * 
 * @param {string} username - username
 * @param {string} email - email
 * @param {string} password - plain-text password
 * @returns {Promise<boolean>} Returns if the user was successfully created in the database
**/
export async function CreateAdmin(username, email, password) {
    try {
        if (await UserExists(username, email)) {
            console.log(`Admin-User: ${username} already exists!`);
            return false;
        }

        const password_hash = Hash_SHA256(password);
        const result = await query(
            "INSERT INTO users (username, email, password_hash, admin) VALUES (?, ?, ?, 1)",
            [username, email, password_hash]
        );
    
        return result && result.affectedRows === 1;
    } catch (err) {
        console.error(`Error: ${err}`);
        return false;
    }
}

/**
 * Remove a desired Admin from the database
 * 
 * @param {string} username - admin username
 * @returns {Promise<boolean>} Returns admin deletion success
**/
export async function RemoveAdmin(username) {
    try {
        // safety
        const admins = await GetAdmins();
        if (admins.length === 1) {
            console.log("There must be at least one admin in the database at all times!");
            return false;
        }

        const result = await query(
            "DELETE FROM users WHERE username = ? AND admin = 1",
            [username]
        );
    
        return result && result.affectedRows === 1;
    } catch (err) {
        console.error(`Error: ${err}`);
        return false;
    }
}

/**
 * Fetch current Admins within the database
 * 
 * @returns {Promise<Array<any>>} Returns array of usernames and emails of all admins in the DB
**/
export async function GetAdmins() {
    try {
        const rows = await query(
            "SELECT id, username, email FROM users WHERE admin = 1"
        );
    
        return rows;
    } catch (err) {
        console.error(`Error: ${err}`);
        return [];
    }
}