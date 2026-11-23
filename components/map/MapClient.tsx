'use client';

import dynamic from 'next/dynamic';
import { MapSkeleton } from './MapSkeleton';

// Leaflet touches `window`, so the maps only ever load in the browser.
export const LiveMap = dynamic(() => import('./LiveMap'), { ssr: false, loading: () => <MapSkeleton /> });
export const RouteMap = dynamic(() => import('./RouteMap'), { ssr: false, loading: () => <MapSkeleton /> });
