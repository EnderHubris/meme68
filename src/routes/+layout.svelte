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
        if (verifying) return;
        verifying = true;

        const response = await fetch("http://localhost:4000/verify_auth", {
            method: "GET",
            credentials: "include"
        });

        const data = await response.json();

        const oldState = loggedOn;
        loggedOn = data?.message === "Session Valid";

        // only execute the logout once
        if (oldState && !loggedOn) {
            await handleLogout();
        }

        verifying = false;
    }

    onMount(() => {
        Verify();

        afterNavigate(() => {
            // Only verify again if the user is logged in
            if (loggedOn) Verify();
        });
    });
</script>

<!-- these tags are shared between all pages in the site -->
<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<nav class="navbar navbar-expand-lg navbar-light bg-light fixed-top">
  <div class="container">
    <a class="navbar-brand" href="/">meme68</a>

    <!-- Mobile toggle -->
    <button
      class="navbar-toggler"
      type="button"
      data-bs-toggle="collapse"
      data-bs-target="#mainNavbar"
    >
      <span class="navbar-toggler-icon"></span>
    </button>

    <div class="collapse navbar-collapse" id="mainNavbar">
      <!-- LEFT dropdown -->
      <ul class="navbar-nav me-auto">
        <li class="nav-item dropdown">
          <a
            class="nav-link dropdown-toggle"
            href="#"
            role="button"
            data-bs-toggle="dropdown"
          >
            Menu
          </a>
          <ul class="dropdown-menu">
            <li><a class="dropdown-item" href="/">Home</a></li>
            <li><a class="dropdown-item" href="/admin">Admin</a></li>
            <!-- add more links here -->
          </ul>
        </li>
      </ul>

      <!-- RIGHT dropdown (auth) -->
      <ul class="navbar-nav ms-auto">
        <li class="nav-item dropdown">
          <a
            class="nav-link dropdown-toggle"
            href="#"
            role="button"
            data-bs-toggle="dropdown"
          >
            Account
          </a>

          <ul class="dropdown-menu dropdown-menu-end">
            {#if !loggedOn}
              <li><a class="dropdown-item" href="/login">Login</a></li>
              <li><a class="dropdown-item" href="/register">Register</a></li>
            {:else}
              <li>
                <a
                  class="dropdown-item text-danger"
                  href="#"
                  on:click|preventDefault={handleLogout}
                >
                  Logout
                </a>
              </li>
            {/if}
          </ul>
        </li>
      </ul>
    </div>
  </div>
</nav>

<!-- potentially required by all layout files to render page contents -->
<main class="container mt-5 pt-5">
    <!-- renders content from +page.svelte -->
    {@render children()}
</main>

<footer class="container mt-5 pt-5 text-center">
    meme68 &copy; 2025
</footer>