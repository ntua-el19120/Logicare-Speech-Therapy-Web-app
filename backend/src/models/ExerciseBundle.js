class ExerciseBundle {
    id;
    title;
    exercises;  //list of exercises
    global;
    notifications;
    constructor(id, title, exercises, global, notifications) {
        this.id = id;
        this.title = title;
        this.exercises = exercises;
        this.global = global;
        this.notifications = notifications;
    }
}
module.exports = ExerciseBundle;