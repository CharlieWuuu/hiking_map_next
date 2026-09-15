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

import { Trail, TrailDetailDto } from './data-contracts';

export namespace Trails {
  /**
   * No description
   * @tags Trails
   * @name TrailsControllerFindAll
   * @request GET:/trails
   */
  export namespace TrailsControllerFindAll {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = Trail[];
  }

  /**
   * No description
   * @tags Trails
   * @name TrailsControllerFindOne
   * @request GET:/trails/{slug}
   */
  export namespace TrailsControllerFindOne {
    export type RequestParams = {
      slug: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = TrailDetailDto;
  }
}
