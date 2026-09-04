import { env } from "$env/dynamic/private";
import { LoginUser } from "$lib/database/userRules.js";
import { CheckCookies, cookieLifeTime } from "$lib/server_utils";
import { fail, redirect, isRedirect } from "@sveltejs/kit";

export const load = async ({ cookies }) => {
    // if cookies are valid and present go back to home
    if (await CheckCookies(cookies))
        throw redirect(303, "/");
};

export const actions = {
    login: async ({ request, cookies, getClientAddress }) => {
        const IP = String(getClientAddress());
        const form = await request.formData();
        const formData = Object.fromEntries(form.entries()) as Record<string, string>;

        try {
            const sessid = await LoginUser(IP, formData.username, formData.password);
            if (!sessid)
                throw fail(500, { success: false, error: "Login Failed" });

            const prodStatus = env.PROD ?? process.env.PROD;
            cookies.set('sessid', sessid, {
                path: '/',
                httpOnly: true,
                secure: prodStatus ? Boolean(prodStatus) : false,
                sameSite: 'strict',
                maxAge: cookieLifeTime // defaults to 1 week
            });
            
            throw redirect(303, '/');
        } catch (e: any) {
            if (isRedirect(e))
                throw e;

            console.error("[-] Login:", e);
            return fail(500, { success: false, error: "An error occurred during Login" })
        }
    },
};