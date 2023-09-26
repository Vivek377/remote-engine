const express = require("express");
const cors = require("cors");
const connection = require("./db");
const userRoute = require("./routes/user.route");
require("dotenv").config();


const app = express();

app.use(cors());
app.use(express.json());
app.use("/user", userRoute)


app.listen(process.env.PORT, async (req, res) => {
    try {
        await connection;
        console.log("connected");
    } catch (e) {
        console.log(e);
    }
})

