const db = require('../connection/connection');

module.exports = async (req, res, next) => {
  const conn = await db.pool.getConnection();
  for(const product of req.body.products){
    const orders =  await conn.query(`SELECT quantity FROM order_product WHERE product_id = ${product.id} AND((STR_TO_DATE('${product.startDate}', '%Y-%m-%d') BETWEEN date_start AND date_end) OR (STR_TO_DATE('${product.endDate}', '%Y-%m-%d') BETWEEN date_start AND date_end) OR (date_start BETWEEN STR_TO_DATE('${product.startDate}', '%Y-%m-%d') AND STR_TO_DATE('${product.endDate}', '%Y-%m-%d')) OR (date_end BETWEEN STR_TO_DATE('${product.startDate}', '%Y-%m-%d') AND STR_TO_DATE('${product.endDate}', '%Y-%m-%d')))`);


      let totalOrdersQuantity = 0;

      for(let item of orders){
          totalOrdersQuantity += item.quantity;
      }
      const findProduct = await conn.query(`SELECT name,total_quantity FROM product WHERE product_id = '${product.id}'`);
      const totalProductQuantity = findProduct[0].total_quantity; //20
      let diff = totalProductQuantity - totalOrdersQuantity;

      if(diff - product.quantity < 0){
          return res.status(400).json({
              message: `${findProduct[0].name} Menge nicht mehr verfügbar, Anzahl auf Lager: ${diff}`
          })
      }
  }
  next();
}