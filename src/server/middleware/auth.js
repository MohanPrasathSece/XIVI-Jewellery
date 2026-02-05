import { supabase } from "../lib/supabase.js";

/**
 * Middleware to verify Supabase Admin Session
 * This ensures only logged-in admins can access sensitive API routes.
 */
export const adminAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({ error: "No authorization header provided." });
        }

        const token = authHeader.replace("Bearer ", "");

        if (!token) {
            return res.status(401).json({ error: "Access token is missing." });
        }

        if (!supabase) {
            return res.status(503).json({ error: "Supabase service unavailable." });
        }

        // Verify token with Supabase
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            return res.status(403).json({ error: "Invalid or expired security token. Access denied." });
        }

        // Strict Security Check: Ensure the user is the designated owner
        const ownerEmail = process.env.OWNER_EMAIL || "hello@xivi.in";
        if (user.email !== ownerEmail) {
            console.warn(`Unauthorized access attempt by: ${user.email}`);
            return res.status(403).json({ error: "Unauthorized. You do not have admin privileges." });
        }

        req.user = user;
        next();
    } catch (err) {
        console.error("Auth Middleware Error:", err);
        res.status(500).json({ error: "Internal security verification error." });
    }
};
