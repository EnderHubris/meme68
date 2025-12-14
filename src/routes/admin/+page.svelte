<h1 class="text-center">Admin Panel</h1>
<div class="container my-5 text-center" style="max-width: 500px;">
  <div class="row g-3">
    <div class="col-6">
      <a href="/admin/upload" class="btn btn-primary btn-lg w-100 shadow">
        Upload Memes
      </a>
    </div>
    <div class="col-6">
      <a href="/admin/manage" class="btn btn-secondary btn-lg w-100 shadow">
        Manage Admins
      </a>
    </div>
  </div>
</div>

<div class="container my-5 d-flex justify-content-center gap-4">
  <div class="card shadow-sm" style="max-width: 500px; width: 100%;">
    <div class="card-body text-center">
      <h5 class="card-title mb-4">Enjoyers</h5><hr>
      <div id="new-users" class="d-grid gap-3">
      </div>
    </div>
  </div>
  
  <div class="card shadow-sm" style="max-width: 500px; width: 100%;">
    <div class="card-body text-center">
      <h5 class="card-title mb-4">Recently Added</h5><hr>
      <div id="recent-memes" class="d-grid gap-3">
      </div>
    </div>
  </div>
</div>