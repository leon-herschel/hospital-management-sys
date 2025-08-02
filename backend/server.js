import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import rolesRouter from "./roles.js";
import addUser from "./add-user/index.js";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/add-user", addUser);
app.use("/api", rolesRouter);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
