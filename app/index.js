var PromiseFtp = require("promise-ftp");
var fs = require("fs");
const { parse } = require("csv-parse");
const csvtojson = require("csvtojson");
var cron = require("node-cron");
var axios = require("axios");
var http = require("http");
var result;
var errorArr = [],
  Qty = [];

readJSONFile();

async function readJSONFile() {
  await fs.readFile("./array.json", "utf8", (err, jsonString) => {
    if (err) {
      console.log("File read failed:", err);
      return;
    }
    // console.log(JSON.parse(jsonString)["array"][0]);
    var res = JSON.parse(jsonString);
    // compareFile(res);
    readCSV(res);
  });
}

// function compareFile(res) {
//   console.log(res);
//   res["array"].forEach((item, index) => console.log(item.id));
// }

// console.log(result);
// cron.schedule("*", () => {
//   console.log("running a task every two minutes");
//   console.log(readShopify);
//   // ftpConnect();
// });

// mongoose.connect("mongodb://localhost:27017/shopify", {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// });

// const db = mongoose.connection;
// db.on("error", console.error.bind(console, "connection error: "));
// db.once("open", function () {
//   console.log("Connected successfully");
// });

// var ftp = new PromiseFtp();

// function ftpConnect() {
//   ftp
//     .connect({ host: "ftp.sanmar.com", user: "136681", password: "Sanmar81" })
//     .then(function (serverMessage) {
//       return ftp.get("/SanMarPDD/sanmar_shopify.csv");
//     })
//     .then(function (stream) {
//       return new Promise(function (resolve, reject) {
//         stream.once("close", resolve);
//         stream.once("error", reject);
//         stream.pipe(fs.createWriteStream("download_csv/sanmar_shopify.csv"));
//       });
//     })
//     .then(function () {
//       console.log("Downloaded csv file successfully");
//       readCSV();
//       return ftp.end();
//     });
// }

async function updateInventory(locationID, inventoryID, qty) {
  var config = {
    method: "post",
    url: `https://uniformright-com.myshopify.com/admin/api/2022-07/inventory_levels/set.json?location_id=${locationID}&inventory_item_id=${inventoryID}&available=${qty}`,
    headers: {
      Authorization:
        "Basic NjliYTllMjhiNDA5MjMwNGRiNDE0NTk2NGZmNjUyYjQ6c2hwYXRfNGU4ZTczY2ZlNTQ2NDIxNjk0MTYxNzQ5OGQ0ZTFmYTI=",
    },
  };

  var res = await axios(config)
    .then(function (response) {
      console.log(JSON.stringify(response.data));
      return true;
    })
    .catch(function (error) {
      console.log(error);
      return false;
    });
  return res;
}

async function readCSV(res) {
  // CSV file name
  const fileName = "download_csv/sanmar_shopify.csv";
  var arrayToInsert = [];
  csvtojson()
    .fromFile(fileName)
    .then(async (source) => {
      //   console.log(source[0]);
      // Fetching the all data from each row
      for (var i = 1; i < source.length; i++) {
        var oneRow = {
          handle: source[i]["Handle"],
          title: source[i]["Title"],
          body: source[i]["Body(HTML)"],
          vendor: source[i]["Vendor"],
          type: source[i]["Type"],
          tags: source[i]["Tags"],
          published: source[i]["Published"],
          option1name: source[i]["Option1 Name"],
          option1value: source[i]["Option1 Value"],
          option2name: source[i]["Option2 Name"],
          option2value: source[i]["Option2 Value"],
          option3name: source[i]["Option3 Name"],
          option3nalue: source[i]["Option3 Value"],
          sku: source[i]["Variant SKU"],
          grams: source[i]["Variant Grams"],
          tracker: source[i]["Variant Inventory Tracker"],
          qty: source[i]["Variant Inventory Qty"],
          policy: source[i]["Variant Inventory Policy"],
          service: source[i]["Variant Fulfillment Service"],
          price: source[i]["Variant Price"],
          atprice: source[i]["Variant Compare At Price"],
          shipping: source[i]["Variant Requires Shipping"],
          taxable: source[i]["Variant Taxable"],
          barcode: source[i]["Variant Barcode"],
          src: source[i]["Image Src"],
          alttext: source[i]["Image Alt Text"],
          giftcard: source[i]["Gift Card"],
          mpn: source[i]["Google Shopping / MPN"],
          agegroup: source[i]["Google Shopping / Age Group"],
          gender: source[i]["Google Shopping / Gender"],
          category: source[i]["Google Shopping / Google Product Category"],
          seotitle: source[i]["SEO Title"],
          seodesc: source[i]["SEO Description"],
          adwordsgrouping: source[i]["Google Shopping / AdWords Grouping"],
          adwordslabels: source[i]["Google Shopping / AdWords Labels"],
          condition: source[i]["Google Shopping / Condition"],
          product: source[i]["Google Shopping / Custom Product"],
          label0: source[i]["Google Shopping / Custom Label 0"],
          label1: source[i]["Google Shopping / Custom Label 1"],
          label2: source[i]["Google Shopping / Custom Label 2"],
          label3: source[i]["Google Shopping / Custom Label 3"],
          label4: source[i]["Google Shopping / Custom Label 4"],
          image: source[i]["Variant Image"],
          weight: source[i]["Variant Weight Unit"],
        };
        arrayToInsert.push(oneRow);
      }

      //   console.log(arrayToInsert[0]);

      let qtyArr = await Promise.all(
        res["array"].map((item) => {
          var product = arrayToInsert.filter(
            (e) =>
              e.handle == item.id &&
              e.option1value.replace(/\s/g, "") ==
                item.option1.replace(/\s/g, "") &&
              e.option2value == item.option2
          );
          // console.log("handle =>" + product[0].handle + "qty=>" + product[0].qty);
          //   if (product.length == 0) {
          //     errorArr.push({
          //       handle: item.id,
          //       option1: item.option1,
          //       option2: item.option2,
          //     });
          //   }
          return product.length > 0 ? product[0].qty : -1;
        })
      );

      var index = 0;
      while (index < res["array"].length) {
        var response = await updateInventory(
          res["array"][index].location_id,
          res["array"][index].item_id,
          qtyArr[index]
        );
        console.log(response);
        index++;
      }

      //   Promise.all(
      //     res["array"].map(async (e, index) => {
      //       console.log(
      //         await updateInventory(e.location_id, e.item_id, qtyArr[index])
      //       );
      //     })
      //   ).then((results) => {
      //     console.log("Updated");
      //   });

      //   var index = 0;
      //   while(index < res["array"].length) {
      //     await updateInventory(e.location_id, e.item_id, qtyArr[index]);
      //   }

      //inserting into the table "employees"
      //   var collectionName = "products";
      //   var collection = db.collection(collectionName);
      //   collection.insertMany(arrayToInsert, (err, result) => {
      //     if (err) console.log(err);
      //     if (result) {
      //       console.log("Import CSV into database successfully.");
      //       db.close();
      //     }
      //   });
    });
}
