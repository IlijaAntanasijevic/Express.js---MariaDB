const productController = require('../controller/products');
const db = require('../connection/connection');

jest.mock('../connection/connection');

describe('Product Controller', () => {
  describe('fetchAll', () => {
    it('should fetch all products without filtering if no keyword is provided', async () => {
    const req = { params: { keyword: '' } };
    const res = { json: jest.fn() };

    const mockConnection = {
      query: jest.fn().mockResolvedValueOnce(),
      release: jest.fn()
    };

    db.pool.getConnection = jest.fn().mockResolvedValueOnce(mockConnection);
    await productController.fetchAll(req, res);

    expect(db.pool.getConnection).toHaveBeenCalledTimes(1);
    expect(mockConnection.query).toHaveBeenCalledWith("SELECT p.*,i.path FROM product p INNER JOIN image i ON p.product_id = i.product_id ");
  });

});

  describe('fetchSingleProduct', () => {
    it('should fetch a single product by ID', async () => {
      const req = { params: { productId: 1 } };
      const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };
      const rows = [{ id: 1, name: 'Product 1' }];
      db.pool.getConnection.mockResolvedValueOnce({
        query: jest.fn().mockResolvedValueOnce(rows),
        release: jest.fn()
      });

      await productController.fetchSingleProduct(req, res);

      expect(res.json).toHaveBeenCalledWith(rows[0]);
    });

  });

  describe('create', () => {
    it('should create a new product successfully with valid input', async () => {
      const req = {
        body: {
          name: 'Test Product',
          details: 'Test details',
          totalQuantity: '10',
          price: '25.99'
        },
        file: { filename: 'test_image.jpg' }
      };
      
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
  
      const mockConnection = {
        beginTransaction: jest.fn(),
        query: jest.fn().mockResolvedValueOnce({ insertId: 1 }),
        commit: jest.fn(),
        release: jest.fn()
      };
  
      db.pool.getConnection = jest.fn().mockResolvedValueOnce(mockConnection);
  
      await productController.create(req, res);
  
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ message: 'Product inserted successfully' });
  
      expect(mockConnection.beginTransaction).toHaveBeenCalledTimes(1);
      expect(mockConnection.commit).toHaveBeenCalledTimes(1);
      expect(mockConnection.release).toHaveBeenCalledTimes(1);
    });
  
    
  });
  

  describe('update', () => {
    it('should update an existing product successfully with valid input', async () => {
      const req = {
        body: {
          id: 1, 
          name: 'Updated Product',
          details: 'Updated details',
          totalQuantity: '15',
          price: '29.99'
        },
        file: { filename: 'updated_image.jpg' }
      };
      

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
  

      const mockConnection = {
        query: jest.fn().mockResolvedValueOnce([{ id: 1 }]), 
        release: jest.fn()
      };
  
      db.pool.getConnection = jest.fn().mockResolvedValueOnce(mockConnection);
  
      await productController.update(req, res);
  
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: 'Product updated successfully' });
  

    });
  
  });
  

  describe('delete', () => {
    it('should delete a product successfully if no linked orders exist', async () => {
  
      const req = { params: { productId: 1 } };
  

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
  
    
      const mockConnection = {
        query: jest.fn().mockImplementation(async (query, params) => {
          // Simulate no linked orders
          if (query.includes('SELECT * FROM order_product')) {
            return [];
          }
          // Simulate successful deletion
          return { affectedRows: 1 };
        }),
        release: jest.fn()
      };
  
      db.pool.getConnection = jest.fn().mockResolvedValueOnce(mockConnection);
  
      await productController.delete(req, res);
  
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ message: 'Successfully deleted' });

    });
  
    it('should delete a product successfully and linked orders if they exist', async () => {
    
      const req = { params: { productId: 1 } };
  

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
  

      const mockConnection = {
        query: jest.fn().mockImplementation(async (query, params) => {
          if (query.includes('SELECT * FROM order_product')) {
            return [{ orderId: 1 }];
          }
          // Simulate successful deletion
          return { affectedRows: 1 };
        }),
        release: jest.fn()
      };
  
      db.pool.getConnection = jest.fn().mockResolvedValueOnce(mockConnection);
  

      await productController.delete(req, res);
  
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ message: 'Successfully deleted' });
    });

  });
  
});
