import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser, UserRole, SystemModule, AccessLevel } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "farm-manager-pro-secret-key",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7, // One week
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      const user = await storage.getUserByUsername(username);
      if (!user || !(await comparePasswords(password, user.password))) {
        return done(null, false);
      } else {
        return done(null, user);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    const user = await storage.getUser(id);
    done(null, user);
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const user = await storage.createUser({
        ...req.body,
        password: await hashPassword(req.body.password),
      });

      // Don't send password in response
      const { password, ...userWithoutPassword } = user;

      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: "Invalid username or password" });

      req.login(user, (err) => {
        if (err) return next(err);
        
        // Don't send password in response
        const { password, ...userWithoutPassword } = user;
        res.status(200).json(userWithoutPassword);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    // Don't send password in response
    const { password, ...userWithoutPassword } = req.user;
    res.json(userWithoutPassword);
  });
  
  // Middleware to check role authorization
  const checkRole = (roles: UserRole[]) => {
    return (req: Express.Request, res: Express.Response, next: Express.NextFunction) => {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      if (!roles.includes(req.user.role as UserRole)) {
        return res.status(403).json({ message: "Not authorized - insufficient role" });
      }
      
      next();
    };
  };
  
  // Middleware to check module access permission
  const checkModuleAccess = (module: SystemModule, requiredLevel: AccessLevel) => {
    return async (req: Express.Request, res: Express.Response, next: Express.NextFunction) => {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // Super admin tem acesso a tudo
      if (req.user.role === UserRole.SUPER_ADMIN) {
        return next();
      }
      
      // Verificar se a requisição tem um parâmetro farmId
      const farmId = parseInt(req.params.farmId, 10) || parseInt(req.body.farmId, 10);
      
      if (!farmId) {
        return res.status(400).json({ message: "Farm ID is required" });
      }
      
      // Verificar se o usuário é admin da fazenda específica
      const farm = await storage.getFarm(farmId);
      if (req.user.role === UserRole.FARM_ADMIN && farm?.adminId === req.user.id) {
        return next();
      }
      
      // Verificar permissões específicas do módulo
      const hasAccess = await storage.checkUserAccess(req.user.id, farmId, module, requiredLevel);
      
      if (!hasAccess) {
        return res.status(403).json({ message: "Not authorized - insufficient module permissions" });
      }
      
      next();
    };
  };
  
  // Export middleware for access checks
  app.locals.checkRole = checkRole;
  app.locals.checkModuleAccess = checkModuleAccess;
}
