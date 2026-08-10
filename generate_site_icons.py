import subprocess
import os
import shutil

src_file = '/Users/vipuhere/.gemini/antigravity/brain/306b9ef0-ad10-4f62-a155-31bed83fcee1/.user_uploaded/media_1786369916313.png'
public_dir = './public'
dist_dir = './dist'

# Step 1: Create a 1024x1024 square version with transparent padding
master_sq = os.path.join(public_dir, 'site-icon.png')
cmd_master = f"sips --padToHeightWidth 1024 1024 {src_file} --out {master_sq}"
subprocess.run(cmd_master, shell=True, check=True)

# Sizes for standard favicons (Google Search, Android, PWA, iOS)
sizes = {
    'favicon-48x48.png': (48, 48),
    'favicon-96x96.png': (96, 96),
    'favicon-144x144.png': (144, 144),
    'favicon-192x192.png': (192, 192),
    'favicon-512x512.png': (512, 512),
    'apple-touch-icon.png': (180, 180),
    'favicon.png': (192, 192),
    'tripgod-logo.png': (512, 512),
    'site-icon.png': (512, 512),
}

for fname, (w, h) in sizes.items():
    dest = os.path.join(public_dir, fname)
    cmd = f"sips -z {h} {w} {master_sq} --out {dest}"
    subprocess.run(cmd, shell=True, check=True)
    print(f"Generated in public/: {fname} ({w}x{h})")

# Generate favicon.ico at 48x48
ico_dest = os.path.join(public_dir, 'favicon.ico')
cmd_ico = f"sips -z 48 48 {master_sq} -s format ico --out {ico_dest}"
subprocess.run(cmd_ico, shell=True, check=True)
print("Generated in public/: favicon.ico (48x48)")

# Generate tripgod-logo-padded.jpg (white background JPEG for OpenGraph / Google Schema / WhatsApp previews)
padded_jpg = os.path.join(public_dir, 'tripgod-logo-padded.jpg')
cmd_jpg = f"sips --padColor FFFFFF -s format jpeg -z 512 512 {master_sq} --out {padded_jpg}"
subprocess.run(cmd_jpg, shell=True, check=True)
print("Generated in public/: tripgod-logo-padded.jpg (512x512 JPEG with white bg)")

# Now copy all generated site icon files to dist/ if dist/ exists
if os.path.exists(dist_dir):
    files_to_sync = list(sizes.keys()) + ['favicon.ico', 'tripgod-logo-padded.jpg', 'site-icon.png']
    for fname in files_to_sync:
        src = os.path.join(public_dir, fname)
        dst = os.path.join(dist_dir, fname)
        if os.path.exists(src):
            shutil.copy2(src, dst)
            print(f"Synced to dist/: {fname}")
    
    # Also update index.html in dist/ if needed
    dist_html = os.path.join(dist_dir, 'index.html')
    if os.path.exists('./index.html') and os.path.exists(dist_html):
        shutil.copy2('./index.html', dist_html)
        print("Synced index.html to dist/")

print("All site icons and favicons generated and synced successfully!")
