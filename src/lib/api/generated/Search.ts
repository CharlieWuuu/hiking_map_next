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
import { ContentType, HttpClient, RequestParams } from './http-client';

export class Search<SecurityDataType = unknown> extends HttpClient<SecurityDataType> {
  /**
   * No description
   *
   * @tags Search
   * @name SearchControllerSearch
   * @request GET:/search
   */
  searchControllerSearch = (
    query: {
      q: string;
      category: string;
      county: string;
    },
    params: RequestParams = {}
  ) =>
    this.request<SearchResultDto[], any>({
      path: `/search`,
      method: 'GET',
      query: query,
      format: 'json',
      ...params,
    });
  /**
   * No description
   *
   * @tags Search
   * @name SearchControllerNearby
   * @request GET:/search/nearby
   */
  searchControllerNearby = (
    query: {
      lat: string;
      lng: string;
    },
    params: RequestParams = {}
  ) =>
    this.request<SearchResultDto[], any>({
      path: `/search/nearby`,
      method: 'GET',
      query: query,
      format: 'json',
      ...params,
    });
  /**
   * No description
   *
   * @tags Search
   * @name SearchControllerLastLocation
   * @request GET:/search/last-location
   */
  searchControllerLastLocation = (params: RequestParams = {}) =>
    this.request<{ lat: number; lng: number } | null, any>({
      path: `/search/last-location`,
      method: 'GET',
      format: 'json',
      ...params,
    });
  /**
   * No description
   *
   * @tags Search
   * @name SearchControllerPopularQueries
   * @request GET:/search/popular
   */
  searchControllerPopularQueries = (params: RequestParams = {}) =>
    this.request<PopularQueryDto[], any>({
      path: `/search/popular`,
      method: 'GET',
      format: 'json',
      ...params,
    });
  /**
   * No description
   *
   * @tags Search
   * @name SearchControllerLogQuery
   * @request POST:/search/log
   */
  searchControllerLogQuery = (data: LogSearchQueryDto, params: RequestParams = {}) =>
    this.request<void, any>({
      path: `/search/log`,
      method: 'POST',
      body: data,
      type: ContentType.Json,
      ...params,
    });
}
