import { NotifyFeedback } from '$lib/feedback';

export const LikeMeme = async (event: Event, mid: string) => {
    event.preventDefault();

    const response = await fetch(`${import.meta.env.VITE_BACKEND_ROOT}/like_meme`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ mid: mid })
    });
    const data = await response.json();

    if (data && data.message) {
        NotifyFeedback(data.message);
    }
};

export const DisikeMeme = async (event: Event, mid: string) => {
    event.preventDefault();

    const response = await fetch(`${import.meta.env.VITE_BACKEND_ROOT}/dislike_meme`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ mid: mid })
    });
    const data = await response.json();

    if (data && data.message) {
        NotifyFeedback(data.message);
    }
};

export const ShareMeme = async (event: Event, mid: string) => {
    event.preventDefault();

    const memeUrl = `${window.location.href}meme/${mid}`;

    if (navigator.share) {
        // Prefer native share sheet (mobile) when available
        try {
            await navigator.share({ url: memeUrl });
            console.log("Shared successfully!");
        } catch (err) {
            console.error("Error sharing:", err);
        }
    } else if (navigator.clipboard) {
        // Fallback: copy to clipboard (desktop)
        try {
            await navigator.clipboard.writeText(memeUrl);

            const toast = document.createElement("div");
            toast.textContent = "Link copied to clipboard!";
            toast.className = "position-fixed bottom-0 end-0 m-3 p-2 bg-dark text-white rounded shadow";
            toast.style.zIndex = "9999";
            document.body.appendChild(toast);

            setTimeout(() => toast.remove(), 2000);
        } catch (err) {
            console.error("Failed to copy:", err);
        }
    } else {
        alert("Cannot share this link. Copy manually: " + memeUrl);
    }
};

export const ViewMore = (event: Event, mid: string) => {
    window.location.href = "/meme/" + mid
}