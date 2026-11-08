const USERS_KEY = "cineboxdUsers";
const CURRENT_USER_KEY = "cineboxdCurrentUser";

function showMessage(message, text, color) {
    message.textContent = text;
    message.style.color = color;
}

function getUsers() {
    const storedUsers = localStorage.getItem(USERS_KEY);
    return storedUsers ? JSON.parse(storedUsers) : [];
}

function updateSessionHeader() {
    const accessControls = document.querySelector("[data-auth-controls]");
    const usernameLabel = document.querySelector("[data-auth-user]");
    const username = sessionStorage.getItem(CURRENT_USER_KEY);

    if (!accessControls || !usernameLabel) {
        return;
    }

    if (username) {
        accessControls.hidden = true;
        usernameLabel.textContent = username;
        usernameLabel.hidden = false;
    }
}

function protectPrivateView() {
    if (document.body.dataset.private === undefined) {
        return;
    }

    if (!sessionStorage.getItem(CURRENT_USER_KEY)) {
        window.location.replace("login.html");
    }
}

async function hashPassword(password, salt) {
    if (!window.crypto?.subtle) {
        throw new Error("La autenticación requiere un contexto seguro. Abre el sitio con Live Server.");
    }

    const data = new TextEncoder().encode(`${salt}:${password}`);
    const hash = await window.crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(hash), byte => byte.toString(16).padStart(2, "0")).join("");
}

async function register(event) {
    event.preventDefault();

    const form = event.currentTarget;
    const username = document.getElementById("create-username").value.trim();
    const password = document.getElementById("create-password").value;
    const repeatPassword = document.getElementById("repeat-password").value;
    const message = document.getElementById("message");
    const submitButton = form.querySelector("button[type='submit']");

    if (!username || !password || !repeatPassword) {
        showMessage(message, "Completa todos los campos.", "red");
        return;
    }

    if (password !== repeatPassword) {
        showMessage(message, "Las contraseñas no coinciden.", "red");
        return;
    }

    try {
        submitButton.disabled = true;
        submitButton.textContent = "Guardando...";
        const users = getUsers();
        if (users.some(user => user.username.toLowerCase() === username.toLowerCase())) {
            showMessage(message, "Ese nombre de usuario ya está registrado.", "red");
            return;
        }

        const salt = Array.from(
            window.crypto.getRandomValues(new Uint8Array(16)),
            byte => byte.toString(16).padStart(2, "0")
        ).join("");
        const passwordHash = await hashPassword(password, salt);

        users.push({ username, salt, passwordHash });
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
        showMessage(message, "Cuenta creada. Ya puedes iniciar sesión.", "green");
        form.reset();
    } catch (error) {
        console.error("No se pudo crear la cuenta:", error);
        showMessage(message, error.message || "No se pudo guardar la cuenta en este navegador.", "red");
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = "Registrarse";
    }
}

async function login(event) {
    event.preventDefault();

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;
    const message = document.getElementById("message");
    const submitButton = document.querySelector("#login-form button[type='submit']");

    if (!username || !password) {
        showMessage(message, "Ingresa tu usuario y contraseña.", "red");
        return;
    }

    try {
        submitButton.disabled = true;
        submitButton.textContent = "Validando...";
        const user = getUsers().find(
            storedUser => storedUser.username.toLowerCase() === username.toLowerCase()
        );

        if (!user || await hashPassword(password, user.salt) !== user.passwordHash) {
            showMessage(message, "Usuario o contraseña incorrectos.", "red");
            return;
        }

        sessionStorage.setItem(CURRENT_USER_KEY, user.username);
        showMessage(message, "Inicio de sesión correcto. Redirigiendo...", "green");
        window.location.href = "index.html";
    } catch (error) {
        console.error("No se pudo iniciar sesión:", error);
        showMessage(message, error.message || "No se pudo validar la cuenta en este navegador.", "red");
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = "Iniciar sesión";
    }
}

document.getElementById("login-form")?.addEventListener("submit", login);
document.getElementById("register-form")?.addEventListener("submit", register);
updateSessionHeader();
protectPrivateView();
