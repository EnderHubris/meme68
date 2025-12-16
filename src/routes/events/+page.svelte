<script lang="ts">
    import { onMount } from 'svelte';
    import { ViewMore } from '$lib/interact';

    let memeData: {
        meme: {
            mid: string,
            tagString: string,
            likes: number
        },
        error: string,
        loading: boolean
    } = { meme: { mid: "", tagString: "", likes: 0 }, error: "", loading: false };

    /**
     * Fetches meme of the day selected by the server
    */
    async function FetchMeme() {
        let meme: {
            mid: string,
            tagString: string,
            likes: number
        } = { mid: "", tagString: "", likes: 0 };
        let error = "";
        let loading = false;

        try {
            loading = true;
            error = "";
            
            const response = await fetch(`${import.meta.env.VITE_BACKEND_ROOT}/meme_of_the_day`, {
                method: "GET",
                credentials: 'include'  // ensures cookies are sent
            });
            const data = await response.json();

            if (!data) {
                error = "No Memes Exist";
            } else {
                meme = {
                    mid: data.mid,
                    tagString: data.tagString,
                    likes: data.likes
                }
            }
        } catch {
            error = "Failed to load memes";
        } finally {
            loading = false;
        }

        return {
            meme,
            error,
            loading
        }
    }

    async function populate() {
        try {
            memeData = await FetchMeme();
        } catch {}
    }

    onMount(populate);
</script>

<h1 class="text-center">Meme Of The Day!</h1>

<div class="container my-5">
  <div class="row g-4 justify-content-center">
    <!-- Hero Card -->
    <div class="col-12 col-md-6">
      <div class="card shadow-sm h-100">
        <div class="card-body text-center">
          <div class="row g-3">
            {#if memeData.loading}
              <p class="text-muted">Loading meme...</p>
            {:else if memeData.error}
              <p class="text-muted">{memeData.error}</p>
            {:else}
                <div class="col-12 col-sm-6 col-lg-6">
                    <div class="card p-3 h-100">
                        <strong>Likes: {memeData.meme.likes}</strong>

                        <img
                            src={`${import.meta.env.VITE_BACKEND_ROOT}/uploads/${memeData.meme.mid}`}
                            alt="meme image"
                            class="meme-img img-fluid rounded border mb-2"
                            on:click={(event) => ViewMore(event, memeData.meme.mid)}
                        />

                        <span class="text-muted">{memeData.meme.tagString}</span>
                    </div>
                </div>
            {/if}
          </div>
        </div>
      </div>
    </div>
  </div>
</div>