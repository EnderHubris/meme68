<script lang="ts">
    /**
     * Admin File Management Logic
    */
    type FileWithTags = {
        file: File;
        tags: string[];
        input: string;
    };

    let files: FileWithTags[] = [];
    let previewUrls: string[] = [];

    $: {
        // revoke old URLs before generating new ones to avoid leaking memory
        previewUrls.forEach(url => URL.revokeObjectURL(url));
        previewUrls = files.map(entry => URL.createObjectURL(entry.file));
    }
    function removeFile(index: number) {
        // revoke the object URL to avoid memory leaks before removing
        URL.revokeObjectURL(previewUrls[index]);
        files = files.filter((_, i) => i !== index);
    }

    function handleFilesSelected(event: Event) {
        const input = event.target as HTMLInputElement;
        if (!input.files) return;

        files = Array.from(input.files).map(file => ({
            file,
            tags: [],
            input: ""
        }));
    }

    function addTag(index: number) {
        const entry = files[index];
        const tag = entry.input.trim().toLowerCase();

        if (tag && !entry.tags.includes(tag)) {
            entry.tags = [...entry.tags, tag];
            files = [...files];
        }

        entry.input = "";
    }

    function handleKeydown(e: KeyboardEvent, index: number) {
        if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            addTag(index);
        }
    }

    function removeTag(index: number, tag: string) {
        files[index].tags = files[index].tags.filter(t => t !== tag);
        files = [...files];
    }

    async function handleUpload() {
        if (!files.length) return;

        const formData = new FormData();

        files.forEach((entry, i) => {
            console.log("[*] Appending:", entry.file);
            formData.append("files", entry.file);
            formData.append(`tags[${i}]`, entry.tags.join(","));
        });

        try {
            const res = await fetch(`${import.meta.env.VITE_BACKEND_ROOT}/upload`, {
                method: "POST",
                credentials: "include",
                body: formData
            });

            const data = await res.json();

            if (data.success) {
                alert("Upload complete!");
                window.location.reload();
            } else {
                alert("Upload failed: " + (data.error || "Unknown error"));
            }
        } catch (err) {
            console.error("Upload failed", err);
            alert("Upload failed. Check console for details.");
        }
    }


    /**
     * Admin Panel Logic
    */
    import { onMount } from 'svelte';
    import { GetMemes } from '$lib/collect';
    import { ViewMore } from '$lib/interact';
    import { NotifyFeedback } from '$lib/feedback';

    let memes: any[] = [];
    let error = "";
    let loading = false;

    import MemeEditPanel from './MemeEditPanel.svelte'; // custom html component
    let editingMeme = false; // ensures admins cannot create multiple edit panels
    let targetMid = "";
    let targetTagString = "";
    const editMeme = async (event: Event, mid: string, tagString: string) => {
        event.preventDefault();
        
        if (!mid) return;
        if (!tagString) return;
        if (editingMeme) return;

        editingMeme = true;
        targetMid = mid;
        targetTagString = tagString;
    };

    const removeMeme = async (event: Event, mid: string) => {
        event.preventDefault();

        if (window.confirm("Are you sure?")) {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_ROOT}/admin/remove_meme`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ mid: mid })
            });

            const data = await response.json();

            if (data && data.message) {
                NotifyFeedback(data.message);
            }
    
            // refresh list
            await populate();
        }
    };

    async function populate() {
        try {
            loading = true;
            error = "";
            
            const data = await GetMemes();
            memes = Array.isArray(data) ? data : data.memes ?? [];

            if (memes.length === 0) {
                error = "No Memes Exist";
            }
        } catch {
            error = "Failed to load Memes";
        } finally {
            loading = false;
        }
    }

    onMount(populate);
</script>

<h2 class="mb-4 text-center">📂 File Upload Manager</h2>
<div class="container" style="max-width: 500px;">
    <a class="navbar-brand btn btn-outline-secondary" href="/admin">Back</a>
</div><hr>

<!-- File Upload Form -->
<form
  on:submit|preventDefault={handleUpload}
  enctype="multipart/form-data"
>
  <!-- File selector -->
  <div class="mb-3">
    <label class="form-label">Choose files</label>
    <input
      type="file"
      name="files"
      multiple
      class="form-control"
      required
      on:change={handleFilesSelected}
    >
  </div>

  {#each files as entry, i}
    <div class="card mb-3 shadow-sm">
        <div class="card-body text-start">
            <div class="d-flex align-items-center justify-content-between mb-2">
                <strong>{entry.file.name}</strong>
                <button
                    type="button"
                    class="btn btn-outline-danger btn-sm"
                    on:click={() => removeFile(i)}
                    >
                    Remove
                </button>
            </div>

            <!-- Image preview -->
            <img
                src={previewUrls[i]}
                alt={entry.file.name}
                class="img-fluid rounded border mb-2"
                style="max-height: 150px; object-fit: contain;"
            >

            <!-- Tags -->
            <div
                class="form-control d-flex flex-wrap gap-2 p-2 mt-2"
                style="min-height: 44px;"
            >
                {#each entry.tags as tag}
                <span class="badge bg-primary d-flex align-items-center">
                    {tag}
                    <button
                        type="button"
                        class="btn-close btn-close-white ms-2"
                        on:click={() => removeTag(i, tag)}
                    ></button>
                </span>
                {/each}

                <input
                    type="text"
                    class="border-0 flex-grow-1"
                    placeholder="Add tag"
                    bind:value={entry.input}
                    on:keydown={(e) => handleKeydown(e, i)}
                >
            </div>

            <!-- Hidden input per file -->
            <input
                type="hidden"
                name={`tags[${i}]`}
                value={entry.tags.join(',')}
            >
        </div>
    </div>
  {/each}

  <button class="btn btn-success">Upload</button>
</form>

<h4 class="mb-4 text-center">Present Memes</h4><hr>
<div class="container my-4">
  {#if loading}
    <p class="text-muted">Loading memes...</p>
  {:else if error}
    <p class="text-muted">{error}</p>
  {:else}
    <div class="row g-3">
      {#each memes as meme}
        <div class="col-12 col-sm-6 col-md-4 col-lg-3">
          <div class="card h-100 p-3 shadow-sm d-flex flex-column">
            <div class="d-flex align-items-center justify-content-between mb-2">
                <strong class="mb-0">Likes: {meme.likes}</strong>

                <!-- Admins can modify the tagString attached to a meme entry -->
                <button class="btn btn-primary btn-sm d-flex align-items-center gap-1" on:click={(event) => editMeme(event, meme.mid, meme.tagString)}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil-square" viewBox="0 0 16 16">
                        <path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z"/>
                        <path fill-rule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5z"/>
                    </svg>
                    Edit
                </button>
            </div>
            
            <img
                src={`${import.meta.env.VITE_BACKEND_ROOT}/uploads/${meme.mid}${meme.file_ext}`}
                alt="meme image"
                class="meme-img img-fluid rounded border mb-2"
                on:click={(event) => ViewMore(event, meme.mid)}
            />

            <div class="mt-auto">
                <button class="btn btn-danger w-100"
                  on:click={(event) => removeMeme(event, meme.mid)}>
                  Remove
                </button>
            </div>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

{#if editingMeme}
  <MemeEditPanel
    mid={targetMid}
    originalTagString={targetTagString}
    runAfter={() => { populate(); }}
    onClose={() => { editingMeme = false; targetMid = ""; }}
  />
{/if}