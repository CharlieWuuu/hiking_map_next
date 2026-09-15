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

import { Mountain } from './data-contracts';

export namespace Mountains {
  /**
   * No description
   * @tags Mountains
   * @name MountainsControllerFindAll
   * @request GET:/mountains
   */
  export namespace MountainsControllerFindAll {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = Mountain[];
  }

  /**
   * No description
   * @tags Mountains
   * @name MountainsControllerFindOne
   * @request GET:/mountains/{id}
   */
  export namespace MountainsControllerFindOne {
    export type RequestParams = {
      id: number;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = Mountain;
  }
}
