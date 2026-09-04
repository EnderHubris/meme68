import { error, fail, isHttpError, isRedirect, type Actions, type RequestEvent } from "@sveltejs/kit";
import { GetUserBySession } from "$lib/database/userRules.js";
import { GetMemeByID, LikeMeme, UnlikeMeme } from "$lib/database/memeRules.js";
import { CheckCookies } from "$lib/server_utils.js";

// general type alias
type UserData = {
    id: string;
    username: string;
    email: string;
    isAdmin: boolean;
    likedMemes: string[];
};

function IsMemeLiked(user: UserData | undefined | null, mid: string) {
    if (!user) return false;
    const contained = user.likedMemes.find((m) => m === mid);
    return contained !== undefined;
}

export const load = async ({ url, cookies }) => {
    const mid = url.searchParams.get('id');
    if (!mid) throw error(404, "Meme not found.");

    try {
        const meme = await GetMemeByID(mid);
        if (!meme) throw error(404, "Meme not found.");

        const user = await GetUserBySession(
            cookies.get('sessid') ?? ""
        )
        const isAdmin = user?.isAdmin ?? false;

        // @todo - Possibly a way to be more efficient than handling the entire likedMemes string array
        const isLiked = IsMemeLiked(user, mid);

        return { meme, isLiked, isAdmin };
    } catch (e: any) {
        if (isRedirect(e) || isHttpError(e))
            throw e;

        console.error("[-] Meme:", e);
        throw error(500, 'Error Occurred');
    }
};

async function HandleMeme(
    { request, cookies }: Pick<RequestEvent, 'request' | 'cookies'>,
    callback: (mid: string, sid: string) => Promise<any>
) {
    try {
        const formData = await request.formData();
        const mid = formData.get("mid") as string;
        const sid = cookies.get("sessid");

        // auth. check
        if (!sid || !await CheckCookies(cookies)) {
            return fail(401, { success: false, error: "Unauthorized" });
        }

        if (!mid) return fail(400, { success: false, error: "Invalid Data!" });

        return await callback(mid, sid);
    } catch (e: any) {
        console.error("[-] HandleMeme:", e);
        return fail(500, { success: false, error: "An Error Occurred" });
    }
}

export const actions: Actions = {
    like_meme: async ({ request, cookies }) => {
        return await HandleMeme({ request, cookies }, LikeMeme);
    },
    unlike_meme: async ({ request, cookies, getClientAddress }) => {
        return await HandleMeme({ request, cookies }, UnlikeMeme);
    },
};