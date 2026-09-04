import { env } from "$env/dynamic/private";

import { db, type Meme } from "./db.ts";
import { desc, eq, sql } from "drizzle-orm";
import * as schema from "./my-schema";

import { DeleteFile } from "./fileUtilities.ts";
import { GetUserBySession } from "./userRules.ts";

let GROUP_SIZE = Number(env.GROUP_SIZE ?? process.env.GROUP_SIZE);
GROUP_SIZE = GROUP_SIZE > 0 ? GROUP_SIZE : 10;

export async function GetMemes(page: number): Promise<Meme[]> {
    try {
        const offset = (page - 1) * GROUP_SIZE;
        
        const group = await db.select().from(schema.memes)
            .orderBy(desc(schema.memes.createdAt))
            .limit(GROUP_SIZE)
            .offset(offset) ?? [];

        return group;
    } catch (e: any) {
        console.error("[-] GetMemes:", e);
        return [];
    }
}

export async function GetMemeByID(mid: string): Promise<Meme|undefined|null> {
    try {
        console.log("[*] Searching for mid:", mid);
        const [meme] = await db.select()
                        .from(schema.memes)
                        .where(eq(schema.memes.mid, mid)).limit(1);
        return meme;
    } catch (e: any) {
        console.error("[-] GetMemeByID:", e);
        return null;
    }
}

export async function GetRecentMemes(): Promise<Meme[]> {
    try {
        const group = await db.select().from(schema.memes)
            .orderBy(desc(schema.memes.createdAt))
            .limit(GROUP_SIZE) ?? [];
        return group;
    } catch (e: any) {
        console.error("[-] GetRecentMemes:", e);
        return [];
    }
}

export async function DeleteMeme(mid: string) {
    try {
        const [meme] = await db.select().from(schema.memes)
                        .where(eq(schema.memes.mid, mid)).limit(1);
        await db.delete(schema.memes).where(
            eq(schema.memes.mid, mid)
        );
        await DeleteFile(`${meme.mid}${meme.fileExt}`);
        return { success: true, message: "Deleted Meme Successfully!" };
    } catch (e: any) {
        console.error("[-] DeleteMeme:", e);
        return { success: false, message: "Error Occurred" }
    }
}

export async function UpdateMeme(mid: string, tagString: string) {
    try {
        await db.update(schema.memes)
                .set({ tagString: tagString })
                .where(eq(schema.memes.mid, mid));
        return { success: true, message: "Updated Meme Successfully!" };
    } catch (e: any) {
        console.error("[-] UpdateMeme:", e);
        return { success: false, message: "Error Occurred" }
    }
}

export async function LikeMeme(mid: string, sid: string) {
    try {
        const user = await GetUserBySession(sid);
        if (!user) return { success: false, message: "Invalid session" };

        let likedMemes = user.likedMemes;
        // already exists
        if (likedMemes.find((m) => m === mid))
            return { success: false, message: "Already Liked!" };
        likedMemes.push(mid);

        await db.update(schema.users)
            .set({
                likedMemes: likedMemes
            })
            .where(eq(schema.users.id, user.id));

        return { success: true, message: "Saved to Likes!" };
    } catch (e: any) {
        console.error("[-] LikeMeme:", e);
        return { success: false, message: "Error Occurred" };
    }
}
export async function UnlikeMeme(mid: string, sid: string) {
    try {
        const user = await GetUserBySession(sid);
        if (!user) return { success: false, message: "Invalid session" };

        let likedMemes = user.likedMemes;
        // does not exist at this time
        const index = likedMemes.indexOf(mid);
        if (index === -1)
            return { success: false, message: "Already Unliked!" };
        // remove the given index form the array
        likedMemes.splice(index, 1);

        await db.update(schema.users)
            .set({
                likedMemes: likedMemes
            })
            .where(eq(schema.users.id, user.id));

        return { success: true, message: "Removed from Likes" };
    } catch (e: any) {
        console.error("[-] UnlikeMeme:", e);
        return { success: false, message: "Error Occurred" };
    }
}