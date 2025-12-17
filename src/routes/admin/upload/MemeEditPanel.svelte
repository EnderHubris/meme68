<script lang="ts">
    import { NotifyFeedback } from "$lib/feedback";
    
    export let mid: string;

    export let onClose: () => void; // similiar to a function pointer
    export let runAfter: () => void; // similiar to a function pointer

    export let originalTagString: string;
    let tagString = originalTagString;

    async function saveEdit(mid: string) {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_ROOT}/admin/edit_meme`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
                mid: mid,
                newTagString: tagString
            })
        });

        const data = await response.json();

        if (data && data.message) {
            NotifyFeedback(data.message);
        }

        runAfter();
    };

    async function submit() {
        if (!window.confirm("Are you sure?")) return;

        // if the tagString never changed don't bother sending a request
        if (tagString !== originalTagString)
            await saveEdit(mid);
        
        onClose();
    }
</script>

<!-- Overlay -->
<div class="modal-backdrop fade show"></div>

<!-- Main Panel -->
<div class="modal d-block" tabindex="-1">
  <div class="modal-dialog modal-dialog-centered">
    <div class="modal-content shadow">

      <div class="modal-header">
        <h5 class="modal-title">Edit Meme</h5>
        <button class="btn-close" on:click={onClose}></button>
      </div>

      <div class="modal-body">
        <label class="form-label">Tags</label>
        <input
          class="form-control"
          placeholder="comma,separated,tags"
          bind:value={tagString}
        />
      </div>

      <div class="modal-footer">
        <button class="btn btn-secondary" on:click={onClose}>Cancel</button>
        <button class="btn btn-primary" on:click={submit}>Save</button>
      </div>

    </div>
  </div>
</div>