class Exercise {
    id;
    bundle_id;
    step;
    title;
    description;
    audio;
    picture;
    video_file_path;
    constructor(id, bundle_id, step, title, description, audio, picture, video_file_path) {
        this.id = id;
        this.bundle_id = bundle_id;
        this.step = step;
        this.title = title;
        this.description = description;
        this.audio = audio;
        this.picture = picture;
        this.video_file_path = video_file_path;
    }
}
module.exports = Exercise;