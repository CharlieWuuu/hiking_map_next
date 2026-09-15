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

import { LogSearchQueryDto, PopularQueryDto, SearchResultDto } from './data-contracts';

export namespace Search {
  /**
   * No description
   * @tags Search
   * @name SearchControllerSearch
   * @request GET:/search
   */
  export namespace SearchControllerSearch {
    export type RequestParams = {};
    export type RequestQuery = {
      q: string;
      category: string;
      county: string;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = SearchResultDto[];
  }

  /**
   * No description
   * @tags Search
   * @name SearchControllerNearby
   * @request GET:/search/nearby
   */
  export namespace SearchControllerNearby {
    export type RequestParams = {};
    export type RequestQuery = {
      lat: string;
      lng: string;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = SearchResultDto[];
  }

  /**
   * No description
   * @tags Search
   * @name SearchControllerLastLocation
   * @request GET:/search/last-location
   */
  export namespace SearchControllerLastLocation {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = { lat: number; lng: number } | null;
  }

  /**
   * No description
   * @tags Search
   * @name SearchControllerPopularQueries
   * @request GET:/search/popular
   */
  export namespace SearchControllerPopularQueries {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = PopularQueryDto[];
  }

  /**
   * No description
   * @tags Search
   * @name SearchControllerLogQuery
   * @request POST:/search/log
   */
  export namespace SearchControllerLogQuery {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = LogSearchQueryDto;
    export type RequestHeaders = {};
    export type ResponseBody = void;
  }
}
