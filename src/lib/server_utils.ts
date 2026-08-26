/**
 * @description This file contains methods used on SSR
 */

import { env } from "$env/dynamic/private";
import crypto from "crypto";

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

export function GenerateSID(IP: string) {
    const salt = env.SALT ?? process.env.SALT;

    // grab random indexs
    const r = [0,0];
    for (let i = 0; i < 2; ++i)
        r[i] = Math.floor(Math.random() * salt.length-6) + 1;

    // stuff IP in between two random substrs and hash it
    let s = salt.slice(r[0], r[0]+6) + IP + salt.slice(r[1], r[1]+6);
    
    // incase the hash string is too long ensure the string size fits
    return Hash_SHA256(s).slice(0, 35);
}