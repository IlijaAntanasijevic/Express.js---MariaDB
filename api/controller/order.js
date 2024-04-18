const db = require("../connection/connection");
const nodeMailer = require('nodemailer');

const validationSchemas = require('../validationSchemas');


// Check product availability before placing an order
exports.check = async (req, res) => {
    try {
        
        if(isNaN(req.body.id)){
            return res.status(500).json({
                message: "Server error"
            })
        }

        const userQuantity = req.body.quantity;

        const conn = await db.pool.getConnection();
        // Find product
        const product = await conn.query(`SELECT total_quantity FROM product WHERE product_id = ?`,[req.body.id]);
        if(product.length === 0){
            return res.status(404).json({
                message: "Product not found"
            })
        }
        const totalProductQuantity = product[0].total_quantity; 
        
        // If the requested quantity exceeds available quantity return message with available quantity
        if(userQuantity > totalProductQuantity){
            await conn.release();
            return res.status(400).json({
                message: `Menge nicht verfügbar, Anzahl auf Lager: ${totalProductQuantity}` 
            })
        }
        else {
            await conn.release();
            return res.status(200).json({
                message: `Successfully`
            })
        }
    }
    catch (err){
        console.log("Catch error: " + err);
        await conn.release();
        res.status(500).json({
            message: "Server error"
        });
    }
}

// Create a new order
exports.create = async (req, res) => {
    try {
        // Extract order information from the request body
        const orderObject = {
            name: req.body.name,
            last_name: req.body.lastName,
            phone: req.body.phone,
            email: req.body.email,
            address: req.body.address,
            firma: req.body.firma,
        }

        //Validate order informations
        
        let {error:userError} = validationSchemas.userDetails.validate(orderObject);
        let {error:priceError} = validationSchemas.price.validate(req.body.totalPrice);

        if(userError){
            return res.status(400).json({
                message: userError.message
            })
        }

        if(priceError){
            return res.status(400).json({
                message: priceError.message
            })
        }

        const orderedProducts = req.body.products;
        if(orderedProducts.length === 0){
            return res.status(400).json({
                message: "Products not found"
            })
        }
        const totalPrice = req.body.totalPrice;

        const conn = await db.pool.getConnection(); 

        await conn.beginTransaction();

        try {
            // Insert order information into the database
            const insertOrderQuery = await conn.query(`INSERT INTO orders (first_name, last_name, phone, email, address, firma) VALUES (?,?,?,?,?,?)`,[orderObject.name,orderObject.last_name,orderObject.phone,orderObject.email,orderObject.address,orderObject.firma]);
            const orderInsertedID = insertOrderQuery.insertId;

            // Insert ordered products into the database
            for(let product of orderedProducts){
               await conn.query (`INSERT INTO order_product (order_id, product_id, quantity, date_start, date_end) VALUES (?,?,?,?,?)`,[orderInsertedID, product.id, product.quantity, product.startDate, product.endDate]);
            }
    
            // Retrieve product details for the ordered products
            const productIDs = orderedProducts.map(product => product.id);
            const placeholders = productIDs.map(() => '?').join(',');
            const products = await conn.query(`SELECT name,product_id FROM product WHERE product_id IN (${placeholders})`,productIDs);

            // Combine product details with order details for email
            const combinedProducts = orderedProducts.map(productData => {
                const productFromDB = products.find(product => product.product_id == productData.id);
                return {
                    name: productFromDB.name,
                    quantity: productData.quantity,
                    startDate: productData.startDate,
                    endDate: productData.endDate
                };
            });

            // Retrieve email address for sending confirmation email
            const emailToSend = await conn.query('SELECT email FROM email ORDER BY created_at DESC LIMIT 1');

            await conn.commit();
            await conn.release();

            // Prepare email content
            let firma = orderObject.firma != null ? orderObject.firma : "/";
            let mailText = `<h1>Benutzer Informationen:</h1>               
                                    <h3>Name: ${orderObject.name} ${orderObject.last_name}</h3>
                                    <h3>Telefonnummer: ${orderObject.phone}</h3>
                                    <h3>Addresse: ${orderObject.address}</h3>
                                    <h3>Email: ${orderObject.email}</h3>
                                    <h3>Firma: ${firma}</h3><br>`;

            let productsString = '<h1>Produkte:</h1><table style="width: 100%; font-size: 16px; text-align: center">';
            // Construct product table in email content
            for(let product of combinedProducts){
                productsString += ` <tr>
                                    <th>Name</th>
                                    <th>Anzahl</th>
                                    <th>Start Datum</th>
                                    <th>End Datum</th>
                                    <th>Totalpreis</th>
                                  </tr>
                                   <tr>
                                    <td>${product.name}</td>
                                    <td>${product.quantity}</td>
                                    <td>${product.startDate}</td>
                                    <td>${product.endDate}</td>
                                    <td>${totalPrice} CHF</td>
                                   </tr>`
            }
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



