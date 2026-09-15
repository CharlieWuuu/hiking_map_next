export type BaseMapKey = 'osm' | 'opentopomap' | 'esritopomap' | 'cartoLight' | 'cartoDark';

export type BaseMapSetting = {
  labelZh: string;
  url: string;
  previewSrc: string;
  opacity: number;
  saturate: number;
};

// 底圖來源與預設樣式，數值沿用舊專案調校過的視覺效果（襯托路線描邊用）
export const BASE_MAPS: Record<BaseMapKey, BaseMapSetting> = {
  osm: {
    labelZh: '一般',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    previewSrc: '/images/basemaps/osm.png',
    opacity: 0.3,
    saturate: 0,
  },
  opentopomap: {
    labelZh: '地形 1',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    previewSrc: '/images/basemaps/opentopomap.png',
    opacity: 0.6,
    saturate: 0.6,
  },
  esritopomap: {
    labelZh: '地形 2',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    previewSrc: '/images/basemaps/esritopomap.png',
    opacity: 0.6,
    saturate: 1,
  },
  cartoLight: {
    labelZh: '淺色',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
    previewSrc: '/images/basemaps/carto-light.png',
    opacity: 1,
    saturate: 1,
  },
  cartoDark: {
    labelZh: '深色',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
    previewSrc: '/images/basemaps/carto-dark.png',
    opacity: 1,
    saturate: 1,
  },
};

export const DEFAULT_BASE_MAP: BaseMapKey = 'osm';
