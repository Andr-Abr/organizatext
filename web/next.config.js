/** @type {import('next').NextConfig} */
const nextConfig = {
  // Turbopack habilitado por defecto en Next.js 16
  turbopack: {},

  // Headers de seguridad
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },

  // Configuración de imágenes
  images: {
    domains: [],
  },
};

module.exports = nextConfig;