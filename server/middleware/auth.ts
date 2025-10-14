import { Request, Response, NextFunction } from 'express';
import { verifyAA } from '../auth/token';

export interface AuthenticatedRequest extends Request {
  user?: {
    username: string;
    accessLevel: 'admin' | 'user';
  };
}

// Secure authentication for advanced AI access
export const authenticateAdvancedAI = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const { username, password } = req.body;
  
  // Validate credentials for advanced AI access
  if (username === 'Smiley' && password === 'Smiley@123jz') {
    req.user = {
      username: 'Smiley',
      accessLevel: 'admin'
    };
    next();
  } else {
    res.status(401).json({ 
      error: 'Unauthorized access to advanced AI system',
      message: 'Invalid credentials'
    });
  }
};

// Middleware to check if user is authenticated for advanced features using JWT
export const requireAdvancedAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const bearer = req.headers.authorization?.startsWith("Bearer ")
    ? req.headers.authorization.slice(7)
    : undefined;
  const token = req.cookies?.aauth || bearer;
  const claims = verifyAA(token);
  
  if (!claims || claims.scope !== "advanced-ai") {
    return res.status(403).json({ 
      error: 'Advanced AI access denied',
      message: 'Admin privileges required'
    });
  }
  
  req.user = {
    username: claims.sub,
    accessLevel: 'admin'
  };
  next();
};