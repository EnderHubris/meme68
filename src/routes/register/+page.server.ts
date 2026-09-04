import { AddUser } from "$lib/database/userRules.js";
import { CheckCookies } from "$lib/server_utils.js";
import { fail, isRedirect, redirect } from "@sveltejs/kit";

export const load = async ({ cookies }) => {
    // if cookies are valid and present go back to home
    if (await CheckCookies(cookies))
        throw redirect(303, "/");
};

export const actions = {
    register: async ({ request }) => {
        const form = await request.formData();
        const formData = Object.fromEntries(form.entries()) as Record<string, string>;

        try {
            const addedUser = await AddUser(formData.username, formData.email, formData.password);
            if (!addedUser)
                throw fail(500, { success: false, error: "Registeration Failed" });
            throw redirect(303, '/login');
        } catch (e: any) {
            if (isRedirect(e))
                throw e;
            
            console.error("[-] Register:", e);
            return fail(500, { success: false, error: "An error occurred during registering" })
        }
    },
};