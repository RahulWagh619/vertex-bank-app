'use strict';

// --- ELEMENTS ---
const labelWelcome = document.querySelector('.welcome');
const labelDate = document.querySelector('.date');
const labelBalance = document.querySelector('.balance__value');
const labelSumIn = document.querySelector('.summary__value--in');
const labelSumOut = document.querySelector('.summary__value--out');
const labelSumInterest = document.querySelector('.summary__value--interest');
// const labelLastLogin = document.querySelector('.login-date');
const labelTimer = document.querySelector('.timer');

const containerApp = document.querySelector('.app');
const containerMovements = document.querySelector('.movements');

const btnLogin = document.querySelector('.login__btn');
const btnTransfer = document.querySelector('.form__btn--transfer');
const btnLoan = document.querySelector('.form__btn--loan');
const btnClose = document.querySelector('.form__btn--close');
const btnSort = document.querySelector('.btn--sort');

const inputLoginUsername = document.querySelector('.login__input--user');
const inputLoginPin = document.querySelector('.login__input--pin');
const inputTransferTo = document.querySelector('.form__input--to');
const inputTransferAmount = document.querySelector('.form__input--amount');
const inputTransferPin = document.querySelector('.form__input--transfer-pin');
const inputLoanAmount = document.querySelector('.form__input--loan-amount');
const inputLoanPin = document.querySelector('.form__input--loan-pin');
const inputCloseUsername = document.querySelector('.form__input--user');
const inputClosePin = document.querySelector('.form__input--pin');

// --- STATE ---
let currentAccount, timer;
let sorted = false;
const API_URL = 'http://127.0.0.1:5000/api/users'; // 🌐 Centralized API Path

// --- FUNCTIONS ---

const formatCurr = (value, locale = 'en-US', currency = 'USD') => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
  }).format(value);
};

const formatDate = (date, locale) => {
  const daysPassed = (date1, date2) =>
    Math.round(Math.abs(date2 - date1) / (24 * 60 * 60 * 1000));
  const diff = daysPassed(new Date(), date);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff <= 7) return `${diff} days ago`;
  return new Intl.DateTimeFormat(locale).format(date);
};

const displayMovements = function (acc, sort = false) {
  containerMovements.innerHTML = '';

  // 1. Glue movements and dates together
  const movs = acc.movements || [];
  const dates = acc.movementsDates || [];

  const combined = movs.map((mov, i) => ({
    movement: mov,
    movementDate: dates[i] || new Date().toISOString(),
  }));

  // 2. Sort the combined array if the button was clicked
  // We use [a.movement - b.movement] for Ascending order
  if (sort) {
    combined.sort((a, b) => a.movement - b.movement);
  }

  // 3. Render the sorted (or unsorted) list
  combined.forEach((obj, i) => {
    const { movement, movementDate } = obj;
    const type = movement > 0 ? 'deposit' : 'withdrawal';
    const date = new Date(movementDate);
    const displayDate = formatDate(date, acc.locale || 'en-US');

    const html = `
      <div class="movements__row">
        <div class="movements__type movements__type--${type}">${i + 1} ${type}</div>
        <div class="movements__date">${displayDate}</div>
        <div class="movements__value">${formatCurr(movement, acc.locale, acc.currency)}</div>
      </div>`;

    containerMovements.insertAdjacentHTML('afterbegin', html);
  });
};

const calcDisplayBalance = function (acc) {
  // 🛡️ If the server sent a balance, use it! Otherwise, calculate it.
  acc.balance =
    acc.balance !== undefined
      ? acc.balance
      : (acc.movements || []).reduce((sum, mov) => sum + mov, 0);

  labelBalance.textContent = formatCurr(acc.balance, acc.locale, acc.currency);
};

const calcDisplaySummary = function (acc) {
  const movs = acc.movements || [];
  const incomes = movs
    .filter(mov => mov > 0)
    .reduce((acc, mov) => acc + mov, 0);
  labelSumIn.textContent = formatCurr(incomes, acc.locale, acc.currency);

  const out = movs.filter(mov => mov < 0).reduce((acc, mov) => acc + mov, 0);
  labelSumOut.textContent = formatCurr(Math.abs(out), acc.locale, acc.currency);

  const interest = movs
    .filter(mov => mov > 0)
    .map(deposit => (deposit * (acc.interestRate || 1.2)) / 100)
    .filter(int => int >= 1)
    .reduce((acc, int) => acc + int, 0);
  labelSumInterest.textContent = formatCurr(interest, acc.locale, acc.currency);
};
// const displayLastLogin = function (acc) {
//   // If no last login exists (first time user), show "First session"
//   if (!acc.lastLogin) {
//     labelLastLogin.textContent = 'First session';
//     return;
//   }

//   const lastDate = new Date(acc.lastLogin);

//   const options = {
//     hour: 'numeric',
//     minute: 'numeric',
//     day: 'numeric',
//     month: 'long',
//     year: 'numeric',
//   };

//   // Format it based on the user's local settings (e.g., hi-IN or en-US)
//   labelLastLogin.textContent = new Intl.DateTimeFormat(
//     acc.locale || 'en-US',
//     options,
//   ).format(lastDate);
// };

const updateUI = function (acc) {
  console.log('Refreshing Dashboard... 🔄');
  displayMovements(acc);
  calcDisplayBalance(acc);
  calcDisplaySummary(acc);
  // displayLastLogin(currentAccount);
};

