import os
import subprocess
from PIL import Image, ImageDraw, ImageFont

BASE_DIR = r"c:\Users\jaksh\Desktop\AI_Coding\Digital Compass"
MARKETING_DIR = os.path.join(BASE_DIR, "marketing")
V5_PROMO_DIR = os.path.join(BASE_DIR, "playstore_screenshots", "v5_promo_banners")
ROYAL_POSTER_SRC = r"C:\Users\jaksh\.gemini\antigravity\brain\ce594c6b-c738-4f0e-be0c-d5592f22a650\digital_compass_royal_whatsapp_poster_universal_1792249175554.jpg"
APP_ICON_SRC = os.path.join(BASE_DIR, "app-icon-1024x1024.png")
QR_SRC = os.path.join(MARKETING_DIR, "playstore_qr.png")
AUDIO_SRC = os.path.join(BASE_DIR, "dist", "Stotras", "Chattari Mangalam  Peaceful.mp3")
TEMP_DIR = os.path.join(MARKETING_DIR, "temp_video_build")

os.makedirs(MARKETING_DIR, exist_ok=True)
os.makedirs(TEMP_DIR, exist_ok=True)

QR_IMG = Image.open(QR_SRC).convert("RGBA") if os.path.exists(QR_SRC) else None

def get_font(size: int, bold: bool = True):
    candidates = [
        r"C:\Windows\Fonts\segoeuib.ttf" if bold else r"C:\Windows\Fonts\segoeui.ttf",
        r"C:\Windows\Fonts\arialbd.ttf" if bold else r"C:\Windows\Fonts\arial.ttf",
        r"C:\Windows\Fonts\georgiab.ttf" if bold else r"C:\Windows\Fonts\georgia.ttf",
    ]
    for p in candidates:
        if os.path.exists(p):
            try:
                return ImageFont.truetype(p, size)
            except Exception:
                pass
    return ImageFont.load_default()

def save_grand_posters():
    """Saves the Royal Poster at 1080x1920 with and without QR badge."""
    W, H = 1080, 1920
    im = Image.open(ROYAL_POSTER_SRC).convert("RGBA").resize((W, H), Image.Resampling.LANCZOS)
    
    # 1. Clean version
    clean_path = os.path.join(MARKETING_DIR, "digital_compass_whatsapp_poster_clean.png")
    im.convert("RGB").save(clean_path, quality=98)
    print(f"Saved clean poster: {clean_path}")

    # 2. QR Badge version
    if QR_IMG is not None:
        overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        draw = ImageDraw.Draw(overlay)
        
        qr_size = 120
        qr_x = W - qr_size - 32
        qr_y = H - qr_size - 84
        
        # White badge with gold border
        draw.rounded_rectangle(
            (qr_x - 8, qr_y - 8, qr_x + qr_size + 8, qr_y + qr_size + 8),
            radius=16,
            fill=(255, 255, 255, 252),
            outline=(218, 165, 32, 255),
            width=3
        )
        qr_res = QR_IMG.resize((qr_size, qr_size), Image.Resampling.LANCZOS)
        overlay.paste(qr_res, (qr_x, qr_y), qr_res)
        
        poster_with_qr = Image.alpha_composite(im, overlay)
        qr_path = os.path.join(MARKETING_DIR, "digital_compass_whatsapp_poster.png")
        poster_with_qr.convert("RGB").save(qr_path, quality=98)
        print(f"Saved poster with QR badge: {qr_path}")
        
        # Also copy as hindi poster path for backward compatibility
        hi_path = os.path.join(MARKETING_DIR, "digital_compass_whatsapp_poster_hindi.png")
        poster_with_qr.convert("RGB").save(hi_path, quality=98)
        print(f"Saved poster: {hi_path}")

def draw_soundwave_icon(draw: ImageDraw.ImageDraw, x: int, y: int, frame_idx: int):
    """Draws 5 golden audio visualizer bars on the top music pill."""
    heights = [10, 22, 16, 26, 12] if frame_idx % 2 == 1 else [18, 12, 26, 14, 22]
    for i, bh in enumerate(heights):
        bx = x + i * 7
        by1 = y + (28 - bh) // 2
        by2 = by1 + bh
        draw.rounded_rectangle((bx, by1, bx + 4, by2), radius=2, fill=(255, 215, 75, 255))

