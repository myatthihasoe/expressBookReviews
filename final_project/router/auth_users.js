const express = require("express");
const jwt = require("jsonwebtoken");
const books = require("./booksdb.js");

const registeredUsers = express.Router();
const users = [];

const isValid = (username) =>
  users.some((user) => user.username === username);

const authenticatedUser = (username, password) =>
  users.some(
    (user) => user.username === username && user.password === password
  );

// Only registered users can log in.
registeredUsers.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      message: "Username and password are required.",
    });
  }

  if (!authenticatedUser(username, password)) {
    return res.status(401).json({
      message: "Invalid username or password.",
    });
  }

  const accessToken = jwt.sign({ username }, "access", { expiresIn: "1h" });
  req.session.accessToken = accessToken;
  req.session.username = username;

  return res.status(200).json({
    message: "User successfully logged in.",
    accessToken,
  });
});

// Add a new review or modify the logged-in user's existing review.
registeredUsers.put("/auth/review/:isbn", (req, res) => {
  const { isbn } = req.params;
  const review = req.body.review ?? req.query.review;
  const username = req.user.username;

  if (!books[isbn]) {
    return res.status(404).json({ message: "Book not found." });
  }

  if (typeof review !== "string" || review.trim() === "") {
    return res.status(400).json({ message: "A non-empty review is required." });
  }

  const reviewAlreadyExists = Object.prototype.hasOwnProperty.call(
    books[isbn].reviews,
    username
  );
  books[isbn].reviews[username] = review.trim();

  return res.status(200).json({
    message: reviewAlreadyExists
      ? "Review successfully updated."
      : "Review successfully added.",
    reviews: books[isbn].reviews,
  });
});

// Delete only the logged-in user's own review.
registeredUsers.delete("/auth/review/:isbn", (req, res) => {
  const { isbn } = req.params;
  const username = req.user.username;

  if (!books[isbn]) {
    return res.status(404).json({ message: "Book not found." });
  }

  if (!Object.prototype.hasOwnProperty.call(books[isbn].reviews, username)) {
    return res.status(404).json({
      message: "You do not have a review for this book.",
    });
  }

  delete books[isbn].reviews[username];
  return res.status(200).json({
    message: "Review successfully deleted.",
    reviews: books[isbn].reviews,
  });
});

module.exports.authenticated = registeredUsers;
module.exports.isValid = isValid;
module.exports.authenticatedUser = authenticatedUser;
module.exports.users = users;
