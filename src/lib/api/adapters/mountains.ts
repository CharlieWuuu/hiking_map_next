import type { Mountain as RawMountain } from '../generated/data-contracts';
import type { Mountains as MountainsClient } from '../generated/Mountains';
import { toCamelCase } from './case';

export type Mountain = {
  id: number;
  name: string;
  elevationM: number;
  location: object;
  range: string | null;
  county: string | null;
  categories: string[];
};

export function adaptMountain(raw: RawMountain): Mountain {
  return { ...(toCamelCase<RawMountain>(raw) as Mountain), categories: raw.categories ?? [] };
}

export function createMountainsService(client: MountainsClient) {
  return {
    findAll: async () => (await client.mountainsControllerFindAll()).map(adaptMountain),
    findOne: async (id: number) => adaptMountain(await client.mountainsControllerFindOne(id)),
  };
}
