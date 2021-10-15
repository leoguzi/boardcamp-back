import express from "express";
import cors from "cors";
import pg from "pg";
import { categorieSchema } from "./schemas.js";

const app = express();
app.use(cors());
app.use(express.json());

const { Pool } = pg;

const connection = new Pool({
  user: "bootcamp_role",
  password: "senha_super_hiper_ultra_secreta_do_role_do_bootcamp",
  host: "localhost",
  port: 5432,
  database: "boardcamp",
});

app.get("/categories", async (req, res) => {
  try {
    const result = await connection.query("SELECT * FROM categories;");
    res.json(result.rows);
  } catch (error) {
    res.sendStatus(400);
  }
});

app.post("/categories", async (req, res) => {
  if (categorieSchema.validate(req.body).error) {
    return res.sendStatus(400);
  }
  const { name } = req.body;

  try {
    const result = await connection.query(
      "SELECT * FROM categories WHERE name = $1;",
      [name]
    );
    if (result.rows.length > 0) {
      return res.sendStatus(409);
    }
  } catch (error) {
    return res.sendStatus(500);
  }

  try {
    await connection.query("INSERT INTO categories (name) VALUES ($1);", [
      name,
    ]);
    res.sendStatus(200);
  } catch (error) {
    res.sendStatus(500);
  }
});

app.listen(4000, () => console.log("Server listening on port 4000..."));
