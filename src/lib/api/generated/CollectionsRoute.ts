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

export namespace Collections {
  /**
   * No description
   * @tags Social
   * @name SocialControllerFindCollectionsByUsername
   * @request GET:/collections/by-username/{username}
   */
  export namespace SocialControllerFindCollectionsByUsername {
    export type RequestParams = {
      username: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = CollectionItemDto[];
  }

  /**
   * No description
   * @tags Social
   * @name SocialControllerAddCollection
   * @request POST:/collections
   */
  export namespace SocialControllerAddCollection {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = CreateCollectionDto;
    export type RequestHeaders = {};
    export type ResponseBody = Collection;
  }

  /**
   * No description
   * @tags Social
   * @name SocialControllerFindCollections
   * @request GET:/collections
   */
  export namespace SocialControllerFindCollections {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = CollectionItemDto[];
  }

  /**
   * No description
   * @tags Social
   * @name SocialControllerRemoveCollection
   * @request DELETE:/collections/{id}
   */
  export namespace SocialControllerRemoveCollection {
    export type RequestParams = {
      id: number;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = void;
  }
}
