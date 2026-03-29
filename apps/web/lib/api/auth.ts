import { apiRequest } from "./client";

export type AuthUser = {
  id: string;
  email: string;
};

export type AuthCredentials = {
  email: string;
  password: string;
};

export const authApi = {
  register(credentials: AuthCredentials): Promise<AuthUser> {
    return apiRequest<AuthUser>("/auth/register", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
  },

  login(credentials: AuthCredentials): Promise<AuthUser> {
    return apiRequest<AuthUser>("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
  },

  getMe(): Promise<AuthUser> {
    return apiRequest<AuthUser>("/auth/me");
  },

  logout(): Promise<{ success: true }> {
    return apiRequest<{ success: true }>("/auth/logout", {
      method: "POST",
    });
  },
};
