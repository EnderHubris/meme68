/**
 * @description Handles admin-related actions involving fetching users/admins
 */

import { db } from "./db";
import { eq } from "drizzle-orm";
import * as schema from "./my-schema";

export async function GetUsers() {
    try {
        return await db.select({
            id: schema.users.id,
            username: schema.users.username,
            email: schema.users.email,
            createdAt: schema.users.createdAt
        }).from(schema.users).where(eq(schema.users.admin, false));
    } catch (e: any) {
        console.error("[-] GetUsers:", e);
        return [];
    }
}

export async function GetAdmins() {
    try {
        return await db.select({
            id: schema.users.id,
            username: schema.users.username,
            email: schema.users.email,
            createdAt: schema.users.createdAt
        }).from(schema.users).where(eq(schema.users.admin, true));
    } catch (e: any) {
        console.error("[-] GetAdmins:", e);
        return [];
    }
}