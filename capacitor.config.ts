import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.hcompass.app',
  appName: 'हिंदी कंपास',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: "#0A0A0C",
      showSpinner: false,
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP"
    }
  }
};

export default config;
