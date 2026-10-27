import os
import math
import subprocess
import qrcode
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageOps

BASE_DIR = r"c:\Users\jaksh\Desktop\AI_Coding\Digital Compass"
MARKETING_DIR = os.path.join(BASE_DIR, "marketing")
V5_PROMO_DIR = os.path.join(BASE_DIR, "playstore_screenshots", "v5_promo_banners")
V5_RAW_DIR = os.path.join(BASE_DIR, "playstore_screenshots", "v5_raw")
APP_ICON_PATH = os.path.join(BASE_DIR, "app-icon-1024x1024.png")
QR_PATH = os.path.join(MARKETING_DIR, "playstore_qr.png")
TEMP_FRAMES_DIR = os.path.join(MARKETING_DIR, "temp_video_frames")
AUDIO_PATH = r"c:\Users\jaksh\Desktop\AI_Coding\Hindi Panchang\public\Stotras\Chattari Mangalam  Peaceful.mp3"

os.makedirs(MARKETING_DIR, exist_ok=True)
os.makedirs(TEMP_FRAMES_DIR, exist_ok=True)

PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.spiritual.compass"

FONT_SEGOE_BOLD = r"C:\Windows\Fonts\segoeuib.ttf"
FONT_SEGOE_REG = r"C:\Windows\Fonts\segoeui.ttf"
FONT_NIRMALA = r"C:\Windows\Fonts\Nirmala.ttc"
FONT_ARIAL_BOLD = r"C:\Windows\Fonts\arialbd.ttf"
FONT_GEORGIA_BOLD = r"C:\Windows\Fonts\georgiab.ttf"

def get_font(size: int, bold: bool = True, hindi: bool = False):
    """Retrieve optimal Windows font with fallback."""
    if hindi:
        if os.path.exists(FONT_NIRMALA):
            try:
                return ImageFont.truetype(FONT_NIRMALA, size, index=0)
            except Exception:
                pass
    candidates = [
        FONT_SEGOE_BOLD if bold else FONT_SEGOE_REG,
        FONT_ARIAL_BOLD if bold else r"C:\Windows\Fonts\arial.ttf",
        FONT_GEORGIA_BOLD,
    ]
    for p in candidates:
        if os.path.exists(p):
            try:
                return ImageFont.truetype(p, size)
            except Exception:
                pass
    return ImageFont.load_default()

def ensure_qr_code():
    """Generate high-resolution scannable QR code."""
    if not os.path.exists(QR_PATH):
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_H,
            box_size=10,
            border=2,
        )
        qr.add_data(PLAY_STORE_URL)
        qr.make(fit=True)
        img = qr.make_image(fill_color="black", back_color="white").convert("RGBA")
        img.save(QR_PATH)
    return Image.open(QR_PATH).convert("RGBA")

QR_IMG = ensure_qr_code()

