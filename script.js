// Your Firebase configuration (replace with your own)

const firebaseConfig = {

    apiKey: "AIzaSyAtR_zciupzwCcGihizE4iFIoBs36PLccc",

    authDomain: "clockserver-ba143.firebaseapp.com",

    databaseURL: "https://clockserver-ba143-default-rtdb.europe-west1.firebasedatabase.app",

    projectId: "clockserver-ba143",

    storageBucket: "clockserver-ba143.firebasestorage.app",

    messagingSenderId: "177428270362",

    appId: "1:177428270362:web:fc127a59039b0a165a30a3",

    measurementId: "G-4VLYV09VM4"

};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// DOM elements
const clockElement = document.getElementById("clock");
const statusElement = document.getElementById("status");
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const resetBtn = document.getElementById("resetBtn");
const alarmSound = document.getElementById("alarmSound");

// Clock state
let startTime = 0;
let timerInterval = null;
let isHost = false;
let countdownInterval = null;

// Reference to Firebase Realtime Database
const clockRef = database.ref("clock");

// Start the clock
function startClock() {
    startTime = Date.now()+3000;
    clockRef.set({ action: "start", time: startTime });
    statusElement.textContent = "Clock will start in 3 seconds...";
    triggerCountdown(3, () => {
        statusElement.textContent = "Clock is running...";
        if (timerInterval) clearInterval(timerInterval);
        timerInterval = setInterval(updateClock, 1000);
    });
}

// Stop the clock
function stopClock() {
    clockRef.set({ action: "stopping" });
    clockRef.set({ action: "stop" });
    statusElement.textContent = "Clock stopped.";
    clearInterval(timerInterval);
}

// Reset the clock
function resetClock() {
    clockRef.set({ action: "resetting" });
    clockRef.set({ action: "reset" });
    startTime = Date.now();
    clockElement.textContent = "00:00:00";
    statusElement.textContent = "Clock reset.";
    clearInterval(timerInterval);

}

// Update the clock display
function updateClock() {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const hours = Math.floor(elapsed / 3600);
    const minutes = Math.floor((elapsed % 3600) / 60);
    const seconds = elapsed % 60;
    clockElement.textContent =
        `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

// Trigger countdown with blinking and sound
function triggerCountdown(seconds, callback) {
    const clock = document.querySelector(".clock");
    clock.classList.add("blink");
    alarmSound.play();
    let remaining = seconds;

    if (countdownInterval) clearInterval(countdownInterval);
    countdownInterval = setInterval(() => {
        remaining--;
        if (remaining <= 0) {
            clearInterval(countdownInterval);
            clock.classList.remove("blink");
            alarmSound.pause();
            alarmSound.currentTime = 0;
            callback();
        }
    }, 1000);
}

// Listen for changes in Firebase
clockRef.on("value", (snapshot) => {
    const data = snapshot.val();
    if (!data) return;

    if (data.action === "start") {
        if (!isHost) {
            startTime = data.time;
            statusElement.textContent = "Clock will start in 3 seconds...";
            triggerCountdown(3, () => {
                statusElement.textContent = "Clock is running...";
                if (timerInterval) clearInterval(timerInterval);
                timerInterval = setInterval(updateClock, 1000);
            });
        }
    } else if (data.action === "stopping") {
        if (!isHost) {
            statusElement.textContent = "Clock will stop in 3 seconds...";
            triggerCountdown(3, () => {
                clearInterval(timerInterval);
                statusElement.textContent = "Clock stopped.";
            });
        }
    } else if (data.action === "resetting") {
        if (!isHost) {
            statusElement.textContent = "Clock will reset in 3 seconds...";
            clearInterval(timerInterval);
            clockElement.textContent = "00:00:00";
            statusElement.textContent = "Clock reset.";
        }
    } else if (data.action === "reset") {
        if (!isHost) {
            clearInterval(timerInterval);
            clockElement.textContent = "00:00:00";
            statusElement.textContent = "Clock reset.";
        }
    } else if (data.action === "stop") {
        if (!isHost) {
            clearInterval(timerInterval);
            statusElement.textContent = "Clock stopped.";
        }
    }
});

// Event listeners
startBtn.addEventListener("click", () => {
    isHost = true;
    startClock();
});

stopBtn.addEventListener("click", () => {
    isHost = true;
    stopClock();
});

resetBtn.addEventListener("click", () => {
    isHost = true;
    resetClock();
});
