import type { Auth } from '../generated/Auth';
import type { RequestParams } from '../generated/http-client';
import { toCamelCase } from './case';

export type AuthMethods = {
  email: string | null;
  hasPassword: boolean;
  hasGoogle: boolean;
};

export function createAuthService(client: Auth) {
  return {
    register: (data: { username: string; password: string; email?: string }) => client.authControllerRegister(data),
    login: (data: { username: string; password: string }) => client.authControllerLogin(data),
    logout: () => client.authControllerLogout(),

    // 目前有哪些登入方式，設定頁靠它決定顯示「綁定」還是「解除綁定」
    getMethods: async (params?: RequestParams): Promise<AuthMethods> => toCamelCase(await client.authControllerGetMethods(params)) as AuthMethods,
    setEmail: (email: string) => client.authControllerSetEmail({ email }),
    unlinkGoogle: () => client.authControllerUnlinkGoogle(),

    // 一律成功，不會透露這個 email 有沒有對應的帳號
    forgotPassword: (email: string) => client.authControllerForgotPassword({ email }),
    resetPassword: (token: string, password: string) => client.authControllerResetPassword({ token, password }),
  };
}
