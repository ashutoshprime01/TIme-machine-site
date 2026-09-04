import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Archived (untrusted) content is rendered inside a sandboxed cross-origin
  // iframe pointing at web.archive.org — it never executes in our origin.
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
