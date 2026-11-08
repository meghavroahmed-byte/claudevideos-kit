import bpy, numpy as np, os
src = r"D:\ClaudeVideos\cache\maps\bluemarble_12000.jpg"
out = r"D:\ClaudeVideos\cache\maps\tiles"
os.makedirs(out, exist_ok=True)
img = bpy.data.images.load(src)
W, H = img.size
print("size", W, H)
px = np.empty(W * H * 4, dtype=np.float32)
img.pixels.foreach_get(px)
px = px.reshape(H, W, 4)  # bottom-up rows
T = 4000
for ty in range(H // T):
    for tx in range(W // T):
        y0 = H - (ty + 1) * T  # tile row 0 = top
        tile = px[y0:y0 + T, tx * T:(tx + 1) * T, :].copy()
        im = bpy.data.images.new(f"t{tx}_{ty}", T, T)
        im.pixels.foreach_set(tile.ravel())
        im.filepath_raw = os.path.join(out, f"bm_{tx}_{ty}.jpg")
        im.file_format = 'JPEG'
        im.save()
        bpy.data.images.remove(im)
        print("saved", tx, ty)
# overview 6000x3000
small = img.copy(); small.scale(6000, 3000)
small.filepath_raw = os.path.join(out, "bm_overview_6000.jpg"); small.file_format = 'JPEG'; small.save()
print("done")
