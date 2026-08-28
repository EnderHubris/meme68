import { CheckCookies, IsAdmin } from "$lib/server_utils";
import { redirect } from "@sveltejs/kit";

export const load = async ({ cookies, getClientAddress }) => {
    console.log("[*] Admin Page Loading...");

    // if cookies are invalid redirect to login
    if (!await CheckCookies({ cookies, getClientAddress })) {
        console.log(" |___ Attempted Admin Access with invalid Cookie!");
        throw redirect(303, "/login");
    }

    const sid = cookies.get("sessid");
    if (!await IsAdmin(sid)) {
        console.log(` |___ SID: ${sid} does not belong to an Admin!`);
        throw redirect(303, "/");
    }
    console.log(` |___ SID: ${sid} is an Admin!`);
};