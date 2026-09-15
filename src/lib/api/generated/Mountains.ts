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
import { HttpClient, RequestParams } from './http-client';

export class Mountains<SecurityDataType = unknown> extends HttpClient<SecurityDataType> {
  /**
   * No description
   *
   * @tags Mountains
   * @name MountainsControllerFindAll
   * @request GET:/mountains
   */
  mountainsControllerFindAll = (params: RequestParams = {}) =>
    this.request<Mountain[], any>({
      path: `/mountains`,
      method: 'GET',
      format: 'json',
      ...params,
    });
  /**
   * No description
   *
   * @tags Mountains
   * @name MountainsControllerFindOne
   * @request GET:/mountains/{id}
   */
  mountainsControllerFindOne = (id: number, params: RequestParams = {}) =>
    this.request<Mountain, any>({
      path: `/mountains/${id}`,
      method: 'GET',
      format: 'json',
      ...params,
    });
}
