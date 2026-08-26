<script lang="ts">
    const { success, warning, error } : {
            success:string,
            warning:string,
            error:string
        } = $props();
</script>

{#if error}
    <div class="alert alert-danger d-flex align-items-start gap-2 mb-3" role="alert">
        <span>{error}</span>
    </div>
{/if}

{#if success}
    <div class="alert alert-success d-flex align-items-start gap-2 mb-3" role="alert">
        <span>{success}</span>
    </div>
{/if}

{#if warning}
    <div class="alert alert-warning d-flex align-items-start gap-2 mb-3" role="alert">
        <span>{warning}</span>
    </div>
{/if}