import os
import subprocess
from PIL import Image, ImageDraw, ImageFont

def create_vendor_icon():
    public_dir = '/Users/vipuhere/.gemini/antigravity/scratch/tripgod/public'
    os.makedirs(public_dir, exist_ok=True)
    
    # 1. Create high-res 1024x1024 master icon
    size = 1024
    img = Image.new('RGBA', (size, size), (15, 23, 42, 255)) # Dark slate background #0F172A
    draw = ImageDraw.Draw(img)
    
    # Draw rounded rectangle container background with subtle orange glow border
    margin = 40
    corner_radius = 180
    
    # Outer orange gradient accent border
    draw.rounded_rectangle(
        [margin, margin, size - margin, size - margin],
        radius=corner_radius,
        fill=(20, 30, 50, 255),
        outline=(255, 107, 0, 255),
        width=16
    )
    
    # Inner glow container
    inner_m = 70
    draw.rounded_rectangle(
        [inner_m, inner_m, size - inner_m, size - inner_m],
        radius=corner_radius - 20,
        fill=(26, 38, 64, 255)
    )
    
    # Draw TRIP GOD logo text & VENDOR badge manually using high-res drawing
    # Orange Pill Badge in middle for "GOD" and "VENDOR"
    # "TRIP" text box
    # Left box: TRIP (white font)
    # Right pill: GOD (orange fill, white font)
    # Bottom pill: VENDOR PARTNER
    
    # Draw Orange Gradient Pill in center
    pill_x1 = 490
    pill_y1 = 340
    pill_x2 = 910
    pill_y2 = 540
    draw.rounded_rectangle([pill_x1, pill_y1, pill_x2, pill_y2], radius=45, fill=(255, 95, 0, 255))
    
    # Try loading a sans-serif font or fallback
    try:
        font_large = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 170)
        font_badge = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 75)
        font_sub = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 55)
    except:
        font_large = ImageFont.load_default()
        font_badge = ImageFont.load_default()
        font_sub = ImageFont.load_default()
        
    # Draw TRIP text
    draw.text((110, 350), "TRIP", fill=(255, 255, 255, 255), font=font_large)
    
    # Draw GOD text inside orange pill
    draw.text((540, 350), "GOD", fill=(255, 255, 255, 255), font=font_large)
    
    # Draw VENDOR PARTNER Bottom Pill Badge
    v_pill_x1 = 180
    v_pill_y1 = 640
    v_pill_x2 = 844
    v_pill_y2 = 780
    draw.rounded_rectangle([v_pill_x1, v_pill_y1, v_pill_x2, v_pill_y2], radius=40, fill=(255, 107, 0, 40), outline=(255, 107, 0, 255), width=6)
    
    # Draw text inside Vendor badge
    draw.text((250, 665), "VENDOR PARTNER", fill=(255, 160, 50, 255), font=font_badge)
    
    # Save Master PNG
    master_path = os.path.join(public_dir, 'vendor-icon-master.png')
    img.save(master_path)
    print("Master vendor icon created:", master_path)
    
    # 2. Resize into standard sizes
    sizes = {
        'vendor-icon-192.png': (192, 192),
        'vendor-icon-512.png': (512, 512),
        'vendor-icon-maskable.png': (512, 512),
        'apple-touch-icon-vendor.png': (180, 180),
        'vendor-favicon.png': (96, 96)
    }
    
    for filename, s in sizes.items():
        resized = img.resize(s, Image.Resampling.LANCZOS)
        out_p = os.path.join(public_dir, filename)
        resized.save(out_p)
        print(f"Saved {filename} ({s[0]}x{s[1]})")

    # 3. Create SVG version as well
    svg_content = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <rect width="512" height="512" rx="100" fill="#0F172A"/>
  <rect x="20" y="20" width="472" height="472" rx="90" fill="#1E293B" stroke="#FF6B00" stroke-width="6"/>
  <g transform="translate(45, 160)">
    <text x="10" y="90" font-family="'Outfit', sans-serif" font-weight="900" font-size="85" fill="#FFFFFF" letter-spacing="-2">TRIP</text>
    <rect x="220" y="10" width="210" height="100" rx="25" fill="url(#orangeGrad)"/>
    <text x="240" y="90" font-family="'Outfit', sans-serif" font-weight="900" font-size="85" fill="#FFFFFF" letter-spacing="-2">GOD</text>
  </g>
  <rect x="80" y="320" width="352" height="75" rx="22" fill="#FF6B00" fill-opacity="0.15" stroke="#FF6B00" stroke-width="3"/>
  <text x="256" y="368" font-family="'Inter', sans-serif" font-weight="800" font-size="32" fill="#FF8C38" text-anchor="middle" letter-spacing="4">VENDOR PARTNER</text>
  <defs>
    <linearGradient id="orangeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FF6B00" />
      <stop offset="100%" stop-color="#FF4500" />
    </linearGradient>
  </defs>
</svg>'''
    with open(os.path.join(public_dir, 'vendor-icon.svg'), 'w') as f:
        f.write(svg_content)
    print("Saved vendor-icon.svg")

if __name__ == '__main__':
    create_vendor_icon()
