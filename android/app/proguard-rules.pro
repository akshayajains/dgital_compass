# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# ── Capacitor / WebView ──
# Capacitor bridges JS to native via reflection; keep all Capacitor classes.
-keep class com.getcapacitor.** { *; }
-keep class com.getcapacitor.plugin.** { *; }
-keep class com.getcapacitor.community.** { *; }
-keep class com.capacitorjs.** { *; }

# Keep all plugin classes (they are loaded reflectively by Capacitor).
-keep class * extends com.getcapacitor.Plugin { *; }

# Keep the JavaScript interface methods used by the WebView.
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# ── Cordova plugins ──
-keep class org.apache.cordova.** { *; }
-keep class * extends org.apache.cordova.CordovaPlugin { *; }

# ── AndroidX / AppCompat ──
-keep class androidx.appcompat.** { *; }
-keep class androidx.core.** { *; }
-keep class androidx.coordinatorlayout.** { *; }
-keep class androidx.fragment.** { *; }

# ── Splash Screen ──
-keep class androidx.core.splashscreen.** { *; }

# ── Keep line numbers for debugging stack traces ──
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile

# ── Keep annotations (needed by some libraries) ──
-keepattributes *Annotation*
-keepattributes JavascriptInterface
-keepattributes Signature
-keepattributes InnerClasses,EnclosingMethod

# ── Gson / JSON (used by Capacitor) ──
-keep class com.google.gson.** { *; }
-keep class * implements com.google.gson.JsonSerializer { *; }
-keep class * implements com.google.gson.JsonDeserializer { *; }

# ── OkHttp (used by some plugins) ──
-dontwarn okhttp3.**
-dontwarn okio.**
-keep class okhttp3.** { *; }
-keep class okio.** { *; }

# ── Avoid warnings for missing optional dependencies ──
-dontwarn com.google.errorprone.annotations.**
-dontwarn javax.annotation.**
-dontwarn org.codehaus.mojo.animal_sniffer.**
-dontwarn com.squareup.okhttp.**
