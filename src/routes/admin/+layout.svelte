<script lang="ts">
/* 
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
@@@@ THIS LAYOUT IS APPLIED TO ALL PAGES WITHIN THE /ADMIN DIRECTORY @@@@
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
*/
    import { onMount } from 'svelte';
    import { afterNavigate } from '$app/navigation';

    let verifying = $state(false);
    async function Verify() {
        // bottle neck number of times this function executes on client-side
        if (verifying) return;
        verifying = true;

        const response = await fetch(`http://localhost:4000/is_admin`, {
            method: "GET",
            credentials: 'include'  // ensures cookies are sent
        });
        const data = await response.json();
        if (data) {
            if (!data.is_admin) {
                window.location.href = "/";
            }
        }
        verifying = false;
    }

    // runs on page load
    onMount(() => {
        // executes only once on initial load
        Verify();

        // execute on redirect
        afterNavigate(() => {
            Verify();
        });
    })
</script>