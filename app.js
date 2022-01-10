const dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });

const cors = require("cors");
const axios = require("axios");
const { wrapper } = require("axios-cookiejar-support");
const express = require("express");
const app = express();
const cheerio = require("cheerio");
const mongoose = require("mongoose");
const DB = process.env.DATABASE.replace("<PASSWORD>", process.env.PASSWORD);
const authController = require("./authController");
mongoose
  .connect(DB, { useNewUrlParser: true })
  .then(() => console.log("finally we are connected"))
  .catch((err) => console.log(err.message));

const htmlparser2 = require("htmlparser2");
const fs = require("fs");
var HTMLParser = require("node-html-parser");
app.use(express.json({ limit: "50mb" }));
app.use(cors());
app.post("/data", async (req, res) => {
  try {
    fs.writeFileSync(__dirname + "/abc.html", req.body.html);
    const result = await scrapping(req.body.html);
    console.log("worked", result);
    return res.status(200).json(result);
  } catch (e) {
    console.log(e);
  }
});
let webhook;
app.post("/webhook", (req, res) => {
  webhook = res.body;
  res.status(200).send({
    status: "success",
  });
});
app.listen(3000, () => {
  console.log("server started");
});

const scrapping = async (data) => {
  try {
    const dom = htmlparser2.parseDocument(data, {});
    const $ = cheerio.load(dom);
    const details = $(".hdp__sc-rfpg3m-0", "span");
    let obj = {};
    details.each(function (idx, el) {
      if (idx == 0) {
        let bed = $(el).text();
        bed = bed.replace("bd", "");
        obj["bed"] = bed;
      }
      if (idx == 1) {
        let bathroom = $(el).text();
        bathroom = bathroom.replace("ba", "");
        obj["bathroom"] = bathroom;
      }
      if (idx == 2) {
        let area = $(el).text();
        obj["area"] = area;
      }
    });
    const address = $("#ds-chip-property-address");
    obj["address"] = address.text();
    const rentzestimate = $(
      ".Text-c11n-8-53-2__sc-aiai24-0",
      ".hdp__sc-18p00c6-0"
    );

    rentzestimate.each(function (idx, el) {
      if (idx == 0) {
        obj["Zestimate"] = $(el).text();
      }
      if (idx == 1) {
        obj["Rent Zestimate"] = $(el).text();
      }
    });
    const refine = $("h5", ".Spacer-c11n-8-53-2__sc-17suqs2-0");
    obj["zestimate_details"] = {};
    refine.each(function (idx, el) {
      if (idx == 0) {
        obj["zestimate_details"]["Zestimate-range"] = $(el).text();
      }
      if (idx == 1) {
        obj["zestimate_details"]["Last_30-day_change"] = $(el).text();
      }
      if (idx == 2) {
        obj["zestimate_details"]["Zestimate_per_sqft"] = $(el).text();
      }
    });
    const estimate = $("p", ".Flex-c11n-8-53-2__sc-n94bjd-0");

    estimate.each(function (idx, el) {
      if (idx == 8) {
        obj["Estimated_net_proceeds"] = $(el).text();
      }
    });
    let rr = HTMLParser.parse(data, {
      lowerCaseTagName: false, // convert tag name to lower case (hurt performance heavily)
      comment: false, // retrieve comments (hurt performance slightly)
      blockTextElements: {
        script: false, // keep text content when parsing
        noscript: false, // keep text content when parsing
        style: true, // keep text content when parsing
        pre: true, // keep text content when parsing
      },
    });
    let body = rr.querySelector("body");
    const $t = cheerio.load(body);
    const overview = $(".kuboKK");
    overview.each(function (idx, val) {
      console.log("hh", idx);
    });

    return obj;
  } catch (e) {
    console.log("err", e);
  }
};

app.post("/signup", authController.signUp);
app.post("/login", authController.logIn);
app.post("/payment", authController.createSession);

app.use("*", (req, res) => {
  res.status(404).send({
    status: "error",
  });
});
