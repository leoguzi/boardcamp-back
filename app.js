import express, { query } from "express";
import cors from "cors";
import connection from "./database.js";
import dayjs from "dayjs";

import {
  categorieSchema,
  gameSchema,
  customerSchema,
  rentalSchema,
} from "./schemas.js";

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
      `INSERT INTO games (
        name, 
        image, 
        "stockTotal",
        "categoryId", 
        "pricePerDay") 
          VALUES($1, $2, $3, $4, $5);`,
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
      const result = await connection.query(`SELECT * FROM customers;`);
      res.json(result.rows);
    }
  } catch (error) {
    res.sendStatus(400);
  }
});

app.get("/customers/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await connection.query(
      `SELECT * FROM customers WHERE id = $1;`,
      [id]
    );
    result.rows.length > 0 ? res.json(result.rows[0]) : res.sendStatus(404);
  } catch (error) {
    res.sendStatus(400);
  }
});

app.post("/customers", async (req, res) => {
  req.body.cpf = req.body.cpf.replace(/\D/g, "");
  req.body.phone = req.body.phone.replace(/\D/g, "");
  const validNumbers =
    /^\d+$/.test(req.body.cpf) && /^\d+$/.test(req.body.phone);
  const validBirthday = new Date() - new Date(req.body.birthday).getTime() > 0;

  if (
    customerSchema.validate(req.body).error ||
    !validNumbers ||
    !validBirthday
  ) {
    return res.sendStatus(400);
  }

  const { name, phone, cpf, birthday } = req.body;

  try {
    let result = await connection.query(
      `SELECT * FROM customers WHERE cpf=$1;`,
      [cpf]
    );

    if (result.rows.length > 0) {
      return res.sendStatus(409);
    }

    await connection.query(
      `INSERT INTO customers (name, phone, cpf, birthday) VALUES ($1, $2, $3, $4);`,
      [name, phone, cpf, birthday]
    );
  } catch (error) {
    return res.sendStatus(500);
  }
  res.sendStatus(201);
});

app.put("/customers/:id", async (req, res) => {
  req.body.cpf = req.body.cpf.replace(/\D/g, "");
  req.body.phone = req.body.phone.replace(/\D/g, "");
  const validNumbers =
    /^\d+$/.test(req.body.cpf) && /^\d+$/.test(req.body.phone);
  const validBirthday = new Date() - new Date(req.body.birthday).getTime() > 0;
  if (
    customerSchema.validate(req.body).error ||
    !validNumbers ||
    !validBirthday
  ) {
    return res.sendStatus(400);
  }

  const { name, phone, cpf, birthday } = req.body;
  const { id } = req.params;

  try {
    let result = await connection.query(
      `SELECT * FROM customers WHERE cpf=$1;`,
      [cpf]
    );

    result.rows = result.rows.filter((r) => r.id != id);

    if (result.rows.length > 0) {
      return res.sendStatus(409);
    }

    await connection.query(
      `UPDATE customers SET name=$2, phone=$3, cpf=$4, birthday=$5 WHERE id = $1;`,
      [id, name, phone, cpf, birthday]
    );
  } catch (error) {
    return res.sendStatus(500);
  }
  res.sendStatus(200);
});

