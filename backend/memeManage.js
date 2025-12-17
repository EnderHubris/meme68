import fs from "fs";

import { NormalizeTags } from './utils.js';
import { query } from './db.js';
import { UPLOAD_DIR } from './server.js';
import { randomInt } from "crypto";

/**
 * Simple meme data fetching function
 * 
 * @param {string} mid - meme id
 * @returns {Promise<{mid:string, tagString:string, likes:number}>} Returns JSON blob containing meme information
**/
export async function GetMemeInfo(mid) {
    try {
        const row = await query(
            "SELECT mid, tagString, likes FROM memes WHERE mid = ? LIMIT 1",
            [mid]
        );
        
        return {
            mid: mid,
            tagString: row[0].tagString,
            likes: row[0].likes
        } || {
            mid: mid,
            tagString: "",
            likes: 0
        }
    } catch (err) {
        console.error(err);
        return {
            mid: mid,
            tagString: "",
            likes: 0
        }
    }
}

/**
 * Upload meme information to the Database
 * 
 * @param {any} fileName - file name of meme image
 * @param {string} tags - comma separated list string
 * @returns {Promise<boolean>} Returns if Meme upload was successful
**/
export async function UploadMeme(fileName, tags) {
    try {
        const tagString = NormalizeTags(tags) || "";
        if (!fileName) {
            console.log("Missing file-name string");
            return false;
        }

        console.log(`MEME DATA -> ${fileName} : ${tagString}`);
        
        const result = await query(
            "INSERT INTO memes (mid, tagString) VALUES (?, ?)",
            [fileName, tagString]
        );
    
        if (result) {
            if (result.affectedRows === 1)
                console.log("Meme Uploaded Successfully");
            else
                console.log("Meme Uploaded Failed");
        } else {
            console.error("Insertion Query Failed");
        }

        return result && result.affectedRows === 1;
    } catch (err) {
        // for safety assume user exists
        console.error(`Error: ${err}`);
        return false;
    }
}

/**
 * Remove meme from the Database
 * 
 * @param {string} fileName - Name of uploaded file
 * @returns {Promise<boolean>} Returns if Meme deletion was successful
**/
export async function DeleteMeme(fileName) {
    try {
        if (!fileName) {
            return false;
        }

        const filePath = UPLOAD_DIR + fileName;
        fs.unlink(filePath, (err) => {
            if (err) console.error("Failed to delete file:", err);
            else console.log("File deleted:", filePath);
        })

        // remove meme entry
        const result = await query(
            "DELETE FROM memes WHERE mid = ?",
            [fileName]
        );

        // remove entry from all users who liked the meme
        const mid = fileName;
        const pushUpdate = await query(
            `
            UPDATE users
            SET liked_memes =
                JSON_REMOVE(
                    liked_memes,
                    JSON_UNQUOTE(JSON_SEARCH(liked_memes, 'all', ?))
                )
            WHERE JSON_CONTAINS(liked_memes, JSON_QUOTE(?))
            `,
            [mid,mid]
        );

        return result && result.affectedRows === 1;
    } catch (err) {
        console.error(`Error: ${err}`);
        return false;
    }
}

/**
 * Edit meme from the Database
 * 
 * @param {string} mid - meme id
 * @param {string} newTagString - comma-separated tag list string
 * @returns {Promise<boolean>} Returns if Meme edit was successful
**/
export async function EditMeme(mid, newTagString) {
    try {
        if (!mid || !newTagString) {
            return false;
        }

        // try to clean-up the tagString (remove bad formatting)
        newTagString = NormalizeTags(newTagString);

        const result = await query(
            "UPDATE memes SET tagString = ? WHERE mid = ?",
            [newTagString, mid]
        );

        if (result && result.affectedRows === 1) {
            console.log("Meme TagString Updated")
        } else {
            console.log("Failed to Update Meme TagString")
        }

        return result && result.affectedRows === 1;
    } catch (err) {
        console.error(`Error: ${err}`);
        return false;
    }
}

/**
 * Fetch current memes within the database
 * 
 * @returns {Promise<Array<any>>} Returns array of memes in the DB
**/
export async function GetMemes() {
    try {
        const rows = await query(
            "SELECT mid, likes, tagString, created_at FROM memes"
        );
    
        return rows;
    } catch (err) {
        console.error(`Error: ${err}`);
        return [];
    }
}

/**
 * Fetch recently added memes within the database
 * 
 * @returns {Promise<Array<any>>} Returns array of recently added memes (10 max)
**/
export async function GetRecentMemes() {
    try {
        const rows = await query(
            `SELECT mid, likes, tagString, created_at 
            FROM memes
            ORDER BY created_at DESC
            LIMIT 10`
        );
    
        return rows;
    } catch (err) {
        console.error(`Error: ${err}`);
        return [];
    }
}

