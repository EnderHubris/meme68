<script lang="ts">
    import Panel from "./panel.svelte";
    import Users from "./users.panel.svelte";
    import Admins from "./admins.panel.svelte";
    import Upload from "./upload.panel.svelte";
    import { onMount } from "svelte";

    const TABS = [
        "Home",
        "Users",
        "Admins",
        "Uploads",
    ]
    const { data } = $props();

    let activePage = $state<string>(TABS[0].toLowerCase());

    function changePage(name: string) {
        for (const TAB of TABS) {
            const elem = document.getElementById(TAB);
            if (!elem) continue;
            activePage = name.toLowerCase();
            
            if (TAB === name) {
                elem.classList.add('active');
            } else {
                elem.classList.remove('active');
            }
        }
    }
    onMount( () => changePage(TABS[0]) );
</script>

<h1 class="text-center">Admin Panel</h1>
<nav
    class="navbar navbar-expand-lg"
>
    <div class="container-fluid">
        <div
            class="justify-content-md-center"
        >
            <ul class="navbar-nav">
                {#each TABS as TAB}
                    <li class="nav-item">
                        <button id="{TAB}" class="nav-link" onclick={() => { changePage(TAB) }}>
                            {TAB}
                        </button>
                    </li>
                {/each}
            </ul>
        </div>
    </div>
</nav>
<hr />

{#if activePage === TABS[0].toLowerCase()}
    <Panel memes={data.recentMemes} />
{:else if activePage === TABS[1].toLowerCase()}
    <Users users={ data.users }/>
{:else if activePage === TABS[2].toLowerCase()}
    <Admins admins={ data.admins }/>
{:else if activePage === TABS[3].toLowerCase()}
    <Upload />
{:else}
    <p>Unsure what to render...</p>
{/if}