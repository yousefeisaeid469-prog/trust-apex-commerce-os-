import type { MetadataRoute } from 'next';
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'TRUST APEX Marketplace',
    short_name: 'TRUST',
    description: 'TRUST APEX — intelligent commerce, trust and operations.',
    start_url: '/',
    display: 'standalone',
    background_color: '#050505',
    theme_color: '#050505',
    lang: 'ar',
    dir: 'rtl',
  };
}
