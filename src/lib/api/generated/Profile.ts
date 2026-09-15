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
import { ContentType, HttpClient, RequestParams } from './http-client';

export class Profile<SecurityDataType = unknown> extends HttpClient<SecurityDataType> {
  /**
   * No description
   *
   * @tags Profile
   * @name ProfileControllerGetMe
   * @request GET:/profile/me
   */
  profileControllerGetMe = (params: RequestParams = {}) =>
    this.request<Profile, any>({
      path: `/profile/me`,
      method: 'GET',
      format: 'json',
      ...params,
    });
  /**
   * No description
   *
   * @tags Profile
   * @name ProfileControllerUpdateMe
   * @request PATCH:/profile/me
   */
  profileControllerUpdateMe = (data: UpdateProfileDto, params: RequestParams = {}) =>
    this.request<Profile, any>({
      path: `/profile/me`,
      method: 'PATCH',
      body: data,
      type: ContentType.Json,
      format: 'json',
      ...params,
    });
  /**
   * No description
   *
   * @tags Profile
   * @name ProfileControllerGetByUsername
   * @request GET:/profile/{username}
   */
  profileControllerGetByUsername = (username: string, params: RequestParams = {}) =>
    this.request<Profile, any>({
      path: `/profile/${username}`,
      method: 'GET',
      format: 'json',
      ...params,
    });
}
