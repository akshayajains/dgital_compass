package com.spiritual.compass;

import android.app.Activity;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.Gravity;
import android.view.MotionEvent;
import android.view.Window;
import android.view.WindowManager;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

/**
 * Invisible 1x1 pixel translucent Activity that runs in an isolated task (taskAffinity="")
 * when the user taps the Home Screen widget.
 *
 * Why this is needed:
 * Android 9+ (API 28+) blocks background BroadcastReceivers from receiving SensorManager events.
 * By launching this zero-UI, non-touch-modal translucent window for ~3 seconds with its own
 * empty taskAffinity, Android grants live foreground sensor access while the user stays on
 * their Home Screen without ever opening MainActivity.
 */
public class WidgetSensorActivity extends Activity implements SensorEventListener {

    private SensorManager sensorManager;
    private Sensor rotationSensor;
    private Sensor accelSensor;
    private Sensor magSensor;

    private final float[] gravity = new float[3];
    private final float[] geomagnetic = new float[3];
    private final float[] orientationAngles = new float[3];
    private boolean hasGravity = false;
    private boolean hasMag = false;

    private float latestHeading = -1f;
    private float latestPitch = 0f;
    private float latestRoll = 0f;
    private long lastWidgetPushTime = 0L;
    private boolean finished = false;

    private final Handler handler = new Handler(Looper.getMainLooper());
    private final Runnable finishRunnable = new Runnable() {
        @Override
        public void run() {
            completeAndClose();
        }
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        overridePendingTransition(0, 0);

        // Make window 1x1 pixel, completely transparent, non-blocking on the Home Screen
        Window window = getWindow();
        if (window != null) {
            window.setBackgroundDrawableResource(android.R.color.transparent);
            window.clearFlags(WindowManager.LayoutParams.FLAG_DIM_BEHIND);
            window.addFlags(
                    WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL |
                    WindowManager.LayoutParams.FLAG_WATCH_OUTSIDE_TOUCH |
                    WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS
            );
            WindowManager.LayoutParams params = window.getAttributes();
            params.width = 1;
            params.height = 1;
            params.gravity = Gravity.TOP | Gravity.START;
            params.x = 0;
            params.y = 0;
            params.alpha = 0f;
            params.dimAmount = 0f;
            window.setAttributes(params);
        }

        // Immediately show "Live Measuring..." on the widget
        float prevHeading = CompassWidgetProvider.getSavedHeading(this);
        float prevPitch = CompassWidgetProvider.getSavedPitch(this);
        float prevRoll = CompassWidgetProvider.getSavedRoll(this);
        latestPitch = prevPitch;
        latestRoll = prevRoll;
        CompassWidgetProvider.updateAllWidgets(this, prevHeading, prevPitch, prevRoll, "● Measuring...", true);

        sensorManager = (SensorManager) getSystemService(SENSOR_SERVICE);
        if (sensorManager == null) {
            completeAndClose();
            return;
        }

        rotationSensor = sensorManager.getDefaultSensor(Sensor.TYPE_ROTATION_VECTOR);
        if (rotationSensor == null) {
            rotationSensor = sensorManager.getDefaultSensor(Sensor.TYPE_GEOMAGNETIC_ROTATION_VECTOR);
        }
        if (rotationSensor != null) {
            sensorManager.registerListener(this, rotationSensor, SensorManager.SENSOR_DELAY_GAME);
        } else {
            accelSensor = sensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER);
            magSensor = sensorManager.getDefaultSensor(Sensor.TYPE_MAGNETIC_FIELD);
            if (accelSensor != null && magSensor != null) {
                sensorManager.registerListener(this, accelSensor, SensorManager.SENSOR_DELAY_GAME);
                sensorManager.registerListener(this, magSensor, SensorManager.SENSOR_DELAY_GAME);
            } else {
                completeAndClose();
                return;
            }
        }

