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
import android.widget.RemoteViews;

/**
 * Nothing OS Inspired Compass & Direction Home Screen Widget.
 * Allows checking live direction directly on the home screen upon click
 * via an invisible 1x1 pixel sensor reader Activity (WidgetSensorActivity)
 * without ever opening the full MainActivity UI.
 */
public class CompassWidgetProvider extends AppWidgetProvider {

    public static final String ACTION_CHECK_DIRECTION = "com.spiritual.compass.ACTION_CHECK_DIRECTION";
    private static final String PREFS_NAME = "CompassWidgetPrefs";
    private static final String KEY_HEADING = "last_heading";
    private static final String KEY_TIMESTAMP = "last_timestamp";

    private static final String[] CARDINALS_16 = {
            "N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
            "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"
    };

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        float heading = prefs.getFloat(KEY_HEADING, 0f);
        String timestamp = prefs.getString(KEY_TIMESTAMP, "Tap to Check Direction");

        for (int appWidgetId : appWidgetIds) {
            updateSingleWidget(context, appWidgetManager, appWidgetId, heading, timestamp, false);
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

    private static void updateSingleWidget(
            Context context,
            AppWidgetManager appWidgetManager,
            int appWidgetId,
            float heading,
            String statusText,
            boolean isMeasuring
    ) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_compass_layout);

        String cardinal = getCardinal(heading);
        int roundedDeg = Math.round(heading) % 360;

        views.setTextViewText(R.id.widget_cardinal_text, cardinal);
        views.setTextViewText(R.id.widget_degree_text, roundedDeg + "°");
        views.setTextViewText(R.id.widget_status_text, statusText);
        views.setTextColor(
                R.id.widget_status_text,
                Color.parseColor(isMeasuring ? "#10B981" : "#8A929B")
        );

        // Generate Nothing OS style rotated dial bitmap with red North needle
        Bitmap dialBitmap = createDialBitmap(heading, 260);
        if (dialBitmap != null) {
            views.setImageViewBitmap(R.id.widget_dial_image, dialBitmap);
        }

        // PendingIntent 1: Tap dial or bottom bar -> Launch invisible 1x1 WidgetSensorActivity (does NOT open MainActivity)
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
     * Draws an authentic Nothing Phone inspired circular dial:
     * - Subtle circular ring
     * - Dot-matrix tick marks
     * - Signature Nothing Red North indicator dot/lance
     */
    private static Bitmap createDialBitmap(float headingDeg, int size) {
        try {
            Bitmap bitmap = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888);
            Canvas canvas = new Canvas(bitmap);

            float cx = size / 2f;
            float cy = size / 2f;
            float radius = (size / 2f) - 12f;

            // Paint for dot-matrix outer ticks
            Paint tickPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
            tickPaint.setColor(Color.parseColor("#383C42"));
            tickPaint.setStyle(Paint.Style.STROKE);
            tickPaint.setStrokeWidth(2f);

            // Paint for cardinal ticks (N, E, S, W)
            Paint cardinalTickPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
            cardinalTickPaint.setColor(Color.parseColor("#8A929B"));
            cardinalTickPaint.setStyle(Paint.Style.STROKE);
            cardinalTickPaint.setStrokeWidth(3f);

            // Draw 24 dot-matrix ticks around the perimeter
            for (int i = 0; i < 24; i++) {
                float angle = i * 15f;
                float rad = (float) Math.toRadians(angle);
                boolean isCardinal = (i % 6 == 0);

                float rInner = isCardinal ? (radius - 12f) : (radius - 6f);
                float x1 = cx + (float) Math.sin(rad) * radius;
                float y1 = cy - (float) Math.cos(rad) * radius;
                float x2 = cx + (float) Math.sin(rad) * rInner;
                float y2 = cy - (float) Math.cos(rad) * rInner;

                canvas.drawLine(x1, y1, x2, y2, isCardinal ? cardinalTickPaint : tickPaint);
            }

            // Save canvas and rotate opposite to heading so needle/dot indicates magnetic North
            canvas.save();
            canvas.rotate(-headingDeg, cx, cy);

            // Signature Nothing Red North Lance / Dot
            Paint redPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
            redPaint.setColor(Color.parseColor("#D71921")); // Nothing Signature Red
            redPaint.setStyle(Paint.Style.FILL);

            // North Arrow Triangle pointing up to 12 o'clock
            Path northArrow = new Path();
            northArrow.moveTo(cx, cy - radius + 2f);
            northArrow.lineTo(cx - 7f, cy - radius + 22f);
            northArrow.lineTo(cx + 7f, cy - radius + 22f);
            northArrow.close();
            canvas.drawPath(northArrow, redPaint);

            // North Accent Circle on tip
            canvas.drawCircle(cx, cy - radius + 7f, 4f, redPaint);

            canvas.restore();
            return bitmap;
        } catch (Throwable t) {
            return null;
        }
    }

    private static String getCardinal(float deg) {
        int index = Math.round(((deg % 360 + 360) % 360) / 22.5f) % 16;
        return CARDINALS_16[index];
    }

    public static void updateAllWidgets(Context context, float heading, String status) {
        updateAllWidgets(context, heading, status, false);
    }

    /**
     * Static helper to update all widgets in-place on the Home Screen.
     */
    public static void updateAllWidgets(Context context, float heading, String status, boolean isMeasuring) {
        if (!isMeasuring) {
            SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            prefs.edit()
                    .putFloat(KEY_HEADING, heading)
                    .putString(KEY_TIMESTAMP, status)
                    .apply();
        }

        AppWidgetManager appWidgetManager = AppWidgetManager.getInstance(context);
        ComponentName thisWidget = new ComponentName(context, CompassWidgetProvider.class);
        int[] appWidgetIds = appWidgetManager.getAppWidgetIds(thisWidget);

        for (int widgetId : appWidgetIds) {
            updateSingleWidget(context, appWidgetManager, widgetId, heading, status, isMeasuring);
        }
    }
}
