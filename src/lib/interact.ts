export const LikeMeme = async (event: Event, mid: string) => {
    event.preventDefault();

    const response = await fetch(`${import.meta.env.VITE_BACKEND_ROOT}/like_meme`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ mid: mid })
    });
};

export const DisikeMeme = async (event: Event, mid: string) => {
    event.preventDefault();

    const response = await fetch(`${import.meta.env.VITE_BACKEND_ROOT}/dislike_meme`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ mid: mid })
    });
};