        // Stream live compass updates to the Home Screen widget for 3.2 seconds, then lock & close
        handler.postDelayed(finishRunnable, 3200);
    }

    @Override
    public void onSensorChanged(SensorEvent event) {
        if (finished) return;

        float computedHeading = -1f;
        float[] R = new float[9];
        boolean hasMatrix = false;

        if (event.sensor.getType() == Sensor.TYPE_ROTATION_VECTOR ||
            event.sensor.getType() == Sensor.TYPE_GEOMAGNETIC_ROTATION_VECTOR) {
            SensorManager.getRotationMatrixFromVector(R, event.values);
            if (R[0] != 0f || R[4] != 0f || R[8] != 0f) {
                hasMatrix = true;
            }
        } else if (event.sensor.getType() == Sensor.TYPE_ACCELEROMETER) {
            System.arraycopy(event.values, 0, gravity, 0, 3);
            hasGravity = true;
        } else if (event.sensor.getType() == Sensor.TYPE_MAGNETIC_FIELD) {
            System.arraycopy(event.values, 0, geomagnetic, 0, 3);
            hasMag = true;
        }

        if (!hasMatrix && hasGravity && hasMag) {
            float[] I = new float[9];
            if (SensorManager.getRotationMatrix(R, I, gravity, geomagnetic)) {
                hasMatrix = true;
            }
        }

        if (hasMatrix) {
            float[] screenR = new float[9];
            int rotation = android.view.Surface.ROTATION_0;
            try {
                WindowManager wm = (WindowManager) getSystemService(WINDOW_SERVICE);
                if (wm != null && wm.getDefaultDisplay() != null) {
                    rotation = wm.getDefaultDisplay().getRotation();
                }
            } catch (Exception ignored) {}

            int worldX = SensorManager.AXIS_X;
            int worldY = SensorManager.AXIS_Y;
            if (rotation == android.view.Surface.ROTATION_90) {
                worldX = SensorManager.AXIS_Y;
                worldY = SensorManager.AXIS_MINUS_X;
            } else if (rotation == android.view.Surface.ROTATION_180) {
                worldX = SensorManager.AXIS_MINUS_X;
                worldY = SensorManager.AXIS_MINUS_Y;
            } else if (rotation == android.view.Surface.ROTATION_270) {
                worldX = SensorManager.AXIS_MINUS_Y;
                worldY = SensorManager.AXIS_X;
            }
            SensorManager.remapCoordinateSystem(R, worldX, worldY, screenR);

            float wY = Math.max(0f, screenR[8]);
            float wZ = Math.max(0f, screenR[7]);
            float eastFwd = (wY + wZ > 0.15f) ? (wY * screenR[1] - wZ * screenR[2]) : screenR[1];
            float northFwd = (wY + wZ > 0.15f) ? (wY * screenR[4] - wZ * screenR[5]) : screenR[4];

            float azimuth = (float) Math.toDegrees(Math.atan2(eastFwd, northFwd));
            computedHeading = ((azimuth % 360f) + 360f) % 360f;

            // Compute live pitch & roll for the Spirit-Level Flatness indicator (with gimbal-lock guard)
            SensorManager.getOrientation(screenR, orientationAngles);
            float rawPitch = (float) -Math.toDegrees(orientationAngles[1]);
            float rawRoll = (float) Math.toDegrees(orientationAngles[2]);
            float gravY = screenR[7];
            float gravX = screenR[6];
            if (Math.abs(gravY) > 0.92f) {
                latestPitch = rawPitch;
                latestRoll = (float) Math.toDegrees(Math.atan2(gravX, Math.abs(gravY)));
            } else {
                latestPitch = rawPitch;
                latestRoll = rawRoll;
            }
        }

        if (computedHeading >= 0f) {
            latestHeading = computedHeading;
            long now = System.currentTimeMillis();
            // Throttle RemoteViews updates to ~6 FPS (every 160ms) for smooth Home Screen dial rotation
            if (now - lastWidgetPushTime >= 160L) {
                lastWidgetPushTime = now;
                CompassWidgetProvider.updateAllWidgets(this, latestHeading, latestPitch, latestRoll, "● Live...", true);
            }
        }
    }

    @Override
    public void onAccuracyChanged(Sensor sensor, int accuracy) {}

    @Override
    public boolean onTouchEvent(MotionEvent event) {
        if (event.getAction() == MotionEvent.ACTION_OUTSIDE) {
            completeAndClose();
            return true;
        }
        return super.onTouchEvent(event);
    }

    private void completeAndClose() {
        if (finished) return;
        finished = true;
        handler.removeCallbacks(finishRunnable);

        if (sensorManager != null) {
            try {
                sensorManager.unregisterListener(this);
            } catch (Exception ignored) {}
        }

        float finalHeading = latestHeading >= 0f ? latestHeading : CompassWidgetProvider.getSavedHeading(this);
        String timeStr = new SimpleDateFormat("h:mm a", Locale.getDefault()).format(new Date());
        CompassWidgetProvider.updateAllWidgets(this, finalHeading, latestPitch, latestRoll, "Updated " + timeStr, false);

        finish();
        overridePendingTransition(0, 0);
    }

    @Override
    protected void onPause() {
        super.onPause();
        completeAndClose();
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        completeAndClose();
    }
}
