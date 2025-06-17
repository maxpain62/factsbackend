//import requires modules
const express = require("express");
const app = express();
const mysql = require("mysql2");
const dotenv = require("dotenv");
dotenv.config(); // Load .env variables into process.env

//if you do not add cors here then below erroe will occure
const cors = require("cors");
app.use(cors());
app.use(express.json());

//set connection string
const connection = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

//check connection with db
// connection.query((connectionError) => {
//   if (connectionError) throw connectionError;
//   console.log("connected");
// });

//get data from db
app.get("/getData", (req, res) => {
  connection.query(
    "select id, text, source, category, votesInteresting, votesMindblowing, votesFalse from facts",
    (dataError, result) => {
      if (dataError) {
        console.error(dataError);
        res.status(500).send("db error");
        return;
      }
      res.json(result);
    }
  );
});

app.post("/createFact", (req, res) => {
  const { text, source, category } = req.body;

  const sql = `INSERT INTO facts (text, source, category, votesInteresting, votesMindblowing, votesFalse, created_at) 
               VALUES (?, ?, ?, 0, 0, 0, NOW())`;

  connection.query(sql, [text, source, category], (err, result) => {
    if (err) {
      console.error("Insert error:", err);
      return res.status(500).send("DB insert failed");
    }

    res.status(201).json({ id: result.insertId, ...req.body });
  });
});

app.patch("/vote/:id", (req, res) => {
  const { id } = req.params;
  const { type } = req.body;

  const allowedVotes = ["votesInteresting", "votesMindblowing", "votesFalse"];
  if (!allowedVotes.includes(type)) {
    return res.status(400).send("Invalid vote type");
  }

  connection.query(
    `UPDATE facts SET ${type} = ${type} + 1 WHERE id = ?`,
    [id],
    (error, result) => {
      if (error) {
        console.error(error);
        return res.status(500).send("Database update error");
      }
      res.send("Vote recorded");
    }
  );
});

//listen on port
app.listen(process.env.PORT, () => {
  console.log(`Server is up and running on ${process.env.PORT}`);
});
