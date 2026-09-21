import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
const JWT_SECRET = process.env.JWT_SECRET || "default-secret-key";
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || "default-refresh-secret";
export class AuthService {
    static async hashPassword(password) {
        return bcrypt.hash(password, 10);
    }
    static async comparePasswords(password, hash) {
        return bcrypt.compare(password, hash);
    }
    static generateTokens(userId, email) {
        const payload = { userId, email };
        const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: "15m" });
        const refreshToken = jwt.sign(payload, REFRESH_TOKEN_SECRET, { expiresIn: "7d" });
        return { accessToken, refreshToken };
    }
    static verifyAccessToken(token) {
        try {
            return jwt.verify(token, JWT_SECRET);
        }
        catch {
            return null;
        }
    }
    static verifyRefreshToken(token) {
        try {
            return jwt.verify(token, REFRESH_TOKEN_SECRET);
        }
        catch {
            return null;
        }
    }
    static validatePasswordStrength(password) {
        const errors = [];
        if (password.length < 8)
            errors.push("Password must be at least 8 characters");
        if (!/[A-Z]/.test(password))
            errors.push("Password must contain an uppercase letter");
        if (!/[a-z]/.test(password))
            errors.push("Password must contain a lowercase letter");
        if (!/[0-9]/.test(password))
            errors.push("Password must contain a number");
        if (!/[!@#$%^&*]/.test(password))
            errors.push("Password must contain a special character (!@#$%^&*)");
        return { valid: errors.length === 0, errors };
    }
}
//# sourceMappingURL=authService.js.map