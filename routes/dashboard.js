const express = require("express");

const router = express.Router();

const { pool } = require("../config/db");

const { 
    getStatus 
} = require("../helpers/billing");

const { 
    requireAuth 
} = require("../middleware/auth");


// Dashboard page
router.get("/dashboard", requireAuth, async (req, res)=>{

    try {

        const result = await pool.query(
            "SELECT * FROM renters ORDER BY id DESC"
        );


        let renters = [];

        let stats = {

            total: 0,

            paid: 0,

            pending: 0,

            late: 0,

            debt: 0

        };


        for(const renter of result.rows){


            const status =
                await getStatus(renter);


            renters.push({

                ...renter,

                ...status

            });


            stats.total++;


            if(status.status==="Paid")
                stats.paid++;


            if(status.status==="Pending")
                stats.pending++;


            if(status.status==="Late")
                stats.late++;


            stats.debt += status.debt;


        }



        res.render(
            "dashboard",
            {
                renters,
                stats,
                user:req.session.user
            }
        );


    }

    catch(err){

        console.log(err);

        res.send(
            "Dashboard error"
        );

    }


});


module.exports = router;