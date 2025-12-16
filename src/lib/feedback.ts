/**
 * 
 * @param { string } msg - Message that appears on notification pop-up
 * @param { number } lifeTime - Number of seconds the pop-up stays on screen
 */
export const NotifyFeedback = (msg: string, lifeTime: number = 2) => {
    // remove existing element
    document.getElementById("feedback-alert")?.remove();
    if (lifeTime) {
        clearTimeout(lifeTime);
    }

    const toast = document.createElement("div");
    toast.id = "feedback-alert";
    toast.textContent = msg;
    toast.className =
        "position-fixed top-0 start-50 translate-middle-x mt-3 p-2 bg-dark text-white rounded shadow";
    toast.style.zIndex = "9999";

    document.body.appendChild(toast);

    lifeTime = window.setTimeout(() => {
        toast.remove();
    }, lifeTime * 1000);
}