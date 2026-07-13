const express = require("express");
const bcrypt = require("bcrypt");

const router = express.Router();

const { pool } = require("../config/db");
const { requireAuth } = require("../middleware/auth");


// ==========================
// Settings Page
// ==========================
router.get("/settings", requireAuth, (req, res) => {

    res.render("settings", {

        user: req.session.user

    });

});


// ==========================
// Change Password Form
// ==========================
router.get("/change-password", requireAuth, (req, res) => {

    res.render("change_password", {

        error: "",

        success: ""

    });

});


// ==========================
// Change Password
// ==========================
router.post("/change-password", requireAuth, async (req, res) => {

    try {

        const {

            currentPassword,

            newPassword,

            confirmPassword

        } = req.body;


        // Find the logged-in user by ID
        const result = await pool.query(

            "SELECT * FROM users WHERE id=$1",

            [

                req.session.user.id

            ]

        );


        if (result.rows.length === 0) {

            return res.render("change_password", {

                error: "User not found.",

                success: ""

            });

        }


        const user = result.rows[0];


        // Verify current password
        const correct = await bcrypt.compare(

            currentPassword,

            user.password

        );


        if (!correct) {

            return res.render("change_password", {

                error: "Current password is incorrect.",

                success: ""

            });

        }


        // Check new password confirmation
        if (newPassword !== confirmPassword) {

            return res.render("change_password", {

                error: "New passwords do not match.",

                success: ""

            });

        }


        // Hash new password
        const hashedPassword = await bcrypt.hash(

            newPassword,

            10

        );


        // Save new password
        await pool.query(

            "UPDATE users SET password=$1 WHERE id=$2",

            [

                hashedPassword,

                user.id

            ]

        );


        // Log the user out
        req.session.destroy(() => {

            res.redirect("/login");

        });

    }

    catch(err){

        console.error(err);

        res.status(500).send("Server Error");

    }

});


module.exports = router;