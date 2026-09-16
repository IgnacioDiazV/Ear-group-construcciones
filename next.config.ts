import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

const cspHeader = `
  upgrade-insecure-requests;
  default-src 'self';
  base-uri 'self';
  object-src 'none';
  form-action 'self';
  style-src 'self' 'unsafe-inline';
  script-src 'self' 'unsafe-inline' ${isDev ? "'unsafe-eval'" : ""};
  img-src 'self' blob: data: https://*.supabase.co;
  frame-src https://*.supabase.co;
  connect-src 'self' https://*.supabase.co https://api.groq.com https://dolarapi.com;
  frame-ancestors 'none';
`.replace(/\s{2,}/g, " ").trim();

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "rgewwpkoejzzkdaewikz.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  headers: async () => [
    {
      source: "/:path*",
      headers: [
        {
          key: "X-Frame-Options",
          value: "DENY",
        },
        {
          key: "X-Content-Type-Options",
          value: "nosniff",
        },
        {
          key: "Referrer-Policy",
          value: "strict-origin-when-cross-origin",
        },
        {
          key: "Permissions-Policy",
          value: "camera=(self), microphone=(), geolocation=()",
        },
        {
          key: "Content-Security-Policy",
          value: cspHeader,
        },
      ],
    },
  ],
};

export default nextConfig;
