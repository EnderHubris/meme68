<script lang="ts">
    import { onMount } from 'svelte';

    const GetMemes = async () => {
        const response = await fetch("http://localhost:4000/get_memes", {
            credentials: "include"
        });

        if (!response.ok) {
            throw new Error("Failed to fetch Memes");
        }

        return response.json();
    };

    const GetLikedMemes = async () => {
        const response = await fetch("http://localhost:4000/get_liked_memes", {
            credentials: "include"
        });

        if (!response.ok) {
            throw new Error("Failed to fetch Memes");
        }

        return response.json();
    };

    const LikeMeme = async (event: Event, mid: string) => {
        event.preventDefault();

        const response = await fetch("http://localhost:4000/like_meme", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ mid: mid })
        });

        // refresh list
        await populate();
    };

    const DisikeMeme = async (event: Event, mid: string) => {
        event.preventDefault();

        const response = await fetch("http://localhost:4000/dislike_meme", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ mid: mid })
        });

        // refresh list
        await populate();
    };
    
    async function FetchLikedMemes() {
        let error = "";
        let loading = false;
        let likedMemes: any[] = [];
        
        try {
            loading = true;
            error = "";
            
            const data = await GetLikedMemes();
            console.log(`Liked Memes -> ${JSON.stringify(data)}`);
            likedMemes = Array.isArray(data) ? data : data.liked_memes ?? [];

            if (likedMemes.length === 0) {
                error = "You have no liked memes";
            }
        } catch (e) {
            console.error(e);
            error = "Failed to load liked Memes";
        } finally {
            loading = false;
        }

        return {
            liked_memes: likedMemes,
            error: error,
            loading: loading
        }
    }
    async function FetchMemes() {
        let error = "";
        let loading = false;
        let memes: any[] = [];

        try {
            loading = true;
            error = "";
            
            const data = await GetMemes();
            console.log(`Memes -> ${JSON.stringify(data)}`);
            memes = Array.isArray(data) ? data : data.memes ?? [];

            if (memes.length === 0) {
                error = "No Memes Exist";
            }
        } catch (e) {
            console.error(e);
            error = "Failed to load Memes";
        } finally {
            loading = false;
        }

        return {
            memes: memes,
            error: error,
            loading: loading
        }
    }

    let memeData: {
        memes: any[],
        error: string,
        loading: boolean
    } = { memes: [], error: "", loading: false };

    let likedMemeData: {
        liked_memes: any[],
        error: string,
        loading: boolean
    } = { liked_memes: [], error: "", loading: false };

    async function populate() {
        try {
            memeData = await FetchMemes();
            likedMemeData = await FetchLikedMemes();
        } catch {}
    }

    onMount(populate);
</script>

<h1 class="text-center">Meme Gallery</h1><hr>

<!-- cards will dynamically generate here -->
<div class="container my-4">
  {#if memeData.loading}
    <p class="text-muted">Loading memes...</p>
  {:else if memeData.error}
    <p class="text-muted">{memeData.error}</p>
  {:else}
    <div class="row g-3">
      {#each memeData.memes as meme}
        <div class="col-12 col-sm-6 col-md-4 col-lg-3">
          <div class="card h-100 p-3 shadow-sm">
            <strong>Likes: {meme.likes}</strong>
            <div class="text-muted small mb-2">{meme.tagString}</div>
            <img
              src="http://localhost:4000/uploads/{meme.mid}"
              alt="meme image"
              class="img-fluid rounded shadow border mb-2"
            >

            {#if !likedMemeData.liked_memes.includes(meme.mid)}
                <button class="btn btn-primary w-100"
                on:click={(event) => LikeMeme(event, meme.mid)}>
                Like
                </button>
            {:else}
                <button class="btn btn-danger w-100"
                on:click={(event) => DisikeMeme(event, meme.mid)}>
                Dislike
                </button>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>