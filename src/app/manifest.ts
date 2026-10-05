import type { MetadataRoute } from 'next';

// 加到主畫面（PWA）時用的 manifest。名稱用預設語系（zh-TW）——
// manifest 只有一份，不跟著 [locale] 走
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '健行軌跡 Hiking Track',
    short_name: '健行軌跡',
    description: '上傳你的 GPX，一起建立你的健行軌跡。',
    start_url: '/',
    display: 'standalone',
    // 跟深色主題的底色一致，啟動畫面才不會先閃一片白
    background_color: '#1e1e1e',
    theme_color: '#1e1e1e',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      // Android 會把 icon 裁成圓形或其他形狀，maskable 版整片黃底、logo 縮在安全區內
      { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
