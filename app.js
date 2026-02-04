const express = require("express");
const session = require("express-session");
const path = require("path");
const expressLayouts = require("express-ejs-layouts");

const authRoutes = require("./routes/auth");
const shopRoutes = require("./routes/shop");

const app = express();  


app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(expressLayouts);
app.set("layout", "layout");


app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.use(
  session({
    secret: "mysecretkey",
    resave: false,
    saveUninitialized: false,
  })
);


app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});


app.use("/", authRoutes);
app.use("/", shopRoutes);


app.get("/", (req, res) => {
  res.redirect("/items");
});


app.listen(3000, () => {
  console.log("Server running at http://localhost:3000");
});
