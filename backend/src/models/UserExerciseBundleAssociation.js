class UserExerciseBundleAssociation {
    user_id;
    bundle_id;
    notifications;
    constructor(user_id, bundle_id, notifications) {
        this.user_id = user_id;
        this.bundle_id = bundle_id;
        this.notifications = notifications;
    }
}
module.exports = UserExerciseBundleAssociation;