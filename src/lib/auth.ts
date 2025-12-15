// SHARED MODULE IS ACCESSIBLE VIA: import { ... } from '$lib/auth';

// JS Doc-String
/**
 * Redirects user to home page
 * and clears the user's cookie
 *
 * @returns {Promise<void>} Completes when logout is finished
**/
export const handleLogout = async () => {
    const response = await fetch(`${import.meta.env.VITE_BACKEND_ROOT}/logout`, {
        method: "GET",
        credentials: "include"
    });
    await response.json();
    if (window.location.href !== "/") window.location.href = "/";
};