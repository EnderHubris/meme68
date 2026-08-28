import { GetUserBySession } from '$lib/database/userRules.js';

export async function load({ cookies }) {
    return {
        user: await GetUserBySession(
            cookies.get('sessid') ?? ""
        )
    };
}