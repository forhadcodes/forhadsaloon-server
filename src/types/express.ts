/**
 * Request augmentation used by the auth middleware chain.
 *
 * `userId` is set by verifyJWT (from the JWT `sub` claim) and `user` is set by
 * loadUser, which re-reads the document from MongoDB. Role and isBlocked are
 * never taken from the token payload or the request body.
 *
 * NOTE: this is a `.ts` file (not `.d.ts`) on purpose. Vercel's build drops
 * unreferenced declaration files, which made `req.user` / `req.userId` fail to
 * type-check in production. app.ts imports this module for its side effects so
 * the augmentation is always part of the compilation.
 */
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      user?: {
        id: string;
        role: "admin" | "customer";
        name: string;
        email: string;
      };
    }
  }
}

export {};
