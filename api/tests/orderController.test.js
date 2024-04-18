
const orderController = require('../controller/order');
const db = require('../connection/connection'); 
const nodemailer = require('nodemailer');

jest.mock('../connection/connection');
jest.mock('nodemailer');

describe('Order Controller', () => {
  afterEach(() => {
    jest.clearAllMocks(); 
  });


  describe('create', () => {
    it('should create a new order successfully', async () => {
      const req = {
        body: {
          name: 'John',
          last_name: 'Doe',
          phone: '59875472',
          email: 'john@example.com',
          address: 'City',
          firma: '',
          products: [{ id: 20, quantity: 2, startDate: '2024-04-20', endDate: '2024-04-25' }],
          totalPrice: 100
        }
      };
  
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
  
      db.pool.getConnection.mockResolvedValueOnce({
        query: jest.fn().mockResolvedValueOnce({ insertId: 20 }),
        beginTransaction: jest.fn(),
        commit: jest.fn(),
        release: jest.fn()
      });
  
      nodemailer.createTransport.mockReturnValueOnce({
        sendMail: jest.fn().mockResolvedValueOnce({})
      });
  
      await orderController.create(req, res);
  
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ message: 'Order products inserted successfully' });
    });
  
    it('should return 400 if validation fails', async () => {
      const req = {
        body: {
          name: 'John',
          lastName: 'Doe',
          phone: '123456789', 
          email: 'invalid_email', 
          address: '123 Street, City',
          firma: 'ABC Inc.',
          products: [],
          totalPrice: 100
        }
      };
  
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
  
      await orderController.create(req, res);
  
  
      expect(res.status).toHaveBeenCalledWith(400);
    });

  
  });

});

