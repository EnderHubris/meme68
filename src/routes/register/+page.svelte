<!-- typescript logic for the page to use -->
<script lang="ts">
    // variables can be referenced in HTML elements after the script-end tag
    let username = "";
    let email = "";
    let password = "";

    const handleRegister = async (event: Event) => {
        event.preventDefault();

        const response = await fetch(`http://localhost:4000/register`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                username: username,
                email: email,
                password: password
            }),
            credentials: 'include'  // ensures cookies are sent
        });

        const data = await response.json();
        
        console.log(data);

        if (data && data.success) {
            window.location.href = '/account/login';
        }
    };
</script>

<div class="d-flex justify-content-center align-items-center">
  <form class="p-4 bg-white shadow rounded" style="width: 100%; max-width: 400px;" on:submit={handleRegister}>
    <h2 class="mb-4 text-center">Register</h2>

    <div class="mb-3">
      <label for="username" class="form-label">Username</label>
      <input
        type="username"
        class="form-control"
        id="username"
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