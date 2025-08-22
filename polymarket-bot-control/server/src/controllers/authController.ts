import jwt from 'jsonwebtoken';
import * as bcrypt from 'bcryptjs';
import { ObjectId, Db, Collection } from 'mongodb';
import { Request, Response } from 'express';
import { User, JWTPayload, AuthRequest } from '../types';

class AuthController {
  private db: Db | null = null;

  setDatabase(db: Db): void {
    this.db = db;
  }

  private getUsersCollection(): Collection<User> {
    if (!this.db) {
      throw new Error('Database not connected');
    }
    return this.db.collection<User>(process.env.USERS_COLLECTION || 'users');
  }

  async login(req: Request, res: Response): Promise<Response> {
    try {
      if (!this.db) {
        return res.status(500).json({ error: 'Database not connected' });
      }

      const { username, password }: { username?: string; password?: string } = req.body;

      if (!username || !password) {
        return res.status(400).json({ 
          error: 'Username and password are required' 
        });
      }

      const usersCollection = this.getUsersCollection();
      const user = await usersCollection.findOne({ username });
      
      if (!user) {
        return res.status(401).json({ 
          error: 'Invalid credentials' 
        });
      }

      if (!user.active) {
        return res.status(401).json({ 
          error: 'Account is disabled' 
        });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ 
          error: 'Invalid credentials' 
        });
      }

      const jwtPayload: JWTPayload = {
        userId: user._id.toString(),
        username: user.username
      };

      const token = jwt.sign(
        jwtPayload,
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
      );

      return res.json({
        user: {
          id: user._id.toString(),
          username: user.username
        },
        token
      });

    } catch (error: any) {
      console.error('Error in login:', error);
      return res.status(500).json({ 
        error: 'Internal server error',
        message: error.message 
      });
    }
  }

  async verify(req: Request, res: Response): Promise<Response> {
    try {
      if (!this.db) {
        return res.status(500).json({ error: 'Database not connected' });
      }

      const token = req.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        return res.status(401).json({ 
          error: 'No token provided' 
        });
      }

      let decoded: JWTPayload;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as JWTPayload;
      } catch (jwtError: any) {
        if (jwtError.name === 'JsonWebTokenError' || jwtError.name === 'TokenExpiredError') {
          return res.status(401).json({ 
            error: 'Invalid or expired token' 
          });
        }
        throw jwtError;
      }

      const usersCollection = this.getUsersCollection();
      const user = await usersCollection.findOne({ _id: new ObjectId(decoded.userId) });

      if (!user) {
        return res.status(401).json({ 
          error: 'Invalid token' 
        });
      }

      if (!user.active) {
        return res.status(401).json({ 
          error: 'Account is disabled' 
        });
      }

      return res.json({
        user: {
          id: user._id.toString(),
          username: user.username
        }
      });

    } catch (error: any) {
      console.error('Error in verify:', error);
      return res.status(500).json({ 
        error: 'Internal server error',
        message: error.message 
      });
    }
  }

  async getProfile(req: AuthRequest, res: Response): Promise<Response> {
    try {
      if (!this.db) {
        return res.status(500).json({ error: 'Database not connected' });
      }

      const userId = req.user.userId;
      const usersCollection = this.getUsersCollection();
      const user = await usersCollection.findOne({ _id: new ObjectId(userId) });

      if (!user) {
        return res.status(404).json({ 
          error: 'User not found' 
        });
      }

      if (!user.active) {
        return res.status(401).json({ 
          error: 'Account is disabled' 
        });
      }

      return res.json({
        user: {
          id: user._id.toString(),
          username: user.username,
          createdAt: user.createdAt,
          active: user.active
        }
      });

    } catch (error: any) {
      console.error('Error in getProfile:', error);
      return res.status(500).json({ 
        error: 'Internal server error',
        message: error.message 
      });
    }
  }
}

export default new AuthController();