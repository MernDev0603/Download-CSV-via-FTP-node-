var axios = require("axios");
const mongoose = require("mongoose");
var fs = require("fs");

// mongoose.connect("mongodb://localhost:27017/shopify", {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// });

// const db = mongoose.connection;
// db.on("error", console.error.bind(console, "connection error: "));
// db.once("open", function () {
//   console.log("Connected successfully");
// });

console.log("=======================");

start();
async function start() {
  var res = await abc();
  return res;
}
var condition = true;

async function abc() {
  var result = await callApi(0);
  console.log(result);
  return result;
}
var allProducts = [];
async function callApi(id = 0) {
  var config = {
    method: "get",
    url: `https://uniformright-com.myshopify.com/admin/api/2022-07/products.json?since_id=${id}&limit=200`,
    headers: {
      Authorization:
        "Basic NjliYTllMjhiNDA5MjMwNGRiNDE0NTk2NGZmNjUyYjQ6c2hwYXRfNGU4ZTczY2ZlNTQ2NDIxNjk0MTYxNzQ5OGQ0ZTFmYTI=",
      Cookie:
        "_secure_admin_session_id=63fb1eff09d92fc149ca2e0471440b36; _secure_admin_session_id_csrf=63fb1eff09d92fc149ca2e0471440b36",
    },
  };

  var products = await axios(config)
    .then(function (response) {
      condition = false;
      return response.data.products;
    })
    .catch(function (error) {
      console.log(error);
    });

  var filter = products.filter((el) => el["tags"].includes("SanMar") == true);
  allProducts = [...allProducts, ...filter];

  var count = products.length;
  if (count > 0) {
    var lastProduct = products[count - 1];
    console.log(count);
    await callApi(lastProduct.id);
  } else {
    var res = readVariants(allProducts);
    return res;
  }
}

async function readVariants() {
  var variants = [];
  allProducts.map((product) => {
    variants = [...variants, ...product["variants"]];
  });
  var res = await getInventoryID(variants);
  return res;
}

async function getInventoryID(allVariants) {
  var pos = 0;
  var inventory = [];
  console.log(allVariants.length);
  var id = 0;
  while (true) {
    var variants = allVariants.slice(pos, pos + 50);
    pos = pos + 50;
    var inventory_id = variants.map((variant) => {
      return variant["inventory_item_id"];
    });
    var config = {
      method: "get",
      url: `https://uniformright-com.myshopify.com/admin/api/2022-07/inventory_levels.json?inventory_item_ids=${inventory_id.toString()}`,
      headers: {
        Authorization:
          "Basic NjliYTllMjhiNDA5MjMwNGRiNDE0NTk2NGZmNjUyYjQ6c2hwYXRfNGU4ZTczY2ZlNTQ2NDIxNjk0MTYxNzQ5OGQ0ZTFmYTI=",
        Cookie:
          "_secure_admin_session_id=63fb1eff09d92fc149ca2e0471440b36; _secure_admin_session_id_csrf=63fb1eff09d92fc149ca2e0471440b36",
      },
    };

    var inventory_levels = await axios(config)
      .then(function (response) {
        return response.data.inventory_levels;
      })
      .catch(function (error) {
        console.log(error);
      });
    inventory = [...inventory, ...inventory_levels];
    id = id + 1;
    console.log(id);
    if (variants.length < 50) {
      break;
    }
  }

  console.log(inventory.length);

  //tag, variant_id,
  var final = {};
  final.array = [];

  allVariants.forEach((variant, index) => {
    var product = allProducts.filter(
      (item) => item["id"] == variant["product_id"]
    );
    // console.log(product[0]);

    var tag = product[0]["tags"].replace("SanMar", "").replace(",", "").trim();
    final.array.push({
      id: tag,
      variant_id: variant["id"],
      option1: variant["option1"],
      option2: variant["option2"],
      item_id: variant["inventory_item_id"],
      location_id: inventory[index]["location_id"],
    });
  });

  console.log(final);

  fs.writeFile("Hello.txt", "Hello World!", function (err) {
    if (err) throw err;
    console.log("complete");
  });

  // fs.writeFileSync("./array.json", JSON.stringify(carObj, null, 4));
}
