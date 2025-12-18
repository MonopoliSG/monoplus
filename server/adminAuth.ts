import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

// Admin credentials from environment - REQUIRED for security
const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

if (!ADMIN_USERNAME || !ADMIN_PASSWORD) {
  console.warn("WARNING: ADMIN_USERNAME and ADMIN_PASSWORD environment variables are not set. Admin login will not work.");
}

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 7 days
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    pool: pool,
    createTableIfMissing: true,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET || "monoplus-secret-key-change-in-production",
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: sessionTtl,
    },
  });
}

export async function setupAdminAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // Local strategy for admin login
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      // Check if credentials are configured
      if (!ADMIN_USERNAME || !ADMIN_PASSWORD) {
        return done(null, false, { message: "Admin hesabi yapilandirilmamis" });
      }
      
      if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        const user = {
          id: "admin",
          username: ADMIN_USERNAME,
          firstName: "Admin",
          lastName: "User",
          email: "admin@monoplus.com",
        };
        return done(null, user);
      }
      return done(null, false, { message: "Kullanici adi veya sifre hatali" });
    })
  );

  passport.serializeUser((user: any, cb) => cb(null, user));
  passport.deserializeUser((user: any, cb) => cb(null, user));

  // Login endpoint
  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) {
        return res.status(500).json({ message: "Sunucu hatasi" });
      }
      if (!user) {
        return res.status(401).json({ message: info?.message || "Giris basarisiz" });
      }
      req.logIn(user, (err) => {
        if (err) {
          return res.status(500).json({ message: "Oturum baslatma hatasi" });
        }
        return res.json({ success: true, user });
      });
    })(req, res, next);
  });

  // Logout endpoint
  app.post("/api/logout", (req, res) => {
    req.logout(() => {
      res.json({ success: true });
    });
  });

  // Also support GET for logout (for links)
  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect("/");
    });
  });
}

export const isAuthenticated: RequestHandler = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ message: "Unauthorized" });
};
