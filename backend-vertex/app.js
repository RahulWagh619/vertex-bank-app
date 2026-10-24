const express = require("express");
const mongoSanitize = require("express-mongo-sanitize");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const userRouter = require("./routes/userRoutes");

const app = express();

// 🌐 Enable reverse proxy trust for Render
app.set("trust proxy", 1);

// 🛡️ 1. SECURITY HEADERS & CORS FIRST
const allowedOrigins = [
  "http://127.0.0.1:5500",
  "http://127.0.0.1:5501", // Local dev port
  "https://vertex-bank-frontend.vercel.app", // Live Vercel frontend
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (e.g., Postman, mobile)
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
    credentials: true,
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

// Apply rate limiter specifically to auth endpoints
app.use("/api/users/login", authLimiter);
app.use("/api/users/signup", authLimiter);

// 📦 3. BODY PARSERS
app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());

// 🛡️ 4. SAFE MANUAL DATA SANITIZATION (Bypasses read-only req.query bug)
app.use((req, res, next) => {
  if (req.body) mongoSanitize.sanitize(req.body);
  if (req.params) mongoSanitize.sanitize(req.params);
  next();
});

// 🛣️ 5. ROUTES
app.use("/api/users", userRouter);

// 🚨 6. GLOBAL ERROR HANDLING MIDDLEWARE (Must be last before module.exports)
app.use((err, req, res, next) => {
  res.status(err.statusCode || 500).json({
    status: "error",
    message: err.message || "Something went very wrong!",
  });
});

module.exports = app;