def create_phone_mockup(screen_path: str, width: int = 380, height: int = 780, is_gold: bool = False):
    """
    Renders an ultra-crisp modern smartphone frame containing the screenshot.
    Returns an RGBA image with transparent background.
    """
    phone = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(phone)
    corner_r = int(width * 0.11)

    # 1. Outer metallic chassis rim
    rim_color = (235, 195, 95, 255) if is_gold else (160, 165, 175, 240)
    draw.rounded_rectangle((0, 0, width, height), radius=corner_r, fill=(20, 22, 28, 255), outline=rim_color, width=4)

    # 2. Inner bezel
    bezel_inset = 8
    screen_rect = (bezel_inset, bezel_inset, width - bezel_inset, height - bezel_inset)
    screen_w = width - 2 * bezel_inset
    screen_h = height - 2 * bezel_inset

    # 3. Load & paste screenshot with rounded corners
    if os.path.exists(screen_path):
        screen_raw = Image.open(screen_path).convert("RGBA")
        screen_resized = screen_raw.resize((screen_w, screen_h), Image.Resampling.LANCZOS)
        
        # Mask for screenshot inner corners
        mask = Image.new("L", (screen_w, screen_h), 0)
        mask_draw = ImageDraw.Draw(mask)
        mask_draw.rounded_rectangle((0, 0, screen_w, screen_h), radius=corner_r - 4, fill=255)
        
        phone.paste(screen_resized, (bezel_inset, bezel_inset), mask)
    else:
        # Fallback dark background
        draw.rounded_rectangle(screen_rect, radius=corner_r - 4, fill=(15, 20, 25, 255))

    # 4. Dynamic Island / Top Camera Pill
    pill_w = int(width * 0.28)
    pill_h = int(height * 0.032)
    pill_x1 = (width - pill_w) // 2
    pill_y1 = bezel_inset + 12
    draw.rounded_rectangle((pill_x1, pill_y1, pill_x1 + pill_w, pill_y1 + pill_h), radius=pill_h // 2, fill=(8, 10, 14, 255))
    # Camera sensor lens dot
    dot_r = 4
    draw.ellipse((pill_x1 + pill_w - 18, pill_y1 + (pill_h // 2) - dot_r, pill_x1 + pill_w - 18 + 2 * dot_r, pill_y1 + (pill_h // 2) + dot_r), fill=(25, 35, 55, 255))

    # 5. Bottom home indicator bar
    bar_w = int(width * 0.35)
    bar_h = 4
    bar_x = (width - bar_w) // 2
    bar_y = height - bezel_inset - 12
    draw.rounded_rectangle((bar_x, bar_y, bar_x + bar_w, bar_y + bar_h), radius=2, fill=(220, 220, 220, 180))

    # 6. Sleek glossy glass reflection diagonal overlay
    glare = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    glare_draw = ImageDraw.Draw(glare)
    glare_draw.polygon([(0, 0), (width, 0), (0, height // 2)], fill=(255, 255, 255, 22))
    phone = Image.alpha_composite(phone, glare)

    return phone

def build_grand_poster(is_hindi: bool = False) -> str:
    """Builds the 1080x1920 Royal WhatsApp Poster with 3D 3-Phone Showcase & Feature Badges."""
    W, H = 1080, 1920
    poster = Image.new("RGBA", (W, H), (0, 0, 0, 255))
    draw = ImageDraw.Draw(poster)

    # 1. Deep cosmic gradient background: dark midnight teal & sapphire
    for y in range(H):
        t = y / float(H)
        # Gradient from deep dark emerald-navy #021118 to midnight abyss #040914 to warm golden ground #091218
        r = int(2 + 6 * math.sin(t * math.pi))
        g = int(14 + 18 * (1.0 - t * 0.5) + 12 * math.sin(t * math.pi))
        b = int(24 + 18 * (1.0 - t * 0.7) + 20 * math.cos(t * math.pi * 0.5))
        draw.line([(0, y), (W, y)], fill=(r, g, b, 255))

    # Radial glowing nebulae
    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    g_draw = ImageDraw.Draw(glow)
    # Top golden aura behind title
    g_draw.ellipse((W // 2 - 380, 80, W // 2 + 380, 620), fill=(245, 175, 35, 38))
    # Center aura behind center phone
    g_draw.ellipse((W // 2 - 320, 580, W // 2 + 320, 1260), fill=(218, 165, 32, 55))
    # Bottom cyan aura
    g_draw.ellipse((W // 2 - 400, 1200, W // 2 + 400, 1850), fill=(6, 182, 212, 35))
    glow = glow.filter(ImageFilter.GaussianBlur(65))
    poster = Image.alpha_composite(poster, glow)
    draw = ImageDraw.Draw(poster)

    # 2. Ornate Double Gold Border
    margin = 22
    draw.rounded_rectangle(
        (margin, margin, W - margin, H - margin),
        radius=36,
        outline=(235, 190, 80, 220),
        width=3
    )
    draw.rounded_rectangle(
        (margin + 9, margin + 9, W - margin - 9, H - margin - 9),
        radius=28,
        outline=(245, 215, 115, 120),
        width=1
    )
    # Gold Corner Diamonds
    c_pts = [
        (margin + 20, margin + 20),
        (W - margin - 20, margin + 20),
        (margin + 20, H - margin - 20),
        (W - margin - 20, H - margin - 20)
    ]
    for cx, cy in c_pts:
        draw.polygon([(cx, cy - 8), (cx + 8, cy), (cx, cy + 8), (cx - 8, cy)], fill=(255, 225, 95, 255))

    # 3. Top Header: Tagline Pill
    top_pill_w = 680
    top_pill_h = 44
    top_pill_x = (W - top_pill_w) // 2
    top_pill_y = 48
    draw.rounded_rectangle(
        (top_pill_x, top_pill_y, top_pill_x + top_pill_w, top_pill_y + top_pill_h),
        radius=22,
        fill=(14, 34, 28, 235),
        outline=(245, 195, 75, 240),
        width=2
    )
    f_pill = get_font(18, bold=True, hindi=is_hindi)
    pill_text = "🧭 भारत का सर्वश्रेष्ठ ऑल-इन-वन कम्पास • 100% FREE & AD-FREE" if is_hindi else "🧭 INDIA'S #1 ALL-IN-ONE COMPASS SUITE • 100% FREE & AD-FREE"
    pill_bbox = f_pill.getbbox(pill_text)
    pill_tw = pill_bbox[2] - pill_bbox[0]
    draw.text((top_pill_x + (top_pill_w - pill_tw) // 2, top_pill_y + 10), pill_text, font=f_pill, fill=(255, 240, 160, 255))

    # 4. Brand Header Row: App Icon + Grand App Title
    icon_y = 108
    icon_size = 110
    if os.path.exists(APP_ICON_PATH):
        raw_icon = Image.open(APP_ICON_PATH).convert("RGBA").resize((icon_size, icon_size), Image.Resampling.LANCZOS)
        # Rounded mask for icon
        icon_mask = Image.new("L", (icon_size, icon_size), 0)
        ImageDraw.Draw(icon_mask).rounded_rectangle((0, 0, icon_size, icon_size), radius=28, fill=255)
        
        # Golden shadow for icon
        draw.rounded_rectangle((82, icon_y + 2, 82 + icon_size, icon_y + icon_size + 2), radius=28, fill=(0, 0, 0, 160))
        poster.paste(raw_icon, (80, icon_y), icon_mask)
        # Gold outline on icon
        draw.rounded_rectangle((80, icon_y, 80 + icon_size, icon_y + icon_size), radius=28, outline=(245, 205, 85, 255), width=3)

    # Title & Subtitle
    f_title = get_font(52, bold=True)
    f_sub1 = get_font(26, bold=True, hindi=True)
    f_sub2 = get_font(19, bold=False, hindi=is_hindi)

    draw.text((214, icon_y - 2), "DIGITAL COMPASS", font=f_title, fill=(255, 235, 130, 255))
    sub1_text = "डिजिटल कम्पास  •  वास्तु 6-IN-1  •  स्पिरिट लेवल"
    draw.text((216, icon_y + 54), sub1_text, font=f_sub1, fill=(94, 234, 212, 255))
    sub2_text = "अल्ट्रा-एक्यूरेट कम्पास, प्रिसिजन स्पिरिट लेवल, मौसम व अंकशास्त्र" if is_hindi else "Ultra-Precision Heading, Spirit Level, Live Weather, Vastu & Numerology"
    draw.text((216, icon_y + 90), sub2_text, font=f_sub2, fill=(225, 235, 245, 220))

    # 5. Top Highlight Banner: 10+ Dials & Core Capabilities
    banner_y = 236
    draw.rounded_rectangle(
        (56, banner_y, W - 56, banner_y + 52),
        radius=20,
        fill=(8, 38, 48, 230),
        outline=(34, 211, 238, 200),
        width=2
    )
    f_banner = get_font(20, bold=True, hindi=is_hindi)
    banner_txt = "✨ 10+ रॉयल डायल्स  •  सटीक स्पिरिट लेवल  •  AR वास्तु स्कैनर  •  लाइव वेदर स्टेशन ✨" if is_hindi else "✨ 10+ Luxury Dials  •  Precision Level  •  AR Vastu Scanner  •  Live Weather  •  Numerology ✨"
    b_bbox = f_banner.getbbox(banner_txt)
    b_tw = b_bbox[2] - b_bbox[0]
    draw.text(((W - b_tw) // 2, banner_y + 13), banner_txt, font=f_banner, fill=(254, 240, 138, 255))

    # 6. Multi-Phone 3D Showcase (Center: Shahi Gold Compass, Left: Spirit Level, Right: Vastu Suite)
    center_screen = os.path.join(V5_RAW_DIR, "clean_screen_2_hi_royal_gold.png")
    left_screen = os.path.join(V5_RAW_DIR, "screen_6_spirit_level.png")
    right_screen = os.path.join(V5_RAW_DIR, "screen_7_vastu_suite.png")

    # Left Phone (Spirit Level - angled slightly lower)
    phone_l = create_phone_mockup(left_screen, width=330, height=680, is_gold=False)
    # Right Phone (Vastu Suite - angled slightly lower)
    phone_r = create_phone_mockup(right_screen, width=330, height=680, is_gold=False)
    # Center Phone (Shahi Gold Compass - largest & front)
    phone_c = create_phone_mockup(center_screen, width=390, height=800, is_gold=True)

    # Paste Left Phone
    poster.paste(phone_l, (48, 350), phone_l)
    # Paste Right Phone
    poster.paste(phone_r, (W - 48 - 330, 350), phone_r)

    # Center Phone Aura & Drop Shadow
    center_x = (W - 390) // 2
    center_y = 308
    shadow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    s_draw = ImageDraw.Draw(shadow)
    s_draw.rounded_rectangle((center_x - 14, center_y - 8, center_x + 390 + 14, center_y + 800 + 18), radius=52, fill=(0, 0, 0, 180))
    s_draw.rounded_rectangle((center_x - 6, center_y - 6, center_x + 390 + 6, center_y + 800 + 6), radius=48, fill=(235, 185, 55, 60))
    shadow = shadow.filter(ImageFilter.GaussianBlur(18))
    poster = Image.alpha_composite(poster, shadow)

    # Paste Center Phone
    poster.paste(phone_c, (center_x, center_y), phone_c)
    draw = ImageDraw.Draw(poster)

    # Phone Feature Pills below each phone
    f_badge = get_font(16, bold=True, hindi=is_hindi)
    
    # Left Badge
    lbl_l = "📐 प्रिसिजन स्पिरिट लेवल" if is_hindi else "📐 Precision Bubble Level"
    draw.rounded_rectangle((65, 1046, 360, 1084), radius=16, fill=(12, 38, 45, 240), outline=(34, 211, 238, 220), width=2)
    draw.text((82, 1054), lbl_l, font=f_badge, fill=(207, 250, 254, 255))

    # Center Badge
    lbl_c = "🧭 शाही गोल्ड कम्पास (True North)" if is_hindi else "🧭 Shahi Gold Compass (True North)"
    c_tw = f_badge.getbbox(lbl_c)[2] - f_badge.getbbox(lbl_c)[0]
    draw.rounded_rectangle(((W - c_tw - 46) // 2, 1120, (W + c_tw + 46) // 2, 1162), radius=18, fill=(35, 20, 6, 245), outline=(245, 195, 75, 255), width=2)
    draw.text(((W - c_tw) // 2, 1130), lbl_c, font=f_badge, fill=(254, 240, 138, 255))

    # Right Badge
    lbl_r = "🏠 वास्तु 6-in-1 महा-सुइट" if is_hindi else "🏠 Vastu Shastra 6-in-1 Suite"
    draw.rounded_rectangle((W - 360, 1046, W - 65, 1084), radius=16, fill=(38, 14, 38, 240), outline=(244, 114, 182, 220), width=2)
    draw.text((W - 340, 1054), lbl_r, font=f_badge, fill=(253, 232, 242, 255))

    # 7. 12 Master Feature Highlights Grid (2 cols x 6 rows)
    grid_y_start = 1182
    col_w = (W - 56 * 2 - 20) // 2
    row_h = 76
    gap_x = 20
    gap_y = 12

    FEATURES_GRID = [
        ("🌐", "Bilingual Hindi & English", "हिंदी और English भाषा में उपलब्ध", (16, 185, 129)),
        ("🌓", "Light & Dark Themes", "प्रीमियम लाइट व डार्क थीम विकल्प", (56, 189, 248)),
        ("🎨", "10+ Luxury Dial Skins", "शाही, चंदन, वैदिक मंडल व गैलेक्सी", (245, 158, 11)),
        ("📐", "Dual-Axis Spirit Level", "360° टिल्ट, पिच, रोल व एंगल लेवल", (20, 184, 166)),
        ("⛅", "Live Weather & Barometer", "तापमान, वायुदाब, अल्टीमीटर व UV", (251, 146, 60)),
        ("🏠", "Vastu 16 Zones & 32 Padas", "16 दिशा ज़ोन, पद व दोष निवारण", (236, 72, 153)),
        ("📷", "AR Vastu Camera Scanner", "कैमरे से घर के कमरों की दिशा जाँचें", (168, 85, 247)),
        ("🔢", "Vedic Numerology & Lo Shu", "मूलांक, भाग्यांक व लकी दिशा ग्रिड", (234, 179, 8)),
        ("☯️", "Feng Shui 8 Mansions", "कुआ नंबर, धन व स्वास्थ्य दिशाएँ", (14, 165, 233)),
        ("🕉️", "Jain & Jyotish Direction", "दिशा शूल, राहु काल व तीर्थंकर दिशा", (244, 63, 94)),
        ("🛰️", "Satellite Map Compass", "लाइव गूगल हाइब्रिड मैप दिशा वेक्टर", (34, 197, 94)),
        ("📱", "Live Home Screen Widget", "स्क्रीन पर लाइव दिशा व अज़ीमुथ देखें", (139, 92, 246)),
    ]

    f_card_t = get_font(19, bold=True)
    f_card_d = get_font(15, bold=False, hindi=True)

    for idx, (emoji, title_en, title_hi, accent) in enumerate(FEATURES_GRID):
        row = idx // 2
        col = idx % 2
        cx = 56 + col * (col_w + gap_x)
        cy = grid_y_start + row * (row_h + gap_y)

        # Card container
        draw.rounded_rectangle(
            (cx, cy, cx + col_w, cy + row_h),
            radius=18,
            fill=(12, 18, 26, 215),
            outline=(*accent, 180),
            width=2
        )
        # Left Accent pill
        draw.rounded_rectangle((cx + 10, cy + 12, cx + 56, cy + row_h - 12), radius=12, fill=(*accent, 45))
        # Emoji
        f_emo = get_font(24)
        draw.text((cx + 19, cy + 20), emoji, font=f_emo, fill=(255, 255, 255, 255))
        # Text
        main_t = title_hi if is_hindi else title_en
        sub_t = title_en if is_hindi else title_hi
        draw.text((cx + 66, cy + 14), main_t, font=f_card_t, fill=(255, 255, 255, 255))
        draw.text((cx + 66, cy + 42), sub_t, font=f_card_d, fill=(185, 205, 220, 225))

    # 8. Bottom Download CTA Banner with Scannable QR Code
    cta_y = 1730
    draw.rounded_rectangle(
        (36, cta_y, W - 36, H - 36),
        radius=26,
        fill=(10, 28, 22, 248),
        outline=(52, 211, 153, 240),
        width=3
    )

    # App icon in CTA on left
    if os.path.exists(APP_ICON_PATH):
        cta_icon = Image.open(APP_ICON_PATH).convert("RGBA").resize((108, 108), Image.Resampling.LANCZOS)
        cta_mask = Image.new("L", (108, 108), 0)
        ImageDraw.Draw(cta_mask).rounded_rectangle((0, 0, 108, 108), radius=24, fill=255)
        poster.paste(cta_icon, (56, cta_y + 24), cta_mask)
        draw.rounded_rectangle((56, cta_y + 24, 56 + 108, cta_y + 24 + 108), radius=24, outline=(245, 205, 85, 255), width=2)

    # Middle Text Info & Button
    f_cta_h1 = get_font(22, bold=True)
    f_cta_btn = get_font(23, bold=True)
    f_cta_sub = get_font(17, bold=False, hindi=is_hindi)

    draw.text((182, cta_y + 18), "DIGITAL COMPASS & VASTU 6-IN-1", font=f_cta_h1, fill=(254, 240, 138, 255))

    # Download Button Pill
    btn_w = 460
    btn_h = 48
    draw.rounded_rectangle((182, cta_y + 54, 182 + btn_w, cta_y + 54 + btn_h), radius=16, fill=(245, 195, 65, 255))
    btn_text = "📥 Download on Google Play Store"
    draw.text((200, cta_y + 64), btn_text, font=f_cta_btn, fill=(16, 10, 30, 255))

    cta_sub_txt = "100% Free • No Ads (कोई विज्ञापन नहीं) • 100% Private" if is_hindi else "100% Free • No Ads • Scan QR to Install • Available on Play Store"
    draw.text((182, cta_y + 114), cta_sub_txt, font=f_cta_sub, fill=(167, 243, 208, 240))

    # QR Code on Right
    qr_box_size = 118
    qr_x = W - 36 - qr_box_size - 22
    qr_y = cta_y + 18
    draw.rounded_rectangle((qr_x - 6, qr_y - 6, qr_x + qr_box_size + 6, qr_y + qr_box_size + 6), radius=16, fill=(255, 255, 255, 255), outline=(235, 195, 75, 255), width=3)
    qr_res = QR_IMG.resize((qr_box_size, qr_box_size), Image.Resampling.LANCZOS)
    poster.paste(qr_res, (qr_x, qr_y), qr_res)

    out_name = "digital_compass_whatsapp_poster_hindi.png" if is_hindi else "digital_compass_whatsapp_poster.png"
    out_path = os.path.join(MARKETING_DIR, out_name)
    poster.convert("RGB").save(out_path, quality=96)
    print(f"Generated Grand Poster: {out_path}")
    return out_path

def build_video_slide(
    index: int,
    total: int,
    base_image_path: str,
    tag_en: str,
    title_en: str,
    subtitle_en: str
) -> str:
    """Builds a high-impact 1080x1920 video slide with sleek top info pill and bottom conversion bar."""
    W, H = 1080, 1920
    
    if os.path.exists(base_image_path):
        slide = Image.open(base_image_path).convert("RGBA").resize((W, H), Image.Resampling.LANCZOS)
    else:
        slide = Image.new("RGBA", (W, H), (10, 20, 28, 255))

    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)

    font_top = get_font(21, bold=True)
    font_step = get_font(20, bold=True)
    font_cta_title = get_font(23, bold=True)
    font_cta_link = get_font(24, bold=True)
    font_cta_sub = get_font(18, bold=True)

    # 1. Sleek Top Music & Scene Info Pill (y = 16..72)
    draw.rounded_rectangle(
        (26, 16, W - 26, 70),
        radius=26,
        fill=(8, 24, 32, 235),
        outline=(235, 195, 75, 230),
        width=2
    )

    # Animated Visualizer Audio Bars
    v_heights = [12, 26, 18, 30, 14] if index % 2 == 1 else [22, 14, 30, 16, 24]
    for i, bh in enumerate(v_heights):
        bx = 52 + i * 8
        by1 = 26 + (32 - bh) // 2
        draw.rounded_rectangle((bx, by1, bx + 5, by1 + bh), radius=2, fill=(255, 215, 75, 255))

    draw.text(
        (104, 28),
        f"Audio: Chattari Mangalam  •  {tag_en}",
        font=font_top,
        fill=(255, 235, 145, 255)
    )

    # Step Counter Pill on Right
    step_pill_x = W - 146
    draw.rounded_rectangle(
        (step_pill_x, 23, W - 40, 63),
        radius=18,
        fill=(235, 185, 55, 245)
    )
    draw.text((step_pill_x + 24, 29), f"{index:02d} / {total:02d}", font=font_step, fill=(15, 12, 32, 255))

    # 2. Sleek Bottom Royal Download CTA + QR Code Bar (y = 1756..1896)
    draw.rounded_rectangle(
        (24, 1756, W - 24, 1898),
        radius=26,
        fill=(10, 32, 26, 246),
        outline=(52, 211, 153, 240),
        width=3
    )

    # App Icon on left
    if os.path.exists(APP_ICON_PATH):
        icon_im = Image.open(APP_ICON_PATH).convert("RGBA").resize((106, 106), Image.Resampling.LANCZOS)
        icon_mask = Image.new("L", (106, 106), 0)
        ImageDraw.Draw(icon_mask).rounded_rectangle((0, 0, 106, 106), radius=24, fill=255)
        overlay.paste(icon_im, (44, 1772), icon_mask)
        draw.rounded_rectangle((44, 1772, 44 + 106, 1772 + 106), radius=24, outline=(245, 205, 85, 255), width=2)

    # Middle Text + Link
    draw.text(
        (168, 1768),
        "DIGITAL COMPASS & VASTU 6-IN-1  •  100% FREE",
        font=font_cta_title,
        fill=(254, 240, 138, 255)
    )
    draw.rounded_rectangle(
        (168, 1802, 760, 1852),
        radius=14,
        fill=(255, 215, 70, 255)
    )
    draw.text(
        (190, 1812),
        "Google Play:  https://tinyurl.com/CompassVastu",
        font=font_cta_link,
        fill=(18, 10, 38, 255)
    )
    draw.text(
        (168, 1862),
        "Zero Ads  •  Hindi & English  •  Scan QR or Tap to Install",
        font=font_cta_sub,
        fill=(167, 243, 208, 255)
    )

    # Scannable QR Code on Right
    qr_size = 106
    qr_x = W - qr_size - 44
    qr_y = 1772
    draw.rounded_rectangle(
        (qr_x - 6, qr_y - 6, qr_x + qr_size + 6, qr_y + qr_size + 6),
        radius=14,
        fill=(255, 255, 255, 255),
        outline=(235, 192, 95, 255),
        width=2
    )
    qr_resized = QR_IMG.resize((qr_size, qr_size), Image.Resampling.LANCZOS)
    overlay.paste(qr_resized, (qr_x, qr_y), qr_resized)

    # 3. Bottom Progress Bar (y = 1905..1914)
    prog_w = int((W - 60) * (index / float(total)))
    draw.rounded_rectangle((30, 1905, W - 30, 1913), radius=4, fill=(255, 255, 255, 60))
    draw.rounded_rectangle((30, 1905, 30 + prog_w, 1913), radius=4, fill=(255, 205, 65, 255))

    out = Image.alpha_composite(slide, overlay).convert("RGB")
    out_path = os.path.join(TEMP_FRAMES_DIR, f"slide_{index:02d}.jpg")
    out.save(out_path, quality=96)
    return out_path

def build_promo_video():
    """Renders 48-52 sec cinematic 1080x1920 promo video with Ken Burns zoom, xfade & music."""
    poster_en = os.path.join(MARKETING_DIR, "digital_compass_whatsapp_poster.png")
    poster_hi = os.path.join(MARKETING_DIR, "digital_compass_whatsapp_poster_hindi.png")

    # 12 Master Slides covering every single feature
    SLIDES_SPEC = [
        (poster_hi, "All-in-One Digital Compass & Vastu", "Master Compass", "True North & Azimuth"),
        (os.path.join(V5_PROMO_DIR, "promo_1_all_in_one_hero.png"), "Precision Heading & GPS", "Ultra-Accurate Compass", "GPS, Altitude & Azimuth"),
        (os.path.join(V5_PROMO_DIR, "promo_4_luxury_dials.png"), "10+ Luxury & Tactical Dials", "Luxury Dials", "Sandalwood, Shahi & Cosmic"),
        (os.path.join(V5_PROMO_DIR, "promo_3_bilingual_en_hi.png"), "Dual Language & Theme Mastery", "Bilingual & Themes", "Hindi/English & Light/Dark"),
        (os.path.join(V5_PROMO_DIR, "promo_6_spirit_level.png"), "Precision Bubble & Spirit Level", "Spirit Level", "Dual-Axis Pitch, Roll & Angle"),
        (os.path.join(V5_PROMO_DIR, "promo_8_daily_utility.png"), "Live Atmospheric Weather Station", "Live Weather", "Barometer, Altitude & UV Index"),
        (os.path.join(V5_PROMO_DIR, "promo_5_vastu_shastra.png"), "Vastu Shastra 6-in-1 Suite", "Vastu 6-in-1 Suite", "16 Zones, 32 Padas & Remedies"),
        (os.path.join(V5_RAW_DIR, "dark_hi_vastu_suite.png"), "AR Camera Scanner & Blueprint", "AR Room Alignment", "Instant Floor Plan Matching"),
        (os.path.join(V5_PROMO_DIR, "promo_7_numerology_panchang.png"), "Vedic Numerology & Lo Shu Grid", "Vedic Numerology", "Life Path & Lucky Directions"),
        (os.path.join(V5_RAW_DIR, "screen_8_numerology.png"), "Feng Shui 8 Mansions & Kua", "Feng Shui Wisdom", "Kua Number & Wealth Sectors"),
        (os.path.join(V5_PROMO_DIR, "promo_2_live_home_widget.png"), "Live Home Screen Widget & Tools", "Live Home Widgets", "Instant Direction on Screen"),
        (poster_en, "Download Free on Google Play", "Install Free Today", "Zero Ads • 100% Free"),
    ]

    total = len(SLIDES_SPEC)
    slide_paths = []
    for idx, (img_p, tag, t_en, s_en) in enumerate(SLIDES_SPEC, start=1):
        sp = build_video_slide(idx, total, img_p, tag, t_en, s_en)
        slide_paths.append(sp)

    print(f"Built all {total} video slide stills.")

    # Render segments with smooth Ken Burns motion (4.4s each, 30fps)
    seg_paths = []
    seg_dur = 4.4
    fps = 30
    frames_per_seg = int(seg_dur * fps)

    for idx, sp in enumerate(slide_paths):
        seg_out = os.path.join(TEMP_FRAMES_DIR, f"seg_{idx:02d}.mp4")
        # Ken Burns slow cinematic zoom
        vf = (
            f"scale=1120:1992,"
            f"zoompan=z='min(zoom+0.0003,1.035)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d={frames_per_seg}:s=1080x1920:fps={fps},"
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
        print(f"Rendered segment {idx}/{total}")

    # Crossfade transitions between segments
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

    video_only_mp4 = os.path.join(TEMP_FRAMES_DIR, "video_only.mp4")
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
        f"[1:a]volume=0.92,afade=t=in:st=0:d=0.8,afade=t=out:st={fade_out_start:.2f}:d=2.0[aout]"
    )

    subprocess.run([
        "ffmpeg", "-y",
        "-i", video_only_mp4,
        "-i", AUDIO_PATH,
        "-filter_complex", audio_filter,
        "-map", "0:v", "-map", "[aout]",
        "-t", f"{total_video_dur:.2f}",
        "-c:v", "copy",
        "-c:a", "aac", "-b:a", "192k", "-ar", "44100", "-ac", "2",
        "-movflags", "+faststart",
        final_video_mp4
    ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    print(f"SUCCESS! Promo video created: {final_video_mp4}")
    return final_video_mp4

def main():
    print("Step 1: Building Grand WhatsApp Posters...")
    build_grand_poster(is_hindi=False)
    build_grand_poster(is_hindi=True)

    print("Step 2: Building 48-52 Sec Cinematic WhatsApp Promo Video...")
    build_promo_video()

    print("ALL MARKETING ASSETS READY IN marketing/ FOLDER!")

if __name__ == "__main__":
    main()
