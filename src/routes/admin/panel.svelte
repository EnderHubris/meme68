<script lang="ts">
    import type { Meme } from "$lib/database/db";
    import MemesDisplay from "$lib/components/memes.display.svelte";

    const { memes } : { memes: Meme[] } = $props();
</script>

<div class="container my-5">
    <MemesDisplay memes={memes} />
</div>