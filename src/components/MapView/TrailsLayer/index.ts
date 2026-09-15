'use client';

import dynamic from 'next/dynamic';

import MapViewPlaceholder from '../MapViewPlaceholder';

export type { MapTrail } from './TrailsLayer';

export default dynamic(() => import('./TrailsLayer'), {
  ssr: false,
  loading: MapViewPlaceholder,
});
