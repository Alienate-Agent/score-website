import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  async redirects() {
    // The production static-file cache does not resolve a directory's trailing
    // slash to index.html. Keep existing short links and relative asset URLs.
    return [{ source: '/lens', destination: '/lens/index.html', permanent: false }];
  },
};

export default nextConfig;
