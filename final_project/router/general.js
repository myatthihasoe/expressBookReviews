const express = require("express");
const axios = require("axios");
const books = require("./booksdb.js");
const isValid = require("./auth_users.js").isValid;
const users = require("./auth_users.js").users;

const publicUsers = express.Router();
const API_BASE_URL = process.env.BOOKSHOP_API_URL || "http://localhost:5000";

publicUsers.post("/register", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      message: "Username and password are required.",
    });
  }

  if (isValid(username)) {
    return res.status(409).json({
      message: "User already exists. Please log in.",
    });
  }

  users.push({ username, password });
  return res.status(201).json({
    message: "User successfully registered. You can now log in.",
  });
});

// Get the complete list of books available in the shop.
publicUsers.get("/", (req, res) => res.status(200).json(books));

// Get book details based on ISBN.
publicUsers.get("/isbn/:isbn", (req, res) => {
  const book = books[req.params.isbn];

  if (!book) {
    return res.status(404).json({ message: "Book not found." });
  }

  return res.status(200).json(book);
});

// Get all books by an author (case-insensitive exact match).
publicUsers.get("/author/:author", (req, res) => {
  const requestedAuthor = req.params.author.toLowerCase();
  const matchingBooks = Object.fromEntries(
    Object.entries(books).filter(
      ([, book]) => book.author.toLowerCase() === requestedAuthor
    )
  );

  if (Object.keys(matchingBooks).length === 0) {
    return res.status(404).json({ message: "No books found for that author." });
  }

  return res.status(200).json(matchingBooks);
});

// Get all books by title (case-insensitive exact match).
publicUsers.get("/title/:title", (req, res) => {
  const requestedTitle = req.params.title.toLowerCase();
  const matchingBooks = Object.fromEntries(
    Object.entries(books).filter(
      ([, book]) => book.title.toLowerCase() === requestedTitle
    )
  );

  if (Object.keys(matchingBooks).length === 0) {
    return res.status(404).json({ message: "No books found with that title." });
  }

  return res.status(200).json(matchingBooks);
});

// Get reviews for a book.
publicUsers.get("/review/:isbn", (req, res) => {
  const book = books[req.params.isbn];

  if (!book) {
    return res.status(404).json({ message: "Book not found." });
  }

  return res.status(200).json(book.reviews);
});

// The following four Axios methods demonstrate asynchronous access with
// async/await and Promise callbacks, as required by the final project rubric.
const describeAxiosError = (error) => {
  const status = error.response?.status;
  const detail = error.response?.data?.message || error.message || "Unknown error";
  return status ? `${detail} (HTTP ${status})` : detail;
};

const getAllBooks = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/`);
    return response.data;
  } catch (error) {
    const message = `Failed to retrieve all books: ${describeAxiosError(error)}`;
    console.error(message);
    throw new Error(message);
  }
};

const getBookByISBN = (isbn) =>
  axios
    .get(`${API_BASE_URL}/isbn/${encodeURIComponent(isbn)}`)
    .then((response) => response.data)
    .catch((error) => {
      const message = `Failed to retrieve book by ISBN: ${describeAxiosError(error)}`;
      console.error(message);
      throw new Error(message);
    });

const getBooksByAuthor = async (author) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/author/${encodeURIComponent(author)}`
    );
    return response.data;
  } catch (error) {
    const message = `Failed to retrieve books by author: ${describeAxiosError(error)}`;
    console.error(message);
    throw new Error(message);
  }
};

const getBooksByTitle = async (title) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/title/${encodeURIComponent(title)}`
    );
    return response.data;
  } catch (error) {
    const message = `Failed to retrieve books by title: ${describeAxiosError(error)}`;
    console.error(message);
    throw new Error(message);
  }
};

module.exports.general = publicUsers;
module.exports.getAllBooks = getAllBooks;
module.exports.getBookByISBN = getBookByISBN;
module.exports.getBooksByAuthor = getBooksByAuthor;
module.exports.getBooksByTitle = getBooksByTitle;
