<script lang="ts">
    import { onMount } from 'svelte';

    function populate() {
        const mainDisplay = document.getElementById("card-container");

        if (mainDisplay) {
            mainDisplay.textContent = "I just got placed here lol";
        } else {
            console.error("Cannot locate card display area!");
        }
    }

    // run on page-load
    onMount(() => {
        populate();
    });
</script>

<h1 class="text-center">Meme Gallery</h1>

<!-- cards will dynamically generate here -->
<div class="container mt-4">
    <div id="card-container" class="row g-3"></div>
</div>