export type LoginRequest = {
    username: string;
    password: string;
  };
  
export type AuthTokens = {
    accessToken: string;
    refreshToken: string;
    tokenType: string; // "Bearer"
    expiresInSeconds: number;
    refreshExpiresInSeconds: number;
  };

export type MeResponse = {
  username: string;
  authorities: string[];
};
  
