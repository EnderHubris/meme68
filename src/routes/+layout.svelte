<script lang="ts">
/* 
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
@@@@ THIS LAYOUT IS APPLIED TO ALL PAGES WITHIN THE PROJECT @@@@
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
*/
	import favicon from '$lib/assets/favicon.svg';

    import { onMount } from 'svelte';
    import { afterNavigate } from '$app/navigation';
    
    import { handleLogout } from '$lib/auth';

    import "bootstrap/dist/css/bootstrap.min.css";

	let { children } = $props();
    let loggedOn = $state(false); // state variables can be used to do conditioned-HTML-rendering

    let verifying = $state(false);
    async function Verify() {
        // bottle neck number of times this function executes on client-side
        if (verifying) return;
        verifying = true;

        const response = await fetch(`http://localhost:4000/verify_auth`, {
            method: "GET",
            credentials: 'include'  // ensures cookies are sent
        });
        const data = await response.json();
        if (data) {
            loggedOn = data.message !== "Invalid Session";
            if (data.message === "Invalid Session") {
                handleLogout();
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

<!-- these tags are shared between all pages in the site -->
<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<nav class="navbar navbar-expand-lg navbar-light bg-light fixed-top">
  <div class="container">
    <a class="navbar-brand" href="/">Home</a>
    <a class="nav-link" href="/admin">Admin</a>

    <div class="collapse navbar-collapse">
      <ul class="navbar-nav ms-auto">
        {#if !loggedOn}
            <li class="nav-item">
                <a class="nav-link" href="/login">Login</a>
            </li>
            <li class="nav-item">
                <a class="nav-link" href="/register">Register</a>
            </li>
        {:else}
            <li class="nav-item">
                <a href="#" class="nav-link" on:click|preventDefault={handleLogout}>Logout</a>
            </li>
        {/if}
      </ul>
    </div>
  </div>
</nav>

<main class="container mt-5 pt-5">
    <!-- renders content from +page.svelte -->
    {@render children()}
</main>

<footer class="container mt-5 pt-5 text-center">
    meme68 &copy; 2025 Ender
</footer>