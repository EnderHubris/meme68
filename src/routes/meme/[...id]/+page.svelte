<script lang="ts">
    import { enhance } from "$app/forms";
    import { invalidateAll } from "$app/navigation";
    import { parseResult } from "$lib/browser_utils";
    import type { Meme } from "$lib/database/db";
    
    const { data } : { data : {
        meme: Meme,
        isLiked: boolean,
        isAdmin?: boolean
    } } = $props();
    
    import Feedback from "$lib/components/feedback.svelte";
    let error = $state("");
    let warning = $state("");
    let success = $state("");
    function clearResult() {
        error = warning = success = "";
    }

    let lastAction = $state<'delete' | 'update' | ''>('');
    let editing = $state<boolean>(false);
    let ntagString = $state<string>("");
    function Edit(mid: string, tagString: string) {
        editing = true;
        ntagString = tagString;
    }
    function CancelEdit() { editing = false; ntagString = ""; }
</script>

<Feedback {success} {warning} {error} />

<div class="container my-4">
    <div class="card h-100 mx-auto" style="max-width: 350px">
        <img
            src="/view/{data.meme.mid}{data.meme.fileExt}"
            alt="meme"
            class="img-fluid rounded shadow border mb-2 card-img-top"
        />
        <div class="card-body">
            <div class="d-flex flex-wrap gap-1">
                {#if editing}
                    <button class="btn btn-secondary" onclick={CancelEdit}>Cancel</button>
                    <input
                        type="text"
                        class="form-control form-control-sm mb-2"
                        placeholder="tag1, tag2, tag3"
                        bind:value={ntagString}
                    />
                {:else}
                    {#each data.meme.tagString.split(',').map(t => t.trim()).filter(Boolean) as tag}
                        <span class="badge bg-secondary">{tag}</span>
                    {/each}
                    <form
                        method="POST"
                        use:enhance={({}) => {
                            return async ({ result, update }) => {
                                await update();
                                const data = await parseResult(result);

                                success = data.success;
                                warning = data.warning;
                                error = data.error;

                                if (result.type === "success" && result.data) {
                                    await invalidateAll();
                                    setTimeout(clearResult, 5000);
                                }
                            };
                        }}
                    >
                        <input name="mid" value={data.meme.mid} hidden>
                        <button
                            type="submit"
                            class={ data.isLiked ? "btn btn-danger" : "btn btn-primary" }
                            formaction={ data.isLiked ? "?/unlike_meme" : "?/like_meme" }
                        >
                            {#if data.isLiked}
                                Unlike
                            {:else}
                                Like
                            {/if}
                        </button>
                    </form>
                {/if}
            </div>
            {#if data.isAdmin}
                <form
                    method="POST"
                    use:enhance={({ cancel }) => {
                        if (lastAction === 'delete' && !confirm('Are you sure you want to delete this?')) {
                            cancel();
                            return;
                        }
                        if (lastAction === 'update' && !confirm('Save these changes?')) {
                            cancel();
                            return;
                        }

                        return async ({ result, update }) => {
                            await update();
                            const data = await parseResult(result);
                            
                            if (lastAction === 'update')
                                CancelEdit();

                            success = data.success;
                            warning = data.warning;
                            error = data.error;

                            if (result.type === "success" && result.data) {
                                await invalidateAll();
                                setTimeout(clearResult, 5000);
                            }
                        };
                    }}
                >
                    <input name="mid" value={data.meme.mid} hidden>
                    <button
                        type="submit"
                        class="btn btn-danger"
                        formaction="/admin?/delete_meme"
                        onclick={() => lastAction = 'delete'}
                    >
                        Delete
                    </button>
                    {#if editing}
                        <input name="tagString" value={ntagString} hidden>
                        <button
                            type="submit"
                            class="btn btn-primary"
                            formaction="/admin?/update_meme"
                            onclick={() => lastAction = 'update'}
                        >
                            Update
                        </button>
                    {:else}
                        <button class="btn btn-primary" onclick={() => { Edit(data.meme.mid, data.meme.tagString) }}>
                            Edit
                        </button>
                    {/if}
                </form>
            {/if}
        </div>
    </div>
</div>