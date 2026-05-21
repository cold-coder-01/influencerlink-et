import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.influencerlink.et",
  appName: "InfluencerLink ET",
  webDir: "out",
  server: {
    url: "http://192.168.0.188:3000",
    cleartext: true,
  },
};

export default config;
