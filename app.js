require("dotenv").config();

const express = require("express");
const session = require("express-session");
const pgSession = require("connect-pg-simple")(session);

const { pool, initDB } = require("./config/db");

const authRoutes = require("./routes/auth");
const dashboardRoutes = require("./routes/dashboard");
const renterRoutes = require("./routes/renters");
const renterProfileRoutes = require("./routes/renter");
const paymentRoutes = require("./routes/payments");
const moneyRoutes = require("./routes/money");
const settingsRoutes = require("./routes/settings");

const app = express();

const PORT = process.env.PORT || 3000;

// Trust Render proxy
app.set("trust proxy", 1);

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));

// View Engine
app.set("view engine", "ejs");

// Sessions
app.use(
    session({
        store: new pgSession({
            pool: pool,
            createTableIfMissing: true
        }),
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: process.env.NODE_ENV === "production",
            httpOnly: true,
            maxAge: 1000 * 60 * 60 * 24
        }
    })
);
// Routes
app.use(authRoutes);
app.use(dashboardRoutes);
app.use(renterRoutes);
app.use(renterProfileRoutes);
app.use(paymentRoutes);
app.use(moneyRoutes);
app.use(settingsRoutes);

// Home
app.get("/", (req, res) => {
    res.redirect("/login");
});

// 404
app.use((req, res) => {
    res.status(404).send("404 - Page Not Found");
});

// Start server
async function startServer() {
    await initDB();

    app.listen(PORT, () => {
        console.log(`✅ Server running on port ${PORT}`);
    });
}

startServer();