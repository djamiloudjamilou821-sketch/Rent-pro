const express = require("express");
const router = express.Router();

const { pool } = require("../config/db");
const { requireAuth } = require("../middleware/auth");
const { getStatus, getTotalPaid } = require("../helpers/billing");

router.get("/renters/:id", requireAuth, async (req, res) => {

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

        const paymentResult = await pool.query(
            `
            SELECT *
            FROM payments
            WHERE renter_id=$1
            ORDER BY payment_date DESC
            `,
            [id]
        );

        const payments = paymentResult.rows;

        const totalPaid = await getTotalPaid(renter.id);

        const statusInfo = await getStatus(renter);

        res.render("renter", {

            user: req.session.user,

            renter,

            payments,

            totalPaid,

            ...statusInfo

        });

    }

    catch (err) {

        console.error(err);

        res.status(500).send("Server Error");

    }

});

module.exports = router;