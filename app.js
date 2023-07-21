const Oi = require("./utils/oi")
const fs = require("fs");
const Price = new Oi("./database/price.json");
const http = require("http");
const bodyParser = require('./utils/bodyParse')
const Product = new Oi("./database/products.json");
const History = new Oi("./database/stories.json");
const PriceModel = require("./models/price")
const ProductModel = require("./models/Product")
const HistoryModel = require("./models/history")



http
  .createServer(async (req, res) => {
    res.setHeader("Content-Type", "application/json");
    if (req.method === "POST" && req.url === "/products/create") {
      req.body = await bodyParser(req);
      const name = req.body.name;
      const count = req.body.count;
      const buyPrice = req.body.buyPrice;
      const sellPrice = req.body.sellPrice;

      if (!name || !count || !buyPrice || !sellPrice) {
        return res.end(JSON.stringify("Malumotni toliq kiriting"))
      }
      const products = await Product.read()
      const findProduct = products.find((product) => product.name == name)
      if (!findProduct) {
        const id = (products[products.length - 1]?.id || 0) + 1;
        const newProduct = new ProductModel(id, name, +count, buyPrice, sellPrice);
        const data = products.length ? [...products, newProduct] : [newProduct];
        await Product.write(data)
        const stories = await History.read()
        const newHistory = new HistoryModel(name, count, buyPrice, sellPrice, "buy", new Date())
        const history = stories.length ? [...stories, newHistory] : [newHistory];
        await History.write(history)
        const result = await Product.read()

        return res.end(JSON.stringify(result))

      }
      else {
        findProduct.count += +count;
        findProduct.sellPrice = sellPrice;
        findProduct.buyPrice = buyPrice;
        await Product.write(products)
        const stories = await History.read()
        const newHistory = new HistoryModel(name, count, buyPrice, sellPrice, "buy", new Date())
        const history = stories.length ? [...stories, newHistory] : [newHistory];
        await History.write(history)
        const result = await Product.read()

        return res.end(JSON.stringify(result))
      }
    }
    if (req.method === "POST" && req.url === "/products/update") {
      req.body = await bodyParser(req);
      const name = req.body.name;
      const count = req.body.count;
      if (!name || !count) {
        return res.end(JSON.stringify("Malumotni toliq kiriting"))
      }
      const products = await Product.read()
      const findProduct = products.find((product) => product.name == name)
      if (!findProduct) {
        return res.end(JSON.stringify("Bunday maxsulot yoq"))
      }
      else if (findProduct && findProduct.count < count) {
        return res.end(JSON.stringify("Bu maxsulotdan bizda buncha yoq"))
      }

      findProduct.count -= count;
      await Product.write(products)
      const stories = await History.read()
      const newHistory = new HistoryModel(name, count, findProduct.buyPrice, findProduct.sellPrice, "sell", new Date())
      const history = stories.length ? [...stories, newHistory] : [newHistory];
      await History.write(history)
      const prices = await Price.read()
      const findPrice = prices.find((prices) => prices.name === name);
      if (!findPrice) {
        const newPrice = new PriceModel(name, count * (findProduct.sellPrice - findProduct.buyPrice))
        const price = prices.length ? [...prices, newPrice] : [newPrice];
        await Price.write(price)
      }
      else {
        findPrice.benefit += (count * (findProduct.sellPrice - findProduct.buyPrice));
        await Price.write(prices)

      }
      const result = await Product.read()
      return res.end(JSON.stringify(result))

    }
  })
  .listen(4000, "0.0.0.0", (e) => {
    console.log("Started server");
  })
