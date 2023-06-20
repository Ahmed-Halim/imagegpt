const tesseract = require("node-tesseract-ocr");
const multer = require("multer");
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
require("dotenv").config();
const { Configuration, OpenAIApi } = require("openai");
const configuration = new Configuration({
  organization: process.env.OPENAI_ORG_KEY,
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);
const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());
app.use("/imagegpt", express.static(path.join(__dirname, "dist"))); //  "public" off of current is root

app.get("/imagegpt", (req, res) => {
  res.sendFile(path.join(__dirname, "./dist/index.html"));
});

app.get("/imagegpt/uploads/:name", (req, res) => {
  const { name } = req.params;
  res.sendFile(path.join(__dirname, "./uploads/" + name));
});

const upload = multer({ dest: "./uploads/" });
app.post("/imagegpt/ocr", upload.single("avatar"), (req, res) => {
  console.log(req.file.path);
  tesseract
    .recognize(req.file.path, {
      lang: "eng",
      oem: 1,
      psm: 3,
    })
    .then((text) => {
      res.send(text);
    })
    .catch((error) => {
      res.send(JSON.stringify(error));
    });
});

app.post("/imagegpt/gpt", async (req, res) => {
  try {
    const question = req.body.question;
    const prompt = req.body.prompt;
    if (!question || !prompt) {
      res.send("empty request");
      return;
    }
    const reqBody = {
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: prompt,
        },
        { role: "user", content: question },
      ],
    };
    const completion = await openai.createChatCompletion(reqBody);
    const answer = completion.data.choices[0].message.content;
    res.send(answer);
  } catch (err) {
    res.send("error with openai");
  }
});

app.listen(3000, () => {
  console.log("app is running on port 3000");
});
