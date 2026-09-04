@echo off
set JAVA_HOME=C:\Program Files\Android\Android Studio\jbr
echo =========================================
echo 🚀 Starting Digital Compass Build & Pack
echo =========================================

echo.
echo 📦 Step 1: Compiling React Vite app...
call npm run build
if %ERRORLEVEL% neq 0 (
    echo ❌ React build failed!
    exit /b 1
)

echo.
echo 🔄 Step 2: Syncing web assets with Capacitor Android...
call npx cap sync android
if %ERRORLEVEL% neq 0 (
    echo ❌ Capacitor sync failed!
    exit /b 1
)

echo.
echo 🤖 Step 3: Compiling Android APK / AAB...
cd android
call gradlew.bat assembleRelease
if %ERRORLEVEL% neq 0 (
    echo ❌ Gradle compilation failed!
    cd ..
    exit /b 1
)
cd ..

echo =========================================
echo 🎉 Success! Digital Compass Build Complete!
echo =========================================
