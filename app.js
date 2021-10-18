import express from "express";
import cors from "cors";
import connection from "./database.js";

import { categorieSchema, gameSchema, costumerSchema } from "./schemas.js";

const app = express();
app.use(cors());
app.use(express.json());

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

  let { name } = req.body;
  name = name[0].toUpperCase() + name.substr(1);
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
    await connection.query(
      `INSERT INTO categories (name) 
        VALUES ($1);`,
      [name]
    );
    res.sendStatus(201);
  } catch (error) {
    res.sendStatus(500);
  }
});

app.get("/games", async (req, res) => {
  try {
    if (req.query.name) {
      let { name } = req.query;
      name = name[0].toUpperCase() + name.substr(1);
      const result = await connection.query(
        `SELECT games.*, categories.name as "categoryName" 
          FROM games JOIN categories 
            ON games."categoryId"=categories.id
            WHERE games.name LIKE $1;`,
        [name + "%"]
      );
      res.json(result.rows);
    } else {
      const result = await connection.query(
        `SELECT games.*, categories.name as "categoryName" 
        FROM games JOIN categories 
          ON games."categoryId"=categories.id;`
      );
      res.json(result.rows);
    }
  } catch (error) {
    console.log(error);
    res.sendStatus(400);
  }
});

app.post("/games", async (req, res) => {
  if (gameSchema.validate(req.body).error) {
    return res.sendStatus(400);
  }

  let { name, image, stockTotal, categoryId, pricePerDay } = req.body;
  name = name[0].toUpperCase() + name.substr(1);

  try {
    let result = await connection.query(
      "SELECT * FROM categories WHERE id = $1;",
      [categoryId]
    );
    if (result.rows.length === 0) {
      return res.sendStatus(400);
    }

    result = await connection.query("SELECT * FROM games WHERE name = $1;", [
      name,
    ]);

    if (result.rows.length > 0) {
      return res.sendStatus(409);
    }

    await connection.query(
      `INSERT INTO games (name, image, "stockTotal", "categoryId", "pricePerDay") 
          VALUES($1, $2, $3, $4, $5)`,
      [name, image, stockTotal, categoryId, pricePerDay]
    );
    res.sendStatus(201);
  } catch (erro) {
    return res.sendStatus(500);
  }
});

app.get("/customers", async (req, res) => {
  try {
    if (req.query.cpf) {
      let cpf = req.query.cpf.replace(/\D/g, "");
      const result = await connection.query(
        `SELECT * FROM customers
            WHERE customers.cpf LIKE $1;`,
        [cpf + "%"]
      );
      res.json(result.rows);
    } else {
      const result = await connection.query(`SELECT * FROM customers`);
      res.json(result.rows);
    }
  } catch (error) {
    console.log(error);
    res.sendStatus(400);
  }
});

app.get("/customers/:id", async (req, res) => {
  console.log(req.params.id);
  const { id } = req.params;
  try {
    const result = await connection.query(
      `SELECT * FROM customers WHERE id = $1`,
      [id]
    );
    result.rows.length > 0 ? res.json(result.rows[0]) : res.sendStatus(404);
  } catch (error) {
    console.log(error);
    res.sendStatus(400);
  }
});

app.post("/customers", async (req, res) => {
  req.body.cpf = req.body.cpf.replace(/\D/g, "");
  req.body.phone = req.body.phone.replace(/\D/g, "");
  const validNumbers =
    /^\d+$/.test(req.body.cpf) && /^\d+$/.test(req.body.phone);

  if (costumerSchema.validate(req.body).error || !validNumbers) {
    return res.sendStatus(400);
  }

  const { name, phone, cpf, birthday } = req.body;

  try {
    let result = await connection.query(
      `SELECT * FROM customers WHERE cpf=$1`,
      [cpf]
    );

    if (result.rows.length > 0) {
      return res.sendStatus(409);
    }

    await connection.query(
      `INSERT INTO customers (name, phone, cpf, birthday) VALUES ($1, $2, $3, $4)`,
      [name, phone, cpf, birthday]
    );
  } catch (error) {
    console.log(error);
    return res.sendStatus(500);
  }
  res.sendStatus(201);
});

app.put("/customers/:id", async (req, res) => {
  req.body.cpf = req.body.cpf.replace(/\D/g, "");
  req.body.phone = req.body.phone.replace(/\D/g, "");
  const validNumbers =
    /^\d+$/.test(req.body.cpf) && /^\d+$/.test(req.body.phone);

  if (costumerSchema.validate(req.body).error || !validNumbers) {
    return res.sendStatus(400);
  }

  const { name, phone, cpf, birthday } = req.body;
  const { id } = req.params;

  try {
    let result = await connection.query(
      `SELECT * FROM customers WHERE cpf=$1`,
      [cpf]
    );

    result.rows = result.rows.filter((r) => r.id != id);

    if (result.rows.length > 0) {
      return res.sendStatus(409);
    }

    await connection.query(
      `UPDATE customers SET name=$2, phone=$3, cpf=$4, birthday=$5 WHERE id = $1`,
      [id, name, phone, cpf, birthday]
    );
  } catch (error) {
    console.log(error);
    return res.sendStatus(500);
  }
  res.sendStatus(200);
});

app.listen(4000, () => console.log("Server listening on port 4000..."));