/**
 * User liked a meme
 * 
 * @param {string} sessid - Session ID
 * @param {string} mid - meme ID
 * @returns {Promise<boolean>} Returns if the users like action has been logged
**/
export async function LikedMeme(sessid, mid) {
    try {
        if (!sessid || !mid) {
            console.error("Invalid Parameters Given")
            return false;
        }

        const rows = await query(
            `
            SELECT JSON_CONTAINS(liked_memes, JSON_QUOTE(?)) AS liked
            FROM users
            WHERE id = (
                SELECT uid FROM sessions WHERE sid = ? LIMIT 1
            );
            `,
            [mid, sessid]
        );

        if (rows.length > 0 && rows[0].liked === 1) {
            console.log(`User already liked this meme (${mid})`);
            return false;
        }

        const applyLiked = await query(
            "UPDATE memes SET likes = likes + 1 WHERE mid = ?",
            [mid]
        );

        const updateUser = await query(
            `
            UPDATE users
            SET liked_memes =
                IF(
                    JSON_CONTAINS(liked_memes, JSON_QUOTE(?)),
                    liked_memes,
                    JSON_ARRAY_APPEND(liked_memes, '$', ?)
                )
            WHERE id = (
                SELECT uid FROM sessions WHERE sid = ? LIMIT 1
            )
            `,
            [mid, mid, sessid]
        );
        
        const success = applyLiked && applyLiked.affectedRows === 1 && updateUser && updateUser.affectedRows === 1;

        return success;
    } catch (err) {
        console.error(`Error: ${err}`);
        return false;
    }
}

/**
 * User disliked a meme
 * 
 * @param {string} sessid - Session ID
 * @param {string} mid - meme ID
 * @returns {Promise<boolean>} Returns if the users dislike action has been logged
**/
export async function DislikeMeme(sessid, mid) {
    try {
        if (!sessid || !mid) {
            console.error("Invalid Parameters Given")
            return false;
        }

        const rows = await query(
            `
            SELECT JSON_CONTAINS(liked_memes, JSON_QUOTE(?)) AS meme_present
            FROM users
            WHERE id = (
                SELECT uid FROM sessions WHERE sid = ? LIMIT 1
            );
            `,
            [mid, sessid]
        );

        if (rows.length > 0 && rows[0].meme_present === 0) {
            console.log(`meme id (${mid}) does not exist in users liked memes group`);
            return false;
        }

        const applyDisliked = await query(
            "UPDATE memes SET likes = likes - 1 WHERE mid = ?",
            [mid]
        );

        const updateUser = await query(
            `
            UPDATE users
            SET liked_memes =
                JSON_REMOVE(
                    liked_memes,
                    JSON_UNQUOTE(JSON_SEARCH(liked_memes, 'one', ?))
                )
            WHERE id = (
                SELECT uid FROM sessions WHERE sid = ? LIMIT 1
            )
            AND JSON_CONTAINS(liked_memes, JSON_QUOTE(?))
            `,
            [mid, sessid, mid]
        );

        const success = applyDisliked && applyDisliked.affectedRows === 1 && updateUser && updateUser.affectedRows === 1;

        return success;
    } catch (err) {
        console.error(`Error: ${err}`);
        return false;
    }
}

export async function UpdateMemeOfTheDay() {
    const updateEntry = async () => {
        // get all meme entries
        const rows = await query("SELECT mid FROM memes")
        if (rows) {
            // get mid from random row index
            const rmid = rows[randomInt(123456789) % rows.length]?.mid || -1;
            if (rmid !== -1) {
                // update row entry in DB
                const updated = await query(
                    `
                    INSERT INTO meme_of_the_day (id, mid)
                    VALUES (1, ?)
                    ON DUPLICATE KEY UPDATE mid = VALUES(mid), selected_at = CURRENT_TIMESTAMP;
                    `,
                    [rmid]
                )
            }
        }
        console.log("[+] MEME OF THE DAY UPDATED!");
    }

    // find meme of the day within the DB
    let row = await query(
        "SELECT mid, selected_at FROM meme_of_the_day LIMIT 1"
    );

    // initial placement
    if (row && row.length === 0) {
        await updateEntry();

        // update row data
        row = await query(
            "SELECT mid, selected_at FROM meme_of_the_day LIMIT 1"
        );
    }

    const data = (row && row[0]) ? row[0] : null;
    if (data) {
        // if its been 24 hours or more: update row entry
        const now = new Date();
        const selected = new Date(data.selected_at);

        const diffMs = now.getTime() - selected.getTime();  // difference in milliseconds
        const diffHours = diffMs / (1000 * 60 * 60);        // convert to hours

        if (diffHours >= 24) {
            await updateEntry();
        }
    }
}

export async function GetMemeOfTheDay() {
    const FetchData = async () => {
        const memeRows = await query(
            "SELECT mid, tagString, likes FROM memes WHERE mid = (SELECT mid FROM meme_of_the_day LIMIT 1) LIMIT 1"
        )

        const memeData = (memeRows && memeRows[0]) ? {
            mid: memeRows[0].mid,
            tagString: memeRows[0].tagString,
            likes: memeRows[0].likes
        } : { mid: "", tagString: "", likes: 0 };

        return memeData;
    }

    try {
        return await FetchData();
    } catch (err) {
        console.error(`Error: ${err}`);
        return {
            mid: "",
            tagString: "",
            likes: 0
        };
    }
}