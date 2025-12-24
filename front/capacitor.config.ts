import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.sat.mobile',
  appName: 'SAT Mobile',
  webDir: 'dist',
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#1e293b", // slate-800
      showSpinner: true,
      spinnerColor: "#f97316" // orange-500
    }
  },
  server: {
    // Permitir HTTP en desarrollo
    cleartext: true,
    androidScheme: 'http'
  },
  android: {
    allowMixedContent: true
  }
};

export default config;
