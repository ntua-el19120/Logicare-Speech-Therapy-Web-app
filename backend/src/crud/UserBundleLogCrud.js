const pool = require("../config/db-connection");

async function createUserBundleLog(userBundleLog) {
    await pool.query(
        'INSERT INTO speech_therapy.user_bundle_log (user_id,bundle_id,state,step,timestamp) VALUES ($1, $2, $3, $4, $5)',
        [userBundleLog.user_id, userBundleLog.bundle_id, userBundleLog.state, userBundleLog.step, userBundleLog.timestamp],
    );
    return userBundleLog;
}

async function getUserBundleLogsByUserIdAndBundleId(user_id, bundle_id) {
    const userBundleLogRes = await pool.query('SELECT * FROM speech_therapy.user_bundle_log WHERE user_id = $1 AND bundle_id = $2', [user_id, bundle_id]);
    if (userBundleLogRes.rows.length === 0) return null;

    return new userBundleLogRes.rows;
}

module.exports = {
    createUserBundleLog,
    getUserBundleLogsByUserIdAndBundleId
};
