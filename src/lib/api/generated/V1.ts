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

import { LoginDto, TrailsInfoDto } from './data-contracts';
import { ContentType, HttpClient, RequestParams } from './http-client';

export class V1<SecurityDataType = unknown> extends HttpClient<SecurityDataType> {
  /**
   * No description
   *
   * @tags v1 (舊版前端)
   * @name V1TrailsControllerGetTrails
   * @request GET:/v1/trails
   * @secure
   */
  v1TrailsControllerGetTrails = (
    query: {
      owner_uuid: string;
      type: string;
      uuid: string;
      share: string;
    },
    params: RequestParams = {}
  ) =>
    this.request<void, any>({
      path: `/v1/trails`,
      method: 'GET',
      query: query,
      secure: true,
      ...params,
    });
  /**
   * No description
   *
   * @tags v1 (舊版前端)
   * @name V1TrailsControllerPost
   * @request POST:/v1/trails
   * @secure
   */
  v1TrailsControllerPost = (params: RequestParams = {}) =>
    this.request<void, any>({
      path: `/v1/trails`,
      method: 'POST',
      secure: true,
      ...params,
    });
  /**
   * No description
   *
   * @tags v1 (舊版前端)
   * @name V1TrailsControllerGetCountyOrder
   * @request GET:/v1/trails/county_order
   * @secure
   */
  v1TrailsControllerGetCountyOrder = (
    query: {
      owner_uuid: string;
      type: string;
    },
    params: RequestParams = {}
  ) =>
    this.request<void, any>({
      path: `/v1/trails/county_order`,
      method: 'GET',
      query: query,
      secure: true,
      ...params,
    });
  /**
   * No description
   *
   * @tags v1 (舊版前端)
   * @name V1TrailsControllerGetTrailsMonthData
   * @request GET:/v1/trails/trails_month_data
   * @secure
   */
  v1TrailsControllerGetTrailsMonthData = (
    query: {
      owner_uuid: string;
      type: string;
    },
    params: RequestParams = {}
  ) =>
    this.request<void, any>({
      path: `/v1/trails/trails_month_data`,
      method: 'GET',
      query: query,
      secure: true,
      ...params,
    });
  /**
   * No description
   *
   * @tags v1 (舊版前端)
   * @name V1TrailsControllerGetExport
   * @request GET:/v1/trails/export
   * @secure
   */
  v1TrailsControllerGetExport = (
    query: {
      type: string;
      owner_uuid: string;
    },
    params: RequestParams = {}
  ) =>
    this.request<void, any>({
      path: `/v1/trails/export`,
      method: 'GET',
      query: query,
      secure: true,
      ...params,
    });
  /**
   * No description
   *
   * @tags v1 (舊版前端)
   * @name V1TrailsControllerPut
   * @request PUT:/v1/trails/{uuid}
   * @secure
   */
  v1TrailsControllerPut = (uuid: string, params: RequestParams = {}) =>
    this.request<void, any>({
      path: `/v1/trails/${uuid}`,
      method: 'PUT',
      secure: true,
      ...params,
    });
  /**
   * No description
   *
   * @tags v1 (舊版前端)
   * @name V1TrailsControllerDelete
   * @request DELETE:/v1/trails/{uuid}
   * @secure
   */
  v1TrailsControllerDelete = (uuid: string, params: RequestParams = {}) =>
    this.request<void, any>({
      path: `/v1/trails/${uuid}`,
      method: 'DELETE',
      secure: true,
      ...params,
    });
  /**
   * No description
   *
   * @tags v1 (舊版前端)
   * @name V1TrailsControllerPatch
   * @request PATCH:/v1/trails/{uuid}/properties
   * @secure
   */
  v1TrailsControllerPatch = (uuid: string, data: TrailsInfoDto, params: RequestParams = {}) =>
    this.request<void, any>({
      path: `/v1/trails/${uuid}/properties`,
      method: 'PATCH',
      body: data,
      secure: true,
      type: ContentType.Json,
      ...params,
    });
  /**
   * No description
   *
   * @tags v1 (舊版前端)
   * @name V1OwnerControllerGetList
   * @request GET:/v1/owners/list
   */
  v1OwnerControllerGetList = (params: RequestParams = {}) =>
    this.request<void, any>({
      path: `/v1/owners/list`,
      method: 'GET',
      ...params,
    });
  /**
   * No description
   *
   * @tags v1 (舊版前端)
   * @name V1OwnerControllerGetDetail
   * @request GET:/v1/owners/detail
   */
  v1OwnerControllerGetDetail = (
    query: {
      name: string;
      type: string;
    },
    params: RequestParams = {}
  ) =>
    this.request<void, any>({
      path: `/v1/owners/detail`,
      method: 'GET',
      query: query,
      ...params,
    });
  /**
   * No description
   *
   * @tags v1 (舊版前端)
   * @name V1AuthControllerLogin
   * @request POST:/v1/auth/login
   */
  v1AuthControllerLogin = (data: LoginDto, params: RequestParams = {}) =>
    this.request<void, any>({
      path: `/v1/auth/login`,
      method: 'POST',
      body: data,
      type: ContentType.Json,
      ...params,
    });
}
