import { env } from "$env/dynamic/private";

import { db } from "./db";
import * as schema from "./my-schema";

import { randomBytes } from 'crypto';
import { lstat, writeFile, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';

const ALLOWED_TYPES = [
    "image/png",
    "image/jpeg",
    "image/jpg"
];

export const CONTENT_TYPES: Record<string, string> = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg"
};

// Max File Size in MB
const MB = Number(env.MAX_FILE_SIZE ?? process.env.MAX_FILE_SIZE ?? 15);
export const MAX_FILE_SIZE = MB * 1024 * 1024;
export const UPLOAD_DIR = String(env.UPLOADS_DIR ?? process.env.UPLOADS_DIR ?? "./uploads");

async function IsSymlink(file: File) {
    try {
        const buffer = Buffer.from(await file.arrayBuffer());
        
        // write the file outside of uploads to test it before
        // writing to uploads, prevents symlinks from potentially
        // becoming accessible for a small time-frame
        const ext = path.extname(file.name);
        const randomName = randomBytes(16).toString("hex");
        const testPath = path.join("/tmp", randomName + ext);
        await writeFile(testPath, buffer);

        // fetch file information and remove tmp file
        const stats = await lstat(testPath);
        await rm(testPath, { force: true });

        return stats.isSymbolicLink();
    } catch (e: any) {
        // assume true for safety
        console.error('[-] Error Checking if Symlink:', e);
        return true;
    }
}

/**
 * 
 * @param mid file name
 * @param ext file extension
 * @param tagList string of tags in comma-separated format
 * @returns whether or not a given meme was inserted into the DB
 */
async function AddMeme(mid: string, ext: string, tagList: string) {
    try {
        await db.insert(schema.memes).values({
            mid: mid,
            fileExt: ext,
            tagString: tagList
        });
        return true;
    } catch (e: any) {
        console.error("[-] AddMeme:", e);
        return false;
    }
}

export async function UploadFile(file: File | undefined | null, tagList:string, sid: string) {
    if (!file) return { success: false };

    // ensure the uploads folder exists
    await mkdir(UPLOAD_DIR, { recursive: true });

    try {
        if (file.size > MAX_FILE_SIZE) {
            return { success: false, error: `File size exceeds ${MB}MB` }
        }

        if (await IsSymlink(file)) {
            console.log("[-] ");
            return { success: false, error: "File contains symlink" }
        }

        // we create the file name used in path.join, user cannot control the upload destination
        const buffer = Buffer.from(await file.arrayBuffer());
        const ext = path.extname(file.name);
        const randomName = randomBytes(16).toString("hex");

        const filePath = path.join(UPLOAD_DIR, randomName + ext);

        if (!await AddMeme(randomName, ext, tagList)) {
            return { success: false, error: "Could not insert new meme" };
        }
        await writeFile(filePath, buffer);
    } catch (e: any) {
        console.error("[-] UploadFile:", e);
        return { success: false };
    }
}

export async function DeleteFile(fname: string) {
    try {
        let filePath = path.join(UPLOAD_DIR, fname);
        filePath = path.normalize(filePath);
        filePath = path.resolve(filePath);

        if (!filePath.startsWith(UPLOAD_DIR)) {
            console.error("[!] Potential Malicious Deletion:", fname);
            throw new Error("Malformed");
        }

        await rm(filePath, { force: true });
        return true;
    } catch (e: any) {
        // do not consume this throw
        if (e.message === "Malformed") throw e;
        console.error("[-] DeleteFile:", e);
        return false;
    }
}