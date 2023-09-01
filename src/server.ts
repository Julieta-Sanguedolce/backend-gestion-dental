import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { Client } from "pg";
import { getEnvVarOrFail } from "./support/envVarUtils";
import { setupDBClientConfig } from "./support/setupDBClientConfig";

dotenv.config(); //Read .env file lines as though they were env vars.

const dbClientConfig = setupDBClientConfig();
const client = new Client(dbClientConfig);

//Configure express routes
const app = express();

app.use(express.json()); //add JSON body parser to each following route handler
app.use(cors()); //add CORS support to each following route handler

app.get("/customers", async (_req, res) => {
    const allCustomers = await client.query('SELECT * FROM "customers"');
    res.json(allCustomers.rows);
});

app.delete("/customers/:id", async (req, res) => {
    const { id } = req.params;
    await client.query("DELETE FROM customers WHERE client_id=$1", [id]);
    res.json("todo was deleted");
});

app.post("/customers", async (req, res) => {
    const {
        first_name,
        last_name,
        email,
        phone,
        address,
        city,
        country,
        date_of_birth,
        last_date_of_visit,
    } = req.body;
    await client.query(
        'INSERT INTO customers ("first_name", "last_name","email","phone","address","city","country","date_of_birth","last_date_of_visit") VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9)',
        [
            first_name,
            last_name,
            email,
            phone,
            address,
            city,
            country,
            date_of_birth,
            last_date_of_visit,
        ]
    );
    res.json("new customer posted");
});

app.get("/health-check", async (_req, res) => {
    try {
        //For this to be successful, must connect to db
        await client.query("select now()");
        res.status(200).send("system ok");
    } catch (error) {
        //Recover from error rather than letting system halt
        console.error(error);
        res.status(500).send("An error occurred. Check server logs.");
    }
});

connectToDBAndStartListening();

async function connectToDBAndStartListening() {
    console.log("Attempting to connect to db");
    await client.connect();
    console.log("Connected to db!");

    const port = getEnvVarOrFail("PORT");
    app.listen(port, () => {
        console.log(
            `Server started listening for HTTP requests on port ${port}.  Let's go!`
        );
    });
}
