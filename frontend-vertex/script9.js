"use strict";

// --- ELEMENTS ---
const labelWelcome = document.querySelector(".welcome");
const labelDate = document.querySelector(".date");
const labelBalance = document.querySelector(".balance__value");
const labelSumIn = document.querySelector(".summary__value--in");
const labelSumOut = document.querySelector(".summary__value--out");
const labelSumInterest = document.querySelector(".summary__value--interest");
// const labelLastLogin = document.querySelector('.login-date');
const labelTimer = document.querySelector(".timer");

const containerApp = document.querySelector(".app");
const containerMovements = document.querySelector(".movements");

const btnLogin = document.querySelector(".login__btn");
const btnTransfer = document.querySelector(".form__btn--transfer");
const btnLoan = document.querySelector(".form__btn--loan");
const btnClose = document.querySelector(".form__btn--close");
const btnSort = document.querySelector(".btn--sort");
const inputLoginUsername = document.querySelector("#login-user");
const inputLoginPin = document.querySelector("#login-pin");
const inputTransferTo = document.querySelector(".form__input--to");
const inputTransferAmount = document.querySelector(".form__input--amount");
const inputTransferPin = document.querySelector(".form__input--transfer-pin");
const inputLoanAmount = document.querySelector(".form__input--loan-amount");
const inputLoanPin = document.querySelector(".form__input--loan-pin");
const inputCloseUsername = document.querySelector(".form__input--user");
const inputClosePin = document.querySelector(".form__input--pin");
const screenHome = document.querySelector("#screen-home");
const screenSignup = document.querySelector("#screen-signup");
const screenLogin = document.querySelector("#screen-login");

// Navigation Triggers
const btnGoToLogin = document.querySelector("#btn-go-to-login");
const btnGoToSignup = document.querySelector("#btn-go-to-signup");
const btnBackButtons = document.querySelectorAll(".btn-back");

// Signup Submissions
const inputSignupName = document.querySelector("#signup-name");
const inputSignupUsername = document.querySelector("#signup-user");
const inputSignupPin = document.querySelector("#signup-pin");
const btnSubmitSignup = document.querySelector("#btn-submit-signup");

// Login Submissions
// const inputLoginUsername = document.querySelector("#login-user");
// const inputLoginPin = document.querySelector("#login-pin");
const btnSubmitLogin = document.querySelector("#btn-submit-login");
// --- STATE ---
let currentAccount, timer;
let sorted = false;
const API_URL = "https://vertex-bank-app.onrender.com/api/users"; // 🌐 Centralized API Path

// --- FUNCTIONS ---

const formatCurr = (value, locale = "en-US", currency = "USD") => {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency,
  }).format(value);
};

const formatDate = (date, locale) => {
  const daysPassed = (date1, date2) =>
    Math.round(Math.abs(date2 - date1) / (24 * 60 * 60 * 1000));
  const diff = daysPassed(new Date(), date);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff <= 7) return `${diff} days ago`;
  return new Intl.DateTimeFormat(locale).format(date);
};

