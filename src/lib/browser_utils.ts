/**
 * @description This file contains methods used on the front-end (.svelte)
 */

import type { ActionResult } from "@sveltejs/kit";

/**
 * Take an Action's result and parse it into a simplified object
 * 
 * @param result 
 * @returns 
 */
export async function parseResult(result: ActionResult<Record<string, unknown> | undefined, Record<string, unknown> | undefined>) {
    let error = "";
    let warning = "";
    let success = "";

    if (result.type === 'success' && result.data) {
        // perform a cast to avoid error/warning popups
        const data = result.data as {
            success: boolean;
            message?: string;
            warning?: string;
            error?: string;
        };
        
        if (data.success) {
            success = data.message ?? "";
            warning = data.warning ?? "";
        } else {
            error = data.message ?? data.error ?? 'Error Occurred!';
        }
    } else {
        error = 'Error Occurred!';
    }

    return {success, warning, error};
}