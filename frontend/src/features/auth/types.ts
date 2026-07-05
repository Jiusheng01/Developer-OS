export type AuthUser = {
  id: string;
  email: string;
  username: string;
  displayName: string;
  createdAt: string;
  updatedAt: string;
};

export type AuthToken = {
  accessToken: string;
  tokenType: "bearer";
  expiresInSeconds: number;
  user: AuthUser;
};

export type AuthLoginInput = {
  identifier: string;
  password: string;
};

export type AuthRegisterInput = {
  email: string;
  username: string;
  password: string;
  displayName?: string;
};

export type RegistrationStatus = {
  publicRegistrationEnabled: boolean;
};

export type AuthActionResult = { ok: true } | { ok: false; error: string };
