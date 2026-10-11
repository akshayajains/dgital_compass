# Precision ProGuard / R8 rules for Digital Compass
# Optimizes, obfuscates, and shrinks unused code while keeping necessary reflection entry points.
# Addresses Google Play Console "improve your app's memory and performance with R8" warning.

# ── Optimization Configuration ──
-repackageclasses ''
-allowaccessmodification

# ── App & Widget Entry Points ──
# AndroidManifest components (Activities, Receivers, Services) are kept automatically by AAPT rules.
# Keep Widget provider and sensor activity methods needed by Android OS RemoteViews:
-keep class com.spiritual.compass.CompassWidgetProvider {
    public *;
}
-keep class com.spiritual.compass.WidgetSensorActivity {
    public *;
}
-keepclassmembers class com.spiritual.compass.MainActivity {
    public *;
}

# ── Capacitor Core & Reflection ──
# Keep plugin classes and methods that Capacitor discovers reflectively:
-keep public class * extends com.getcapacitor.Plugin {
    public *;
}
-keep public class * extends com.getcapacitor.annotation.CapacitorPlugin
-keep @interface com.getcapacitor.annotation.CapacitorPlugin
-keep @interface com.getcapacitor.PluginMethod

-keepclassmembers class * extends com.getcapacitor.Plugin {
    @com.getcapacitor.PluginMethod public *;
}

# Keep the JavaScript interface methods used by the WebView:
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Keep Capacitor bridge structures passed across JNI / JS bridge:
-keep class com.getcapacitor.Bridge { public *; }
-keep class com.getcapacitor.PluginHandle { public *; }
-keep class com.getcapacitor.JSObject { *; }
-keep class com.getcapacitor.JSArray { *; }
-keep class com.getcapacitor.PluginCall { public *; }
-keep class com.getcapacitor.PluginResult { public *; }
-keep class com.getcapacitor.PluginConfig { *; }

# ── Cordova Plugin Compatibility ──
-keep public class * extends org.apache.cordova.CordovaPlugin {
    public *;
}

# ── Keep line numbers for debugging stack traces & crash reports ──
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile

# ── Keep essential annotations & reflection metadata ──
-keepattributes *Annotation*
-keepattributes JavascriptInterface
-keepattributes Signature
-keepattributes InnerClasses,EnclosingMethod

# ── Gson / JSON Serialization ──
# Keep serialized fields and custom serializers:
-keepclassmembers class * {
    @com.google.gson.annotations.SerializedName <fields>;
}
-keep class * implements com.google.gson.JsonSerializer { *; }
-keep class * implements com.google.gson.JsonDeserializer { *; }
-keepclassmembers enum * { *; }

# ── Suppress harmless third-party build-time warnings ──
-dontwarn okhttp3.**
-dontwarn okio.**
-dontwarn com.google.errorprone.annotations.**
-dontwarn javax.annotation.**
-dontwarn org.codehaus.mojo.animal_sniffer.**
-dontwarn com.squareup.okhttp.**
