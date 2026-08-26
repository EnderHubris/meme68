import { db } from "./db";
import {
    eq, and, or
} from "drizzle-orm";
import * as schema from "./my-schema";
import { GenerateSID, Hash_SHA256 } from "$lib/server_utils";

export async function GetUserByID(id: string) {
    try {
        const [user] = await db.select({
            id: schema.users.id,
            username: schema.users.username,
            email: schema.users.email,
            isAdmin: schema.users.admin,
            likedMemes: schema.users.likedMemes
        }).from(schema.users).where(eq(schema.users.id, id));
        return user;
    } catch (e: any) {
        console.error(e);
        return undefined;
    }
}
export async function GetUserBySession(sessid: string) {
    try {
        const [session] = await db.select().from(schema.sessions)
            .where(eq(schema.sessions.sid, sessid));
        if (!session) return null;
        if (new Date().getTime() >= session.expiresAt.getTime()) {
            console.log("[*] Discovered Expired Session:", sessid);
            await DeleteSession(sessid);
            return null;
        }

        const [user] = await db.select({
            id: schema.users.id,
            username: schema.users.username,
            email: schema.users.email,
            isAdmin: schema.users.admin,
            likedMemes: schema.users.likedMemes
        }).from(schema.users).where(eq(schema.users.id, session.uid));
        return user;
    } catch (e: any) {
        console.error(e);
        return null;
    }
}

async function DoesUserExist(username: string, email: string) {
    try {
        console.log(`[*] Checking if either (${username}|${email}) are in use...`);
        const result = await db.select({id: schema.users.id})
            .from(schema.users)
            .where(
                or(
                    eq(schema.users.username, username),
                    eq(schema.users.email, email)
                )
            );
        return result.length > 0;
    } catch (e: any) {
        // for safety if an error occurs assume values are taken
        console.error(e);
        return true;
    }
}

export async function AddUser(username: string, email: string, password: string) {
    try {
        if (await DoesUserExist(username, email)) return false;
        console.log("[*] Attempting to create a new user...");

        const passwordHash = Hash_SHA256(password);
        await db.insert(schema.users).values({
            username,
            email,
            passwordHash
        });
        return true;
    } catch (e: any) {
        console.error(e);
        return false;
    }
}

export async function CreateSession(IP: string, id: string) {
    try {
        console.log("[*] Attempting to create new user session...");
        const sessid = GenerateSID(IP);
    
        // link sessid to user id
        await db.insert(schema.sessions).values({
            sid: sessid,
            uid: id
        });

        console.log("[*] Session Created:", sessid);
    
        return sessid;
    } catch (e: any) {
        console.error("[-] CreateSession: ", e);
        return null;
    }
}

export async function LoginUser(IP: string, username: string, password: string) {
    try {
        console.log("[*] Attempting to authenticate user...");

        const passwordHash = Hash_SHA256(password);
        const user = await db.select({ id: schema.users.id })
            .from(schema.users)
            .where(and(
                or(
                    eq(schema.users.username, username),
                    eq(schema.users.email, username)
                ),
                eq(schema.users.passwordHash, passwordHash)
            ));
        if (user.length === 0) {
            console.log(`Login Failed from ${IP}`);
            return null;
        }

        const sessid = await CreateSession(IP, user[0].id);
        return sessid;
    } catch (e: any) {
        console.error(e);
        return false;
    }
}

export async function DeleteSession(sessid: string) {
    try {
        console.log("[*] Deleting Session:", sessid);
        await db.delete(schema.sessions).where(eq(schema.sessions.sid, sessid));
    } catch (e: any) {
        console.error("[-] DeleteSession:", e);
    }
}