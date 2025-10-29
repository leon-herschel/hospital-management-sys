import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import rolesRouter from "./roles.js";
import addUser from "./add-user/index.js";

dotenv.config();
const app = express();

// CORS configuration
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? process.env.FRONTEND_URL
        : "http://localhost:3000",
    credentials: true,
  })
);

app.use(express.json());

app.use("/add-user", addUser);
app.use("/api", rolesRouter);

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`Frontend URL: ${process.env.FRONTEND_URL}`);
});
