import type { Profile as RawProfile, UpdateProfileDto as RawUpdateProfileDto } from '../generated/data-contracts';
import type { RequestParams } from '../generated/http-client';
import type { Profile as ProfileClient } from '../generated/Profile';
import { toCamelCase } from './case';

export type Profile = {
  id: number;
  userId: number;
  username: string;
  avatar: string;
  description: string;
};

export type UpdateProfileDto = {
  avatar?: string;
  description?: string;
};

// 後端 findByUserId/findByUsername 實際上都會多回傳 username，但 Swagger DTO
// 是照 Profile entity 產生的，沒有這個欄位，所以在這裡手動補上型別。
export function adaptProfile(raw: RawProfile & { username: string }): Profile {
  return toCamelCase<RawProfile & { username: string }>(raw) as Profile;
}

export function toUpdateProfileDto(dto: UpdateProfileDto): RawUpdateProfileDto {
  return {
    avatar: dto.avatar,
    description: dto.description,
  };
}

export function createProfileService(client: ProfileClient) {
  return {
    getMe: async (params?: RequestParams) => adaptProfile((await client.profileControllerGetMe(params)) as RawProfile & { username: string }),
    updateMe: async (dto: UpdateProfileDto) =>
      adaptProfile((await client.profileControllerUpdateMe(toUpdateProfileDto(dto))) as RawProfile & { username: string }),
    getByUsername: async (username: string) => adaptProfile((await client.profileControllerGetByUsername(username)) as RawProfile & { username: string }),
  };
}
