<script lang="ts">
    import { onMount } from 'svelte';

    import { LikeMeme, DisikeMeme } from '$lib/interact';
    import { FetchMemes, FetchLikedMemes } from '$lib/collect';

    const ViewMore = (event: Event, mid: string) => {
        window.location.href = "/meme/" + mid
    }

    const PressedLike = async (event: Event, mid: string) => {
        event.preventDefault();

        await LikeMeme(event, mid);

        // refresh list
        await populate();
    };

    const PressedDislike = async (event: Event, mid: string) => {
        event.preventDefault();

        await DisikeMeme(event, mid);

        // refresh list
        await populate();
    };

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

<style>
/*
    Desktop/Laptop Browsers have an on:hover effect
    when hovering over meme images to show they can be clicked
*/
@media (hover: hover) and (pointer: fine) {
    .meme-img {
        cursor: pointer;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .meme-img:hover {
        transform: scale(1.04);
        box-shadow: 0 12px 25px rgba(0, 0, 0, 0.25);
    }
}
</style>

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
            <strong style="padding: 5px">Likes: {meme.likes}</strong>
            <img
                src={`${import.meta.env.VITE_BACKEND_ROOT}/uploads/${meme.mid}`}
                alt="meme image"
                class="meme-img img-fluid rounded border mb-2"
                on:click={(event) => ViewMore(event, meme.mid)}
            />

            {#if !likedMemeData.liked_memes.includes(meme.mid)}
                <button class="btn btn-primary w-100"
                on:click={(event) => PressedLike(event, meme.mid)}>
                Like
                </button>
            {:else}
                <button class="btn btn-danger w-100"
                on:click={(event) => PressedDislike(event, meme.mid)}>
                Dislike
                </button>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>