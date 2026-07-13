const express = require("express");
const router = express.Router();

const { pool } = require("../config/db");
const { requireAuth } = require("../middleware/auth");
const { WEEKLY_FEE, getStatus } = require("../helpers/billing");

router.get("/money", requireAuth, async (req, res) => {

    try {

        const rentersResult =
            await pool.query(
                "SELECT * FROM renters"
            );

        const renters = rentersResult.rows;

        let paid = 0;
        let pending = 0;
        let late = 0;
        let totalDebt = 0;

        for (const renter of renters) {

            const info = await getStatus(renter);

            totalDebt += info.debt;

            if (info.status === "Paid") {
                paid++;
            }
            else if (info.status === "Pending") {
                pending++;
            }
            else {
                late++;
            }

        }

        const moneyResult = await pool.query(`
            SELECT COALESCE(SUM(amount),0) AS total
            FROM payments
        `);

        const totalCollected =
            Number(moneyResult.rows[0].total);

        const weeklyExpected =
            renters.length * WEEKLY_FEE;

        const collectionRate =
            weeklyExpected === 0
                ? 0
                : Math.round(
                    ((weeklyExpected - totalDebt) /
                    weeklyExpected) * 100
                );

        res.render("money", {

            totalCollected,

            weeklyExpected,

            totalDebt,

            collectionRate,

            totalRenters: renters.length,

            paid,

            pending,

            late

        });

    }

    catch (err) {

        console.error(err);

        res.status(500).send("Server Error");

    }

});

module.exports = router;