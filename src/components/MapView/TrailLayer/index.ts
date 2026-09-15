'use client';

import dynamic from 'next/dynamic';

import MapViewPlaceholder from '../MapViewPlaceholder';

export default dynamic(() => import('./TrailLayer'), {
  ssr: false,
  loading: MapViewPlaceholder,
});
