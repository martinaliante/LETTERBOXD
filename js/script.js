const CURRENT_USER_KEY = "cineboxdCurrentUser";

function showMessage(message, text, color) {
    message.textContent = text;
    message.style.color = color;
}

function updateSessionHeader() {
    const accessControls = document.querySelector("[data-auth-controls]");
    const usernameLabel = document.querySelector("[data-auth-user]");
    const logoutButton = document.querySelector("[data-auth-logout]");
    const username = sessionStorage.getItem(CURRENT_USER_KEY);

    if (!accessControls || !usernameLabel) {
        return;
    }

    if (username) {
        accessControls.hidden = true;
        usernameLabel.textContent = username;
        usernameLabel.hidden = false;
        if (logoutButton) logoutButton.hidden = false;
    } else {
        accessControls.hidden = false;
        usernameLabel.hidden = true;
        usernameLabel.textContent = "";
        if (logoutButton) logoutButton.hidden = true;
    }
}

document.querySelector("[data-auth-logout]")?.addEventListener("click", () => {
    sessionStorage.removeItem(CURRENT_USER_KEY);
    window.location.href = "index.html";
});

function protectPrivateView() {
    if (document.body.dataset.private === undefined) {
        return;
    }

    if (!sessionStorage.getItem(CURRENT_USER_KEY)) {
        window.location.replace("login.html");
    }
}

// Asistencia de IA: validación de campos y mensajes específicos de error.
async function register(event) {
    event.preventDefault();

    const form = event.currentTarget;
    const username = document.getElementById("create-username").value.trim();
    const password = document.getElementById("create-password").value;
    const repeatPassword = document.getElementById("repeat-password").value;
    const message = document.getElementById("message");
    const submitButton = form.querySelector("button[type='submit']");

    if (!username) {
        showMessage(message, "Ingresa un nombre de usuario.", "red");
        document.getElementById("create-username").focus();
        return;
    }

    if (!password) {
        showMessage(message, "Ingresa una contraseña.", "red");
        document.getElementById("create-password").focus();
        return;
    }

    if (!repeatPassword) {
        showMessage(message, "Repite tu contraseña.", "red");
        document.getElementById("repeat-password").focus();
        return;
    }

    if (password !== repeatPassword) {
        showMessage(message, "Las contraseñas no coinciden.", "red");
        document.getElementById("repeat-password").focus();
        return;
    }

    try {
        submitButton.disabled = true;
        submitButton.textContent = "Guardando...";

        const salt = Array.from(
            window.crypto.getRandomValues(new Uint8Array(16)),
            byte => byte.toString(16).padStart(2, "0")
        ).join("");

        const passwordHash = await apiHashPassword(password, salt);
        const respuesta = await crearUsuario({ username, salt, passwordHash });

        if (!respuesta.ok) {
            showMessage(message, respuesta.error, "red");
            return;
        }

        showMessage(message, "Cuenta creada. Ya puedes iniciar sesión.", "green");
        form.reset();
    } catch (error) {
        console.error("No se pudo crear la cuenta:", error);
        showMessage(message, error.message || "No se pudo guardar la cuenta.", "red");
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = "Registrarse";
    }
}

// Asistencia de IA: validación de usuario y contraseña.
async function login(event) {
    event.preventDefault();

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;
    const message = document.getElementById("message");
    const submitButton = document.querySelector("#login-form button[type='submit']");

    if (!username) {
        showMessage(message, "Ingresa tu nombre de usuario.", "red");
        document.getElementById("username").focus();
        return;
    }

    if (!password) {
        showMessage(message, "Ingresa tu contraseña.", "red");
        document.getElementById("password").focus();
        return;
    }

    try {
        submitButton.disabled = true;
        submitButton.textContent = "Validando...";

        const respuesta = await autenticarUsuario(username, password);

        if (!respuesta.ok) {
            showMessage(message, respuesta.error, "red");
            return;
        }

        const user = respuesta.data;

        sessionStorage.setItem(CURRENT_USER_KEY, user.username);
        showMessage(message, "Inicio de sesión correcto. Redirigiendo...", "green");
        window.location.href = "index.html";
    } catch (error) {
        console.error("No se pudo iniciar sesión:", error);
        showMessage(message, error.message || "No se pudo validar la cuenta.", "red");
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = "Iniciar sesión";
    }
}

document.getElementById("login-form")?.addEventListener("submit", login);
document.getElementById("register-form")?.addEventListener("submit", register);
updateSessionHeader();
protectPrivateView();
