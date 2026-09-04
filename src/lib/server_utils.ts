/**
 * @description This file contains methods used on SSR
 */

import { env } from "$env/dynamic/private";
import crypto from "crypto";
import { DeleteSession, FindSID, GetUserBySession } from "./database/userRules";
import { RemoveCookie } from "./browser_utils";
import { type Cookies } from "@sveltejs/kit";

let ct = Number(env.COOKIE_LIFETIME ?? process.env.COOKIE_LIFETIME);
export const cookieLifeTime = ct > 0 ? ct : 60 * 60 * 24 * 7;
console.log("Cookie Life-Time:", cookieLifeTime);

/**
 * Alias Function to generate SHA-256 Strings
 * from any input String
 * 
 * @param {string} input
 * @returns {String} SHA-256 Hash String
**/
export function Hash_SHA256(input: string) {
    input = String(input);
    return crypto.createHash("sha256").update(input).digest("hex");
}

/**
 * Verify a given session cookie exists and is not expired
 * 
 * @param cookies 
 * @returns 
 */
export async function CheckCookies(cookies: Cookies) {
    const sid = cookies.get("sessid");
    if (!sid) return false;

    if (await CheckSID(sid)) {
        return true;
    }

    await RemoveCookie(cookies);
    return false;
}

export function GenerateSID(IP: string) {
    const salt = env.SALT ?? process.env.SALT;
    let s: string = "";
    const base = "abcdefghijklmnopqrstuvwxyz1234567890";

    for (let i = 0; i < salt.length; ++i) {
        for (let k = 0; k < IP.length; ++k) {
            const pos = (salt[i].charCodeAt(0) + IP[k].charCodeAt(0)) % base.length;
            s += base[pos];
        }
    }
    s += new Date().getTime().toString();
    
    // incase the hash string is too long ensure the string size fits
    return Hash_SHA256(s).slice(0, 35);
}

/**
 * Checks a given session for expiration
 * 
 * @param session 
 * @returns 
 */
export async function IsExpired(session: {
    sid: string;
    uid: string;
    createdAt: Date;
    expiresAt: Date;
} | undefined | null) {
    if (!session) return true;

    if (Date.now() >= session.expiresAt.getTime()) {
        await DeleteSession(session.sid);
        return true;
    }

    return false;
}

export async function CheckSID(sid: string) {
    try {
        const session = await FindSID(sid);
        if (!session) return false;
        return !(await IsExpired(session));
    } catch (e: any) {
        console.error("[-] CheckSID:", e);
        return false;
    }
}

export async function IsAdmin(sid: string | undefined | null) {
    if (!sid) return false;
    const user = await GetUserBySession(sid);
    if (!user) return false;
    return user.isAdmin;
}