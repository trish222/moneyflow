import { AuthService } from "../services/authService.js";
export const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            error: "unauthorized",
            message: "Missing or invalid authorization header",
        });
    }
    const token = authHeader.substring(7);
    const payload = AuthService.verifyAccessToken(token);
    if (!payload) {
        return res.status(401).json({
            error: "invalid_token",
            message: "Invalid or expired access token",
        });
    }
    req.userId = payload.userId;
    req.userEmail = payload.email;
    next();
};
//# sourceMappingURL=auth.js.map