/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

import { CreateHikeDto, Hike, HikeStatsDto, InViewHikeDto, MountainProgressDto, UpdateHikeDto } from './data-contracts';
import { ContentType, HttpClient, RequestParams } from './http-client';

export class Hikes<SecurityDataType = unknown> extends HttpClient<SecurityDataType> {
  /**
   * No description
   *
   * @tags Hikes
   * @name HikesControllerCreate
   * @request POST:/hikes
   */
  hikesControllerCreate = (data: CreateHikeDto, params: RequestParams = {}) =>
    this.request<Hike, any>({
      path: `/hikes`,
      method: 'POST',
      body: data,
      type: ContentType.Json,
      format: 'json',
      ...params,
    });
  /**
   * No description
   *
   * @tags Hikes
   * @name HikesControllerFindAll
   * @request GET:/hikes
   */
  hikesControllerFindAll = (
    query: {
      userId: string;
      includeGeojson: string;
      category?: string;
    },
    params: RequestParams = {}
  ) =>
    this.request<Hike[], any>({
      path: `/hikes`,
      method: 'GET',
      query: query,
      format: 'json',
      ...params,
    });
  /**
   * No description
   *
   * @tags Hikes
   * @name HikesControllerFindAllPaginated
   * @request GET:/hikes
   */
  hikesControllerFindAllPaginated = (
    query: {
      userId: string;
      includeGeojson: string;
      cursor?: string;
      limit: string;
      category?: string;
    },
    params: RequestParams = {}
  ) =>
    this.request<{ items: Hike[]; total_count: number; next_cursor: string | null }, any>({
      path: `/hikes`,
      method: 'GET',
      query: query,
      format: 'json',
      ...params,
    });
  /**
   * No description
   *
   * @tags Hikes
   * @name HikesControllerFindInView
   * @request GET:/hikes/in-view
   */
  hikesControllerFindInView = (
    query: {
      bbox: string;
      userId?: string;
      zoom?: string;
      category?: string;
    },
    params: RequestParams = {}
  ) =>
    this.request<InViewHikeDto[], any>({
      path: `/hikes/in-view`,
      method: 'GET',
      query: query,
      format: 'json',
      ...params,
    });
  /**
   * No description
   *
   * @tags Hikes
   * @name HikesControllerGetStats
   * @request GET:/hikes/stats
   */
  hikesControllerGetStats = (
    query: {
      username: string;
    },
    params: RequestParams = {}
  ) =>
    this.request<HikeStatsDto, any>({
      path: `/hikes/stats`,
      method: 'GET',
      query: query,
      format: 'json',
      ...params,
    });
  /**
   * No description
   *
   * @tags Hikes
   * @name HikesControllerGetMountainProgress
   * @request GET:/hikes/mountain-progress
   */
  hikesControllerGetMountainProgress = (params: RequestParams = {}) =>
    this.request<MountainProgressDto, any>({
      path: `/hikes/mountain-progress`,
      method: 'GET',
      format: 'json',
      ...params,
    });
  /**
   * No description
   *
   * @tags Hikes
   * @name HikesControllerFindOne
   * @request GET:/hikes/{id}
   */
  hikesControllerFindOne = (id: number, params: RequestParams = {}) =>
    this.request<Hike, any>({
      path: `/hikes/${id}`,
      method: 'GET',
      format: 'json',
      ...params,
    });
  /**
   * No description
   *
   * @tags Hikes
   * @name HikesControllerGetPageInfo
   * @request GET:/hikes/{id}/page
   */
  hikesControllerGetPageInfo = (id: number, query: { userId: number; limit: number }, params: RequestParams = {}) =>
    this.request<{ page: number; cursor: string | null }, any>({
      path: `/hikes/${id}/page`,
      method: 'GET',
      query: query,
      format: 'json',
      ...params,
    });
  /**
   * No description
   *
   * @tags Hikes
   * @name HikesControllerUpdate
   * @request PATCH:/hikes/{id}
   */
  hikesControllerUpdate = (id: number, data: UpdateHikeDto, params: RequestParams = {}) =>
    this.request<Hike, any>({
      path: `/hikes/${id}`,
      method: 'PATCH',
      body: data,
      type: ContentType.Json,
      format: 'json',
      ...params,
    });
  /**
   * No description
   *
   * @tags Hikes
   * @name HikesControllerRemove
   * @request DELETE:/hikes/{id}
   */
  hikesControllerRemove = (id: number, params: RequestParams = {}) =>
    this.request<void, any>({
      path: `/hikes/${id}`,
      method: 'DELETE',
      ...params,
    });
}
