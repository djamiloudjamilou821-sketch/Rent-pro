const express = require("express");
const bcrypt = require("bcrypt");

const router = express.Router();

const { pool } = require("../config/db");

router.get("/login", (req, res) => {

    res.render("login", {
        error: ""
    });

});

router.post("/login", async (req, res) => {

    try {

        const { username, password } = req.body;

        const result = await pool.query(

            "SELECT * FROM users WHERE username=$1",

            [username]

        );

        if (result.rows.length === 0) {

            return res.render("login", {

                error: "Invalid username or password"

            });

        }

        const user = result.rows[0];

        const ok = await bcrypt.compare(

            password,

            user.password

        );

        if (!ok) {

            return res.render("login", {

                error: "Invalid username or password"

            });

        }

        req.session.user = {

            id: user.id,

            username: user.username

        };

        res.redirect("/dashboard");

    }

    catch (err) {

        console.log(err);

        res.send("Login Error");

    }

});

router.get("/logout", (req, res) => {

    req.session.destroy(() => {

        res.redirect("/login");

    });

});

module.exports = router;