import type { Collections as CollectionsClient } from '../generated/Collections';
import type {
  Collection as RawCollection,
  CollectionItemDto as RawCollectionItemDto,
  CreateCollectionDto as RawCreateCollectionDto,
} from '../generated/data-contracts';
import { toCamelCase } from './case';

export type Collection = {
  id: number;
  userId: number;
  itemType: 'trail' | 'hike' | 'user';
  itemId: number;
  createdAt: string;
};

export type CollectionItem = Collection & {
  trailName?: string | null;
  trailSlug?: string | null;
  username?: string | null;
  avatar?: string | null;
};

export type CreateCollectionDto = {
  itemType: 'trail' | 'hike' | 'user';
  itemId: number;
};

export function adaptCollection(raw: RawCollection): Collection {
  return toCamelCase<RawCollection>(raw) as Collection;
}

export function adaptCollectionItem(raw: RawCollectionItemDto): CollectionItem {
  return toCamelCase<RawCollectionItemDto>(raw) as CollectionItem;
}

export function toCreateCollectionDto(dto: CreateCollectionDto): RawCreateCollectionDto {
  return {
    item_type: dto.itemType,
    item_id: dto.itemId,
  };
}

export function createCollectionsService(client: CollectionsClient) {
  return {
    add: async (dto: CreateCollectionDto) => adaptCollection(await client.socialControllerAddCollection(toCreateCollectionDto(dto))),
    findAll: async () => (await client.socialControllerFindCollections()).map(adaptCollectionItem),
    findByUsername: async (username: string) => (await client.socialControllerFindCollectionsByUsername(username)).map(adaptCollectionItem),
    remove: (id: number) => client.socialControllerRemoveCollection(id),
  };
}
