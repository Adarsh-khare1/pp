import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.codefolio.app',
  appName: 'Codefolio',
  webDir: 'dist/client',
  server: {
    androidScheme: 'https',
    cleartext: true
  },
  android: {
    allowMixedContent: true,
    backgroundColor: '#080c17'
  }
};

export default config;
