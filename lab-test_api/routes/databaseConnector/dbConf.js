const mongoose = require('mongoose');

class DatabaseConnector {

    constructor() {
        this.initConnection()
        this.products = null;
        this.OrderWrite = null;
        this.connectionString = 'mongodb+srv://naanThaan:sollaMudiyaathu@cluster0.v3w7i.mongodb.net/lab-test';
    }

    async initConnection() {
        try {
            await mongoose.connect(this.connectionString);
            const product_collection_name = "products";
            const orders_collection_name = "orders";
            var validateEmail = function(email) {
                var re = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
                return re.test(email)
            };
            const orderSchema = new mongoose.Schema({
                name:{
                    type:'string',
                    required: true,
                    minlength: 2
                },
                phone_number:{
                    type:'string',
                    required: true,
                    minlength: 10,
                    maxlength: 10
                },
                email:{
                    type:'string',
                    trim: true,
                    lowercase: true,
                    required: true,
                    validate: [validateEmail, 'Please fill a valid email address'],
                    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
                },
                product_id:{
                    type:'string',
                    required: true
                },
                quantity:{
                    type:'number',
                    required: true,
                    min: 1
                }
            });
            const productSchema = new mongoose.Schema({
                product_name:{
                    type:'string',
                    required: true,
                    minlength: 2
                },
                mrp:{
                    type:'number',
                    required: true
                },
                selling_price:{
                    type:'number',
                    required: true
                },
                quantity:{
                    type:'number',
                    required: true
                }
            });
            this.products = mongoose.model(product_collection_name, productSchema);
            this.OrderWrite = mongoose.model(orders_collection_name, orderSchema);
        } catch (err) {
            console.log(err);
            process.exit(1);
        }
    }

    async getProducts(searchPrams) {
        try {
            if(this.products) {
                if(Object.keys(searchPrams).length){
                    if("product_name" in searchPrams) {
                        searchPrams["product_name"] = { $regex: searchPrams["product_name"], $options: "i" }
                    }
                    console.log(searchPrams);
                    return await this.products.find(searchPrams).all();
                }
                return await this.products.find().all();
            }
            return false
        } catch (err) {
            console.log(err);
            return false
        }
    }

    async getOrders(searchPrams) {
        try {
            if(this.OrderWrite) {
                if(Object.keys(searchPrams).length){
                    return await this.OrderWrite.find(searchPrams).all();
                }
                return await this.OrderWrite.find().all();
            }
            return false
        } catch (err) {
            console.log(err);
            return false
        }
    }

    async checkIfProductInStock(product_id,requiredQuantity) {
        try {
            if(this.products) {
                var resp = await this.products.findOne({_id:product_id});
                console.log(resp["quantity"],requiredQuantity);
                if(resp["quantity"]){
                    if(resp["quantity"] > requiredQuantity) {
                        return true
                    }
                }
            }
            return false
        } catch (err) {
            console.log(err);
            return false
        }
    }

    async placeOrder(jsonData) {
        try {
            var order = new this.OrderWrite(jsonData);
            var localThis = this;
            var prom = new Promise(async function(res,rej){
                if(await localThis.checkIfProductInStock(jsonData["product_id"],jsonData["quantity"])) {
                    order.save(async function (err, doc) {
                        if(err){
                            console.log(err);
                            rej(err)
                            return;
                        }
                        const filter = { _id: jsonData["product_id"] };
                        const update = { $inc: {quantity: -jsonData["quantity"] }};
                        let doc1 = await localThis.products.findOneAndUpdate(filter, update);
                        console.log(doc1);
                        res(doc);
                        return
                    });
                } else {
                    res({message:"No Enough Stock. please reduce the quantity"});
                }
            });
            var result = await prom;
            return result
        } catch (err) {
            console.log(err)
            return null
        }
    }

    async createProduct(jsonData) {
        try {
            var product = new this.products(jsonData);
            var prom = new Promise(function(res,rej){
                product.save(function (err, doc) {
                    if(err){
                        console.log(err);
                        rej(err)
                        return;
                    }
                    res(doc);
                    return
                });
            });
            var result = await prom;
            return result
        } catch (err) {
            console.log(err)
            return null
        }
    }
}

class DatabaseConnectorInstance {

    constructor() {
        if (!DatabaseConnectorInstance.instance) {
            DatabaseConnectorInstance.instance = new DatabaseConnector();
        }
    }

    getInstance() {
        return DatabaseConnectorInstance.instance;
    }

}

module.exports = DatabaseConnectorInstance;