<script lang="ts">
    import type { ViewableUser } from "$lib/database/db";

    const { users } : { users: ViewableUser[] } = $props();
</script>

<div class="container my-5">
    <div class="row g-4 justify-content-center">
        <!-- Enjoyers Card -->
        <div class="col-12 col-md-6">
            <div class="card shadow-sm h-100">
                <div class="card-body text-center">
                    <h5 class="card-title mb-4">
                        Enjoyers ({users?.length ?? 0})
                    </h5>
                    <hr />
                    <div class="row g-3">
                        {#each users as user}
                        <div class="col-12 col-sm-6 col-lg-6">
                            <div class="card p-3 h-100">
                                <strong>{user.username}</strong>
                                <div class="text-muted small mb-1">{user.email}</div>
                                <div class="text-muted small">
                                    {new Date(user.createdAt).toLocaleDateString()}
                                </div>
                            </div>
                        </div>
                        {/each}
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>