const jwt = require('jsonwebtoken');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// HELPER FUNCTION: To sign the "Passport"
const signToken = id => {
  return jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};
// 1. Add 'req' to the parameters
const createSendToken = (user, statusCode, req, res) => {
  const token = signToken(user._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
    ),
    httpOnly: true,
    // Now 'req' is defined and works!
    secure: req.secure || req.headers['x-forwarded-proto'] === 'https',
    sameSite: 'Lax',
  };

  res.cookie('jwt', token, cookieOptions);

  // Remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: { user },
  });
};
// --- LOGIN ---
exports.login = async (req, res) => {
  try {
    const { username, pin } = req.body;

    if (!username || !pin) {
      return res
        .status(400)
        .json({ message: 'Please provide username and pin' });
    }

    const user = await User.findOne({ username }).select('+pin');

    if (!user || !(await user.correctPin(pin, user.pin))) {
      return res.status(401).json({ message: 'Incorrect username or pin' });
    }
    user.lastLogin = Date.now();
    await user.save({ validateBeforeSave: false });

    // 🛡️ Use the helper here too!
    createSendToken(user, 200, req, res);
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// --- SIGNUP ---
exports.signup = async (req, res) => {
  try {
    const newUser = await User.create({
      name: req.body.name,
      username: req.body.username,
      pin: req.body.pin,
      balance: req.body.balance || 0,
    });

    // 🛡️ Use the helper to sign token and send cookie
    createSendToken(newUser, 201, req, res);
  } catch (err) {
    res.status(400).json({ status: 'fail', message: err.message });
  }
};

const { promisify } = require('util'); // Standard Node tool

exports.protect = async (req, res, next) => {
  try {
    // 1. Get token and check if it exists
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.jwt) {
      token = req.cookies.jwt;
    }

    if (!token) {
      return res.status(401).json({
        status: 'fail',
        message: 'You are not logged in! Please login to get access.',
      });
    }

    // 2. Verification (Checking the "Seal")
    // We promisify jwt.verify so we can use 'await'
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // 3. Check if user still exists in the database
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return res.status(401).json({
        status: 'fail',
        message: 'The user belonging to this token no longer exists.',
      });
    }

    // 4. GRANT ACCESS to protected route
    // We attach the user data to the "req" object so the next function can use it!
    req.user = currentUser;
    next();
  } catch (err) {
    res.status(401).json({
      status: 'fail',
      message: 'Invalid token. Please log in again!',
    });
  }
};

exports.transferMoney = async (req, res) => {
  try {
    const { recipientUsername, amount, pin } = req.body;
    const sender = req.user;

    const user = await User.findById(req.user.id).select('+pin');

    if (!(await user.correctPin(pin, user.pin))) {
      return res.status(401).json({
        status: 'fail',
        message: 'Incorrect PIN. Transfer cancelled.',
      });
    }

    if (amount <= 0) {
      return res
        .status(400)
        .json({ status: 'fail', message: 'Amount must be greater than 0' });
    }

    if (sender.balance < amount) {
      return res
        .status(400)
        .json({ status: 'fail', message: 'Insufficient funds' });
    }

    const receiver = await User.findOne({ username: recipientUsername });
    if (!receiver) {
      return res
        .status(404)
        .json({ status: 'fail', message: 'Receiver not found' });
    }

    // 🛡️ FIX 1: Changed targetUsername to recipientUsername
    if (sender.username === recipientUsername) {
      return res
        .status(400)
        .json({ status: 'fail', message: 'You cannot send money to yourself' });
    }

    sender.movements = sender.movements || [];
    sender.movementsDates = sender.movementsDates || [];
    receiver.movements = receiver.movements || [];
    receiver.movementsDates = receiver.movementsDates || [];

    sender.balance -= amount;
    sender.movements.push(-amount);
    sender.movementsDates.push(new Date().toISOString());

    receiver.balance += amount;
    receiver.movements.push(amount);
    receiver.movementsDates.push(new Date().toISOString());

    await sender.save({ validateBeforeSave: false });
    await receiver.save({ validateBeforeSave: false });

    res.status(200).json({
      status: 'success',
      // 🛡️ FIX 2: Changed targetUsername to recipientUsername
      message: `Successfully transferred $${amount} to ${recipientUsername}`,
      data: {
        user: sender,
      },
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};
exports.requestLoan = async (req, res) => {
  try {
    const { amount, pin } = req.body;

    // 🛡️ IMPORTANT: You must verify the PIN manually in the controller
    // because the middleware only checked the LENGTH, not if it's CORRECT.
    const user = await User.findById(req.user.id).select('+pin');

    if (!(await user.correctPin(pin, user.pin))) {
      return res.status(401).json({ status: 'fail', message: 'Incorrect PIN' });
    }

    // ... your 10% deposit check logic here ...
    const hasEnoughDeposit = user.movements.some(mov => mov >= amount * 0.1);

    if (!hasEnoughDeposit) {
      return res.status(400).json({ status: 'fail', message: 'Loan denied.' });
    }

    // 3. Update User Data
    user.balance += amount;
    user.movements.push(amount);
    user.movementsDates.push(new Date().toISOString());

    // 4. Save to MongoDB
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      status: 'success',
      message: 'Loan approved! 🏦',
      data: { user },
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};
exports.closeAccount = async (req, res) => {
  try {
    const { confirmUsername, confirmPin } = req.body;
    const user = await User.findById(req.user.id).select('+pin');

    // 1. Verify Username matches the logged-in user
    if (confirmUsername !== user.username) {
      return res
        .status(400)
        .json({ status: 'fail', message: 'Username does not match!' });
    }

    // 2. Verify PIN
    if (!(await user.correctPin(confirmPin, user.pin))) {
      return res.status(401).json({
        status: 'fail',
        message: 'Incorrect PIN. Account closure aborted.',
      });
    }

    // 3. Delete the user from MongoDB
    await User.findByIdAndDelete(req.user.id);

    // 4. Send success and "log out" the user on the frontend
    res.status(204).json({
      status: 'success',
      data: null,
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};
