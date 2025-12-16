<script lang="ts">
    import { onMount } from 'svelte';
    import { NotifyFeedback } from '$lib/feedback';

    let username = "";
    let email = "";
    let password = "";

    let admins: any[] = [];
    let error = "";
    let loading = false;

    const GetAdmins = async () => {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_ROOT}/admin/fetch`, {
            credentials: "include"
        });

        if (!response.ok) {
            throw new Error("Failed to fetch admins");
        }

        return response.json();
    };

    async function populate() {
        try {
            loading = true;
            error = "";
            
            const data = await GetAdmins();
            admins = Array.isArray(data) ? data : data.admins ?? [];

            if (admins.length === 0) {
                error = "No Admins Exist";
            }
        } catch {
            error = "Failed to load admins";
        } finally {
            loading = false;
        }
    }

    const removeAdmin = async (event: Event, adm_username: string) => {
        event.preventDefault();

        if (window.confirm("Are you sure?")) {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_ROOT}/admin/remove`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ username: adm_username })
            });

            const data = await response.json();

            if (data && data.message) {
                NotifyFeedback(data.message);
            }
    
            // refresh list
            await populate();
        }
    };

    const createAdmin = async (event: Event) => {
        event.preventDefault();

        if (window.confirm("Do you trust this person?")) {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_ROOT}/admin/create`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ username, email, password })
            });
    
            if (!response.ok) {
                error = "Failed to create admin";
                return;
            }

            const data = await response.json();

            if (data && data.message) {
                NotifyFeedback(data.message);
            }
    
            // reset form
            username = "";
            email = "";
            password = "";
    
            // refresh list
            await populate();
        }
    };

    onMount(populate);
</script>

<h2 class="mb-4 text-center">👤 Current Admins</h2>
<div class="container" style="max-width: 500px;">
    <a class="navbar-brand btn btn-outline-secondary" href="/admin">Back</a>
</div><hr>

<div class="d-flex justify-content-center align-items-center" style="padding: 25px;">
  <form class="p-4 bg-white shadow rounded" style="width: 100%; max-width: 400px;" on:submit={createAdmin}>
    <h2 class="mb-4 text-center">Create Admin</h2>

    <div class="mb-3">
      <label for="username" class="form-label">Username</label>
      <input
        type="username"
        class="form-control"
        id="username"
        bind:value={username}
        placeholder="Enter Username"
        required
      />
    </div>

    <div class="mb-3">
      <label for="email" class="form-label">Email</label>
      <input
        type="email"
        class="form-control"
        id="email"
        bind:value={email}
        placeholder="Enter Email"
        required
      />
    </div>

    <div class="mb-3">
      <label for="password" class="form-label">Password</label>
      <input
        type="password"
        class="form-control"
        id="password"
        bind:value={password}
        placeholder="Password"
        required
      />
    </div>

    <button type="submit" class="btn btn-primary w-100">Submit</button>
  </form>
</div><hr>

<div class="container my-5 d-flex justify-content-center">
  <div class="card shadow-sm" style="max-width: 1000px; width: 100%;">
    <div class="card-body text-center">
      <h5 class="card-title mb-4">Admins</h5><hr>
        <div id="admin-users" class="row g-3">
            {#if loading}
                <p class="text-muted">Loading admins...</p>
            {:else if error}
                <p class="text-muted">{error}</p>
            {:else}
                {#each admins as admin}
                    <div class="col-12 col-sm-6 col-md-4 col-lg-3">
                    <div class="card p-3 h-100">
                        <strong>{admin.username}</strong>
                        <div class="text-muted small mb-2">{admin.email}</div>
                        <button class="btn btn-danger w-100"
                            on:click={(event) => removeAdmin(event, admin.username)}>
                            Remove
                        </button>
                    </div>
                    </div>
                {/each}
            {/if}
        </div>
    </div>
  </div>
</div>