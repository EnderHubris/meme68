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

    let filterTags: string[] = [];
    let tagInput = "";
    let createdAfter = "";   // yyyy-mm-dd format
    let createdBefore = "";

    async function handleTagKey(e: KeyboardEvent) {
        if (e.key === "Enter") {
            e.preventDefault();
            const tag = tagInput.trim().toLowerCase();

            // creates array of strings from a comma-separated string
            if (tag && !filterTags.includes(tag)) {
                filterTags = [...filterTags, tag];
            }

            tagInput = "";
            console.log(filterTags);
            await populate();
            filterTags = [];
        }
    }

    function removeTag(tag: string) {
        filterTags = filterTags.filter(t => t !== tag);
    }

    let filteredMemes = $state([{mid:"", tagString: "", likes: 0}]);

    async function populate() {
        try {
            memeData = await FetchMemes();
            filteredMemes = memeData.memes.filter(meme => {
                // TAG FILTER
                if (filterTags.length > 0) {
                    const memeTags = meme.tagString
                    ?.split(',')
                    .map((t: string) => t.trim().toLowerCase());

                    if (!filterTags.every(tag => memeTags.includes(tag))) {
                    return false;
                    }
                }

                // DATE FILTER
                const created = new Date(meme.created_at);

                if (createdAfter && created < new Date(createdAfter)) {
                    return false;
                }

                if (createdBefore && created > new Date(createdBefore)) {
                    return false;
                }

                return true;
            });

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

<!-- meme searching / filtering -->
<div class="card p-3 mb-4 shadow-sm">
  <div class="d-flex flex-wrap gap-3 align-items-end">

    <!-- tag filtering -->
    <div class="flex-grow-1">
      <label class="form-label small mb-1">Tags (separate multiple tags with a comma)</label>
      <div class="form-control d-flex flex-wrap gap-2 p-2">
        {#each filterTags as tag}
          <span class="badge bg-primary">
            {tag}
            <button
              type="button"
              class="btn-close btn-close-white ms-2"
              on:click={() => removeTag(tag)}
            />
          </span>
        {/each}

        <input
          class="border-0 flex-grow-1"
          placeholder="Add tag"
          bind:value={tagInput}
          on:keydown={handleTagKey}
        >
      </div>
    </div>

    <!-- date filtering -->
    <div>
      <label class="form-label small mb-1">After</label>
      <input type="date" class="form-control form-control-sm" on:change={populate} bind:value={createdAfter}>
    </div>

    <div>
      <label class="form-label small mb-1">Before</label>
      <input type="date" class="form-control form-control-sm" on:change={populate} bind:value={createdBefore}>
    </div>

  </div>
</div>

<!-- cards will dynamically generate here -->
<div class="container my-4">
  {#if memeData.loading}
    <p class="text-muted">Loading memes...</p>
  {:else if memeData.error}
    <p class="text-muted">{memeData.error}</p>
  {:else}
    <div class="row g-3">
      {#each filteredMemes as meme}
        <div class="col-12 col-sm-6 col-md-4 col-lg-3">
          <div class="card h-100 p-3 shadow-sm d-flex flex-column">
            <strong class="mb-1">Likes: {meme.likes}</strong>

            <img
              src={`${import.meta.env.VITE_BACKEND_ROOT}/uploads/${meme.mid}`}
              alt="meme image"
              class="meme-img img-fluid rounded border mb-2"
              on:click={(event) => ViewMore(event, meme.mid)}
            />

            <!-- Push button to bottom -->
            <div class="mt-auto">
              {#if !likedMemeData.liked_memes.includes(meme.mid)}
                <button
                  class="btn btn-primary btn-sm w-100"
                  on:click={(event) => PressedLike(event, meme.mid)}
                >
                  Like
                </button>
              {:else}
                <button
                  class="btn btn-danger btn-sm w-100"
                  on:click={(event) => PressedDislike(event, meme.mid)}
                >
                  Dislike
                </button>
              {/if}
            </div>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>