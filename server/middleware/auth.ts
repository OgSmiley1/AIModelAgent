import { Request, Response, NextFunction } from 'express';

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

// Middleware to check if user is authenticated for advanced features
export const requireAdvancedAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (req.user && req.user.accessLevel === 'admin') {
    next();
  } else {
    res.status(403).json({ 
      error: 'Advanced AI access denied',
      message: 'Admin privileges required'
    });
  }
};