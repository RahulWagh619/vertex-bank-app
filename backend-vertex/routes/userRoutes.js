const express = require('express');
const authController = require('../controllers/authController');
const router = express.Router();
const { body, validationResult } = require('express-validator');
// PUBLIC ROUTES
router.post('/signup', authController.signup);
router.post('/login', authController.login);

// PROTECTED ROUTES (Require Token)
router.use(authController.protect); // Professional Tip: This protects EVERYTHING below it!

router.get('/my-account', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: `Welcome to your vault, ${req.user.name}!`,
    balance: req.user.balance,
    movements: req.user.movements,
  });
});

// Helper to handle validation errors
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ status: 'fail', errors: errors.array() });
  }
  next();
};

// Application of rules
router.post(
  '/transfer',
  [
    body('amount').isNumeric().withMessage('Amount must be a number'),
    body('amount')
      .custom(val => val > 0)
      .withMessage('Amount must be positive'),
    body('recipientUsername')
      .notEmpty()
      .withMessage('Recipient username is required'),
    body('pin')
      .isLength({ min: 4, max: 4 })
      .withMessage('PIN must be 4 digits'),
    validate, // The gatekeeper
  ],
  authController.transferMoney,
);

router.post(
  '/request-loan',
  [
    body('amount')
      .isNumeric()
      .custom(val => val > 0)
      .withMessage('Amount must be a positive number'),
    body('pin').isLength({ min: 4, max: 4 }),
    validate,
  ],
  authController.requestLoan,
);

// THE NEW DELETE ROUTE
router.delete('/close-account', authController.closeAccount);

module.exports = router;
