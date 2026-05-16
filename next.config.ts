import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Optimizaciones de rendimiento
  poweredByHeader: false,
  compress: true,
  
  // Configuraciones de imagen
  images: {
    formats: ['image/webp', 'image/avif'],
  },
  
  // Variables de entorno públicas
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080',
  },
  
  // Configuración experimental
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-toast'],
  },
};

export default nextConfig;
