'use client';

import dynamic from 'next/dynamic';

import MapViewPlaceholder from '../../../../../../components/MapView/MapViewPlaceholder';

// react-leaflet 在模組載入時就碰 window，伺服器端會直接炸掉。
// MapView 自己已經 ssr:false，但這一層 import 了 CircleMarker／Tooltip，
// 同樣得延到瀏覽器端才載入
export default dynamic(() => import('./MountainMap'), {
  ssr: false,
  loading: MapViewPlaceholder,
});
