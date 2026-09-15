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

import { Collection, CollectionItemDto, CreateCollectionDto } from './data-contracts';
import { ContentType, HttpClient, RequestParams } from './http-client';

export class Collections<SecurityDataType = unknown> extends HttpClient<SecurityDataType> {
  /**
   * No description
   *
   * @tags Social
   * @name SocialControllerFindCollectionsByUsername
   * @request GET:/collections/by-username/{username}
   */
  socialControllerFindCollectionsByUsername = (username: string, params: RequestParams = {}) =>
    this.request<CollectionItemDto[], any>({
      path: `/collections/by-username/${username}`,
      method: 'GET',
      format: 'json',
      ...params,
    });
  /**
   * No description
   *
   * @tags Social
   * @name SocialControllerAddCollection
   * @request POST:/collections
   */
  socialControllerAddCollection = (data: CreateCollectionDto, params: RequestParams = {}) =>
    this.request<Collection, any>({
      path: `/collections`,
      method: 'POST',
      body: data,
      type: ContentType.Json,
      format: 'json',
      ...params,
    });
  /**
   * No description
   *
   * @tags Social
   * @name SocialControllerFindCollections
   * @request GET:/collections
   */
  socialControllerFindCollections = (params: RequestParams = {}) =>
    this.request<CollectionItemDto[], any>({
      path: `/collections`,
      method: 'GET',
      format: 'json',
      ...params,
    });
  /**
   * No description
   *
   * @tags Social
   * @name SocialControllerRemoveCollection
   * @request DELETE:/collections/{id}
   */
  socialControllerRemoveCollection = (id: number, params: RequestParams = {}) =>
    this.request<void, any>({
      path: `/collections/${id}`,
      method: 'DELETE',
      ...params,
    });
}
