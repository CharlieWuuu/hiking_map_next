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

export namespace V1 {
  /**
   * No description
   * @tags v1 (舊版前端)
   * @name V1TrailsControllerGetTrails
   * @request GET:/v1/trails
   * @secure
   */
  export namespace V1TrailsControllerGetTrails {
    export type RequestParams = {};
    export type RequestQuery = {
      owner_uuid: string;
      type: string;
      uuid: string;
      share: string;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = void;
  }

  /**
   * No description
   * @tags v1 (舊版前端)
   * @name V1TrailsControllerPost
   * @request POST:/v1/trails
   * @secure
   */
  export namespace V1TrailsControllerPost {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = void;
  }

  /**
   * No description
   * @tags v1 (舊版前端)
   * @name V1TrailsControllerGetCountyOrder
   * @request GET:/v1/trails/county_order
   * @secure
   */
  export namespace V1TrailsControllerGetCountyOrder {
    export type RequestParams = {};
    export type RequestQuery = {
      owner_uuid: string;
      type: string;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = void;
  }

  /**
   * No description
   * @tags v1 (舊版前端)
   * @name V1TrailsControllerGetTrailsMonthData
   * @request GET:/v1/trails/trails_month_data
   * @secure
   */
  export namespace V1TrailsControllerGetTrailsMonthData {
    export type RequestParams = {};
    export type RequestQuery = {
      owner_uuid: string;
      type: string;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = void;
  }

  /**
   * No description
   * @tags v1 (舊版前端)
   * @name V1TrailsControllerGetExport
   * @request GET:/v1/trails/export
   * @secure
   */
  export namespace V1TrailsControllerGetExport {
    export type RequestParams = {};
    export type RequestQuery = {
      type: string;
      owner_uuid: string;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = void;
  }

  /**
   * No description
   * @tags v1 (舊版前端)
   * @name V1TrailsControllerPut
   * @request PUT:/v1/trails/{uuid}
   * @secure
   */
  export namespace V1TrailsControllerPut {
    export type RequestParams = {
      uuid: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = void;
  }

  /**
   * No description
   * @tags v1 (舊版前端)
   * @name V1TrailsControllerDelete
   * @request DELETE:/v1/trails/{uuid}
   * @secure
   */
  export namespace V1TrailsControllerDelete {
    export type RequestParams = {
      uuid: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = void;
  }

  /**
   * No description
   * @tags v1 (舊版前端)
   * @name V1TrailsControllerPatch
   * @request PATCH:/v1/trails/{uuid}/properties
   * @secure
   */
  export namespace V1TrailsControllerPatch {
    export type RequestParams = {
      uuid: string;
    };
    export type RequestQuery = {};
    export type RequestBody = TrailsInfoDto;
    export type RequestHeaders = {};
    export type ResponseBody = void;
  }

  /**
   * No description
   * @tags v1 (舊版前端)
   * @name V1OwnerControllerGetList
   * @request GET:/v1/owners/list
   */
  export namespace V1OwnerControllerGetList {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = void;
  }

  /**
   * No description
   * @tags v1 (舊版前端)
   * @name V1OwnerControllerGetDetail
   * @request GET:/v1/owners/detail
   */
  export namespace V1OwnerControllerGetDetail {
    export type RequestParams = {};
    export type RequestQuery = {
      name: string;
      type: string;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = void;
  }

  /**
   * No description
   * @tags v1 (舊版前端)
   * @name V1AuthControllerLogin
   * @request POST:/v1/auth/login
   */
  export namespace V1AuthControllerLogin {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = LoginDto;
    export type RequestHeaders = {};
    export type ResponseBody = void;
  }
}
