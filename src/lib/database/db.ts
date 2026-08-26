import { env } from "$env/dynamic/private";
import { drizzle } from "drizzle-orm/mysql2";

const dbu = env.DB_USER ?? process.env.DB_USER;
const dbupwd = env.DB_PASS ?? process.env.DB_PASS;
const dbuhost = env.DB_HOST ?? process.env.DB_HOST;
const dbname = env.DB_NAME ?? process.env.DB_NAME;
const db_uri = `mysql://${dbu}:${dbupwd}@${dbuhost}/${dbname}`;
export const db = drizzle(db_uri);

export interface Meme {
    mid: string;
    fileExt: string;
    likes: number;
    tagString: string;
    createdAt: Date;
};

export interface User {
    id: string;
    username: string;
    email: string;
    passwordHash: string;
    createdAt: Date;
    admin: boolean;
    likedMemes: string[];
};

export interface UserSession {
    sid: string;
    uid: string;
    createdAt: Date;
    expiresAt: Date;
    signature: string;
};