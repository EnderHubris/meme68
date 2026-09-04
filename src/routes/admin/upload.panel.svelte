<script lang="ts">
    import { enhance } from '$app/forms';
    import { invalidateAll } from '$app/navigation';
    import { parseResult } from '$lib/browser_utils';
    import { onDestroy } from 'svelte';

    let uploading = $state(false);
    let formEl: HTMLFormElement | undefined = $state();
    let fileInput: HTMLInputElement | undefined = $state();

    import Feedback from "$lib/components/feedback.svelte";
    let error = $state("");
    let warning = $state("");
    let success = $state("");
    function clearResult() {
        error = warning = success = "";
    }

    type PendingFile = {
        file: File;
        previewUrl: string;
        tags: string;
    };

    let pending: PendingFile[] = $state([]);

    function handleFileSelect(e: Event) {
        const input = e.currentTarget as HTMLInputElement;
        if (!input.files) return;

        for (const p of pending) URL.revokeObjectURL(p.previewUrl);

        pending = Array.from(input.files).map((file) => ({
            file,
            previewUrl: URL.createObjectURL(file),
            tags: ""
        }));
    }

    function syncInputFiles() {
        if (!fileInput) return;
        const dt = new DataTransfer();
        for (const p of pending) dt.items.add(p.file);
        fileInput.files = dt.files;
    }

    function removeFile(index: number) {
        URL.revokeObjectURL(pending[index].previewUrl);
        pending = pending.filter((_, i) => i !== index);
        syncInputFiles();
    }

    onDestroy(() => {
        for (const p of pending) URL.revokeObjectURL(p.previewUrl);
    });

    function buildFormData(): FormData {
        const fd = new FormData();
        for (const p of pending) {
            fd.append('files', p.file);
            fd.append('tags', p.tags);
        }
        return fd;
    }
</script>

<div class="container my-5">
    <h2 class="mb-4 text-center">📂 File Upload Manager</h2>
    <hr />

    <Feedback {success} {warning} {error} />

    <form
        method="POST"
        action="?/upload"
        enctype="multipart/form-data"
        bind:this={formEl}
        use:enhance={({ formData, cancel }) => {
            if (pending.length === 0) {
                cancel();
                error = "Select at least one file";
                return;
            }

            const built = buildFormData();
            for (const key of [...formData.keys()]) formData.delete(key);
            for (const [key, value] of built.entries()) formData.append(key, value);

            uploading = true;
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

                if (result.type === 'success') {
                    for (const p of pending) URL.revokeObjectURL(p.previewUrl);
                    pending = [];
                    formEl?.reset();
                }
                uploading = false;
            };
        }}
    >
        <div class="mb-3">
            <label for="files" class="form-label">Choose files</label>
            <input
                bind:this={fileInput}
                type="file"
                name="files"
                class="form-control"
                accept="image/*"
                multiple
                required
                onchange={handleFileSelect}
            />
        </div>

        {#if pending.length > 0}
            <div class="row g-3 mb-3">
                {#each pending as p, i}
                    <div class="col-md-4">
                        <div class="card">
                            <img src={p.previewUrl} alt={p.file.name} class="card-img-top" style="max-height: 200px; object-fit: cover;" />
                            <div class="card-body">
                                <p class="card-text small text-truncate">{p.file.name}</p>
                                <input
                                    type="text"
                                    class="form-control form-control-sm mb-2"
                                    placeholder="tag1, tag2, tag3"
                                    bind:value={p.tags}
                                />
                                <button type="button" class="btn btn-sm btn-outline-danger" onclick={() => removeFile(i)}>
                                    Remove
                                </button>
                            </div>
                        </div>
                    </div>
                {/each}
            </div>
        {/if}

        <button type="submit" class="btn btn-success" disabled={uploading || pending.length === 0}>
            {uploading ? 'Uploading...' : 'Upload'}
        </button>
    </form>
</div>