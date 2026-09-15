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

import {
  AuthMethodsDto,
  ForgotPasswordDto,
  LoginDto,
  LoginResponseDto,
  RegisterDto,
  RegisterResponseDto,
  ResetPasswordDto,
  SetEmailDto,
} from './data-contracts';
import { ContentType, HttpClient, RequestParams } from './http-client';

export class Auth<SecurityDataType = unknown> extends HttpClient<SecurityDataType> {
  /**
   * No description
   *
   * @tags Auth
   * @name AuthControllerRegister
   * @request POST:/auth/register
   */
  authControllerRegister = (data: RegisterDto, params: RequestParams = {}) =>
    this.request<RegisterResponseDto, any>({
      path: `/auth/register`,
      method: 'POST',
      body: data,
      type: ContentType.Json,
      format: 'json',
      ...params,
    });
  /**
   * No description
   *
   * @tags Auth
   * @name AuthControllerLogin
   * @request POST:/auth/login
   */
  authControllerLogin = (data: LoginDto, params: RequestParams = {}) =>
    this.request<LoginResponseDto, any>({
      path: `/auth/login`,
      method: 'POST',
      body: data,
      type: ContentType.Json,
      format: 'json',
      ...params,
    });
  /**
   * No description
   *
   * @tags Auth
   * @name AuthControllerLogout
   * @request POST:/auth/logout
   */
  authControllerLogout = (params: RequestParams = {}) =>
    this.request<void, any>({
      path: `/auth/logout`,
      method: 'POST',
      ...params,
    });
  /**
   * No description
   *
   * @tags Auth
   * @name AuthControllerGetMethods
   * @request GET:/auth/methods
   */
  authControllerGetMethods = (params: RequestParams = {}) =>
    this.request<AuthMethodsDto, any>({
      path: `/auth/methods`,
      method: 'GET',
      format: 'json',
      ...params,
    });
  /**
   * No description
   *
   * @tags Auth
   * @name AuthControllerSetEmail
   * @request PUT:/auth/email
   */
  authControllerSetEmail = (data: SetEmailDto, params: RequestParams = {}) =>
    this.request<void, any>({
      path: `/auth/email`,
      method: 'PUT',
      body: data,
      type: ContentType.Json,
      ...params,
    });
  /**
   * No description
   *
   * @tags Auth
   * @name AuthControllerForgotPassword
   * @request POST:/auth/forgot-password
   */
  authControllerForgotPassword = (data: ForgotPasswordDto, params: RequestParams = {}) =>
    this.request<void, any>({
      path: `/auth/forgot-password`,
      method: 'POST',
      body: data,
      type: ContentType.Json,
      ...params,
    });
  /**
   * No description
   *
   * @tags Auth
   * @name AuthControllerResetPassword
   * @request POST:/auth/reset-password
   */
  authControllerResetPassword = (data: ResetPasswordDto, params: RequestParams = {}) =>
    this.request<void, any>({
      path: `/auth/reset-password`,
      method: 'POST',
      body: data,
      type: ContentType.Json,
      ...params,
    });
  /**
   * No description
   *
   * @tags Auth
   * @name AuthControllerGoogleLogin
   * @request GET:/auth/google
   */
  authControllerGoogleLogin = (params: RequestParams = {}) =>
    this.request<void, any>({
      path: `/auth/google`,
      method: 'GET',
      ...params,
    });
  /**
   * No description
   *
   * @tags Auth
   * @name AuthControllerUnlinkGoogle
   * @request DELETE:/auth/google
   */
  authControllerUnlinkGoogle = (params: RequestParams = {}) =>
    this.request<void, any>({
      path: `/auth/google`,
      method: 'DELETE',
      ...params,
    });
  /**
   * No description
   *
   * @tags Auth
   * @name AuthControllerGoogleCallback
   * @request GET:/auth/google/callback
   */
  authControllerGoogleCallback = (params: RequestParams = {}) =>
    this.request<void, any>({
      path: `/auth/google/callback`,
      method: 'GET',
      ...params,
    });
}
