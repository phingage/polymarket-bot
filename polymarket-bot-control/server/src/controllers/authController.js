const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { ObjectId } = require('mongodb');

class AuthController {
  constructor() {
    this.db = null;
  }

  setDatabase(db) {
    this.db = db;
  }

  async login(req, res) {
    try {
      if (!this.db) {
        return res.status(500).json({ error: 'Database not connected' });
      }

      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ 
          error: 'Username and password are required' 
        });
      }

      const usersCollection = this.db.collection(process.env.USERS_COLLECTION || 'users');
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

      const token = jwt.sign(
        { userId: user._id.toString(), username: user.username },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
      );

      res.json({
        user: {
          id: user._id.toString(),
          username: user.username
        },
        token
      });

    } catch (error) {
      console.error('Error in login:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        message: error.message 
      });
    }
  }

  async verify(req, res) {
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

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      const usersCollection = this.db.collection(process.env.USERS_COLLECTION || 'users');
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

      res.json({
        user: {
          id: user._id.toString(),
          username: user.username
        }
      });

    } catch (error) {
      console.error('Error in verify:', error);
      
      if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          error: 'Invalid or expired token' 
        });
      }

      res.status(500).json({ 
        error: 'Internal server error',
        message: error.message 
      });
    }
  }

  async getProfile(req, res) {
    try {
      if (!this.db) {
        return res.status(500).json({ error: 'Database not connected' });
      }

      const userId = req.user.userId;
      const usersCollection = this.db.collection(process.env.USERS_COLLECTION || 'users');
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

      res.json({
        user: {
          id: user._id.toString(),
          username: user.username,
          createdAt: user.createdAt,
          active: user.active
        }
      });

    } catch (error) {
      console.error('Error in getProfile:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        message: error.message 
      });
    }
  }
}

module.exports = new AuthController();