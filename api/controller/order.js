const db = require("../connection/connection");
const nodeMailer = require('nodemailer');

const validationSchemas = require('../validationSchemas');


// Check product availability before placing an order
exports.check = async (req, res) => {
    try {
        const conn = await db.pool.getConnection();
        //startDate = 2024-01-25
        //endDate = 2024-01-27

        //DbStartDate = 2024-01-25 >= 2024-01-27
        //DbEndDate = 2024-01-27 <= 2024-01-25
   
        console.log(req.body);
        
        const orders = await conn.query(`SELECT quantity FROM order_product WHERE product_id = ${req.body.id} AND ((STR_TO_DATE('${req.body.startDate}', '%Y-%m-%d') BETWEEN date_start AND date_end) OR (STR_TO_DATE('${req.body.endDate}', '%Y-%m-%d') BETWEEN date_start AND date_end) OR (date_start BETWEEN STR_TO_DATE('${req.params.startDate}', '%Y-%m-%d') AND STR_TO_DATE('${req.body.endDate}', '%Y-%m-%d')) OR (date_end BETWEEN STR_TO_DATE('${req.body.startDate}', '%Y-%m-%d') AND STR_TO_DATE('${req.body.endDate}', '%Y-%m-%d')))`);


        let totalOrdersQuantity = 0;

        for(let item of orders){
            totalOrdersQuantity += item.quantity;
        }
        const product = await conn.query(`SELECT total_quantity FROM product WHERE product_id = '${req.body.id}'`);
        const totalProductQuantity = product[0].total_quantity;
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

// Create a new order
exports.create = async (req, res) => {
    try {

        // ************* Extract order information from the request body ************* //
        // const orderObject = {
        //     name: req.body.name,
        //     last_name: req.body.lastName,
        //     phone: req.body.phone,
        //     email: req.body.email,
        //     address: req.body.address,
        //     firma: req.body.firma,
        // }

        const { phone, email, quantity, startDate, endDate } = req.body;

       
        const formatDate = (dateString) => {
            const date = new Date(dateString);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0'); 
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };
        
        const orderObject = {
            phone: phone.trim(),  
            email: email.toLowerCase().trim(),  
            quantity: parseInt(quantity, 10), 
            startDate: formatDate(startDate),  
            endDate: formatDate(endDate)  
        };

        const product = req.body.product;

        console.log(orderObject);
        
        
        

        // ************* Validate order informations ************* //
        
        // let {error:userError} = validationSchemas.userDetails.validate(orderObject);
        // let {error:priceError} = validationSchemas.price.validate(req.body.totalPrice);

        // if(userError){
        //     return res.status(400).json({
        //         message: userError.message
        //     })
        // }

        // if(priceError){
        //     return res.status(400).json({
        //         message: priceError.message
        //     })
        // }

        
        // if(orderedProducts.length === 0){
        //     return res.status(400).json({
        //         message: "Products not found"
        //     })
        // }
                
        //const totalPrice = req.body.totalPrice;

        const conn = await db.pool.getConnection(); 

        await conn.beginTransaction();

        try {
            // ************* Insert order information into the database ************* //
            const insertOrderQuery = await conn.query(`INSERT INTO orders (first_name, last_name, phone, email, address, firma) VALUES (?,?,?,?,?,?)`,[orderObject.name,orderObject.last_name,orderObject.phone,orderObject.email,orderObject.address,orderObject.firma]);
            const orderInsertedID = insertOrderQuery.insertId;

            // ************* Insert ordered products into the database ************* //
            // for(let product of orderedProducts){
            //    await conn.query (`INSERT INTO order_product (order_id, product_id, quantity, date_start, date_end) VALUES (?,?,?,?,?)`,[orderInsertedID, product.id, product.quantity, product.startDate, product.endDate]);
            // }

            await conn.query (`INSERT INTO order_product (order_id, product_id, quantity, date_start, date_end) VALUES (?,?,?,?,?)`,[orderInsertedID, product.id, orderObject.quantity, orderObject.startDate, orderObject.endDate]);

    
            // ************* Retrieve product details for the ordered products ************* //

            // const productIDs = orderedProducts.map(product => product.id);
            // const placeholders = productIDs.map(() => '?').join(',');
            // const products = await conn.query(`SELECT name,product_id FROM product WHERE product_id IN (${placeholders})`,productIDs);

            // ************* Combine product details with order details for email ************* //

            // const combinedProducts = orderedProducts.map(productData => {
            //     const productFromDB = products.find(product => product.product_id == productData.id);
            //     return {
            //         name: productFromDB.name,
            //         quantity: productData.quantity,
            //         startDate: productData.startDate,
            //         endDate: productData.endDate
            //     };
            // });

            // Retrieve email address for sending confirmation email
            const emailToSend = await conn.query('SELECT email FROM email ORDER BY created_at DESC LIMIT 1');

            await conn.commit();
            await conn.release();

            // Prepare email content
            //let firma = orderObject.firma != null ? orderObject.firma : "/";
            // let mailText = `<h1>Benutzer Informationen:</h1>               
            //                         <h3>Name: ${orderObject.name} ${orderObject.last_name}</h3>
            //                         <h3>Telefonnummer: ${orderObject.phone}</h3>
            //                         <h3>Addresse: ${orderObject.address}</h3>
            //                         <h3>Email: ${orderObject.email}</h3>
            //                         <h3>Firma: ${firma}</h3><br>`;

            let mailText = `<h1>Benutzer Informationen:</h1>               
                                    <h3>Telefonnummer: ${orderObject.phone}</h3>
                                    <h3>Email: ${orderObject.email}</h3><br>`;

            let productsString = '<h1>Produkte:</h1><table style="width: 100%; font-size: 16px; text-align: center">';
            // Construct product table in email content
            // for(let product of combinedProducts){
            //     productsString += ` <tr>
            //                         <th>Name</th>
            //                         <th>Anzahl</th>
            //                         <th>Start Datum</th>
            //                         <th>End Datum</th>
            //                         <th>Totalpreis</th>
            //                       </tr>
            //                        <tr>
            //                         <td>${product.name}</td>
            //                         <td>${product.quantity}</td>
            //                         <td>${product.startDate}</td>
            //                         <td>${product.endDate}</td>
            //                         <td>${totalPrice} CHF</td>
            //                        </tr>`
            // }
                productsString += ` <tr>
                                    <th>Name</th>
                                    <th>Anzahl</th>
                                    <th>Start Datum</th>
                                    <th>End Datum</th>
                                  </tr>
                                   <tr>
                                    <td>${product.name}</td>
                                    <td>${orderObject.quantity}</td>
                                    <td>${orderObject.startDate}</td>
                                    <td>${orderObject.endDate}</td>
                                   </tr>`
            
            productsString += '</table>';
            mailText += productsString;

            // Create email transporter
            const transporter = nodeMailer.createTransport({
                service: "Gmail",
                auth: {
                    user: process.env.DEFAULT_EMAIL,
                    pass: process.env.PASSWORD
                }
            });

            // Send confirmation emails to admin and customer
            await transporter.sendMail({
                from: 'Order<andrejcpoag@gmail.com>',
                to: emailToSend[0].email,
                subject: "NEUE Anfrage" ,
                html: mailText
            })
            await transporter.sendMail({
                from: 'Order<andrejcpoag@gmail.com>',
                to: orderObject.email,
                subject: "Anfrage bei CPO AG",
                html: mailText 
            })

            res.status(201).json({
                message: "Order products inserted successfully"
            })
        }
        catch (error){
            // Rollback transaction and return server error if an unexpected error occurs
            await conn.rollback();
            console.log(error);
            res.status(500).json({
                message: "Server error"
            });
        }
    }
    catch (err){
        console.log("Catch error: " + err);
        res.status(500).json({
            message: "Server error"
        });
    }
}



