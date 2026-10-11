package com.spiritual.compass;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.Typeface;
import android.widget.RemoteViews;

/**
 * Precision 360° Compass & Spirit-Level Home Screen Widget.
 * Renders:
 * 1. Fixed 12 o'clock Heading Pointer (Lubber Triangle + Jewel Dot)
 * 2. Rotating 3D Bicolor Compass Needle (Red North Spear + Silver-Titanium South Spear)
 * 3. All 4 Upright Cardinal Labels (N, E, S, W)
 * 4. 30° Perimeter Degree Numbers (30, 60, 120, 150, 210, 240, 300, 330) + 5°/15° ticks
 * 5. Live Spirit-Level Flatness Ring, Bubble & Top Bar Status Badge (● LEVEL vs ● TILT)
 */
public class CompassWidgetProvider extends AppWidgetProvider {

    public static final String ACTION_CHECK_DIRECTION = "com.spiritual.compass.ACTION_CHECK_DIRECTION";
    private static final String PREFS_NAME = "CompassWidgetPrefs";
    private static final String KEY_HEADING = "last_heading";
    private static final String KEY_PITCH = "last_pitch";
    private static final String KEY_ROLL = "last_roll";
    private static final String KEY_TIMESTAMP = "last_timestamp";

    // Standard 8-Direction codes and full names
    private static final String[] CARDINALS_8 = {
            "N", "NE", "E", "SE", "S", "SW", "W", "NW"
    };

    private static final String[] CARDINAL_NAMES_8 = {
            "North", "North-East", "East", "South-East",
            "South", "South-West", "West", "North-West"
    };

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        float heading = prefs.getFloat(KEY_HEADING, 0f);
        float pitch = prefs.getFloat(KEY_PITCH, 0f);
        float roll = prefs.getFloat(KEY_ROLL, 0f);
        String timestamp = prefs.getString(KEY_TIMESTAMP, "Tap to Check Direction");

