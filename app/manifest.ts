import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'StrideLog: Run & Walk Tracker',
    short_name: 'StrideLog',
    description: 'Track your runs and walks with a live GPS map, streaks, badges, notes and progress photos.',
    id: '/',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#0b0f1a',
    theme_color: '#0b0f1a',
    categories: ['health', 'fitness', 'sports'],
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
