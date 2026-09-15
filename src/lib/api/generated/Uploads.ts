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

import { ContentType, HttpClient, RequestParams } from './http-client';

export class Uploads<SecurityDataType = unknown> extends HttpClient<SecurityDataType> {
  /**
   * No description
   *
   * @tags Uploads
   * @name UploadsControllerUploadImage
   * @request POST:/uploads/images
   */
  uploadsControllerUploadImage = (
    data: {
      /** @format binary */
      file?: File;
    },
    params: RequestParams = {}
  ) =>
    this.request<
      {
        url?: string;
      },
      any
    >({
      path: `/uploads/images`,
      method: 'POST',
      body: data,
      type: ContentType.FormData,
      format: 'json',
      ...params,
    });
}
