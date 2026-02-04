const express = require("express");
const db = require("../db");

const router = express.Router();

function requireLogin(req, res, next) {
  if (!req.session.user) return res.redirect("/login");
  next();
}

router.get("/items", (req, res) => {
  db.all("SELECT * FROM items", (err, items) => {
    res.render("items", { items: items || [] });
  });
});

router.post("/cart/add", requireLogin, (req, res) => {
  const userId = req.session.user.id;
  const itemId = Number(req.body.itemId);

  // If exists, qty++
  db.get(
    "SELECT * FROM cart WHERE user_id = ? AND item_id = ?",
    [userId, itemId],
    (err, row) => {
      if (row) {
        db.run(
          "UPDATE cart SET qty = qty + 1 WHERE user_id = ? AND item_id = ?",
          [userId, itemId],
          () => res.redirect("/cart")
        );
      } else {
        db.run(
          "INSERT INTO cart(user_id, item_id, qty) VALUES (?, ?, 1)",
          [userId, itemId],
          () => res.redirect("/cart")
        );
      }
    }
  );
});

router.get("/cart", requireLogin, (req, res) => {
  const userId = req.session.user.id;
  db.all(
    `
    SELECT c.item_id, c.qty, i.name, i.price
    FROM cart c
    JOIN items i ON i.id = c.item_id
    WHERE c.user_id = ?
    `,
    [userId],
    (err, rows) => {
      const cart = rows || [];
      const total = cart.reduce((sum, x) => sum + x.price * x.qty, 0);
      res.render("cart", { cart, total });
    }
  );
});

router.post("/cart/remove", requireLogin, (req, res) => {
  const userId = req.session.user.id;
  const itemId = Number(req.body.itemId);

  db.run(
    "DELETE FROM cart WHERE user_id = ? AND item_id = ?",
    [userId, itemId],
    () => res.redirect("/cart")
  );
});

router.post("/checkout", requireLogin, (req, res) => {
  const userId = req.session.user.id;

  db.all(
    `
    SELECT c.qty, i.price
    FROM cart c
    JOIN items i ON i.id = c.item_id
    WHERE c.user_id = ?
    `,
    [userId],
    (err, rows) => {
      const cart = rows || [];
      const total = cart.reduce((sum, x) => sum + x.price * x.qty, 0);

      if (total === 0) return res.redirect("/cart");

      const createdAt = new Date().toISOString();

      db.run(
        "INSERT INTO orders(user_id, total, created_at) VALUES (?, ?, ?)",
        [userId, total, createdAt],
        () => {
          db.run("DELETE FROM cart WHERE user_id = ?", [userId], () => {
            res.redirect("/orders");
          });
        }
      );
    }
  );
});

router.get("/orders", requireLogin, (req, res) => {
  const userId = req.session.user.id;
  db.all(
    "SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC",
    [userId],
    (err, orders) => {
      res.render("orders", { orders: orders || [] });
    }
  );
});

module.exports = router;