<script lang="ts">
    import MemesDisplay from "$lib/components/memes.display.svelte";
    import type { Meme } from "$lib/database/db";
    
    const { data } : { data : {
        memes: Meme[],
        page: number
    } } = $props();
</script>

<h1 class="text-center">Home</h1>
<hr />

<div class="container my-4">
    <MemesDisplay memes={data.memes} />

    <!-- Pagination -->
    <div class="d-flex justify-content-center gap-2 mt-4">
        {#if data.page > 1}
            <a href="?page={data.page - 1}" class="btn btn-outline-secondary">Previous</a>
        {/if}
        <span class="align-self-center">Page {data.page}</span>
        <a href="?page={data.page + 1}" class="btn btn-outline-secondary">Next</a>
    </div>
</div>