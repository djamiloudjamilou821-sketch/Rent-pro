const express = require("express");
const router = express.Router();

const { pool } = require("../config/db");
const { requireAuth } = require("../middleware/auth");
const { getStatus } = require("../helpers/billing");

router.get("/renters", requireAuth, async (req, res) => {

    try {

        const search = req.query.search || "";

        const filter = req.query.filter || "all";

        let query = `
            SELECT *
            FROM renters
        `;

        let values = [];

        if (search !== "") {

            query += `
                WHERE
                    name ILIKE $1
                    OR phone ILIKE $1
                    OR address ILIKE $1
            `;

            values.push(`%${search}%`);

        }

        query += " ORDER BY name ASC";

        const result = await pool.query(query, values);

        let renters = [];

        for (const renter of result.rows) {

            const statusInfo = await getStatus(renter);

            if (
                filter !== "all" &&
                statusInfo.status.toLowerCase() !== filter.toLowerCase()
            ) {
                continue;
            }

            renters.push({

                ...renter,

                ...statusInfo

            });

        }

        res.render("renters", {

            renters,

            search,

            filter,

            total: renters.length

        });

    }

    catch (err) {

        console.error(err);

        res.status(500).send("Server Error");

    }

});

// ==========================
// Edit Renter (Form)
// ==========================
router.get("/renters/edit/:id", requireAuth, async (req, res) => {

    try {

        const id = req.params.id;

        const result = await pool.query(
            "SELECT * FROM renters WHERE id=$1",
            [id]
        );

        if (result.rows.length === 0) {

            return res.status(404).send("Renter not found");

        }

        res.render("edit_renter", {

            renter: result.rows[0]

        });

    }

    catch(err){

        console.error(err);

        res.status(500).send("Server Error");

    }

});


// ==========================
// Update Renter
// ==========================
router.post("/renters/edit/:id", requireAuth, async (req,res)=>{

    try{

        const id = req.params.id;

        const {

            name,

            phone,

            address

        } = req.body;

        await pool.query(

            `
            UPDATE renters

            SET

                name=$1,

                phone=$2,

                address=$3

            WHERE id=$4
            `,

            [

                name,

                phone,

                address,

                id

            ]

        );

        res.redirect("/renters/" + id);

    }

    catch(err){

        console.error(err);

        res.status(500).send("Server Error");

    }

});

// ==========================
// Delete Renter
// ==========================
router.get("/renters/delete/:id", requireAuth, async (req,res)=>{

    try{

        const id = req.params.id;

        await pool.query(

            "DELETE FROM renters WHERE id=$1",

            [id]

        );

        res.redirect("/renters");

    }

    catch(err){

        console.error(err);

        res.status(500).send("Server Error");

    }

});

// ==========================
// Add Renter
// ==========================

// Show form
router.get("/renters/add", requireAuth, (req, res) => {

    res.render("add_renter");

});


// Save renter
router.post("/renters/add", requireAuth, async (req, res) => {

    try {

        const {

            name,

            phone,

            address

        } = req.body;


        if (!name || name.trim() === "") {

            return res.send("Name is required.");

        }


        await pool.query(

            `
            INSERT INTO renters
            (
                name,
                phone,
                address,
                start_date
            )

            VALUES
            (
                $1,
                $2,
                $3,
                CURRENT_DATE
            )
            `,

            [

                name.trim(),

                phone || null,

                address || null

            ]

        );


        res.redirect("/renters");

    }

    catch (err) {

        console.error(err);

        res.status(500).send("Server Error");

    }

});

module.exports = router;