const startLogOutTimer = function () {
  const tick = function () {
    const min = String(Math.floor(time / 60)).padStart(2, 0);
    const sec = String(time % 60).padStart(2, 0);

    // 1. In each call, print the remaining time to UI
    labelTimer.textContent = `${min}:${sec}`;

    // 2. When 0 seconds, stop timer and log out user
    if (time === 0) {
      clearInterval(timer);
      labelWelcome.textContent = 'Log in to get started';
      containerApp.style.opacity = 0;
      // Optional: Send a request to backend to clear the cookie
    }

    // 3. Decrease 1s
    time--;
  };

  // 4. Set time to 10 minutes (600 seconds)
  let time = 600;

  // 5. Call the timer every second
  tick(); // Call immediately so it doesn't wait 1s to start
  const timer = setInterval(tick, 1000);

  return timer; // We return this so we can "kill" it later
};

// --- EVENT HANDLERS ---

btnLogin.addEventListener('click', async function (e) {
  e.preventDefault();

  try {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: inputLoginUsername.value,
        pin: inputLoginPin.value,
      }),
      credentials: 'include', // 🛡️ CRITICAL: Hands over the JWT Cookie
    });

    const data = await response.json();

    if (data.status === 'success') {
      currentAccount = data.data.user;

      // UI Updates
      labelWelcome.textContent = `Welcome back, ${currentAccount.name.split(' ')[0]}`;
      containerApp.style.opacity = 100;

      // Clear inputs
      inputLoginUsername.value = inputLoginPin.value = '';
      inputLoginPin.blur();

      // Start Logic
      if (timer) clearInterval(timer);
      timer = startLogOutTimer();
      updateUI(currentAccount);
    } else {
      alert(data.message);
    }
  } catch (err) {
    console.error('Connection Error 💥', err);
    alert(`Could not connect to bank: ${err.message}`);
  }
});

btnTransfer.addEventListener('click', async function (e) {
  e.preventDefault();

  const amount = +inputTransferAmount.value;
  const targetUsername = inputTransferTo.value;
  // 🛡️ Get the PIN value
  const pin = inputTransferPin.value;

  try {
    const response = await fetch('http://127.0.0.1:5000/api/users/transfer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipientUsername: inputTransferTo.value, // 🛡️ MATCH THIS TO THE ERROR
        amount: +inputTransferAmount.value,
        pin: inputTransferPin.value, //Now the backend will finally receive the PIN!
      }),
      credentials: 'include',
    });

    const data = await response.json();
    console.log('--- SERVER RESPONSE ---', data);

    if (data.status === 'success') {
      // updateUI(currentAccount);
      // ... success logic
    } else {
      // 🛡️ Better error fallback
      alert(data.message || 'The server sent an error but forgot the message!');
    }
    if (data.status === 'success') {
      // Clear all fields including the new PIN
      inputTransferAmount.value =
        inputTransferTo.value =
        inputTransferPin.value =
          '';
      sorted = false;

      currentAccount = data.data.user;
      if (timer) clearInterval(timer);
      timer = startLogOutTimer();
      updateUI(currentAccount);
      alert('Transfer Successful! ✅');
    } else {
      alert(data.message); // This will now correctly show "Incorrect PIN"
    }
  } catch (err) {
    alert('Transfer failed. Please check connection.');
  }
});
btnLoan.addEventListener('click', async function (e) {
  e.preventDefault();

  const amount = Math.floor(inputLoanAmount.value);
  const pin = inputLoanPin.value; // 🛡️ Capture the PIN

  if (amount > 0) {
    try {
      const response = await fetch(`${API_URL}/request-loan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, pin }), // 🛡️ Send the PIN
        credentials: 'include',
      });

      const data = await response.json();

      if (data.status === 'success') {
        sorted = false;
        currentAccount = data.data.user;
        if (timer) clearInterval(timer);
        timer = startLogOutTimer();
        updateUI(currentAccount);

        // Clear fields
        inputLoanAmount.value = inputLoanPin.value = '';
        alert(data.message);
      } else {
        // This will now show your validation errors
        alert(data.message || (data.errors ? data.errors[0].msg : 'Error'));
      }
    } catch (err) {
      alert('Loan request failed.');
    }
  }
});
btnClose.addEventListener('click', async function (e) {
  e.preventDefault();

  const confirmUsername = inputCloseUsername.value;
  const confirmPin = inputClosePin.value;

  if (confirmUsername && confirmPin) {
    if (
      confirm(
        `Are you sure you want to permanently delete your account, ${confirmUsername}?`,
      )
    ) {
      try {
        const response = await fetch(
          'http://127.0.0.1:5000/api/users/close-account',
          {
            method: 'DELETE', // 🛡️ Using the DELETE method
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ confirmUsername, confirmPin }),
            credentials: 'include',
          },
        );

        if (response.status === 204) {
          // 1. Hide UI
          containerApp.style.opacity = 0;
          labelWelcome.textContent = 'Log in to get started';

          // 2. Clear inputs
          inputCloseUsername.value = inputClosePin.value = '';
          alert('Account successfully closed. We are sorry to see you go! 👋');
        } else {
          const data = await response.json();
          alert(data.message);
        }
      } catch (err) {
        alert('Could not close account. Check server connection.');
      }
    }
  }
});
btnSort.addEventListener('click', function (e) {
  e.preventDefault();

  // Toggle the state (if it's true, make it false, and vice versa)
  sorted = !sorted;

  // Re-run the UI update with the new sort state
  displayMovements(currentAccount, sorted);
});
