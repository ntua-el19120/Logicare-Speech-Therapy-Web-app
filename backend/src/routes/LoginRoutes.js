const express = require("express");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const passport = require("passport");
const { Strategy } = require("passport-local");
const session = require("express-session");
const userCrud = require("../crud/UserCrud");

const router = express.Router();
router.use(bodyParser.json());


/*
This checks req.isAuthenticated() (a Passport method) to see if a session is active.
If yes, calls next() to move on.
If no, responds with a 401 Unauthorized.*/

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.status(401).json({ message: "Not logged in" });
}



// Passport Local Strategy
passport.use(
  new Strategy(
    { usernameField: "email" }, // expect "email" in frontend value
    async function verify(email, password, callback) {
      try {
        const user = await userCrud.getUserByEmail(email);
        if (!user) {
          // callback(error, user object, extra info )
          return callback(null, false, { message: "User not found" });
        }

        const storedHash = user.hashed_password;
        bcrypt.compare(password, storedHash, (err, isMatch) => {
          // callback(error, user object, extra info )
          if (err) return callback(err);
          // callback(error, user object, extra info )
          if (!isMatch) return callback(null, false, { message: "Invalid password" });
          // callback(error, user object, extra info )
          return callback(null, user);
        });
      } catch (err) {
        return callback(err);
      }
    }
  )
);

/* Called once right after a successful login.
 user here is the full user object returned by your verify() function in the strategy.
 You decide what to save into the session — here you’re saving only the user.id instead of the entire user object.
 callback(null, user.id) means:
 null → no error occurred.
 user.id → this is what will be stored in the session cookie.

 Keeps sensitive data (like password hash) out of the cookie. */

passport.serializeUser((user, callback) => {
  callback(null, user.id); // store only ID in session
});



/* 
Called on every request that comes in after login, if there’s a session cookie.
Passport reads the stored id from the cookie and gives it to you.
You fetch the full user from the database (userCrud.getUserById(id)).
to access the user u use the req.user  
*/

passport.deserializeUser(async (id, callback) => {
  try {
    const user = await userCrud.getUserById(id);
    callback(null, user);
  } catch (err) {
    callback(err);
  }
});

/**
 * POST /login
 */
router.post(
  "/login",
  passport.authenticate("local"),
  (req, res) => {
    res.json({
      message: "Login successful",
      user: {
        id: req.user.id,
        email: req.user.email,
        type: req.user.type,
        name: req.user.name,
        surname: req.user.surname,
        year_of_birth: req.user.year_of_birth,
        clinician_id: req.user.clinician_id
      }
    });
  }
);

/**
 * POST /logout
 */
router.post("/logout", (req, res, next) => {
  req.logout(err => {
    if (err) return next(err);
    res.json({ message: "Logged out successfully" });
  });
});

/**
 * GET /me → returns logged-in user
 */
router.get("/me", ensureAuthenticated, (req, res) => {
  res.json(req.user);
});


module.exports = router;
