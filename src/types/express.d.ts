/**
 * Request augmentation used by the auth middleware chain.
 *
 * `userId` is set by verifyJWT (from the JWT `sub` claim) and `user` is set by
 * loadUser, which re-reads the document from MongoDB. Role and isBlocked are
 * never taken from the token payload or the request body.
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
