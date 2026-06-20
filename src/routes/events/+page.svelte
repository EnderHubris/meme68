<script lang="ts">
    import { onMount } from 'svelte';
    import { ViewMore } from '$lib/interact';

    let memeData: {
        meme: {
            mid: string,
            file_ext: string,
            tagString: string,
            likes: number
        },
        error: string,
        loading: boolean
    } = { meme: { mid: "", file_ext: "", tagString: "", likes: 0 }, error: "", loading: false };

    /**
     * Fetches meme of the day selected by the server
    */
    async function FetchMeme() {
        let meme: {
            mid: string,
            file_ext: string,
            tagString: string,
            likes: number
        } = { mid: "", file_ext: "", tagString: "", likes: 0 };
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
                    file_ext: data.file_ext,
                    tagString: data.tagString,
                    likes: data.likes
                }
            }
        } catch {
            error = "Failed to load meme of the day";
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

<h1 class="text-center">Meme Of The Day!</h1><hr>

<div class="container my-5">
  <div class="row justify-content-center">
    <div class="col-12 col-md-6">
      <div class="card shadow-sm">
        <div class="card-body text-center">

          {#if memeData.loading}
            <p class="text-muted mb-0">Loading meme...</p>

          {:else if memeData.error}
            <p class="text-muted mb-0">{memeData.error}</p>

          {:else}
            <strong class="d-block mb-2">
              Likes: {memeData.meme.likes}
            </strong>

            <img
              src={`${import.meta.env.VITE_BACKEND_ROOT}/uploads/${memeData.meme.mid}${memeData.meme.file_ext}`}
              alt="meme image"
              class="meme-img img-fluid rounded border mb-3"
              onclick={(event) => ViewMore(event, memeData.meme.mid)}
            />

            <div class="text-muted small">
              {memeData.meme.tagString}
            </div>
          {/if}

        </div>
      </div>
    </div>
  </div>
</div>