const displayMovements = function (acc, sort = false) {
  containerMovements.innerHTML = "";

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
    const type = movement > 0 ? "deposit" : "withdrawal";
    const date = new Date(movementDate);
    const displayDate = formatDate(date, acc.locale || "en-US");

    const html = `
      <div class="movements__row">
        <div class="movements__type movements__type--${type}">${i + 1} ${type}</div>
        <div class="movements__date">${displayDate}</div>
        <div class="movements__value">${formatCurr(movement, acc.locale, acc.currency)}</div>
      </div>`;

    containerMovements.insertAdjacentHTML("afterbegin", html);
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
    .filter((mov) => mov > 0)
    .reduce((acc, mov) => acc + mov, 0);
  labelSumIn.textContent = formatCurr(incomes, acc.locale, acc.currency);

  const out = movs.filter((mov) => mov < 0).reduce((acc, mov) => acc + mov, 0);
  labelSumOut.textContent = formatCurr(Math.abs(out), acc.locale, acc.currency);

  const interest = movs
    .filter((mov) => mov > 0)
    .map((deposit) => (deposit * (acc.interestRate || 1.2)) / 100)
    .filter((int) => int >= 1)
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
  console.log("Refreshing Dashboard... 🔄");
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
      labelWelcome.textContent = "Log in to get started";
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
// btnSignup.addEventListener("click", async function (e) {
//   e.preventDefault();

//   const name = inputSignupName.value;
//   const username = inputSignupUsername.value;
//   const pin = inputSignupPin.value;

//   // Basic frontend validation
//   if (!name || !username || !pin) {
//     alert("Please fill out all fields to create an account.");
//     return;
//   }

//   if (pin.length !== 4 || isNaN(Number(pin))) {
//     alert("PIN must be exactly a 4-digit number.");
//     return;
//   }

//   try {
//     // 🌍 Assuming your backend route is /signup or /register
//     const response = await fetch(`${API_URL}/signup`, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({
//         name: name,
//         username: username,
//         pin: pin,
//       }),
//     });

//     const data = await response.json();

//     if (data.status === "success") {
//       alert("Account successfully created! 🎉 You can now log in.");

//       // Clear signup inputs
//       inputSignupName.value =
//         inputSignupUsername.value =
//         inputSignupPin.value =
//           "";
//     } else {
//       // Handles backend validation errors (e.g., "Username already taken")
//       alert(data.message || "Registration failed.");
//     }
//   } catch (err) {
//     console.error("Signup Error 💥", err);
//     alert("Could not connect to the server. Please try again.");
//   }
// });
// btnLogin.addEventListener("click", async function (e) {
//   e.preventDefault();

//   const username = inputLoginUsername.value;
//   const pin = inputLoginPin.value;

//   if (!username || !pin) {
//     alert("Please enter both username and PIN");
//     return;
//   }

//   try {
//     console.log("Attempting login at:", `${API_URL}/login`);

//     const response = await fetch(`${API_URL}/login`, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({
//         username: username,
//         pin: pin,
//       }),
//       // 'include' is used if your backend sends cookies,
//       // but we will also store the token manually for headers.
//       credentials: "include",
//     });

//     const data = await response.json();

//     if (data.status === "success") {
//       // 🛡️ 1. SAVE THE SECURITY TOKEN
//       // This is the "Key" we will show the server for Transfers/Loans
//       localStorage.setItem("jwt", data.token);

//       // 2. SET THE CURRENT ACCOUNT
//       currentAccount = data.data.user;

//       // 3. UI UPDATES
//       labelWelcome.textContent = `Welcome back, ${currentAccount.name.split(" ")[0]}`;
//       containerApp.style.opacity = 1; // Show the app

//       // 4. CLEAR INPUTS & FOCUS
//       inputLoginUsername.value = inputLoginPin.value = "";
//       inputLoginPin.blur();

//       // 5. INITIALIZE APP STATE
//       if (timer) clearInterval(timer);
//       timer = startLogOutTimer();

//       // Update the balance, movements, and summary
//       updateUI(currentAccount);

//       console.log("Login successful! Token saved to localStorage.");
//     } else {
//       // Show the specific error from your backend (e.g., "Incorrect PIN")
//       alert(data.message || "Login failed");
//     }
//   } catch (err) {
//     console.error("Connection Error 💥", err);
//     alert("Could not connect to the bank server. Please try again later.");
//   }
// });

btnTransfer.addEventListener("click", async function (e) {
  e.preventDefault();
  const amount = +inputTransferAmount.value;
  const targetUsername = inputTransferTo.value;
  const pin = inputTransferPin.value;
  const token = localStorage.getItem("jwt"); // 🔑 Get the key

  try {
    // 🌍 Use API_URL, not localhost!
    const response = await fetch(`${API_URL}/transfer`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`, // ✅ Send the key to the server
      },
      body: JSON.stringify({
        recipientUsername: targetUsername,
        amount: amount,
        pin: pin,
      }),
      credentials: "include",
    });

    const data = await response.json();

    if (data.status === "success") {
      currentAccount = data.data.user;
      updateUI(currentAccount);
      inputTransferAmount.value =
        inputTransferTo.value =
        inputTransferPin.value =
          "";
      alert("Transfer Successful! ✅");
    } else {
      alert(data.message);
    }
  } catch (err) {
    alert("Transfer failed. Please check connection.");
  }
});
btnLoan.addEventListener("click", async function (e) {
  e.preventDefault();
  const amount = Math.floor(inputLoanAmount.value);
  const pin = inputLoanPin.value;
  const token = localStorage.getItem("jwt");

  if (amount > 0) {
    try {
      const response = await fetch(`${API_URL}/request-loan`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // ✅ Added
        },
        body: JSON.stringify({ amount, pin }),
        credentials: "include",
      });

      const data = await response.json();

      if (data.status === "success") {
        currentAccount = data.data.user;
        updateUI(currentAccount);
        inputLoanAmount.value = inputLoanPin.value = "";
        alert(data.message);
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert("Loan request failed.");
    }
  }
});
btnClose.addEventListener("click", async function (e) {
  e.preventDefault();

  const confirmUsername = inputCloseUsername.value;
  const confirmPin = inputClosePin.value;
  const token = localStorage.getItem("jwt"); // 🔑 Retrieve the key

  if (confirmUsername && confirmPin) {
    if (
      confirm(
        `Are you sure you want to permanently delete your account, ${confirmUsername}? This action cannot be undone.`,
      )
    ) {
      try {
        // 🌍 1. Use API_URL instead of 127.0.0.1
        const response = await fetch(`${API_URL}/close-account`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`, // ✅ 2. Show the ID Card
          },
          body: JSON.stringify({ confirmUsername, confirmPin }),
          credentials: "include",
        });

        // 3. Handle the response
        if (response.status === 204) {
          // Success: No Content (standard for DELETE)
          containerApp.style.opacity = 0;
          labelWelcome.textContent = "Log in to get started";
          inputCloseUsername.value = inputClosePin.value = "";

          // Clear the token since the account is gone
          localStorage.removeItem("jwt");

          alert("Account successfully closed. We are sorry to see you go! 👋");
        } else {
          // If the status isn't 204, the server likely sent an error message
          const data = await response.json();
          alert(
            data.message || "Could not close account. Please check your PIN.",
          );
        }
      } catch (err) {
        console.error("Close Account Error:", err);
        alert("Could not connect to the server. Please check your internet.");
      }
    }
  }
});
btnSort.addEventListener("click", function (e) {
  e.preventDefault();

  // Toggle the state (if it's true, make it false, and vice versa)
  sorted = !sorted;

  // Re-run the UI update with the new sort state
  displayMovements(currentAccount, sorted);
});
btnGoToLogin.addEventListener("click", function () {
  screenHome.classList.add("hidden");
  screenLogin.classList.remove("hidden");
  inputLoginUsername.focus();
});

