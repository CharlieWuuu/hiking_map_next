import { createAuthService } from './adapters/auth';
import { createHikesService } from './adapters/hikes';
import { createMountainsService } from './adapters/mountains';
import { createProfileService } from './adapters/profile';
import { createSearchService } from './adapters/search';
import { createCollectionsService } from './adapters/social';
import { createTrailsService } from './adapters/trails';
import { createUploadsService } from './adapters/uploads';
import { Auth } from './generated/Auth';
import { Collections } from './generated/Collections';
import { Hikes } from './generated/Hikes';
import type { ApiConfig } from './generated/http-client';
import { Mountains } from './generated/Mountains';
import { Profile } from './generated/Profile';
import { Search } from './generated/Search';
import { Trails } from './generated/Trails';
import { Uploads } from './generated/Uploads';

// 後端回傳/接收的欄位是 snake_case，前端要用的是 camelCase。
// 這裡組裝出來的 service 已經套用過轉換，app 端不該直接 import ./api/* 下的生成檔案。
export function createApiClient(config?: ApiConfig) {
  return {
    auth: createAuthService(new Auth(config)),
    profile: createProfileService(new Profile(config)),
    hikes: createHikesService(new Hikes(config)),
    mountains: createMountainsService(new Mountains(config)),
    trails: createTrailsService(new Trails(config)),
    collections: createCollectionsService(new Collections(config)),
    search: createSearchService(new Search(config)),
    uploads: createUploadsService(new Uploads(config)),
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;

export type { CreateHikeDto, Hike, HikeStats } from './adapters/hikes';
export type { Mountain } from './adapters/mountains';
export type { Profile as ProfileModel, UpdateProfileDto } from './adapters/profile';
export type { SearchResult } from './adapters/search';
export type { Collection, CollectionItem, CreateCollectionDto } from './adapters/social';
export type { Trail, TrailDetail } from './adapters/trails';
export type { LoginDto, LoginResponseDto, RegisterDto, RegisterResponseDto } from './generated/data-contracts';
