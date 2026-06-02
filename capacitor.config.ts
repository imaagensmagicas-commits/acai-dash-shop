import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.klacai.admin',
  appName: 'KL Açaí Admin',
  webDir: 'dist/client',
  server: {
    androidScheme: 'https'
  }
};

export default config;
