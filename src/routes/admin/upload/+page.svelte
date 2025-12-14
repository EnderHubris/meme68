<script lang="ts">
    type FileWithTags = {
        file: File;
        tags: string[];
        input: string;
    };

    let files: FileWithTags[] = [];

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
            formData.append("files", entry.file);
            formData.append(`tags[${i}]`, entry.tags.join(","));
        });

        try {
            const res = await fetch("http://localhost:4000/upload", {
                method: "POST",
                credentials: "include",
                body: formData
            });

            const data = await res.json();
            console.log("Upload response:", data);

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

    import { onMount } from 'svelte';

    let memes: any[] = [];
    let error = "";
    let loading = false;

    const GetMemes = async () => {
        const response = await fetch("http://localhost:4000/get_memes", {
            credentials: "include"
        });

        if (!response.ok) {
            throw new Error("Failed to fetch Memes");
        }

        return response.json();
    };

    const removeMeme = async (event: Event, mid: string) => {
        event.preventDefault();

        if (window.confirm("Are you sure?")) {
            const response = await fetch("http://localhost:4000/admin/remove_meme", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ mid: mid })
            });
    
            // refresh list
            await populate();
        }
    };

    async function populate() {
        try {
            loading = true;
            error = "";
            
            const data = await GetMemes();
            console.log(`Memes -> ${JSON.stringify(data)}`);
            memes = Array.isArray(data) ? data : data.memes ?? [];

            if (memes.length === 0) {
                error = "No Memes Exist";
            }
        } catch (e) {
            console.error(e);
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
        <strong>{entry.file.name}</strong>

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
              />
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
          <div class="card h-100 p-3 shadow-sm">
            <strong>Likes: {meme.likes}</strong>
            <div class="text-muted small mb-2">{meme.tagString}</div>
            <img
              src="http://localhost:4000/uploads/{meme.mid}"
              alt="meme image"
              class="img-fluid rounded shadow border mb-2"
            >
            <button class="btn btn-danger w-100"
              on:click={(event) => removeMeme(event, meme.mid)}>
              Remove
            </button>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>