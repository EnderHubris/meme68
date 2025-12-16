<!-- typescript logic for the page to use -->
<script lang="ts">
    import { NotifyFeedback } from "$lib/feedback";

    // variables can be referenced in HTML elements after the script-end tag
    let name = "";
    let password = "";

    const handleLogin = async (event: Event) => {
        event.preventDefault();

        const response = await fetch(`${import.meta.env.VITE_BACKEND_ROOT}/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name: name,
                password: password
            }),
            credentials: 'include'  // ensures cookies are sent
        });

        const data = await response.json();

        if (data && data.message) {
            NotifyFeedback(data.message);
        }

        if (data && data.success) {
            window.location.href = '/';
        }
    };
</script>

<div class="d-flex justify-content-center align-items-center">
  <form class="p-4 bg-white shadow rounded" style="width: 100%; max-width: 400px;" on:submit={handleLogin}>
    <h2 class="mb-4 text-center">Login</h2>

    <div class="mb-3">
      <label for="name" class="form-label">Username</label>
      <input
        type="username"
        class="form-control"
        id="name"
        bind:value={name}
        placeholder="Enter Username or Email"
        required
      />
    </div>

    <div class="mb-3">
      <label for="password" class="form-label">Password</label>
      <input
        type="password"
        class="form-control"
        id="password"
        bind:value={password}
        placeholder="Password"
        required
      />
    </div>

    <button type="submit" class="btn btn-primary w-100">Login</button>

    <div class="mt-3 text-center">
      <a href="/register">Don't have an account? Sign up</a>
    </div>
  </form>
</div>