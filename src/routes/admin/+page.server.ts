import { GetAdmins, GetUsers } from "$lib/database/adminRules.js";
import { UploadFile } from "$lib/database/fileUtilities.js";
import { DeleteMeme, GetRecentMemes } from "$lib/database/memeRules";
import { GetUserBySession } from "$lib/database/userRules.js";
import { CheckCookies, IsAdmin } from "$lib/server_utils";
import { type Actions, redirect, fail } from "@sveltejs/kit";

export const load = async ({ cookies }) => {
    // if cookies are invalid redirect to login
    if (!await CheckCookies(cookies)) {
        throw redirect(303, "/login");
    }

    const sid = cookies.get("sessid");
    if (!await IsAdmin(sid)) {
        throw redirect(303, "/");
    }

    return {
        users: await GetUsers(),
        admins: await GetAdmins(),
        recentMemes: await GetRecentMemes()
    }
};

export const actions: Actions = {
	upload: async ({ request, cookies, getClientAddress }) => {
		const formData = await request.formData();
        
        const files = formData.getAll('files') as File[];
        const tags = formData.getAll('tags') as string[];

        const IP = getClientAddress();
        const sid = cookies.get("sessid");
        const uid = (await GetUserBySession(sid))?.id ?? "unknown";

        try {
            // auth. check
            if (!sid || !await CheckCookies(cookies)) {
                console.log(`[-] UID: ${uid}, IP: ${IP} -- Attempted to Upload with either an expired or bad sessid`);
                return fail(500, { success: false, error: "An error occurred during upload" });
            }

            if (!files) return { success: false, error: "No files were provided" }
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const tagList = tags[i]?.split(',').map(t => t.trim()).filter(Boolean) ?? [];
                // @todo - Handle cases where not all files are uploaded
                const result = await UploadFile(file, tagList.join(','), sid);
            }
            
            return { success: true, message: "Uploaded Files Successfully!" }
        } catch (e: any) {
            console.error("[-] Upload:", e);
            return fail(500, { success: false, error: "An error occurred during upload" });
        }
	},
    delete_meme: async ({ request, cookies, getClientAddress }) => {
		const formData = await request.formData();
        const mid = formData.get("mid") as string;

        const IP = getClientAddress();
        const sid = cookies.get("sessid");
        const uid = (await GetUserBySession(sid))?.id ?? "unknown";

        try {
            // auth. check
            if (!sid || !await CheckCookies(cookies)) {
                console.log(`[-] UID: ${uid}, IP: ${IP} -- Attempted to Delete a Meme with either an expired or bad sessid`);
                return fail(500, { success: false, error: "An error occurred during upload" });
            }

            if (!mid) return { success: false, error: "Invalid Data!" }
            return await DeleteMeme(mid);
        } catch (e: any) {
            console.error("[-] Upload:", e);
            return fail(500, { success: false, error: "An error occurred during upload" });
        }
	},
};