        for (int appWidgetId : appWidgetIds) {
            updateSingleWidget(context, appWidgetManager, appWidgetId, heading, pitch, roll, timestamp, false);
        }
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);

        if (ACTION_CHECK_DIRECTION.equals(intent.getAction())) {
            Intent sensorIntent = new Intent(context, WidgetSensorActivity.class);
            sensorIntent.addFlags(
                    Intent.FLAG_ACTIVITY_NEW_TASK |
                    Intent.FLAG_ACTIVITY_MULTIPLE_TASK |
                    Intent.FLAG_ACTIVITY_NO_ANIMATION |
                    Intent.FLAG_ACTIVITY_EXCLUDE_FROM_RECENTS
            );
            context.startActivity(sensorIntent);
        }
    }

    public static float getSavedHeading(Context context) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        return prefs.getFloat(KEY_HEADING, 0f);
    }

    public static float getSavedPitch(Context context) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        return prefs.getFloat(KEY_PITCH, 0f);
    }

    public static float getSavedRoll(Context context) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        return prefs.getFloat(KEY_ROLL, 0f);
    }

    private static void updateSingleWidget(
            Context context,
            AppWidgetManager appWidgetManager,
            int appWidgetId,
            float heading,
            float pitch,
            float roll,
            String statusText,
            boolean isMeasuring
    ) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_compass_layout);

        int index8 = getCardinal8Index(heading);
        String cardinalCode = CARDINALS_8[index8];
        String cardinalFullName = CARDINAL_NAMES_8[index8];
        int roundedDeg = Math.round(((heading % 360f) + 360f) % 360f) % 360;

        float totalTilt = (float) Math.sqrt(pitch * pitch + roll * roll);
        boolean isFlat = totalTilt <= 3.0f;

        views.setTextViewText(R.id.widget_cardinal_text, cardinalCode);
        views.setTextViewText(R.id.widget_direction_name_text, cardinalFullName);
        views.setTextViewText(R.id.widget_degree_text, roundedDeg + "°");
        views.setTextViewText(R.id.widget_status_text, statusText);
        views.setTextColor(
                R.id.widget_status_text,
                Color.parseColor(isMeasuring ? "#10B981" : "#94A3B8")
        );

        // Live Spirit-Level Flatness Badge in Top Bar
        if (isFlat) {
            views.setTextViewText(R.id.widget_level_badge, "● LEVEL");
            views.setTextColor(R.id.widget_level_badge, Color.parseColor("#10B981"));
        } else {
            views.setTextViewText(R.id.widget_level_badge, "● TILT " + Math.round(totalTilt) + "°");
            views.setTextColor(R.id.widget_level_badge, Color.parseColor("#F59E0B"));
        }

        // Generate 320x320 high-DPI dial bitmap with 3D needle, N/E/S/W, 30° numbers & Spirit Level ring
        Bitmap dialBitmap = createDialBitmap(heading, pitch, roll, 320);
        if (dialBitmap != null) {
            views.setImageViewBitmap(R.id.widget_dial_image, dialBitmap);
        }

        // PendingIntent 1: Tap dial or bottom bar -> Launch invisible 1x1 WidgetSensorActivity
        Intent checkIntent = new Intent(context, WidgetSensorActivity.class);
        checkIntent.addFlags(
                Intent.FLAG_ACTIVITY_NEW_TASK |
                Intent.FLAG_ACTIVITY_MULTIPLE_TASK |
                Intent.FLAG_ACTIVITY_NO_ANIMATION |
                Intent.FLAG_ACTIVITY_EXCLUDE_FROM_RECENTS
        );
        PendingIntent checkPendingIntent = PendingIntent.getActivity(
                context,
                0,
                checkIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        views.setOnClickPendingIntent(R.id.widget_dial_container, checkPendingIntent);
        views.setOnClickPendingIntent(R.id.widget_btn_refresh, checkPendingIntent);

        // PendingIntent 2: Tap top-right launch icon (↗) -> Open full app
        Intent openAppIntent = new Intent(context, MainActivity.class);
        openAppIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent openAppPendingIntent = PendingIntent.getActivity(
                context,
                1,
                openAppIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        views.setOnClickPendingIntent(R.id.widget_btn_open, openAppPendingIntent);

        appWidgetManager.updateAppWidget(appWidgetId, views);
    }

    /**
     * Draws a high-precision circular compass dial:
     * 1. Fixed 12 o'clock Heading Pointer (Red/Gold Lubber Triangle + White Jewel Dot)
     * 2. Rotated degree ring with 5°/15° ticks + 30° degree numbers (30, 60, 120, 150, 210, 240, 300, 330)
     * 3. All 4 upright Cardinal labels (N in Red, E / S / W in Crisp White)
     * 4. 3D Faceted Bicolor Compass Needle (Red North Spear + Silver-Titanium South Spear)
     * 5. Center Bullseye Spirit-Level Ring & Live Tilt Bubble
     */
    private static Bitmap createDialBitmap(float headingDeg, float pitchDeg, float rollDeg, int size) {
        try {
            Bitmap bitmap = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888);
            Canvas canvas = new Canvas(bitmap);

            float cx = size / 2f;
            float cy = size / 2f;
            float outerRadius = (size / 2f) - 18f; // 142f for size=320
            float hubRadius = 58f;                 // Inner hub circle around center text

            // Outer subtle bezel ring
            Paint bezelRingPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
            bezelRingPaint.setColor(Color.parseColor("#262B33"));
            bezelRingPaint.setStyle(Paint.Style.STROKE);
            bezelRingPaint.setStrokeWidth(2f);
            canvas.drawCircle(cx, cy, outerRadius + 4f, bezelRingPaint);

            // =========================================================================
            // ROTATING DIAL & 3D COMPASS NEEDLE (rotates by -headingDeg so 0° = North)
            // =========================================================================
            canvas.save();
            canvas.rotate(-headingDeg, cx, cy);

            // 1. Draw 72 precision ticks (every 5°)
            Paint minorTickPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
            minorTickPaint.setColor(Color.parseColor("#334155"));
            minorTickPaint.setStyle(Paint.Style.STROKE);
            minorTickPaint.setStrokeWidth(1.5f);

            Paint midTickPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
            midTickPaint.setColor(Color.parseColor("#64748B"));
            midTickPaint.setStyle(Paint.Style.STROKE);
            midTickPaint.setStrokeWidth(2.2f);

            Paint majorTickPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
            majorTickPaint.setColor(Color.parseColor("#FBBF24"));
            majorTickPaint.setStyle(Paint.Style.STROKE);
            majorTickPaint.setStrokeWidth(2.8f);

            for (int deg = 0; deg < 360; deg += 5) {
                float rad = (float) Math.toRadians(deg);
                boolean isCardinal = (deg % 90 == 0);
                boolean isThirty = (deg % 30 == 0);
                boolean isFifteen = (deg % 15 == 0);

                float tickLen = isCardinal ? 11f : (isThirty ? 9f : (isFifteen ? 6.5f : 4f));
                float rOut = outerRadius;
                float rIn = outerRadius - tickLen;

                float x1 = cx + (float) Math.sin(rad) * rOut;
                float y1 = cy - (float) Math.cos(rad) * rOut;
                float x2 = cx + (float) Math.sin(rad) * rIn;
                float y2 = cy - (float) Math.cos(rad) * rIn;

                Paint p = isThirty ? majorTickPaint : (isFifteen ? midTickPaint : minorTickPaint);
                canvas.drawLine(x1, y1, x2, y2, p);
            }

            // 2. Draw 30° Perimeter Degree Numbers (30, 60, 120, 150, 210, 240, 300, 330)
            Paint degNumPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
            degNumPaint.setColor(Color.parseColor("#FDE68A"));
            degNumPaint.setTextSize(13.5f);
            degNumPaint.setTypeface(Typeface.create(Typeface.DEFAULT, Typeface.BOLD));
            degNumPaint.setTextAlign(Paint.Align.CENTER);

            float numRadius = outerRadius - 21f;
            for (int deg = 30; deg < 360; deg += 30) {
                if (deg % 90 == 0) continue; // Skip 0, 90, 180, 270 where N, E, S, W sit
                float rad = (float) Math.toRadians(deg);
                float tx = cx + (float) Math.sin(rad) * numRadius;
                float ty = cy - (float) Math.cos(rad) * numRadius;

                canvas.save();
                // Keep degree numbers upright relative to the user's screen
                canvas.rotate(headingDeg, tx, ty);
                canvas.drawText(String.valueOf(deg), tx, ty + 4.5f, degNumPaint);
                canvas.restore();
            }

            // 3. Draw 3D Faceted Bicolor Compass Needle (spanning from hubRadius+2 out to outerRadius-32)
            // Placed BEFORE N/E/S/W labels so the North spear points cleanly into the 'N' emblem!
            float needleInner = hubRadius + 1f;       // 59f
            float needleOuterNorth = outerRadius - 28f; // 114f
            float needleOuterSouth = outerRadius - 34f; // 108f
            float needleHalfWidth = 10.5f;

            // 3a. South Counter-Spear (180° — Brushed Silver-Titanium 3D facets)
            Paint southLightPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
            southLightPaint.setColor(Color.parseColor("#CBD5E1"));
            southLightPaint.setStyle(Paint.Style.FILL);

            Paint southDarkPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
            southDarkPaint.setColor(Color.parseColor("#64748B"));
            southDarkPaint.setStyle(Paint.Style.FILL);

            Path southLeftFacet = new Path();
            southLeftFacet.moveTo(cx, cy + needleOuterSouth);
            southLeftFacet.lineTo(cx - needleHalfWidth, cy + needleInner);
            southLeftFacet.lineTo(cx, cy + needleInner + 4f);
            southLeftFacet.close();
            canvas.drawPath(southLeftFacet, southLightPaint);

            Path southRightFacet = new Path();
            southRightFacet.moveTo(cx, cy + needleOuterSouth);
            southRightFacet.lineTo(cx + needleHalfWidth, cy + needleInner);
            southRightFacet.lineTo(cx, cy + needleInner + 4f);
            southRightFacet.close();
            canvas.drawPath(southRightFacet, southDarkPaint);

            // 3b. North Primary Spear (0° — 3D Crimson-Red & Coral-Red facets + Gold Spine)
            Paint northLightPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
            northLightPaint.setColor(Color.parseColor("#FF4D4D"));
            northLightPaint.setStyle(Paint.Style.FILL);

            Paint northDarkPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
            northDarkPaint.setColor(Color.parseColor("#B91C1C"));
            northDarkPaint.setStyle(Paint.Style.FILL);

            Path northLeftFacet = new Path();
            northLeftFacet.moveTo(cx, cy - needleOuterNorth);
            northLeftFacet.lineTo(cx - needleHalfWidth, cy - needleInner);
            northLeftFacet.lineTo(cx, cy - needleInner - 4f);
            northLeftFacet.close();
            canvas.drawPath(northLeftFacet, northLightPaint);

            Path northRightFacet = new Path();
            northRightFacet.moveTo(cx, cy - needleOuterNorth);
            northRightFacet.lineTo(cx + needleHalfWidth, cy - needleInner);
            northRightFacet.lineTo(cx, cy - needleInner - 4f);
            northRightFacet.close();
            canvas.drawPath(northRightFacet, northDarkPaint);

            // Central 24K Gold Spine on North Needle
            Paint spinePaint = new Paint(Paint.ANTI_ALIAS_FLAG);
            spinePaint.setColor(Color.parseColor("#FDE047"));
            spinePaint.setStyle(Paint.Style.STROKE);
            spinePaint.setStrokeWidth(1.6f);
            canvas.drawLine(cx, cy - needleOuterNorth + 3f, cx, cy - needleInner - 2f, spinePaint);

            // Outer Red North Rim Triangle at 0°
            Path northRimTip = new Path();
            northRimTip.moveTo(cx, cy - outerRadius - 3f);
            northRimTip.lineTo(cx - 6.5f, cy - outerRadius + 9f);
            northRimTip.lineTo(cx + 6.5f, cy - outerRadius + 9f);
            northRimTip.close();
            canvas.drawPath(northRimTip, northLightPaint);

            // 4. Draw All 4 Cardinal Labels (N, E, S, W) kept upright for instant readability
            String[] cardLabels = {"N", "E", "S", "W"};
            int[] cardAngles = {0, 90, 180, 270};
            float cardRadius = outerRadius - 20f;

            Paint cardPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
            cardPaint.setTypeface(Typeface.create(Typeface.DEFAULT, Typeface.BOLD));
            cardPaint.setTextAlign(Paint.Align.CENTER);

            for (int i = 0; i < 4; i++) {
                float rad = (float) Math.toRadians(cardAngles[i]);
                float tx = cx + (float) Math.sin(rad) * cardRadius;
                float ty = cy - (float) Math.cos(rad) * cardRadius;

                cardPaint.setTextSize(i == 0 ? 22f : 17.5f);
                cardPaint.setColor(Color.parseColor(i == 0 ? "#EF4444" : "#F8FAFC"));

                canvas.save();
                canvas.rotate(headingDeg, tx, ty);
                canvas.drawText(cardLabels[i], tx, ty + (i == 0 ? 7.5f : 6f), cardPaint);
                canvas.restore();
            }

            canvas.restore();

            // =========================================================================
            // FIXED FOREGROUND OVERLAYS (12 o'clock Lubber Pointer & Spirit-Level Ring)
            // =========================================================================

            // 5. Fixed 12 o'clock Lubber Heading Pointer Triangle + White Jewel Dot
            Paint lubberTrianglePaint = new Paint(Paint.ANTI_ALIAS_FLAG);
            lubberTrianglePaint.setColor(Color.parseColor("#EF4444"));
            lubberTrianglePaint.setStyle(Paint.Style.FILL);

            Path lubberPath = new Path();
            lubberPath.moveTo(cx, 17f);      // Tip pointing straight down at active degree mark
            lubberPath.lineTo(cx - 8f, 3f);
            lubberPath.lineTo(cx + 8f, 3f);
            lubberPath.close();
            canvas.drawPath(lubberPath, lubberTrianglePaint);

            Paint jewelPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
            jewelPaint.setColor(Color.parseColor("#FFFFFF"));
            jewelPaint.setStyle(Paint.Style.FILL);
            canvas.drawCircle(cx, 4.5f, 2.5f, jewelPaint);

            // 6. Center Bullseye Spirit-Level Ring & Live Tilt Bubble
            float totalTilt = (float) Math.sqrt(pitchDeg * pitchDeg + rollDeg * rollDeg);
            boolean isFlat = totalTilt <= 3.0f;

            // Dark inner hub backing so center text is always high-contrast
            Paint hubBgPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
            hubBgPaint.setColor(Color.parseColor("#11151C"));
            hubBgPaint.setStyle(Paint.Style.FILL);
            canvas.drawCircle(cx, cy, hubRadius - 2f, hubBgPaint);

            // Outer metallic gold collar ring around hub
            Paint collarPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
            collarPaint.setColor(Color.parseColor("#D4AF37"));
            collarPaint.setStyle(Paint.Style.STROKE);
            collarPaint.setStrokeWidth(2.2f);
            canvas.drawCircle(cx, cy, hubRadius, collarPaint);

            // Inner Spirit-Level Status Ring (Emerald Green when flat, Amber when tilted)
            Paint levelRingPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
            levelRingPaint.setColor(Color.parseColor(isFlat ? "#10B981" : "#F59E0B"));
            levelRingPaint.setStyle(Paint.Style.STROKE);
            levelRingPaint.setStrokeWidth(2.0f);
            levelRingPaint.setAlpha(isFlat ? 220 : 180);
            canvas.drawCircle(cx, cy, hubRadius - 4.5f, levelRingPaint);

            // Live Spirit-Level Bubble Indicator along the hub ring
            float bubbleOffsetX = isFlat ? 0f : Math.max(-18f, Math.min(18f, -rollDeg * 1.4f));
            float bubbleOffsetY = isFlat ? 0f : Math.max(-18f, Math.min(18f, pitchDeg * 1.4f));
            Paint bubblePaint = new Paint(Paint.ANTI_ALIAS_FLAG);
            bubblePaint.setColor(Color.parseColor(isFlat ? "#10B981" : "#F59E0B"));
            bubblePaint.setStyle(Paint.Style.FILL);
            // Place subtle spirit bubble near the top of the inner hub ring when flat, or shifted by tilt
            canvas.drawCircle(cx + bubbleOffsetX, (cy - hubRadius + 10f) + bubbleOffsetY * 0.4f, 3.8f, bubblePaint);

            return bitmap;
        } catch (Throwable t) {
            return null;
        }
    }

    private static int getCardinal8Index(float deg) {
        return Math.round((((deg % 360f) + 360f) % 360f) / 45f) % 8;
    }

    public static void updateAllWidgets(Context context, float heading, String status) {
        updateAllWidgets(context, heading, getSavedPitch(context), getSavedRoll(context), status, false);
    }

    public static void updateAllWidgets(Context context, float heading, String status, boolean isMeasuring) {
        updateAllWidgets(context, heading, getSavedPitch(context), getSavedRoll(context), status, isMeasuring);
    }

    /**
     * Static helper to update all widgets in-place on the Home Screen with heading + pitch/roll flatness.
     */
    public static void updateAllWidgets(
            Context context,
            float heading,
            float pitch,
            float roll,
            String status,
            boolean isMeasuring
    ) {
        if (!isMeasuring) {
            SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            prefs.edit()
                    .putFloat(KEY_HEADING, heading)
                    .putFloat(KEY_PITCH, pitch)
                    .putFloat(KEY_ROLL, roll)
                    .putString(KEY_TIMESTAMP, status)
                    .apply();
        }

        AppWidgetManager appWidgetManager = AppWidgetManager.getInstance(context);
        ComponentName thisWidget = new ComponentName(context, CompassWidgetProvider.class);
        int[] appWidgetIds = appWidgetManager.getAppWidgetIds(thisWidget);

        for (int widgetId : appWidgetIds) {
            updateSingleWidget(context, appWidgetManager, widgetId, heading, pitch, roll, status, isMeasuring);
        }
    }
}
