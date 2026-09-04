<script lang="ts">
    import { enhance } from "$app/forms";
    import { invalidateAll } from "$app/navigation";
    import { parseResult } from "$lib/browser_utils";
    import type { Meme } from "$lib/database/db";

    const { memes, isAdmin } : { memes: Meme[], isAdmin?: boolean } = $props();
    
    import Feedback from "$lib/components/feedback.svelte";
    let error = $state("");
    let warning = $state("");
    let success = $state("");
    function clearResult() {
        error = warning = success = "";
    }
</script>

<Feedback {success} {warning} {error} />

{#if memes.length === 0}
    <p class="text-center text-muted">No memes found.</p>
{:else}
    <div class="row g-3">
        {#each memes as meme (meme.mid)}
            <div class="col-md-3">
                <div class="card h-100">
                    <img
                        src="/view/{meme.mid}{meme.fileExt}"
                        alt="meme"
                        class="card-img-top"
                        style="height: 200px; object-fit: cover;"
                    />
                    <div class="card-body">
                        <div class="d-flex flex-wrap gap-1">
                            {#each meme.tagString.split(',').map(t => t.trim()).filter(Boolean) as tag}
                                <span class="badge bg-secondary">{tag}</span>
                            {/each}
                        </div>
                        {#if isAdmin}
                            <form method="POST" use:enhance={() => {
                                return async ({ result, update, cancel }) => {
                                    if (!confirm('Are you sure you want to delete this?')) {
                                        cancel();
                                        return;
                                    }
                                    
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
                            }}>
                                <input name="mid" value={meme.mid} hidden>
                                <button type="submit" class="btn btn-danger" formaction="/admin?/delete_meme">
                                    Delete
                                </button>
                            </form>
                        {/if}
                    </div>
                </div>
            </div>
        {/each}
    </div>
{/if}