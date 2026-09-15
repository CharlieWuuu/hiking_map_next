export type TrailCategory = 'hundred' | 'smallHundred' | 'hundredTrail';

// 官方路線分類清單，順序即為分類瀏覽頁的顯示順序
export const TRAIL_CATEGORIES: TrailCategory[] = ['hundred', 'smallHundred', 'hundredTrail'];

export type TrailDetail = {
  slug: string;
  name: string;
  county: string;
  town: string;
  date: string;
  distanceKm: number;
  urls: string[];
  note?: string;
  description?: string;
  // 官方分類：百岳／小百岳／百大必訪步道，一條路線可以同時屬於多個分類
  categories: TrailCategory[];
  // 路線座標序列，[經度, 緯度]，之後接上真的後端 API 後會換成後端回傳的 GeoJSON LineString
  path: [number, number][];
};

// 之後接上真的後端 API 後，這份假資料會換成打 API 查詢的結果
export const MOCK_TRAIL_DETAILS: TrailDetail[] = [
  {
    slug: 'trail-1',
    name: '象山親山步道',
    county: '台北市',
    town: '信義區',
    date: '2025-03-14',
    distanceKm: 2.8,
    urls: ['https://example.com/trail-1-a', 'https://example.com/trail-1-b'],
    note: '鄰近信義區，適合新手健行',
    description: '象山親山步道是台北市熱門的夜景登山路線，步道規劃完善，沿途設有多個觀景平台，可俯瞰台北 101 與市區夜景，適合親子與新手健行。',
    categories: ['hundredTrail'],
    path: [
      [121.5705, 25.0275],
      [121.572, 25.0268],
      [121.5738, 25.0261],
      [121.5751, 25.0248],
      [121.5762, 25.0233],
      [121.577, 25.0219],
    ],
  },
  {
    slug: 'trail-2',
    name: '七星山',
    county: '台北市',
    town: '陽明山',
    date: '2025-05-02',
    distanceKm: 6.4,
    urls: ['https://example.com/trail-2-a'],
    note: '台北市熱門路線，假日人潮較多',
    description: '七星山為大屯火山群最高峰，步道沿途可見硫氣孔地質景觀，視野遼闊，是台北近郊熱門的登山路線之一。',
    categories: ['smallHundred'],
    path: [
      [121.5445, 25.1668],
      [121.5461, 25.1652],
      [121.5478, 25.1639],
      [121.5492, 25.1621],
      [121.5507, 25.1605],
      [121.5523, 25.159],
    ],
  },
  {
    slug: 'trail-3',
    name: '玉山主峰',
    county: '南投縣',
    town: '信義鄉',
    date: '2025-04-10',
    distanceKm: 21.5,
    urls: ['https://example.com/trail-3-a'],
    note: '台灣最高峰，需申請入山證',
    description: '玉山為台灣最高峰，海拔 3,952 公尺，登頂步道規劃完善，沿途景觀壯麗，是百岳中最熱門的路線之一。',
    categories: ['hundred'],
    path: [
      [120.9575, 23.4703],
      [120.9591, 23.4718],
      [120.9608, 23.4732],
    ],
  },
  {
    slug: 'trail-4',
    name: '雪山主峰',
    county: '台中市',
    town: '和平區',
    date: '2025-06-01',
    distanceKm: 27.4,
    urls: [],
    note: '台灣第二高峰，適合安排兩天一夜',
    description: '雪山為台灣第二高峰，沿途可見雪山圈谷、黑森林等經典地景，是熱門的百岳路線。',
    categories: ['hundred'],
    path: [
      [121.2214, 24.3872],
      [121.2231, 24.3889],
      [121.2249, 24.3903],
    ],
  },
  {
    slug: 'trail-5',
    name: '皇帝殿步道',
    county: '新北市',
    town: '石碇區',
    date: '2025-02-18',
    distanceKm: 5.2,
    urls: [],
    note: '刃嶺地形著名，需注意腳程與天候',
    description: '皇帝殿以稜線岩石地形著名，沿途需手腳並用通過狹窄岩稜，視野開闊，是新北市熱門的小百岳路線。',
    categories: ['smallHundred'],
    path: [
      [121.6398, 24.9891],
      [121.6415, 24.9905],
      [121.6432, 24.9918],
    ],
  },
  {
    slug: 'trail-6',
    name: '龜山島步道',
    county: '宜蘭縣',
    town: '頭城鎮',
    date: '2025-07-05',
    distanceKm: 4.1,
    urls: [],
    note: '需搭船上島，登頂可俯瞰龜卵島',
    description: '龜山島登頂步道沿途可見海蝕地形與硫氣孔景觀，登頂後視野遼闊，是宜蘭縣熱門的小百岳路線。',
    categories: ['smallHundred'],
    path: [
      [121.9218, 24.8365],
      [121.9235, 24.8379],
      [121.9251, 24.8392],
    ],
  },
  {
    slug: 'trail-7',
    name: '阿里山對高岳步道',
    county: '嘉義縣',
    town: '阿里山鄉',
    date: '2025-01-22',
    distanceKm: 3.6,
    urls: [],
    note: '鄰近阿里山森林遊樂區，適合看日出',
    description: '對高岳步道鄰近阿里山森林遊樂區，沿途林相豐富，是熱門的百大必訪步道之一，也是熱門的賞日出地點。',
    categories: ['hundredTrail'],
    path: [
      [120.7981, 23.4693],
      [120.7998, 23.4707],
      [120.8014, 23.4721],
    ],
  },
];
