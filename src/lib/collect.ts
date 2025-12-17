export const GetMemes = async () => {
    const response = await fetch(`${import.meta.env.VITE_BACKEND_ROOT}/get_memes`, {
        credentials: "include"
    });

    if (!response.ok) {
        throw new Error("Failed to fetch Memes");
    }

    return response.json();
};

export async function FetchMemes() {
    let error = "";
    let loading = false;
    let memes: any[] = [];

    try {
        loading = true;
        error = "";
        
        const data = await GetMemes();
        memes = Array.isArray(data) ? data : data.memes ?? [];

        if (memes.length === 0) {
            error = "No Memes Exist";
        }
    } catch {
        error = "Failed to load Memes";
    } finally {
        loading = false;
    }

    return {
        memes: memes,
        error: error,
        loading: loading
    }
}

const GetLikedMemes = async () => {
    const response = await fetch(`${import.meta.env.VITE_BACKEND_ROOT}/get_liked_memes`, {
        credentials: "include"
    });

    if (!response.ok) {
        throw new Error("Failed to fetch Memes");
    }

    return response.json();
};

export async function FetchLikedMemes() {
    let error = "";
    let loading = false;
    let likedMemes: any[] = [];
    
    try {
        loading = true;
        error = "";
        
        const data = await GetLikedMemes();
        likedMemes = Array.isArray(data) ? data : data.liked_memes ?? [];

        if (likedMemes.length === 0) {
            error = "You have no liked memes";
        }
    } catch {
        error = "Failed to load liked Memes";
    } finally {
        loading = false;
    }

    return {
        liked_memes: likedMemes,
        error: error,
        loading: loading
    }
}