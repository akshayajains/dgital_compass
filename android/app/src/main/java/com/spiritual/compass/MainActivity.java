package com.spiritual.compass;

import android.content.Context;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.os.Bundle;
import android.view.Display;
import android.view.Surface;
import android.view.WindowManager;
import android.webkit.WebView;

import com.getcapacitor.BridgeActivity;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

/**
 * MainActivity with Hardware-Fused Native Compass & Spirit Level Bridge.
 *
 * Streams Kalman-filtered 3D rotation matrix azimuth (with full display-rotation
 * and upright-tilt gimbal-lock compensation), pitch, roll, live magnetic field
 * strength (uT), and OS magnetometer calibration accuracy directly to the WebView.
 */
public class MainActivity extends BridgeActivity implements SensorEventListener {

    private SensorManager sensorManager;
    private Sensor rotationSensor;
    private Sensor accelSensor;
    private Sensor magSensor;

    private final float[] gravity = new float[3];
    private final float[] geomagnetic = new float[3];
    private final float[] rotationMatrix = new float[9];
    private final float[] inclinationMatrix = new float[9];
    private final float[] screenMatrix = new float[9];
    private final float[] orientationAngles = new float[3];
    private boolean hasGravity = false;
    private boolean hasMag = false;
    private boolean hasRotationVectorFix = false;

    private float latestHeading = -1f;
    private float latestPitch = 0f;
    private float latestRoll = 0f;
    private float latestMagFlux = -1f;
    private int latestMagAccuracy = SensorManager.SENSOR_STATUS_ACCURACY_HIGH;

    private float lastDispatchedHeading = -999f;
    private float lastDispatchedPitch = -999f;
    private float lastDispatchedRoll = -999f;
    private int lastDispatchedAccuracy = -1;

