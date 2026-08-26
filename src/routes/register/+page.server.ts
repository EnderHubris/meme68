import { AddUser } from "$lib/database/userRules.js";
import { fail, isRedirect, redirect } from "@sveltejs/kit";

export const load = async ({ cookies, getClientAddress }) => {
    const sid = cookies.get("sessid");
    const IP = getClientAddress();
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