btnGoToSignup.addEventListener("click", function () {
  screenHome.classList.add("hidden");
  screenSignup.classList.remove("hidden");
  inputSignupName.focus();
});

// Bind all back buttons to return to the selection menu
btnBackButtons.forEach((btn) => {
  btn.addEventListener("click", function () {
    screenSignup.classList.add("hidden");
    screenLogin.classList.add("hidden");
    screenHome.classList.remove("hidden");
  });
});

// ==========================================
// 3. SECURE SIGNUP ENGINE (POST)
// ==========================================
btnSubmitSignup.addEventListener("click", async function (e) {
  e.preventDefault();

  const name = inputSignupName.value;
  const username = inputSignupUsername.value;
  const pin = inputSignupPin.value;

  if (!name || !username || !pin) {
    alert("Please fill out all fields to register.");
    return;
  }

  try {
    const response = await fetch(`${API_URL}/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, username, pin }),
    });

    const data = await response.json();

    if (data.status === "success") {
      alert("Account successfully created! 🎉 Redirecting to options menu.");

      // Clear signup inputs safely
      inputSignupName.value =
        inputSignupUsername.value =
        inputSignupPin.value =
          "";

      // Flip layout state back to gateway
      screenSignup.classList.add("hidden");
      screenHome.classList.remove("hidden");
    } else {
      alert(data.message || "Registration failed.");
    }
  } catch (err) {
    console.error("Signup Error:", err);
    alert("Could not process registration with Render server.");
  }
});

// ==========================================
// 4. SECURE LOGIN ENGINE (POST)
// ==========================================
btnSubmitLogin.addEventListener("click", async function (e) {
  e.preventDefault();

  const username = inputLoginUsername.value;
  const pin = inputLoginPin.value;

  try {
    const response = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, pin }),
      credentials: "include",
    });

    const data = await response.json();

    if (data.status === "success") {
      // Set localized session asset
      localStorage.setItem("jwt", data.token);
      currentAccount = data.data.user;

      // Transition layouts cleanly
      screenLogin.classList.add("hidden");
      containerApp.style.opacity = 1; // Reveal the workspace dashboard safely
      labelWelcome.classList.remove("hidden");
      // Clear inputs
      inputLoginUsername.value = inputLoginPin.value = "";
      inputLoginPin.blur();

      // Fire state hooks
      labelWelcome.textContent = `Welcome back, ${currentAccount.name.split(" ")[0]}`;
      if (timer) clearInterval(timer);
      timer = startLogOutTimer();
      updateUI(currentAccount);
    } else {
      alert(data.message || "Authentication failed.");
    }
  } catch (err) {
    alert(`Could not complete credentials handshake: ${err.message}`);
  }
});
