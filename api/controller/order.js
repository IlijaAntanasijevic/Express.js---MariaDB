const db = require("../connection/connection");
const nodeMailer = require('nodemailer');
//---------------DEBUGGING--------------------//
exports.check = async (req, res) => {
    try {
        const conn = await db.pool.getConnection();
        //startDate = 2024-01-25
        //endDate = 2024-01-27

        //DbStartDate = 2024-01-25 >= 2024-01-27
        //DbEndDate = 2024-01-27 <= 2024-01-25
        
        
        //GPT
        const orders = await conn.query(`SELECT quantity FROM order_product WHERE product_id = ${req.body.id} AND ((STR_TO_DATE('${req.body.startDate}', '%Y-%m-%d') BETWEEN date_start AND date_end) OR (STR_TO_DATE('${req.body.endDate}', '%Y-%m-%d') BETWEEN date_start AND date_end) OR (date_start BETWEEN STR_TO_DATE('${req.params.startDate}', '%Y-%m-%d') AND STR_TO_DATE('${req.body.endDate}', '%Y-%m-%d')) OR (date_end BETWEEN STR_TO_DATE('${req.body.startDate}', '%Y-%m-%d') AND STR_TO_DATE('${req.body.endDate}', '%Y-%m-%d')))`);


        let totalOrdersQuantity = 0;

        for(let item of orders){
            totalOrdersQuantity += item.quantity;
        }
        const product = await conn.query(`SELECT total_quantity FROM product WHERE product_id = '${req.body.id}'`);
        const totalProductQuantity = product[0].total_quantity; //20
        let diff = totalProductQuantity - totalOrdersQuantity;
        

        if(diff - req.body.quantity < 0){
            return res.status(400).json({
                message: `Menge nicht verfügbar, Anzahl auf Lager: ${diff}` 
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
                // n + 1 - lazyloading
            }
    


            //const insertProductsQuery = `INSERT INTO order_product (order_id, product_id, quantity, date_start, date_end) VALUES (?, ?, ?, ?, ?)`;
            //await conn.batch(insertProductsQuery, [productValues]);

            const productIDs = orderedProducts.map(product => product.id);
            const products = await conn.query(`SELECT name,product_id FROM product WHERE product_id IN (${productIDs})`);


            const combinedProducts = orderedProducts.map(productData => {
                const productFromDB = products.find(product => product.product_id == productData.id);
                return {
                    name: productFromDB.name,
                    quantity: productData.quantity,
                    startDate: productData.startDate,
                    endDate: productData.endDate
                };
            });
            const emailToSend = await conn.query('SELECT email FROM email ORDER BY created_at DESC LIMIT 1');


            await conn.commit();
            await conn.release();



            let mailText = `<h1>User Information:</h1>               
                                    <h3>Name: ${orderObject.name} ${orderObject.last_name}</h3>
                                    <h3>Phone: ${orderObject.phone}</h3>
                                    <h3>Address: ${orderObject.address}</h3>
                                    <h3>Email: ${orderObject.email}</h3><br>`;

            let productsString = '<h1>Products:</h1><table style="width: 100%; font-size: 16px; text-align: center">';
            for(let product of combinedProducts){
                productsString += ` <tr>
                                    <th>Name</th>
                                    <th>Quantity</th>
                                    <th>Start Date</th>
                                    <th>End Date</th>
                                  </tr>
                                   <tr>
                                    <td>${product.name}</td>
                                    <td>${product.quantity}</td>
                                    <td>${product.startDate}</td>
                                    <td>${product.endDate}</td>
                                   </tr>`
            }
            productsString += '</table>';
            mailText += productsString;


            const transporter = nodeMailer.createTransport({
                service: "Gmail",
                auth: {
                    user: 'ilija0125@gmail.com',
                    pass: 'bmfl gzip gsxj qlye'
                }
            })
            console.log(emailToSend[0].email);
            await transporter.sendMail({
                from: 'Order<ilija0125@gmail.com>',
                to: emailToSend[0].email,
                subject: "NEW ORDER: " + orderInsertedID,
                html: mailText
            })

            res.status(201).json({
                message: "Order products inserted successfully"

            })
        }
        catch (error){
            await conn.rollback();
            console.log(error);
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