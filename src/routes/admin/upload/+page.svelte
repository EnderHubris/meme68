<h2 class="mb-4 text-center">📂 File Upload Manager</h2>
<div class="container" style="max-width: 500px;">
    <a class="navbar-brand" href="/admin">Back</a>
</div>

<!-- File Upload Form -->
<form action="" method="POST" enctype="multipart/form-data" class="mb-4">
    <div class="mb-3">
        <label for="file" class="form-label">Choose file to upload</label>
        <input type="file" name="file" id="file" class="form-control" required>
    </div>
    <button type="submit" class="btn btn-success">Upload</button>
</form>