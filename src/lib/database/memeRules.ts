import { env } from "$env/dynamic/private";

import { db, type Meme } from "./db.ts";
import { desc, eq } from "drizzle-orm";
import * as schema from "./my-schema";

import { DeleteFile } from "./fileUtilities.ts";

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