const express = require("express");
const bcrypt = require("bcrypt");
const db = require("../db");

const router = express.Router();

router.get("/register", (req, res) => res.render("register", { error: null }));

router.post("/register", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.render("register", { error: "All fields required." });

  const hash = await bcrypt.hash(password, 10);

  db.run(
    "INSERT INTO users(username, password_hash) VALUES (?, ?)",
    [username, hash],
    function (err) {
      if (err) return res.render("register", { error: "Username already taken." });

      req.session.user = { id: this.lastID, username };
      res.redirect("/items");
    }
  );
});

router.get("/login", (req, res) => res.render("login", { error: null }));

router.post("/login", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.render("login", { error: "All fields required." });

  db.get("SELECT * FROM users WHERE username = ?", [username], async (err, user) => {
    if (err || !user) return res.render("login", { error: "Invalid credentials." });

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.render("login", { error: "Invalid credentials." });

    req.session.user = { id: user.id, username: user.username };
    res.redirect("/items");
  });
});

router.post("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/login"));
});

module.exports = router;
