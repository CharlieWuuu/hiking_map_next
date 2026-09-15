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

import { CreateHikeDto, Hike, HikeStatsDto } from './data-contracts';

export namespace Hikes {
  /**
   * No description
   * @tags Hikes
   * @name HikesControllerCreate
   * @request POST:/hikes
   */
  export namespace HikesControllerCreate {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = CreateHikeDto;
    export type RequestHeaders = {};
    export type ResponseBody = Hike;
  }

  /**
   * No description
   * @tags Hikes
   * @name HikesControllerFindAll
   * @request GET:/hikes
   */
  export namespace HikesControllerFindAll {
    export type RequestParams = {};
    export type RequestQuery = {
      userId: string;
      includeGeojson: string;
      category?: string;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = Hike[];
  }

  /**
   * No description
   * @tags Hikes
   * @name HikesControllerFindInView
   * @request GET:/hikes/in-view
   */
  export namespace HikesControllerFindInView {
    export type RequestParams = {};
    export type RequestQuery = {
      bbox: string;
      userId: string;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = void;
  }

  /**
   * No description
   * @tags Hikes
   * @name HikesControllerGetStats
   * @request GET:/hikes/stats
   */
  export namespace HikesControllerGetStats {
    export type RequestParams = {};
    export type RequestQuery = {
      username: string;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = HikeStatsDto;
  }

  /**
   * No description
   * @tags Hikes
   * @name HikesControllerFindOne
   * @request GET:/hikes/{id}
   */
  export namespace HikesControllerFindOne {
    export type RequestParams = {
      id: number;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = Hike;
  }

  /**
   * No description
   * @tags Hikes
   * @name HikesControllerRemove
   * @request DELETE:/hikes/{id}
   */
  export namespace HikesControllerRemove {
    export type RequestParams = {
      id: number;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = void;
  }
}
