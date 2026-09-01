import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.hcompass.app',
  appName: 'हिंदी कंपास',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
