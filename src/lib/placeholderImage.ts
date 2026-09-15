// 先用代圖：依 seed 產生穩定的漸層色塊 data URI，之後可換成真實圖片
// 飽和度／明度固定，只有色相依 seed 變化，讓多張卡片維持同一套質感而非隨機撞色
const SATURATION = 60;
const LIGHTNESS_START = 42;
const LIGHTNESS_END = 30;

export function placeholderImage(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;

  const hue1 = hash % 360;
  const hue2 = (hue1 + 30) % 360;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="hsl(${hue1},${SATURATION}%,${LIGHTNESS_START}%)"/><stop offset="100%" stop-color="hsl(${hue2},${SATURATION}%,${LIGHTNESS_END}%)"/></linearGradient></defs><rect width="300" height="200" fill="url(#g)"/></svg>`;

  const encoded = encodeURIComponent(svg).replace(/\(/g, '%28').replace(/\)/g, '%29');
  return `data:image/svg+xml;utf8,${encoded}`;
}
