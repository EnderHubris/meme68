<script lang="ts">
    const { data } = $props();
</script>

<h1 class="text-center">Admin Panel</h1>
<div class="container my-5 text-center" style="max-width: 500px;">
    <div class="row g-3">
        <div class="col-6">
            <a href="/admin/upload" class="btn btn-primary btn-lg w-100 shadow">
                Upload Memes
            </a>
        </div>
        <div class="col-6">
            <a
                href="/admin/manage"
                class="btn btn-secondary btn-lg w-100 shadow"
            >
                Manage Admins
            </a>
        </div>
        <div class="col-6">
            <button class="btn btn-secondary btn-lg w-100 shadow">
                Update Meme of the Day
            </button>
        </div>
    </div>
</div>
<hr />

<div class="container my-5">
    <div class="row g-4 justify-content-center">
        <!-- Enjoyers Card -->
        <div class="col-12 col-md-6">
            <div class="card shadow-sm h-100">
                <div class="card-body text-center">
                    <h5 class="card-title mb-4">
                        Enjoyers ({data.users?.length ?? 0})
                    </h5>
                    <hr />
                    <div class="row g-3">Display Users Here!</div>
                </div>
            </div>
        </div>

        <!-- Recently Added Card -->
        <div class="col-12 col-md-6">
            <div class="card shadow-sm h-100">
                <div class="card-body text-center">
                    <h5 class="card-title mb-4">Recently Added</h5>
                    <hr />
                    <div class="row g-3">
                        Display Memes Here!
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>