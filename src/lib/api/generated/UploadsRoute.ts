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

export namespace Uploads {
  /**
   * No description
   * @tags Uploads
   * @name UploadsControllerUploadImage
   * @request POST:/uploads/images
   */
  export namespace UploadsControllerUploadImage {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = {
      /** @format binary */
      file?: File;
    };
    export type RequestHeaders = {};
    export type ResponseBody = {
      url?: string;
    };
  }
}
