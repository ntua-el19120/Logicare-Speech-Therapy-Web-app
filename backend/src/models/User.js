class User {
    id;
    type;
    email;
    name;
    surname;
    year_of_birth;
    hashed_password;
    clinician_id;
    constructor(id, type, email, name, surname, year_of_birth, hashed_password, clinician_id) {
        this.id = id;
        this.type = type;
        this.email = email;
        this.name = name;
        this.surname = surname;
        this.year_of_birth = year_of_birth;
        this.hashed_password = hashed_password;
        this.clinician_id = clinician_id;
    }
}

module.exports = User;