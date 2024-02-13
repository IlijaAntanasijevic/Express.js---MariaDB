const db = require("../connection/connection");
//---------------DEBUGGING--------------------//
exports.check = async (req, res) => {
    try {
        const conn = await db.pool.getConnection();
        //startDate = 2024-01-25
        //endDate = 2024-01-27

        //DbStartDate = 2024-01-25 >= 2024-01-27
        //DbEndDate = 2024-01-27 <= 2024-01-25
        //Ovaj query je zajeban :D
        const orders = await conn.query(`SELECT quantity FROM order_product WHERE product_id = ${req.params.id} AND((STR_TO_DATE('${req.params.startDate}', '%Y-%m-%d') BETWEEN date_start AND date_end) OR (STR_TO_DATE('${req.params.endDate}', '%Y-%m-%d') BETWEEN date_start AND date_end) OR (date_start BETWEEN STR_TO_DATE('${req.params.startDate}', '%Y-%m-%d') AND STR_TO_DATE('${req.params.endDate}', '%Y-%m-%d')) OR (date_end BETWEEN STR_TO_DATE('${req.params.startDate}', '%Y-%m-%d') AND STR_TO_DATE('${req.params.endDate}', '%Y-%m-%d')))`);


        let totalOrdersQuantity = 0;

        for(let item of orders){
            totalOrdersQuantity += item.quantity;
        }
        const product = await conn.query(`SELECT total_quantity FROM product WHERE product_id = '${req.params.id}'`);
        const totalProductQuantity = product[0].total_quantity; //20
        let diff = totalProductQuantity - totalOrdersQuantity;

        if(diff - req.params.quantity < 0){
            return res.status(404).json({
                message: `out of stock, available: ${diff}`
            })
        }
        else {
            return res.status(200).json({
                message: `Successfully`
            })
        }
    }
    catch (err){
        console.log("Catch error: " + err);
        res.status(500).json({
            message: err
        });
    }
}


//---------------***DEBUGGING***-----------------//
exports.create = async (req, res) => {

    try {
        const orderObject = {
            name: req.body.name,
            last_name: req.body.lastName,
            phone: req.body.phone,
            email: req.body.email,
            address: req.body.address,
        }

        const orderedProducts = req.body.products; // object array


        const conn = await db.pool.getConnection();
        await conn.beginTransaction();



        try {

            const insertOrderQuery = await conn.query(`INSERT INTO orders (first_name, last_name, phone, email, address) VALUES ('${orderObject.name}','${orderObject.last_name}','${orderObject.phone}','${orderObject.email}','${orderObject.address}')`);

            //const insertOrderValues = [orderObject.name, orderObject.last_name, orderObject.phone, orderObject.email, orderObject.address];
            //const insertOrder = await conn.query(insertOrderQuery);

            const orderInsertedID = insertOrderQuery.insertId;


            for(let product of orderedProducts){
                await conn.query (`INSERT INTO order_product (order_id, product_id, quantity, date_start, date_end) VALUES (${orderInsertedID},${product.id},${product.quantity},'${product.startDate}','${product.endDate}')`);

            }

            //const insertProductsQuery = `INSERT INTO order_product (order_id, product_id, quantity, date_start, date_end) VALUES (?, ?, ?, ?, ?)`;
            //await conn.batch(insertProductsQuery, [productValues]);

            await conn.commit();
            await conn.release();

            res.status(201).json({
                message: "Order products inserted successfully"
            })
        }
        catch (error){
            await conn.rollback();
            console.log("Transaction error: " + error);
            res.status(500).json({
               // message: error
                message: "Server error"

            });
        }

    }
    catch (err){
        console.log("Catch error: " + err);
        res.status(500).json({
            //message: err
            message: "Server error"
        });
    }
}