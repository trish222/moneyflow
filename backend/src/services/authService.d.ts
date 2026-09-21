export interface TokenPayload {
    userId: number;
    email: string;
}
export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
}
export declare class AuthService {
    static hashPassword(password: string): Promise<string>;
    static comparePasswords(password: string, hash: string): Promise<boolean>;
    static generateTokens(userId: number, email: string): AuthTokens;
    static verifyAccessToken(token: string): TokenPayload | null;
    static verifyRefreshToken(token: string): TokenPayload | null;
    static validatePasswordStrength(password: string): {
        valid: boolean;
        errors: string[];
    };
}
//# sourceMappingURL=authService.d.ts.map