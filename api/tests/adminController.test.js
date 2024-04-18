const db = require('../connection/connection');
const adminController = require('../controller/admin');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const validationSchemas = require('../validationSchemas');

jest.mock('../connection/connection');
jest.mock('bcrypt');
jest.mock('jsonwebtoken');
jest.mock('../validationSchemas');

describe('Admin controller', () => {
  afterEach(() => {
    jest.clearAllMocks(); 
  });
  describe('getAllAdmins', () => {
    it('should fetch all admins successfully', async () => {
      const req = {};
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const rows = [{ admin_id: 1, email: 'admin1@example.com' }, { admin_id: 2, email: 'admin2@example.com' }];
      const mockConnection = {
        query: jest.fn().mockResolvedValueOnce(rows),
        release: jest.fn()
      };
      db.pool.getConnection.mockResolvedValueOnce(mockConnection);
  
      await adminController.getAllAdmins(req, res);
  
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(rows);
      expect(mockConnection.query).toHaveBeenCalledWith('SELECT admin_id, email FROM admin');
  
    });
  
    it('should return 404 if no admins are found', async () => {
      const req = {};
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const mockConnection = {
        query: jest.fn().mockResolvedValueOnce([]),
        release: jest.fn()
      };
      db.pool.getConnection.mockResolvedValueOnce(mockConnection);
  
      await adminController.getAllAdmins(req, res);
  
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Admins not found' });
      expect(mockConnection.query).toHaveBeenCalledWith('SELECT admin_id, email FROM admin');
  
    });
  
    it('should handle server error', async () => {
      const req = {};
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const mockConnection = {
        query: jest.fn().mockRejectedValueOnce('DB connection error'),
        release: jest.fn()
      };
      db.pool.getConnection.mockResolvedValueOnce(mockConnection);
  
      await adminController.getAllAdmins(req, res);
  
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Server error' });
    
    });
  });
  
  
  describe('register', () => {
    it('should register a new admin successfully', async () => {
      const req = {
        body: {
          email: 'test@example.com',
          password: 'password',
          repeatPassword: 'password'
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const mockValidationResult = { error: null };
      validationSchemas.email.validate.mockReturnValueOnce(mockValidationResult);
      validationSchemas.password.validate.mockReturnValueOnce(mockValidationResult);
      const mockConnection = {
        query: jest.fn().mockResolvedValueOnce([]),
        release: jest.fn()
      };
      db.pool.getConnection.mockResolvedValueOnce(mockConnection);
      bcrypt.hash.mockImplementation((password, salt, callback) => {
        callback(null, 'hashedPassword');
      });
  
      await adminController.register(req, res);
  
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ message: 'Admin registered successfully' });
      expect(bcrypt.hash).toHaveBeenCalledTimes(1);
    });
  });
  
  describe('login', () => {
    it('should log in an admin successfully', async () => {
      const req = {
        body: {
          email: 'admin@example.com',
          password: 'password'
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const mockValidationResult = { error: null };
      validationSchemas.email.validate.mockReturnValueOnce(mockValidationResult);
      validationSchemas.password.validate.mockReturnValueOnce(mockValidationResult);
      const mockAdmin = { admin_id: 1, email: 'admin@example.com', password: 'hashedPassword' };
      const mockConnection = {
        query: jest.fn().mockResolvedValueOnce([mockAdmin]),
        release: jest.fn()
      };
      db.pool.getConnection.mockResolvedValueOnce(mockConnection);
      bcrypt.compare.mockImplementation((password, hashedPassword, callback) => {
        callback(null, true); // Simulating successful password comparison
      });
      jwt.sign.mockReturnValueOnce('token');
  
      await adminController.login(req, res);
  
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Successful',
        token: 'token'
      });
  
    });
  
  });
  
  describe('delete', () => {
    it('should delete an admin successfully', async () => {
      const req = {
        params: {
          adminID: 1
        },
        headers: {
          authorization: 'Bearer fakeToken'
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      jwt.decode.mockReturnValueOnce({ id: 2 }); 
      const mockConnection = {
        query: jest.fn().mockImplementation(query => {
          if (query.includes('SELECT')) {
            return [{ admin_id: 1, email: 'admin@example.com' }];
          } else {
            return { affectedRows: 1 }; // Simulating successful deletion
          }
        }),
        release: jest.fn()
      };
      db.pool.getConnection.mockResolvedValueOnce(mockConnection);
  
      await adminController.delete(req, res);
  
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Admin deleted successfully'
      });
    });
  
  });
  
  
  describe('getCurrentEmail', () => {
    it('should return the current email', async () => {
      const req = {};
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const mockConnection = {
        query: jest.fn().mockResolvedValueOnce([{ email: 'test@example.com' }]),
        release: jest.fn()
      };
      db.pool.getConnection.mockResolvedValueOnce(mockConnection);
  
      await adminController.getCurrentEmail(req, res);
  
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith([{ email: 'test@example.com' }]);
  
    });
  
    it('should return message if no email found', async () => {
      const req = {};
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const mockConnection = {
        query: jest.fn().mockResolvedValueOnce([]),
        release: jest.fn()
      };
      db.pool.getConnection.mockResolvedValueOnce(mockConnection);
  
      await adminController.getCurrentEmail(req, res);
  
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Email not found' });
    });
  
  });
})


