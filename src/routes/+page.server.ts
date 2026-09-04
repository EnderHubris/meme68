import { GetMemes } from "$lib/database/memeRules";

export const load = async ({ url }) => {
    const page = url.searchParams.get('page') ?? "1";
    const pageNum = Number(page);
    return {
        memes: await GetMemes(pageNum),
        page: pageNum
    };
};