const { v4: uuidv4 } = require('uuid');
const pool = require("../config/db-connection");
const UserExerciseBundleAssociation = require("../models/UserExerciseBundleAssociation");
const ExerciseBundle = require("../models/ExerciseBundle");


async function createUserExerciseBundleAssociation(user_id,bundle_id,notifications) {
    await pool.query(
        'INSERT INTO speech_therapy.user_bundle (user_id,bundle_id,notifications) VALUES ($1, $2, $3)',
        [user_id,bundle_id,notifications]
    );
    return new UserExerciseBundleAssociation(user_id,bundle_id,notifications);
}

async function deleteUserExerciseBundleAssociation(user_id,bundle_id) {
    await pool.query('DELETE FROM speech_therapy.user_bundle WHERE user_id = $1 AND bundle_id = $2', [user_id,bundle_id]);
}

async function getUserExerciseBundleAssociationByUserId(user_id) {

    const userBundleRes = await pool.query('SELECT bundle_id,notifications FROM speech_therapy.user_bundle WHERE user_id = $1', [user_id]);
    if (userBundleRes.rows.length === 0) return null;

    return new bundleRes.rows;
}

module.exports = {
    getUserExerciseBundleAssociationByUserId,
    createUserExerciseBundleAssociation,
    deleteUserExerciseBundleAssociation,
};
