export type ProfileDetail = {
  username: string;
  displayName: string;
  avatar?: string;
  totalDistanceKm: number;
  hikeCount: number;
  achievements: {
    hundred: number; // 百岳
    smallHundred: number; // 小百岳
    hundredTrail: number; // 百大必訪步道
  };
  monthlyDistance: { month: string; distanceKm: number }[];
  countyStats: { county: string; count: number }[];
  trails: {
    slug: string;
    name: string;
    county: string;
    town: string;
    date: string;
    distanceKm: number;
    isPublic: boolean;
    isHundred: boolean; // 百岳
    isSmallHundred: boolean; // 小百岳
    isHundredTrail: boolean; // 百大必訪步道
    urls: string[];
    note?: string;
    // 路線座標序列，[經度, 緯度]，之後接上真的後端 API 後會換成後端回傳的 GeoJSON LineString
    path: [number, number][];
  }[];
};

// 之後接上真的後端 API 後，這份假資料會換成打 API 查詢的結果
export const MOCK_PROFILE_DETAILS: ProfileDetail[] = [
  {
    username: 'demo',
    displayName: '示範使用者',
    totalDistanceKm: 128.6,
    hikeCount: 24,
    achievements: { hundred: 12, smallHundred: 28, hundredTrail: 45 },
    monthlyDistance: [
      { month: '2025-01', distanceKm: 8.2 },
      { month: '2025-02', distanceKm: 12.5 },
      { month: '2025-03', distanceKm: 6.4 },
      { month: '2025-04', distanceKm: 15.8 },
      { month: '2025-05', distanceKm: 20.1 },
      { month: '2025-06', distanceKm: 9.6 },
    ],
    countyStats: [
      { county: '台北市', count: 8 },
      { county: '新北市', count: 6 },
      { county: '桃園市', count: 4 },
      { county: '台中市', count: 3 },
      { county: '南投縣', count: 2 },
      { county: '花蓮縣', count: 1 },
    ],
    trails: [
      {
        slug: 'trail-1',
        name: '象山親山步道',
        county: '台北市',
        town: '信義區',
        date: '2025-06-14',
        distanceKm: 2.8,
        isPublic: true,
        isHundred: false,
        isSmallHundred: false,
        isHundredTrail: true,
        urls: ['https://example.com/trail-1-a'],
        note: '鄰近信義區，適合新手健行',
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
        name: '七星山親山步道',
        county: '新北市',
        town: '新店區',
        date: '2025-05-02',
        distanceKm: 6.4,
        isPublic: true,
        isHundred: true,
        isSmallHundred: false,
        isHundredTrail: false,
        urls: [],
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
        name: '大屯山親山步道',
        county: '桃園市',
        town: '復興區',
        date: '2025-04-18',
        distanceKm: 5.1,
        isPublic: false,
        isHundred: false,
        isSmallHundred: true,
        isHundredTrail: false,
        urls: [],
        path: [
          [121.5223, 25.1735],
          [121.524, 25.1721],
          [121.5258, 25.1706],
          [121.5273, 25.169],
          [121.5289, 25.1673],
        ],
      },
      {
        slug: 'trail-4',
        name: '五分山親山步道',
        county: '台中市',
        town: '和平區',
        date: '2025-03-09',
        distanceKm: 4.3,
        isPublic: true,
        isHundred: false,
        isSmallHundred: false,
        isHundredTrail: false,
        urls: [],
        path: [
          [121.7975, 25.0698],
          [121.799, 25.0684],
          [121.8006, 25.0669],
          [121.8021, 25.0653],
        ],
      },
      {
        slug: 'trail-5',
        name: '劍潭山親山步道',
        county: '台南市',
        town: '南化區',
        date: '2025-02-21',
        distanceKm: 3.6,
        isPublic: true,
        isHundred: false,
        isSmallHundred: false,
        isHundredTrail: false,
        urls: [],
        note: '沿途景觀優美，建議攜帶登山杖',
        path: [
          [121.5265, 25.0862],
          [121.528, 25.0849],
          [121.5296, 25.0834],
          [121.5309, 25.0819],
        ],
      },
    ],
  },
];
