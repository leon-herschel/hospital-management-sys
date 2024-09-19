import express from "express";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT;

app.use(express.json()); //allows us to accept JSON data in the body

app.listen(3000, () => {
  console.log("Server started at http://localhost:" + PORT);
});
