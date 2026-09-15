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

import { Profile, UpdateProfileDto } from './data-contracts';

export namespace Profile {
  /**
   * No description
   * @tags Profile
   * @name ProfileControllerGetMe
   * @request GET:/profile/me
   */
  export namespace ProfileControllerGetMe {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = Profile;
  }

  /**
   * No description
   * @tags Profile
   * @name ProfileControllerUpdateMe
   * @request PATCH:/profile/me
   */
  export namespace ProfileControllerUpdateMe {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = UpdateProfileDto;
    export type RequestHeaders = {};
    export type ResponseBody = Profile;
  }

  /**
   * No description
   * @tags Profile
   * @name ProfileControllerGetByUsername
   * @request GET:/profile/{username}
   */
  export namespace ProfileControllerGetByUsername {
    export type RequestParams = {
      username: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = Profile;
  }
}
