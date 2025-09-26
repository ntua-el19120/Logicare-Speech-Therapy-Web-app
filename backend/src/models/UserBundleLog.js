class UserBundleLog {
    user_id;
    bundle_id;
    state;
    step;
    timestamp;
    constructor(user_id, bundle_id, state, step, timestamp) {
        this.user_id = user_id;
        this.bundle_id = bundle_id;
        this.state = state;
        this.step = step;
        this.timestamp = timestamp;
    }
}
module.exports = UserBundleLog;