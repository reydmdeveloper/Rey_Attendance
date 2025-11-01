// ⬇️ IMPORTANT: Paste your deployed Google Apps Script URL here
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbz_7bgqReUCe7Q7uojvP549bJFxVPlU40gzcggG-g_K59Ed_aoPBkskVWhohSsVPK5l/exec";


document.addEventListener("DOMContentLoaded", () => {
    
    // --- Logic for login.html ---
    if (document.getElementById("login-form")) {
        handleLoginPage();
    }

    // --- Logic for attendance.html ---
    if (document.getElementById("clock-container")) {
        handleAttendancePage();
    }
});

/**
 * Manages all logic for the Login Page
 */
function handleLoginPage() {
    const loginForm = document.getElementById("login-form");
    const passToggleBtn = document.getElementById("pass-toggle-btn");
    const passwordInput = document.getElementById("password");

    // Clear session storage on login page load, just in case
    localStorage.removeItem("username");

    passToggleBtn.addEventListener("click", () => {
        if (passwordInput.type === "password") {
            passwordInput.type = "text";
            passToggleBtn.textContent = "Hide";
        } else {
            passwordInput.type = "password";
            passToggleBtn.textContent = "Show";
        }
    });

    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const username = document.getElementById("username").value;
        const password = document.getElementById("password").value;
        const errorMessage = document.getElementById("error-message");
        const loginButton = document.getElementById("login-button");

        loginButton.disabled = true;
        loginButton.textContent = "Signing in...";
        errorMessage.textContent = "";

        try {
            const payload = {
                action: "login",
                username: username,
                password: password
            };

            const response = await fetch(WEB_APP_URL, {
                method: "POST",
                mode: "cors", // Required for cross-origin requests
                headers: { "Content-Type": "text/plain;charset=utf-8" }, // Apps Script quirk
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (data.success) {
                // On success, save username to browser storage
                localStorage.setItem("username", username);
                // Redirect to the attendance page
                window.location.href = "attendance.html";
            } else {
                errorMessage.textContent = data.message;
                loginButton.disabled = false;
                loginButton.textContent = "Sign in";
            }
        } catch (error) {
            errorMessage.textContent = "Network error. Please try again.";
            loginButton.disabled = false;
            loginButton.textContent = "Sign in";
        }
    });
}

/**
 * Manages all logic for the Attendance Page
 */
function handleAttendancePage() {
    const username = localStorage.getItem("username");
    
    // If no user is saved, redirect to login
    if (!username) {
        window.location.href = "login.html";
        return;
    }

    // Get all elements
    const timeEl = document.getElementById("time");
    const dateEl = document.getElementById("date");
    const clockInBtn = document.getElementById("clock-in-btn");
    const clockOutBtn = document.getElementById("clock-out-btn");
    const nameLabel = document.getElementById("name-label");
    const profilePic = document.getElementById("profile-pic");
    const logoutLink = document.getElementById("logout-link");

    // --- Page Setup ---
    nameLabel.textContent = "Name: " + username;
    loadUserProfileImage(username);

    // --- Clock Function ---
    function updateClock() {
        const now = new Date();
        const timeString = now.toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
        const dateString = now.toLocaleDateString("en-US", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        
        timeEl.textContent = "Time: " + timeString;
        dateEl.textContent = "Date: " + dateString;
    }

    // --- Image Loading Function ---
    function loadUserProfileImage(user) {
        const base_url = "https://raw.githubusercontent.com/Dharani-111/Reydatamind/main/Images/";
        const user_image_url = `${base_url}${user}.jpg`;
        const placeholder_url = `${base_url}Placeholder_photo.jpg`;
        
        const img = new Image();
        img.src = user_image_url;
        
        img.onload = () => {
            profilePic.src = user_image_url;
        };
        img.onerror = () => {
            profilePic.src = placeholder_url;
        };
    }

    // --- API Call Functions ---
    async function checkLoginStatus() {
        try {
            // Send a GET request to check status
            const response = await fetch(`${WEB_APP_URL}?action=getStatus&username=${username}`);
            const data = await response.json();
            
            if (data.success) {
                clockInBtn.disabled = !data.login_enabled;
                clockOutBtn.disabled = !data.logout_enabled;
            } else {
                console.error("Error checking status:", data.message);
            }
        } catch (error) {
            console.error("Network error checking status:", error);
        }
    }

    async function handleClockIn() {
        try {
            clockInBtn.disabled = true;
            const payload = { action: "clock_in", username: username };
            
            const response = await fetch(WEB_APP_URL, {
                method: "POST",
                mode: "cors",
                headers: { "Content-Type": "text/plain;charset=utf-8" },
                body: JSON.stringify(payload)
            });
            const data = await response.json();
            
            alert(data.message);
            checkLoginStatus(); // Re-check status to update buttons
        } catch (error) {
            alert("Error logging in.");
            clockInBtn.disabled = false;
        }
    }

    async function handleClockOut() {
        try {
            clockOutBtn.disabled = true;
            const payload = { action: "clock_out", username: username };
            
            const response = await fetch(WEB_APP_URL, {
                method: "POST",
                mode: "cors",
                headers: { "Content-Type": "text/plain;charset=utf-8" },
                body: JSON.stringify(payload)
            });
            const data = await response.json();
            
            alert(data.message);
            checkLoginStatus(); // Re-check status to update buttons
        } catch (error) {
            alert("Error logging out.");
            clockOutBtn.disabled = false;
        }
    }

    // --- Event Listeners ---
    clockInBtn.addEventListener("click", handleClockIn);
    clockOutBtn.addEventListener("click", handleClockOut);
    logoutLink.addEventListener("click", () => {
        localStorage.removeItem("username");
    });

    // --- Initial Page Load ---
    updateClock();
    setInterval(updateClock, 1000);
    checkLoginStatus();

}
