const { pool } = require("../config/db");

const WEEKLY_FEE = 1000;


// ======================================
// Format Date (YYYY-MM-DD)
// ======================================
function formatDate(date) {

    const options = {
        day: "numeric",
        month: "short",
        year: "numeric"
    };

    return new Date(date).toLocaleDateString("en-GB", options);

}


// ======================================
// Wednesday → Tuesday Week
// ======================================
function getWeekRange(inputDate = new Date()) {

    const date = new Date(inputDate);

    // Remove time
    date.setHours(0, 0, 0, 0);

    // Sunday=0 ... Wednesday=3
    const day = date.getDay();

    const daysSinceWednesday =
        (day + 7 - 3) % 7;

    const weekStart = new Date(date);

    weekStart.setDate(
        date.getDate() - daysSinceWednesday
    );

    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);

    weekEnd.setDate(
        weekStart.getDate() + 6
    );

    weekEnd.setHours(0, 0, 0, 0);

    return {

        weekStart,

        weekEnd

    };

}


// ======================================
// Weeks Passed Since Registration
// ======================================
function getWeeksPassed(startDate) {

    const today = new Date();

    const { weekStart } =
        getWeekRange(today);

    const { weekStart: renterWeek } =
        getWeekRange(startDate);

    const difference =
        weekStart.getTime() -
        renterWeek.getTime();

    let weeks =

        Math.floor(

            difference /

            (1000 * 60 * 60 * 24 * 7)

        ) + 1;

    if (weeks < 1) {

        weeks = 1;

    }

    return weeks;

}


// ======================================
// Total Paid
// ======================================
async function getTotalPaid(renterId) {

    const result = await pool.query(

        `
        SELECT COALESCE(SUM(amount),0) AS total
        FROM payments
        WHERE renter_id = $1
        `,

        [renterId]

    );

    return Number(result.rows[0].total);

}


// ======================================
// Debt
// ======================================
async function getDebt(renter) {

    const weeksPassed =

        getWeeksPassed(
            renter.start_date
        );

    const expectedMoney =

        weeksPassed *
        WEEKLY_FEE;

    const totalPaid =

        await getTotalPaid(
            renter.id
        );

    let debt =

        expectedMoney -
        totalPaid;

    if (debt < 0) {

        debt = 0;

    }

    return debt;

}


// ======================================
// Status
// ======================================
// ======================================
// Status (Python Logic)
// ======================================
async function getStatus(renter) {

    const debt = await getDebt(renter);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { weekEnd } = getWeekRange(today);

    let daysLeft = Math.ceil(
        (weekEnd.getTime() - today.getTime()) /
        (1000 * 60 * 60 * 24)
    );

    if (daysLeft < 0) {
        daysLeft = 0;
    }

    // Same logic as Python
    const status = debt > 0 ? "Late" : "Paid";

    const message = `Due in ${daysLeft} day${daysLeft === 1 ? "" : "s"}`;

    return {
        status,
        debt,
        message,
        daysLeft
    };
}


module.exports = {

    WEEKLY_FEE,

    formatDate,

    getWeekRange,

    getWeeksPassed,

    getTotalPaid,

    getDebt,

    getStatus

};