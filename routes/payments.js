const express = require("express");
const router = express.Router();

const { pool } = require("../config/db");
const { requireAuth } = require("../middleware/auth");
const { getStatus } = require("../helpers/billing");


// ===============================
// ALL PAYMENTS HISTORY
// ===============================
router.get("/payments", requireAuth, async (req, res) => {

    try {

        const paymentsResult = await pool.query(`

            SELECT 
                payments.id,
                payments.amount,
                payments.payment_date,
                renters.name,
                renters.phone

            FROM payments

            JOIN renters

            ON payments.renter_id = renters.id

            ORDER BY payments.payment_date DESC

        `);


        const totalResult = await pool.query(`

            SELECT COALESCE(SUM(amount),0) AS total

            FROM payments

        `);


        res.render("payments", {

            payments: paymentsResult.rows,

            totalCollected: Number(totalResult.rows[0].total)

        });


    } catch(err) {

        console.error(err);

        res.status(500).send("Unable to load payments");

    }

});



// ===============================
// Payment Page
// ===============================
router.get("/payments/:id", requireAuth, async (req, res) => {

    try {

        const id = req.params.id;

        const renterResult = await pool.query(
            "SELECT * FROM renters WHERE id=$1",
            [id]
        );


        if (renterResult.rows.length === 0) {

            return res.status(404).send("Renter not found");

        }


        const renter = renterResult.rows[0];


        const status = await getStatus(renter);


        res.render("pay", {

            renter,

            ...status

        });


    } catch (err) {

        console.error(err);

        res.status(500).send("Server Error");

    }

});



// ===============================
// Save Payment
// ===============================
router.post("/payments/:id", requireAuth, async (req, res) => {

    try {

        const id = req.params.id;

        let { amount } = req.body;


        amount = Number(amount);


        if (!amount || amount <= 0) {

            amount = 1000;

        }


        await pool.query(

            `
            INSERT INTO payments
            (
                renter_id,
                amount,
                payment_date
            )

            VALUES
            (
                $1,
                $2,
                CURRENT_DATE
            )
            `,

            [
                id,
                amount
            ]

        );


        res.redirect("/renters/" + id);


    } catch(err) {

        console.error(err);

        res.status(500).send("Unable to save payment.");

    }

});


module.exports = router;