def build_video_slide(index: int, total: int, bg_path: str, tag_en: str) -> str:
    """Builds a full-bleed 1080x1920 video slide preserving 90% of screen art."""
    W, H = 1080, 1920
    src = Image.open(bg_path).convert("RGBA").resize((W, H), Image.Resampling.LANCZOS)

    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)

    font_top = get_font(20, bold=True)
    font_step = get_font(19, bold=True)
    font_cta_title = get_font(22, bold=True)
    font_cta_link = get_font(24, bold=True)
    font_cta_sub = get_font(17, bold=True)

    # 1. Sleek Top Music & Scene Info Pill (y = 16..66)
    draw.rounded_rectangle(
        (28, 14, W - 28, 64),
        radius=25,
        fill=(14, 18, 28, 230),
        outline=(235, 192, 95, 230),
        width=2
    )
    draw_soundwave_icon(draw, 50, 25, index)
    draw.text(
        (96, 25),
        f"Audio: Instrumental  •  {tag_en}",
        font=font_top,
        fill=(255, 230, 145, 255)
    )

    # Step Badge on Right
    draw.rounded_rectangle(
        (W - 130, 21, W - 40, 57),
        radius=18,
        fill=(235, 185, 55, 245)
    )
    draw.text((W - 106, 26), f"{index:02d} / {total:02d}", font=font_step, fill=(18, 12, 32, 255))

    # 2. Sleek Bottom Royal Download CTA + QR Code Bar (y = 1766..1898)
    draw.rounded_rectangle(
        (24, 1766, W - 24, 1898),
        radius=24,
        fill=(12, 22, 28, 245),
        outline=(218, 165, 32, 240),
        width=2
    )

    # App Icon on Left
    if os.path.exists(APP_ICON_SRC):
        icon_im = Image.open(APP_ICON_SRC).convert("RGBA").resize((98, 98), Image.Resampling.LANCZOS)
        icon_mask = Image.new("L", (98, 98), 0)
        ImageDraw.Draw(icon_mask).rounded_rectangle((0, 0, 98, 98), radius=22, fill=255)
        overlay.paste(icon_im, (44, 1782), icon_mask)
        draw.rounded_rectangle((44, 1782, 44 + 98, 1782 + 98), radius=22, outline=(245, 205, 85, 255), width=2)

    # Middle Text Info & Download Link
    draw.text(
        (160, 1776),
        "DIGITAL COMPASS & VASTU 6-IN-1  •  100% FREE",
        font=font_cta_title,
        fill=(254, 240, 138, 255)
    )
    draw.rounded_rectangle(
        (160, 1808, 760, 1856),
        radius=14,
        fill=(255, 215, 70, 255)
    )
    draw.text(
        (182, 1818),
        "Download: https://tinyurl.com/CompassVastu",
        font=font_cta_link,
        fill=(18, 12, 36, 255)
    )
    draw.text(
        (160, 1866),
        "Available on Google Play Store  •  Zero Ads  •  Tap or Scan to Install",
        font=font_cta_sub,
        fill=(200, 235, 255, 245)
    )

    # Scannable QR Code on Right
    if QR_IMG is not None:
        qr_size = 98
        qr_x = W - qr_size - 44
        qr_y = 1782
        draw.rounded_rectangle(
            (qr_x - 6, qr_y - 6, qr_x + qr_size + 6, qr_y + qr_size + 6),
            radius=12,
            fill=(255, 255, 255, 255),
            outline=(235, 192, 95, 255),
            width=2
        )
        qr_res = QR_IMG.resize((qr_size, qr_size), Image.Resampling.LANCZOS)
        overlay.paste(qr_res, (qr_x, qr_y), qr_res)

    # 3. Bottom Golden Progress Bar (y = 1905..1913)
    prog_w = int((W - 60) * (index / float(total)))
    draw.rounded_rectangle((30, 1905, W - 30, 1913), radius=4, fill=(255, 255, 255, 60))
    draw.rounded_rectangle((30, 1905, 30 + prog_w, 1913), radius=4, fill=(255, 205, 65, 255))

    out = Image.alpha_composite(src, overlay).convert("RGB")
    out_path = os.path.join(TEMP_DIR, f"slide_{index:02d}.jpg")
    out.save(out_path, quality=96)
    return out_path

