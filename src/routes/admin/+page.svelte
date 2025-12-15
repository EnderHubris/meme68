<script lang="ts">
    import { onMount } from 'svelte';

    let userData: {
        users: any[],
        error: string,
        loading: boolean
    } = { users: [], error: "", loading: false };

    async function FetchUsers() {
        let users: any[] = [];
        let error = "";
        let loading = false;

        const GetUsers = async () => {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_ROOT}/admin/get_enjoyers`, {
                credentials: "include"
            });

            if (!response.ok) {
                throw new Error("Failed to fetch users");
            }

            return response.json();
        };

        try {
            loading = true;
            error = "";
            
            const data = await GetUsers();
            users = Array.isArray(data) ? data : data.enjoyers ?? [];

            if (users.length === 0) {
                error = "No Users Exist";
            }
        } catch {
            error = "Failed to load users";
        } finally {
            loading = false;
        }

        return {
            users,
            error,
            loading
        }
    }

    let memeData: {
        memes: any[],
        error: string,
        loading: boolean
    } = { memes: [], error: "", loading: false };

    async function FetchRecent() {
        let memes: any[] = [];
        let error = "";
        let loading = false;
    
        const GetRecentMemes = async () => {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_ROOT}/get_recent_memes`, {
                credentials: "include"
            });
    
            if (!response.ok) {
                throw new Error("Failed to fetch recent Memes");
            }
    
            return response.json();
        };

        try {
            loading = true;
            error = "";
            
            const data = await GetRecentMemes();
            memes = Array.isArray(data) ? data : data.memes ?? [];

            if (memes.length === 0) {
                error = "No Memes Exist";
            }
        } catch {
            error = "Failed to load memes";
        } finally {
            loading = false;
        }

        return {
            memes,
            error,
            loading
        }
    }

    async function populate() {
        try {
            userData = await FetchUsers();
            memeData = await FetchRecent();
        } catch {}
    }

    onMount(populate);
</script>

<h1 class="text-center">Admin Panel</h1>
<div class="container my-5 text-center" style="max-width: 500px;">
  <div class="row g-3">
    <div class="col-6">
      <a href="/admin/upload" class="btn btn-primary btn-lg w-100 shadow">
        Upload Memes
      </a>
    </div>
    <div class="col-6">
      <a href="/admin/manage" class="btn btn-secondary btn-lg w-100 shadow">
        Manage Admins
      </a>
    </div>
  </div>
</div><hr>

<div class="container my-5">
  <div class="row g-4 justify-content-center">
    <!-- Enjoyers Card -->
    <div class="col-12 col-md-6">
      <div class="card shadow-sm h-100">
        <div class="card-body text-center">
          <h5 class="card-title mb-4">Enjoyers ({userData.users.length})</h5>
          <hr>
          <div class="row g-3">
            {#if userData.loading}
              <p class="text-muted">Loading users...</p>
            {:else if userData.error}
              <p class="text-muted">{userData.error}</p>
            {:else}
              {#each userData.users as user}
                <div class="col-12 col-sm-6 col-lg-6">
                  <div class="card p-3 h-100">
                    <strong>{user.username}</strong>
                    <div class="text-muted small mb-1">{user.email}</div>
                    <div class="text-muted small">{new Date(user.created_at).toLocaleDateString()}</div>
                  </div>
                </div>
              {/each}
            {/if}
          </div>
        </div>
      </div>
    </div>

    <!-- Recently Added Card -->
    <div class="col-12 col-md-6">
      <div class="card shadow-sm h-100">
        <div class="card-body text-center">
          <h5 class="card-title mb-4">Recently Added</h5>
          <hr>
          <div class="row g-3">
            {#if memeData.loading}
              <p class="text-muted">Loading memes...</p>
            {:else if memeData.error}
              <p class="text-muted">{memeData.error}</p>
            {:else}
              {#each memeData.memes as meme}
                <div class="col-12 col-sm-6 col-lg-6">
                  <div class="card p-3 h-100">
                    <strong>Likes: {meme.likes}</strong>
                    <div class="text-muted small mb-2">{meme.tagString}</div>
                  </div>
                </div>
              {/each}
            {/if}
          </div>
        </div>
      </div>
    </div>
  </div>
</div>