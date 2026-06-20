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

    let dark = $state(false);
    
    function styleComponents() {
        // applying custom coloring to navbar
        const navbar = document.getElementById("mainNavbar")
        if (navbar) {
            navbar.style.backgroundColor = dark ? "#37414a" : "#e6e6e6";
        }

        // applying custom coloring to specific forms
        const form = document.getElementById("dataForm")
        if (form) {
            form.style.backgroundColor = dark ? "#233242" : "#e6e6e6";
        }
    }
    function toggleTheme() {
        dark = !dark;
        styleComponents();

        const theme = dark ? 'dark' : 'light';
        document.documentElement.setAttribute('data-bs-theme', theme);
        localStorage.setItem('theme', theme);
    }
    function loadTheme() {
        const saved = localStorage.getItem('theme') || 'light';
        dark = saved === 'dark';

        styleComponents();
        document.documentElement.setAttribute('data-bs-theme', saved);
    }

    // restore preference on load
    if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('theme');
        dark = saved === 'dark';
        document.documentElement.classList.toggle('dark', dark);
    }

	let { children } = $props();
    let loggedOn = $state(false); // state variables can be used to do conditioned-HTML-rendering
    let isAdmin = $state(false);
    let verifying = $state(false);
    let displayName = $state("Account");

    async function Verify() {
        if (verifying) return;
        verifying = true;

        const response = await fetch(`${import.meta.env.VITE_BACKEND_ROOT}/verify_auth`, {
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

    async function CheckAdmin() {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_ROOT}/is_admin`, {
            method: "GET",
            credentials: 'include'  // ensures cookies are sent
        });
        const data = await response.json();
        isAdmin = data && data.is_admin;
    }

    async function FindUsername() {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_ROOT}/say_my_name`, {
            method: "GET",
            credentials: 'include'  // ensures cookies are sent
        });
        const data = await response.json();
        displayName = data.username || "Account";
    }

    onMount(() => {
        loadTheme();
        
        Verify();
        CheckAdmin();
        FindUsername();

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

<nav id="mainNavbar" class="navbar navbar-expand-lg fixed-top">
  <div class="container">
    <a class="navbar-brand" href="/">meme68</a>

    <!-- Mobile toggle -->
    <button
      class="navbar-toggler"
      type="button"
      data-bs-toggle="collapse"
      data-bs-target="#userNavbar"
    >
      <span class="navbar-toggler-icon"></span>
    </button>

    <div class="collapse navbar-collapse" id="userNavbar">
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
            <li><a class="dropdown-item" href="/events">Events</a></li>
            {#if loggedOn && isAdmin}
              <li><a class="dropdown-item" href="/admin">Admin</a></li>
            {/if}
            <!-- add more links here -->
          </ul>
        </li>
      </ul>

      <!-- RIGHT dropdown (auth) -->
       <div class="d-flex align-items-center ms-auto gap-2">
            <ul class="navbar-nav">
                <li class="nav-item dropdown">
                <a
                    class="nav-link dropdown-toggle"
                    href="#"
                    role="button"
                    data-bs-toggle="dropdown"
                >
                    {displayName}
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
                        onclick={handleLogout}
                        >
                        Logout
                        </a>
                    </li>
                    {/if}
                </ul>
                </li>
            </ul>

            <button
                class="btn btn-outline-secondary btn-sm"
                onclick={toggleTheme}
            >
                {dark ? '🌙' : '☀️'}
            </button>
        </div>

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