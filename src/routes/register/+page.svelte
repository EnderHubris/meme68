<!-- typescript logic for the page to use -->
<script lang="ts">
    import { enhance } from "$app/forms";
    import { invalidateAll } from '$app/navigation';
    
    import { parseResult } from "$lib/browser_utils";
    
    let username = $state<string>("");
    let email = $state<string>("");
    let password = $state<string>("");
                
    import Feedback from '$lib/components/feedback.svelte';
    let error = $state("");
    let warning = $state("");
    let success = $state("");
    function clearResult() {
        error = warning = success = "";
    }
</script>

<div class="d-flex justify-content-center align-items-center">
  <form
    id="dataForm"
    class="p-4 shadow rounded"
    style="width: 100%; max-width: 400px;"
    method="POST"
    action="?/register"
    use:enhance={ () => {
        return async ({ result, update }) => {
            await update();
            const data = await parseResult(result);

            success = data.success;
            warning = data.warning;
            error = data.error;

            if (result.type === 'success' && result.data) {
                await invalidateAll();
                setTimeout(clearResult, 5000);
            }
        };
    }}
  >
    <h2 class="mb-4 text-center">Register</h2>

    <Feedback {success} {warning} {error} />

    <div class="mb-3">
      <label for="username" class="form-label">Username</label>
      <input
        type="username"
        class="form-control"
        id="username"
        name="username"
        bind:value={username}
        placeholder="Enter Username"
        required
      />
    </div>

    <div class="mb-3">
      <label for="email" class="form-label">Email</label>
      <input
        type="email"
        class="form-control"
        id="email"
        name="email"
        bind:value={email}
        placeholder="Enter Email"
        required
      />
    </div>

    <div class="mb-3">
      <label for="password" class="form-label">Password</label>
      <input
        type="password"
        class="form-control"
        id="password"
        name="password"
        bind:value={password}
        placeholder="Password"
        required
      />
    </div>

    <button type="submit" class="btn btn-primary w-100">Sign Up</button>

    <div class="mt-3 text-center">
      <a href="/login">Have an account? Log in</a>
    </div>
  </form>
</div>