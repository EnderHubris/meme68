<script lang="ts">
    import type { Meme } from "$lib/database/db";

    const { memes } : { memes: Meme[] } = $props();
</script>

{#if memes.length === 0}
    <p class="text-center text-muted">No memes found.</p>
{:else}
    <div class="row g-3">
        {#each memes as meme (meme.mid)}
            <div class="col-md-3">
                <div class="card h-100">
                    <a href="/meme?id={meme.mid}">
                        <img
                            src="/view/{meme.mid}{meme.fileExt}"
                            alt="meme"
                            class="img-fluid rounded shadow border mb-2 card-img-top"
                        />
                    </a>
                </div>
            </div>
        {/each}
    </div>
{/if}