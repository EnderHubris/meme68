import { error, isHttpError, isRedirect } from "@sveltejs/kit";
import { CONTENT_TYPES, UPLOAD_DIR } from "$lib/database/fileUtilities";

import { readFile } from 'node:fs/promises';
import path from 'node:path';

export const GET = async ({ params }) => {

    // mitigations for LFI
    const requestedPath = path.resolve(
        path.normalize(
            path.join(UPLOAD_DIR, params.file ?? "")
        )
    );
    console.log(`[*] Attempting to Access: ${requestedPath}`);

    if (!requestedPath.startsWith(UPLOAD_DIR)) {
        throw error(403, "Access denied.");
    }

    try {
        const file = await readFile(requestedPath);
        const filename = path.basename(requestedPath);
        const fileExt = path.extname(filename);
        const contentType = CONTENT_TYPES[fileExt];

        if (!contentType) {
            throw error(406, "Invalid file extension");
        }

        return new Response(file, {
            headers: {
                "Content-Type": contentType,
                "Content-Disposition": `inline; filename="${filename}"`,
                "Content-Length": file.length.toString()
            }
        });
    } catch (e: any) {
        if (isRedirect(e) || isHttpError(e))
            throw e;

        console.log("[-] View:", e);
        throw error(404, "File not found.");
    }
};