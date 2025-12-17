<script lang="ts">
	import { onMount } from 'svelte';

    import { LikeMeme, DisikeMeme } from '$lib/interact';
    import { FetchLikedMemes } from '$lib/collect';

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

    let likedMemeData: {
        liked_memes: any[],
        error: string,
        loading: boolean
    } = $state({ liked_memes: [], error: "", loading: false });

	let { params }: { params: { id?: string } } = $props();
    let collectedData = $state(false);

    let memeInfo: {
        mid: string,
        tagString: string,
        likes: number
    } = $state({ mid: "", tagString: "", likes: 0 });

    async function FetchMemeData(mid:string) {
        if (!mid || mid.length === 0) return { mid: mid, tagString: "", likes: 0 };

        try {
            const req = await fetch(`${import.meta.env.VITE_BACKEND_ROOT}/get_meme_info`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ mid: mid })
            });
            const data = await req.json();

            collectedData = true;
            return (data) ? { mid: data.mid, tagString: data.tagString, likes: data.likes } : { mid: mid, tagString: "", likes: 0 };
        } catch {}
        
        return { mid: mid, tagString: "", likes: 0 };
    }

	async function populate() {
        try {
            const mid = params.id || "";
            memeInfo = await FetchMemeData(mid);
            likedMemeData = await FetchLikedMemes();
        } catch {}
    }

    onMount(populate);
</script>

<h1 class="text-center">Meme Info</h1><hr>
<div class="container my-4 d-flex justify-content-center">
    {#if collectedData}
        <div class="col-12 col-sm-8 col-md-6 col-lg-4">
            <div class="card h-100 p-3 shadow-sm text-center">
                <strong>Likes: {memeInfo.likes}</strong>
                <div class="text-muted small mb-2">{memeInfo.tagString}</div>

                <img
                    src={`${import.meta.env.VITE_BACKEND_ROOT}/uploads/${memeInfo.mid}`}
                    alt="meme image"
                    class="img-fluid rounded shadow border mb-2"
                >

                {#if !likedMemeData.liked_memes.includes(memeInfo.mid)}
                    <button class="btn btn-primary w-100"
                    on:click={(event) => PressedLike(event, memeInfo.mid)}>
                    Like
                    </button>
                {:else}
                    <button class="btn btn-danger w-100"
                    on:click={(event) => PressedDislike(event, memeInfo.mid)}>
                    Dislike
                    </button>
                {/if}
            </div>
        </div>
    {/if}
</div>