    private long lastWebDispatchMs = 0L;
    private static final long DISPATCH_INTERVAL_MS = 28L; // ~35 FPS smooth native stream
    private static final float ALPHA_FILTER = 0.18f;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        sensorManager = (SensorManager) getSystemService(Context.SENSOR_SERVICE);
        if (sensorManager != null) {
            rotationSensor = sensorManager.getDefaultSensor(Sensor.TYPE_ROTATION_VECTOR);
            if (rotationSensor == null) {
                rotationSensor = sensorManager.getDefaultSensor(Sensor.TYPE_GEOMAGNETIC_ROTATION_VECTOR);
            }
            accelSensor = sensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER);
            magSensor = sensorManager.getDefaultSensor(Sensor.TYPE_MAGNETIC_FIELD);
        }
    }

    @Override
    public void onResume() {
        super.onResume();
        if (sensorManager != null) {
            hasRotationVectorFix = false;
            if (rotationSensor != null) {
                sensorManager.registerListener(this, rotationSensor, SensorManager.SENSOR_DELAY_GAME);
            }
            if (accelSensor != null) {
                sensorManager.registerListener(this, accelSensor, SensorManager.SENSOR_DELAY_GAME);
            }
            if (magSensor != null) {
                sensorManager.registerListener(this, magSensor, SensorManager.SENSOR_DELAY_GAME);
            }
        }
    }

    @Override
    public void onPause() {
        super.onPause();
        if (sensorManager != null) {
            try {
                sensorManager.unregisterListener(this);
            } catch (Exception ignored) {}
        }
        // Keep the Home Screen Widget synced with the latest calibrated heading & flatness
        if (latestHeading >= 0f) {
            try {
                String timeStr = new SimpleDateFormat("h:mm a", Locale.getDefault()).format(new Date());
                CompassWidgetProvider.updateAllWidgets(this, latestHeading, latestPitch, latestRoll, "Updated " + timeStr, false);
            } catch (Exception ignored) {}
        }
    }

    @Override
    public void onSensorChanged(SensorEvent event) {
        if (event == null || event.sensor == null) return;

        int type = event.sensor.getType();
        boolean hasMatrix = false;

        if (type == Sensor.TYPE_MAGNETIC_FIELD) {
            float bx = event.values[0];
            float by = event.values[1];
            float bz = event.values[2];
            latestMagFlux = (float) Math.sqrt(bx * bx + by * by + bz * bz);
            if (event.accuracy >= SensorManager.SENSOR_STATUS_UNRELIABLE) {
                latestMagAccuracy = event.accuracy;
            }
            if (!hasMag) {
                System.arraycopy(event.values, 0, geomagnetic, 0, 3);
                hasMag = true;
            } else {
                geomagnetic[0] += ALPHA_FILTER * (bx - geomagnetic[0]);
                geomagnetic[1] += ALPHA_FILTER * (by - geomagnetic[1]);
                geomagnetic[2] += ALPHA_FILTER * (bz - geomagnetic[2]);
            }
        } else if (type == Sensor.TYPE_ACCELEROMETER) {
            float ax = event.values[0];
            float ay = event.values[1];
            float az = event.values[2];
            if (!hasGravity) {
                System.arraycopy(event.values, 0, gravity, 0, 3);
                hasGravity = true;
            } else {
                gravity[0] += ALPHA_FILTER * (ax - gravity[0]);
                gravity[1] += ALPHA_FILTER * (ay - gravity[1]);
                gravity[2] += ALPHA_FILTER * (az - gravity[2]);
            }
        }

        // Throttle heavy 3D matrix remapping & WebView bridge dispatch to ~35 FPS
        long now = System.currentTimeMillis();
        if (now - lastWebDispatchMs < DISPATCH_INTERVAL_MS) {
            return;
        }

        if (type == Sensor.TYPE_ROTATION_VECTOR || type == Sensor.TYPE_GEOMAGNETIC_ROTATION_VECTOR) {
            SensorManager.getRotationMatrixFromVector(rotationMatrix, event.values);
            if (rotationMatrix[0] != 0f || rotationMatrix[4] != 0f || rotationMatrix[8] != 0f) {
                hasMatrix = true;
                hasRotationVectorFix = true;
            }
        }

        // Fallback to tilt-compensated Accelerometer + Magnetometer matrix if RotationVector is absent
        if (!hasMatrix && !hasRotationVectorFix && hasGravity && hasMag) {
            if (SensorManager.getRotationMatrix(rotationMatrix, inclinationMatrix, gravity, geomagnetic)) {
                hasMatrix = true;
            }
        }

        if (!hasMatrix) return;

        // 1. Remap coordinate system for current display rotation
        int rotation = getDisplayRotation();
        int worldX = SensorManager.AXIS_X;
        int worldY = SensorManager.AXIS_Y;
        if (rotation == Surface.ROTATION_90) {
            worldX = SensorManager.AXIS_Y;
            worldY = SensorManager.AXIS_MINUS_X;
        } else if (rotation == Surface.ROTATION_180) {
            worldX = SensorManager.AXIS_MINUS_X;
            worldY = SensorManager.AXIS_MINUS_Y;
        } else if (rotation == Surface.ROTATION_270) {
            worldX = SensorManager.AXIS_MINUS_Y;
            worldY = SensorManager.AXIS_X;
        }
        SensorManager.remapCoordinateSystem(rotationMatrix, worldX, worldY, screenMatrix);

        // 2. Gimbal-lock-free 3D Tilt-Compensated Azimuth:
        // Combine +Y (device top edge: screenMatrix[1], screenMatrix[4]) and -Z (back camera: -screenMatrix[2], -screenMatrix[5])
        // weighted by flatness vs upright inclination so heading never flips 180 deg when held vertically (90 deg).
        float wY = Math.max(0f, screenMatrix[8]); // cos(tilt) when screen faces upward
        float wZ = Math.max(0f, screenMatrix[7]); // sin(tilt) when top of phone is raised toward user
        float eastFwd;
        float northFwd;
        if (wY + wZ > 0.15f) {
            eastFwd = wY * screenMatrix[1] - wZ * screenMatrix[2];
            northFwd = wY * screenMatrix[4] - wZ * screenMatrix[5];
        } else {
            eastFwd = screenMatrix[1];
            northFwd = screenMatrix[4];
        }

        float azimuthRad = (float) Math.atan2(eastFwd, northFwd);
        float azimuthDeg = (float) Math.toDegrees(azimuthRad);
        latestHeading = ((azimuthDeg % 360f) + 360f) % 360f;

        // 3. Hardware Pitch & Roll (matching W3C beta/gamma sign convention for Spirit Level, with gimbal-lock guard)
        SensorManager.getOrientation(screenMatrix, orientationAngles);
        float rawPitch = (float) -Math.toDegrees(orientationAngles[1]);
        float rawRoll = (float) Math.toDegrees(orientationAngles[2]);

        float gravY = screenMatrix[7];
        float gravX = screenMatrix[6];
        if (Math.abs(gravY) > 0.92f) { // Vertical / wall alignment (> 67° upright plumb line)
            latestPitch = rawPitch;
            // Compute roll directly from lateral gravity component to eliminate ±90° wild gimbal-lock oscillation
            latestRoll = (float) Math.toDegrees(Math.atan2(gravX, Math.abs(gravY)));
        } else {
            latestPitch = rawPitch;
            latestRoll = rawRoll;
        }

        lastWebDispatchMs = now;

        // Stationary deadband: skip WebView evaluateJavascript when phone is completely still
        float dH = Math.abs(latestHeading - lastDispatchedHeading);
        if (dH > 180f) dH = 360f - dH;
        float dP = Math.abs(latestPitch - lastDispatchedPitch);
        float dR = Math.abs(latestRoll - lastDispatchedRoll);
        if (dH < 0.08f && dP < 0.08f && dR < 0.08f && latestMagAccuracy == lastDispatchedAccuracy) {
            return;
        }

        lastDispatchedHeading = latestHeading;
        lastDispatchedPitch = latestPitch;
        lastDispatchedRoll = latestRoll;
        lastDispatchedAccuracy = latestMagAccuracy;
        dispatchToWebView(latestHeading, latestPitch, latestRoll, latestMagFlux, latestMagAccuracy);
    }

    @Override
    public void onAccuracyChanged(Sensor sensor, int accuracy) {
        if (sensor != null && (sensor.getType() == Sensor.TYPE_MAGNETIC_FIELD ||
                sensor.getType() == Sensor.TYPE_ROTATION_VECTOR ||
                sensor.getType() == Sensor.TYPE_GEOMAGNETIC_ROTATION_VECTOR)) {
            latestMagAccuracy = accuracy;
        }
    }

    private int getDisplayRotation() {
        try {
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.R && getDisplay() != null) {
                return getDisplay().getRotation();
            }
            WindowManager wm = (WindowManager) getSystemService(Context.WINDOW_SERVICE);
            if (wm != null) {
                Display d = wm.getDefaultDisplay();
                if (d != null) return d.getRotation();
            }
        } catch (Exception ignored) {}
        return Surface.ROTATION_0;
    }

    private void dispatchToWebView(final float heading, final float pitch, final float roll, final float magFlux, final int accuracy) {
        if (bridge == null) return;
        final WebView webView = bridge.getWebView();
        if (webView == null) return;

        final String js = String.format(
                Locale.US,
                "if(window.__onNativeCompassUpdate){window.__onNativeCompassUpdate(%.2f,%.2f,%.2f,%.1f,%d);}",
                heading, pitch, roll, magFlux, accuracy
        );
        webView.post(new Runnable() {
            @Override
            public void run() {
                try {
                    webView.evaluateJavascript(js, null);
                } catch (Exception ignored) {}
            }
        });
    }
}