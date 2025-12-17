<script lang="ts">
    import { onMount } from 'svelte';

    import { LikeMeme, DisikeMeme, ShareMeme, ViewMore } from '$lib/interact';
    import { FetchMemes, FetchLikedMemes } from '$lib/collect';

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

            const tagList = tagInput
                ?.split(',')
                .map(t => t.trim().toLowerCase());

            for (let i = 0; i < tagList.length; ++i) {

                // remove weird characters from tags
                const tag = tagList[i]
                    .toLowerCase()
                    .replace(/-/g, '_')         // replace hyphen for underscore
                    .replace(/[^a-z0-9_]/g, '') // only allow alphanum and underscore (no unicode or other weird chars)
                    .replace(/_+/g, '_')        // merge multiple underscores into a single underscore
                    .replace(/^_+|_+$/g, '');   // remove pre-hang and post-hang underscores

                // only write non-empty strings
                if (tag.length > 0) {
                    // creates array of strings from a comma-separated string
                    if (tag && !filterTags.includes(tag)) {
                        filterTags = [...filterTags, tag];
                    }
                }
            }

            console.log(`User Entered Tags -> ${JSON.stringify(filterTags)}`);
            await populate();
            filterTags = [];
        }
    }

    let filteredMemes = $state([{mid:"", tagString: "", likes: 0}]);

    let showLikedOnly = false;
    let showPopular = false;
    
    let populating = false;
    async function populate() {
        if (populating) return;
        populating = true;

        try {
            memeData = await FetchMemes();
            likedMemeData = await FetchLikedMemes();

            filteredMemes = memeData.memes.filter(meme => {
                if (!showPopular) {
                    if (showLikedOnly) {
                        return likedMemeData.liked_memes.includes(meme.mid);
                    }
    
                    // TAG FILTER
                    if (filterTags.length > 0) {
                        const memeTags = meme.tagString
                            ?.split(',')
                            .map(t => t.trim().toLowerCase());
    
                        if (!filterTags.every(tag => memeTags?.includes(tag))) {
                            return false;
                        }
                    }
    
                    // DATE FILTER
                    const created = new Date(meme.created_at);
                    if (createdAfter && created < new Date(createdAfter)) return false;
                    if (createdBefore && created > new Date(createdBefore)) return false;
                }
                return true;
            });

            if (showPopular) {
                // sort by likes in descending order
                filteredMemes.sort((a, b) => b.likes - a.likes);
            }
        } catch (err) {
            console.error(err);
        }

        populating = false;
    }

    onMount(populate);
</script>

<h1 class="text-center">Meme Gallery</h1><hr>

<!-- meme searching / filtering -->
<div class="card p-3 mb-4 shadow-sm">
  <div class="row g-3 align-items-end">

    <!-- Tag filtering -->
    <div class="col-12 col-md flex-grow-1">
      <label class="form-label small mb-1">Tags (separate multiple tags with a comma)</label>
      <div class="form-control d-flex flex-wrap gap-2 p-2">
        <input
          class="border-0 flex-grow-1"
          placeholder="Add tag"
          bind:value={tagInput}
          on:keydown={handleTagKey}
        >
      </div>
    </div>

    <!-- Date filtering -->
    <div class="col-12 col-md-3 d-flex flex-column gap-2">
        <button
            class="btn btn-outline-secondary w-100 d-flex justify-content-between align-items-center"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#dateFilter"
            aria-expanded="false"
            aria-controls="dateFilter"
        >
            Filter by Date
            <span class="navbar-toggler-icon"></span>
        </button>

        <div class="collapse" id="dateFilter">
            <div class="card card-body p-3 mt-2">
                <div class="mb-2">
                    <label class="form-label small mb-1">After</label>
                    <input
                    type="date"
                    class="form-control form-control-sm"
                    bind:value={createdAfter}
                    on:change={populate}
                    >
                </div>

                <div>
                    <label class="form-label small mb-1">Before</label>
                    <input
                    type="date"
                    class="form-control form-control-sm"
                    bind:value={createdBefore}
                    on:change={populate}
                    >
                </div>
            </div>
        </div>

      <!-- Toggles -->
        <div class="form-check form-switch d-flex align-items-center mt-2">
            <input
                class="form-check-input"
                type="checkbox"
                id="likedToggle"
                bind:checked={showLikedOnly}
                on:change={() => {
                    populate();

                    if (showPopular) {
                        const showPopularToggle = document.getElementById('popularToggle');
                        if (showPopularToggle) showPopularToggle.checked = false;
                    }
                }}
            >
            <label class="form-check-label ms-2" for="likedToggle">Show Liked Only</label>
        </div>
        <div class="form-check form-switch d-flex align-items-center mt-2">
            <input
                class="form-check-input"
                type="checkbox"
                id="popularToggle"
                bind:checked={showPopular}
                on:change={() => {
                    populate();

                    if (showLikedOnly) {
                        const showLikedToggle = document.getElementById('likedToggle');
                        if (showLikedToggle) showLikedToggle.checked = false;
                    }
                }}
            >
            <label class="form-check-label ms-2" for="likedToggle">Show Popular</label>
        </div>
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
      {#if filteredMemes.length === 0}
        <p class="text-muted">Its Barren Here...</p>
      {:else}
        {#each filteredMemes as meme}
            <div class="col-12 col-sm-6 col-md-4 col-lg-3">
            <div class="card h-100 p-3 shadow-sm d-flex flex-column">
                <div class="d-flex align-items-center justify-content-between mb-2">
                    <strong class="mb-0">Likes: {meme.likes}</strong>

                    <button class="btn btn-primary btn-sm d-flex align-items-center gap-1" on:click={(event) => ShareMeme(event, meme.mid)}>
                        <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        fill="currentColor"
                        class="bi bi-share"
                        viewBox="0 0 16 16"
                        >
                        <path d="M13.5 1a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3M11 2.5a2.5 2.5 0 1 1 .603 1.628l-6.718 3.12a2.5 2.5 0 0 1 0 1.504l6.718 3.12a2.5 2.5 0 1 1-.488.876l-6.718-3.12a2.5 2.5 0 1 1 0-3.256l6.718-3.12A2.5 2.5 0 0 1 11 2.5m-8.5 4a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3m11 5.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3"/>
                        </svg>
                        Share
                    </button>
                </div>

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
      {/if}
    </div>
  {/if}
</div>