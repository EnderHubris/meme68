import { RemoveCookie } from '$lib/browser_utils';
import { DeleteSession } from '$lib/database/userRules.js';
import { redirect } from '@sveltejs/kit';

export async function GET({ cookies }) {
    const sessid = cookies.get("sessid");
    await RemoveCookie(cookies);
    
    try {
        await DeleteSession(sessid);
    } catch (e: any) {
        console.error("[-] Logout:", e);
    }

    throw redirect(303, '/login');
}