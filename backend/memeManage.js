import fs from "fs";

import { query } from './db.js';
import { UPLOAD_DIR } from './server.js';

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
 * @param {any} file - meme image file
 * @param {string} tags - comma separated list string
 * @returns {Promise<boolean>} Returns if Meme upload was successful
**/
export async function UploadMeme(fileName, tags) {
    try {
        const tagString = tags || "";
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

        const result = await query(
            "DELETE FROM memes WHERE mid = ?",
            [fileName]
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
        if (newTagString.length > 0) {
            const tagList = newTagString
                ?.split(',')
                .map(t => t.trim().toLowerCase());

            console.log(`tag list -> ${JSON.stringify(tagList)}`)

            let cleanedTagString = "";
            for (let i = 0; i < tagList.length; ++i) {

                // remove weird characters from tags
                const tag = tagList[i]
                    .toLowerCase()
                    .trim()
                    .replace(/\s+/g, '_')       // replace space for underscore
                    .replace(/-/g, '_')         // replace hyphen for underscore
                    .replace(/[^a-z0-9_]/g, '') // only allow alphanum and underscore (no unicode or other weird chars)
                    .replace(/_+/g, '_')        // merge multiple underscores into a single underscore
                    .replace(/^_+|_+$/g, '');   // remove pre-hang and post-hang underscores

                // only write non-empty strings
                if (tag.length > 0) {
                    cleanedTagString += tag;
                    if (i < tagList.length - 1) {
                        cleanedTagString += ",";
                    }
                }
            }
            newTagString = cleanedTagString;
            console.log(`new tag string list -> ${newTagString}`)
        }

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
        
        return applyLiked && applyLiked.length === 1 && updateUser && updateUser.length === 1;
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

        return applyDisliked && applyDisliked.length === 1 && updateUser && updateUser.length === 1;
    } catch (err) {
        console.error(`Error: ${err}`);
        return false;
    }
}