app.get("/rentals", async (req, res) => {
  try {
    let result = [];
    const { customerId, gameId } = req.query;
    if (customerId) {
      result = await connection.query(
        `SELECT rentals.*, 
        customers.id as "customerId", customers.name as "customerName", 
        games.id as "gameId", games.name as "gameName", games."categoryId" as "categoryId", 
        categories.name as "categoryName"
            FROM rentals
              JOIN customers
                ON rentals."customerId" = customers.id
              JOIN games
                ON rentals."gameId"= games.id
              JOIN categories 
                on games."categoryId" = categories.id
                  WHERE rentals."customerId"= $1;`,
        [req.query.customerId]
      );
    } else if (gameId) {
      result = await connection.query(
        `SELECT rentals.*, 
          customers.id as "customerId", customers.name as "customerName", 
          games.id as "gameId", games.name as "gameName", games."categoryId" as "categoryId", 
          categories.name as "categoryName"
              FROM rentals
                JOIN customers
                  ON rentals."customerId" = customers.id
                JOIN games
                  ON rentals."gameId"= games.id
                JOIN categories 
                  on games."categoryId" = categories.id
                    WHERE rentals."gameId"= $1;`,
        [req.query.gameId]
      );
    } else {
      result = await connection.query(
        `SELECT rentals.*, 
      customers.id as "customerId", customers.name as "customerName", 
      games.id as "gameId", games.name as "gameName", games."categoryId" as "categoryId", 
      categories.name as "categoryName"
          FROM rentals
            JOIN customers
              ON rentals."customerId" = customers.id
            JOIN games
              ON rentals."gameId"= games.id
            JOIN categories 
              on games."categoryId" = categories.id;`
      );
    }

    result = result.rows.map((row) => {
      return {
        id: row.id,
        customerId: row.customerId,
        gameId: row.gameId,
        rentDate: row.rentDate,
        daysRented: row.daysRented,
        returnDate: row.returnDate,
        originalPrice: row.originalPrice,
        delayFee: row.delayFee,
        customer: {
          id: row.customerId,
          name: row.customerName,
        },
        game: {
          id: row.gameId,
          name: row.gameName,
          categoryId: row.categoryId,
          categoryName: row.categoryName,
        },
      };
    });

    res.json(result);
  } catch (error) {
    return res.sendStatus(500);
  }
});

app.post("/rentals", async (req, res) => {
  if (rentalSchema.validate(req.body).error) {
    return res.sendStatus(400);
  }
  const { customerId, gameId, daysRented } = req.body;
  const rentDate = dayjs().format("YYYY-MM-DD");
  try {
    let rentals = await connection.query(
      `SELECT * FROM rentals WHERE "gameId"=$1`,
      [gameId]
    );

    const customer = await connection.query(
      `SELECT * FROM customers WHERE id = $1;`,
      [customerId]
    );
    let game = await connection.query(`SELECT * FROM games WHERE id = $1;`, [
      gameId,
    ]);
    if (
      customer.rows.length === 0 ||
      game.rows.length === 0 ||
      rentals.rows.length >= game.rows[0].stockTotal
    ) {
      return res.sendStatus(400);
    }
    game = game.rows[0];
    const originalPrice = game.pricePerDay * daysRented;

    const result = await connection.query(
      `INSERT INTO rentals (
        "customerId", 
        "gameId", 
        "rentDate", 
        "daysRented", 
        "returnDate", 
        "originalPrice", 
        "delayFee")
          VALUES($1, $2, $3, $4, $5, $6, $7);`,
      [customerId, gameId, rentDate, daysRented, null, originalPrice, null]
    );
    res.sendStatus(201);
  } catch (error) {
    return res.sendStatus(500);
  }
});

app.post("/rentals/:id/return", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await connection.query(
      `SELECT * FROM rentals WHERE ID = $1;`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.sendStatus(404);
    }
    if (result.rows[0].returnDate) {
      console.log(result.rows[0].returnDate);
      return res.sendStatus(400);
    }
    const rental = result.rows[0];
    const rentDate = new Date(rental.rentDate);
    const returnDate = new Date();
    const timeDiff = Math.abs(returnDate.getTime() - rentDate.getTime());
    const diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
    let game = await connection.query(`SELECT * FROM games WHERE id = $1;`, [
      rental.gameId,
    ]);
    game = game.rows[0];

    let delayFee = null;
    diffDays > rental.daysRented
      ? (delayFee = game.pricePerDay * (diffDays - rental.daysRented))
      : (delayFee = 0);
    await connection.query(
      `UPDATE rentals SET "returnDate" = $2, "delayFee"= $3 WHERE id = $1`,
      [rental.id, returnDate, delayFee]
    );
    res.sendStatus(200);
  } catch (error) {
    console.log(error);
    return res.sendStatus(500);
  }
});

app.delete("/rentals/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await connection.query(
      `SELECT * FROM rentals WHERE id = $1;`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.sendStatus(404);
    }
    if (result.rows[0].returnDate !== null) {
      return res.sendStatus(400);
    }
    await connection.query(`DELETE FROM rentals WHERE ID = $1;`, [id]);
    res.sendStatus(200);
  } catch (error) {
    return res.sendStatus(500);
  }
});

app.listen(4000, () => console.log("Server listening on port 4000..."));
