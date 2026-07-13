require("dotenv").config();


const express = require("express");
const session = require("express-session");

const { initDB } = require("./config/db");

const authRoutes = require("./routes/auth");
const dashboardRoutes = require("./routes/dashboard");
const renterRoutes = require("./routes/renters");
const renterProfileRoutes = require("./routes/renter");
const paymentRoutes = require("./routes/payments");
const moneyRoutes = require("./routes/money");
const settingsRoutes = require("./routes/settings");

const app = express();

const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(express.static("public"));

app.set("view engine", "ejs");

app.use(session({

    secret: process.env.SESSION_SECRET,

    resave: false,

    saveUninitialized: false

}));

app.use(authRoutes);
app.use(dashboardRoutes);
app.use(renterRoutes);
app.use(renterProfileRoutes);
app.use(paymentRoutes);
app.use(moneyRoutes);
app.use(settingsRoutes);

app.get("/", (req, res) => {

    res.redirect("/login");

});

initDB();

app.listen(PORT, () => {

    console.log(`✅ Server running on http://localhost:${PORT}`);

});