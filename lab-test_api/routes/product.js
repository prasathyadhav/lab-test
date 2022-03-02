var express = require('express');
var DatabaseConnector = require('./databaseConnector/dbConf');
var router = express.Router();

router.get('/products',async function(req, res, next) {
  try {
    var dbHandler = new DatabaseConnector().getInstance();
    var resp = {};
    var coreResp = await dbHandler.getProducts(req.query);
    if(coreResp) {
      resp["data"] = coreResp;
      res.json(resp).status(200);
      return;
    }
  } catch (err) {
    console.log(err);
  }
  res.json({message: 'Error'}).status(400);
  return;
});

router.post('/product',async function(req, res, next) {
  var dbHandler = new DatabaseConnector().getInstance();
  try {
    var resp = await dbHandler.createProduct(req.body);
    if(resp) {
      res.json(resp).status(200);
      return;
    }
    res.json({message: 'Error'}).status(400);
    return;
  } catch (err) {
    console.log(err);
  }
  res.json({message: 'Error'}).status(400);
  return;
});

module.exports = router;