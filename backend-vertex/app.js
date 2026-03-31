const express = require("express");
const mongoSanitize = require("express-mongo-sanitize");
const userRouter = require("./routes/userRoutes");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const app = express();

// 🛡️ 1. SECURITY HEADERS & CORS FIRST
app.use(cors());
const allowedOrigins = [
  "http://127.0.0.1:5500",
  "http://127.0.0.1:5501", // Your current local port
  "https://your-vertex-bank.vercel.app", // Your live Vercel link
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or postman)
      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) === -1) {
        return callback(
          new Error("CORS Policy: This origin is not allowed"),
          false,
        );
      }
      return callback(null, true);
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true, // 👈 THIS must be true to match your frontend
  }),
);
app.use(helmet());

// 🛡️ 2. RATE LIMITING (Prevents Brute Force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    status: "fail",
    message: "Too many login attempts. Please try again in 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply limiter only to auth routes
app.use("/api/users/login", authLimiter);
app.use("/api/users/signup", authLimiter);

// 📦 3. BODY PARSER
app.use(express.json({ limit: "10kb" }));
// app.use(mongoSanitize());
app.use(cookieParser());

// 🛡️ 4. DATA SANITIZATION (The Fix)
// We tell it to allowDots to avoid the "read-only" property crash on some systems
// app.use(
//   mongoSanitize({
//     allowDots: true,
//     replaceWith: '_',
//   }),
// );
// 🛣️ 5. ROUTES
app.use("/api/users", userRouter);

module.exports = app;
app.use((err, req, res, next) => {
  res.status(err.statusCode || 500).json({
    status: "error",
    message: err.message || "Something went very wrong!",
  });
});