def build_promo_video():
    """Builds the 48.4 second promo video with Ken Burns motion, xfade & instrumental audio."""
    clean_poster = os.path.join(MARKETING_DIR, "digital_compass_whatsapp_poster.png")

    SLIDES_SPEC = [
        (clean_poster, "All-in-One Digital Compass & Vastu"),
        (os.path.join(V5_PROMO_DIR, "promo_1_all_in_one_hero.png"), "Dual Modes: Light & Charcoal Dark"),
        (os.path.join(V5_PROMO_DIR, "promo_4_luxury_dials.png"), "10+ Luxury Dials: Shahi, Chandan & Galaxy"),
        (os.path.join(V5_PROMO_DIR, "promo_3_bilingual_en_hi.png"), "Bilingual: 1-Tap Hindi & English Toggle"),
        (os.path.join(V5_PROMO_DIR, "promo_6_spirit_level.png"), "Precision Spirit Level: Dual-Axis 360° Tilt"),
        (os.path.join(V5_PROMO_DIR, "promo_5_vastu_shastra.png"), "32-Pada Vastu Mandala & AR Scanner"),
        (os.path.join(V5_PROMO_DIR, "promo_8_daily_utility.png"), "Live Weather, Altitude & Barometer"),
        (os.path.join(V5_PROMO_DIR, "promo_7_numerology_panchang.png"), "Vedic Numerology & Lo Shu Matrix"),
        (os.path.join(V5_PROMO_DIR, "promo_2_live_home_widget.png"), "Live Home Screen Widgets & Shortcuts"),
        (clean_poster, "Install Free on Google Play Store"),
    ]

    total = len(SLIDES_SPEC)
    slide_paths = []
    for idx, (img_p, tag) in enumerate(SLIDES_SPEC, start=1):
        sp = build_video_slide(idx, total, img_p, tag)
        slide_paths.append(sp)

    print(f"Generated {total} video slide stills.")

    # Render segments with smooth Ken Burns motion (5.2s each, 30fps)
    seg_paths = []
    seg_dur = 5.2
    fps = 30
    frames_per_seg = int(seg_dur * fps)

    for idx, sp in enumerate(slide_paths):
        seg_out = os.path.join(TEMP_DIR, f"seg_{idx:02d}.mp4")
        vf = (
            f"scale=1120:1992,"
            f"zoompan=z='min(zoom+0.00025,1.03)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d={frames_per_seg}:s=1080x1920:fps={fps},"
            f"format=yuv420p"
        )
        subprocess.run([
            "ffmpeg", "-y",
            "-loop", "1", "-i", sp,
            "-vf", vf,
            "-t", str(seg_dur),
            "-r", str(fps),
            "-c:v", "libx264", "-preset", "fast", "-crf", "20",
            seg_out
        ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        seg_paths.append(seg_out)
        print(f"Rendered segment {idx+1}/{total}")

    # Crossfade transitions
    xfade_dur = 0.4
    inputs = []
    for seg in seg_paths:
        inputs.extend(["-i", seg])

    filter_parts = []
    prev_label = "[0:v]"
    offset = seg_dur - xfade_dur
    for i in range(1, len(seg_paths)):
        out_label = f"[v{i}]"
        filter_parts.append(
            f"{prev_label}[{i}:v]xfade=transition=fade:duration={xfade_dur}:offset={offset:.2f}{out_label}"
        )
        prev_label = out_label
        offset += (seg_dur - xfade_dur)

    total_video_dur = len(seg_paths) * seg_dur - (len(seg_paths) - 1) * xfade_dur
    print(f"Total video duration: {total_video_dur:.2f} seconds")

    video_only_mp4 = os.path.join(TEMP_DIR, "video_only.mp4")
    subprocess.run([
        "ffmpeg", "-y",
        *inputs,
        "-filter_complex", ";".join(filter_parts),
        "-map", prev_label,
        "-c:v", "libx264", "-preset", "medium", "-crf", "21", "-pix_fmt", "yuv420p",
        video_only_mp4
    ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    # Audio mixing with peaceful background instrumental track
    final_video_mp4 = os.path.join(MARKETING_DIR, "digital_compass_whatsapp_promo_video.mp4")
    fade_out_start = max(0, total_video_dur - 2.0)

    audio_filter = (
        f"[1:a]volume=0.90,afade=t=in:st=0:d=0.8,afade=t=out:st={fade_out_start:.2f}:d=2.0[aout]"
    )

    subprocess.run([
        "ffmpeg", "-y",
        "-i", video_only_mp4,
        "-i", AUDIO_SRC,
        "-filter_complex", audio_filter,
        "-map", "0:v", "-map", "[aout]",
        "-t", f"{total_video_dur:.2f}",
        "-c:v", "copy",
        "-c:a", "aac", "-b:a", "192k", "-ar", "44100", "-ac", "2",
        "-movflags", "+faststart",
        final_video_mp4
    ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    print(f"SUCCESS! Flawless Promo Video created: {final_video_mp4}")
    return final_video_mp4

def main():
    print("=== STEP 1: Saving Royal Grand Posters ===")
    save_grand_posters()

    print("=== STEP 2: Building 48.4s Flawless Cinematic Promo Video ===")
    build_promo_video()

    print("=== ALL MARKETING DELIVERABLES COMPLETED! ===")

if __name__ == "__main__":
    main()
