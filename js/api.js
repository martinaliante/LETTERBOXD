
/*
============================================================
 CINEBOX - API SIMULADA
============================================================

Este archivo centraliza el acceso a los datos del proyecto.

Funciones principales:
- Leer archivos JSON de mocks.
- Simular una API REST.
- Simular latencia entre 300 y 800 ms.
- Unificar las respuestas.
- Guardar modificaciones en localStorage.
- Implementar operaciones CRUD.
============================================================
*/



const API_RUTAS = {
    peliculas: "./mocks/peliculas.json",
    usuarios: "./mocks/usuarios.json",
    amigos: "./mocks/amigos.json",
    actividad: "./mocks/actividad.json"
};

const API_CLAVES = {
    peliculas: "cineboxdPeliculas",
    usuarios: "cineboxdUsers",
    amigos: "cineboxdAmigos",
    actividad: "cineboxdActividad",
    watchlist: "watchlist",
    vistas: "vistas",
    puntuaciones: "cineboxdRatings",
    resenas: "cineboxdReviews"
};

const API_ERROR_KEY = "cineboxForzarError";




// Simula una latencia aleatoria entre 300 y 800 milisegundos.
function apiEsperar() {
    const tiempo = Math.floor(Math.random() * 501) + 300;

    return new Promise(resolve => {
        setTimeout(resolve, tiempo);
    });
}


// Genera una respuesta uniforme para todas las operaciones.
function apiRespuesta(ok, status, data = null, error = null) {
    return {
        ok,
        status,
        data,
        error
    };
}

function apiCrearError(mensaje, status) {
    const error = new Error(mensaje);
    error.status = status;
    return error;
}

async function apiHashPassword(password, salt) {
    if (!window.crypto?.subtle) {
        throw new Error("La autenticación requiere un contexto seguro. Abre el sitio con Live Server.");
    }

    const data = new TextEncoder().encode(`${salt}:${password}`);
    const hash = await window.crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(hash), byte => byte.toString(16).padStart(2, "0")).join("");
}


// Ejecuta una operación simulando una petición HTTP.
async function apiSolicitar(operacion, statusExito = 200) {
    await apiEsperar();

    try {
        if (localStorage.getItem(API_ERROR_KEY) === "true") {
            throw apiCrearError("Error simulado de conexión con la API.", 500);
        }

        const data = await operacion();

        return apiRespuesta(true, statusExito, data, null);

    } catch (error) {
        console.error("Error en la API de Cinebox:", error);

        return apiRespuesta(
            false,
            error && Number.isInteger(error.status) ? error.status : 500,
            null,
            error && error.message || "Ocurrió un error inesperado."
        );
    }
}


// Lee información de localStorage
function apiLeerLocal(clave, valorInicial = null) {
    try {
        const dato = localStorage.getItem(clave);

        return dato !== null
            ? JSON.parse(dato)
            : valorInicial;

    } catch (error) {
        console.error(`No se pudo leer ${clave}:`, error);
        return valorInicial;
    }
}


// guarda info en localStorage
function apiGuardarLocal(clave, dato) {
    localStorage.setItem(clave, JSON.stringify(dato));
}



// comprueba que exista una sesión antes de modificaciones
function apiExigirSesion() {
    const usuario = sessionStorage.getItem("cineboxdCurrentUser");

    if (!usuario || !usuario.trim()) {
        throw apiCrearError(
            "Debes iniciar sesión para realizar esta operación.",
            401
        );
    }

    return usuario;
}



// Construye una clave independiente para cada usuario


// Obtiene el usuario que tiene iniciada la sesión.
function apiUsuarioActual() {
    return sessionStorage.getItem("cineboxdCurrentUser") || "invitado";
}

function apiClaveUsuario(recurso, usuario = apiUsuarioActual()) {
    return `${recurso}_${usuario}`;
}




// Carga un recurso desde localStorage o desde su archivo JSON.
async function apiCargarRecurso(nombre) {
    const clave = API_CLAVES[nombre];
    const ruta = API_RUTAS[nombre];

    if (!clave || !ruta) {
        throw new Error(`El recurso "${nombre}" no está configurado.`);
    }

    // Primero comprueba si existen datos guardados.
    const guardado = localStorage.getItem(clave);

    if (guardado !== null) {
        const datos = JSON.parse(guardado);

        if (!Array.isArray(datos)) {
            throw new Error(`El recurso "${nombre}" no contiene una lista válida.`);
        }

        return datos;
    }

    // si no existen datos guardados, consulta el JSON
    const respuesta = await fetch(ruta);

    if (!respuesta.ok) {
        throw new Error(`No se pudo cargar ${nombre}.`);
    }

    const datos = await respuesta.json();

    if (!Array.isArray(datos)) {
        throw new Error(`El archivo ${ruta} no contiene un arreglo válido.`);
    }

    // Guarda una copia local para futuras operaciones.
    apiGuardarLocal(clave, datos);

    return datos;
}



// Obtiene todas las películas.
async function obtenerPeliculas() {
    return apiSolicitar(async () => {
        return await apiCargarRecurso("peliculas");
    });
}


// Obtiene una película específica por su ID.
async function obtenerPeliculaPorId(id) {
    return apiSolicitar(async () => {
        const peliculas = await apiCargarRecurso("peliculas");

        const pelicula = peliculas.find(
            pelicula => pelicula.id === Number(id)
        );

        if (!pelicula) {
            throw apiCrearError("No se encontró la película.", 404);
        }

        return pelicula;
    });
}


// Obtiene todos los usuarios registrados.
async function obtenerUsuarios() {
    return apiSolicitar(async () => {
        return await apiCargarRecurso("usuarios");
    });
}

async function obtenerAmigos() {
    return apiSolicitar(async () => {
        return await apiCargarRecurso("amigos");
    });
}

async function obtenerActividad() {
    return apiSolicitar(async () => {
        return await apiCargarRecurso("actividad");
    });
}

async function obtenerResenasUsuario(usuario = apiUsuarioActual()) {
    return apiSolicitar(async () => {
        if (!usuario || usuario !== apiExigirSesion()) {
            throw new Error("No puedes consultar las reseñas de otro usuario.");
        }

        const peliculas = await apiCargarRecurso("peliculas");
        return peliculas.flatMap(pelicula =>
            apiLeerLocal(apiClaveResenas(pelicula.id), [])
                .filter(resena => resena.usuario === usuario)
        );
    });
}




// Crea una pelicula nueva.
async function crearPelicula(nuevaPelicula) {
    return apiSolicitar(async () => {
        const peliculas = await apiCargarRecurso("peliculas");

        const existe = peliculas.some(
            pelicula => pelicula.id === nuevaPelicula.id
        );

        if (existe) {
            throw new Error("Ya existe una película con ese ID.");
        }

        peliculas.push(nuevaPelicula);

        apiGuardarLocal(API_CLAVES.peliculas, peliculas);

        return nuevaPelicula;
    }, 201);
}


// Actualiza una película existente.
async function actualizarPelicula(id, cambios) {
    return apiSolicitar(async () => {
        const peliculas = await apiCargarRecurso("peliculas");

        const indice = peliculas.findIndex(
            pelicula => pelicula.id === Number(id)
        );

        if (indice === -1) {
            throw apiCrearError("No se encontró la película.", 404);
        }

        peliculas[indice] = {
            ...peliculas[indice],
            ...cambios,
            id: peliculas[indice].id
        };

        apiGuardarLocal(API_CLAVES.peliculas, peliculas);

        return peliculas[indice];
    });
}


// Elimina una película.
async function eliminarPelicula(id) {
    return apiSolicitar(async () => {
        const peliculas = await apiCargarRecurso("peliculas");

        const nuevasPeliculas = peliculas.filter(
            pelicula => pelicula.id !== Number(id)
        );

        if (nuevasPeliculas.length === peliculas.length) {
            throw apiCrearError("No se encontró la película.", 404);
        }
        apiGuardarLocal(API_CLAVES.peliculas, nuevasPeliculas);

        return { id: Number(id) };
    });
}



// Registra un usuario nuevo.
async function crearUsuario(nuevoUsuario) {
    return apiSolicitar(async () => {
        const usuarios = await apiCargarRecurso("usuarios");

        const existe = usuarios.some(usuario =>
            usuario.username.toLowerCase() ===
            nuevoUsuario.username.toLowerCase()
        );

        if (existe) {
            throw new Error("Ese nombre de usuario ya está registrado.");
        }

        usuarios.push(nuevoUsuario);

        apiGuardarLocal(API_CLAVES.usuarios, usuarios);

        return nuevoUsuario;
    }, 201);
}


// Busca un usuario por su nombre.
async function obtenerUsuario(username) {
    return apiSolicitar(async () => {
        const usuarios = await apiCargarRecurso("usuarios");

        return usuarios.find(usuario =>
            usuario.username.toLowerCase() === username.toLowerCase()
        ) || null;
    });
}

async function autenticarUsuario(username, password) {
    return apiSolicitar(async () => {
        const usuarios = await apiCargarRecurso("usuarios");
        const usuario = usuarios.find(
            usuario => usuario.username.toLowerCase() === username.toLowerCase()
        );

        if (!usuario || await apiHashPassword(password, usuario.salt) !== usuario.passwordHash) {
            throw apiCrearError("Usuario o contraseña incorrectos.", 401);
        }

        return usuario;
    });
}




// Obtiene las peliculas vistas o guardadas en watchlist
async function obtenerListaUsuario(tipo, usuario = apiUsuarioActual()) {
    return apiSolicitar(async () => {
        if (!["vistas", "watchlist"].includes(tipo)) {
            throw new Error("Tipo de lista no válido.");
        }

        const clave = apiClaveUsuario(API_CLAVES[tipo], usuario);
        const lista = apiLeerLocal(clave, []);

        if (tipo === "watchlist") {
            const claveVistas = apiClaveUsuario(API_CLAVES.vistas, usuario);
            const idsVistas = new Set(
                apiLeerLocal(claveVistas, []).map(Number)
            );

            return lista.filter(id => !idsVistas.has(Number(id)));
        }

        return lista;
    });
}


async function guardarListaUsuario(tipo, ids, usuario = apiUsuarioActual()) {
    return apiSolicitar(async () => {
        // solo usuarios autenticados pueden modificar sus listas
        usuario = apiExigirSesion();

        if (!["vistas", "watchlist"].includes(tipo)) {
            throw new Error("Tipo de lista no válido.");
        }

        if (!Array.isArray(ids)) {
            throw new Error("La lista debe ser un arreglo.");
        }

        const clave = apiClaveUsuario(API_CLAVES[tipo], usuario);
        const idsUnicos = [...new Set(ids.map(Number))];
        const tipoContrario = tipo === "vistas" ? "watchlist" : "vistas";
        const claveContraria = apiClaveUsuario(
            API_CLAVES[tipoContrario],
            usuario
        );
        const idsActualizados = new Set(idsUnicos);
        const idsContrarios = apiLeerLocal(claveContraria, [])
            .filter(id => !idsActualizados.has(Number(id)));

        apiGuardarLocal(clave, idsUnicos);
        apiGuardarLocal(claveContraria, idsContrarios);

        return idsUnicos;
    });
}

// Obtiene las puntuaciones almacenadas.
async function obtenerPuntuaciones() {
    return apiSolicitar(async () => {
        return apiLeerLocal(API_CLAVES.puntuaciones, {});
    });
}


// Guarda la puntuación de un usuario para una película.

async function guardarPuntuacion(idPelicula, puntuacion) {
    return apiSolicitar(async () => {
        // impide guardar puntuaciones sin inicir sesión
        const usuario = apiExigirSesion();

        const valor = Number(puntuacion);

        if (!Number.isFinite(valor) || valor < 1 || valor > 5) {
            throw new Error("La puntuación debe estar entre 1 y 5.");
        }

        const puntuaciones = apiLeerLocal(
            API_CLAVES.puntuaciones,
            {}
        );

        if (!puntuaciones[idPelicula]) {
            puntuaciones[idPelicula] = {};
        }

        puntuaciones[idPelicula][usuario] = valor;

        apiGuardarLocal(API_CLAVES.puntuaciones, puntuaciones);

        return {
            idPelicula: Number(idPelicula),
            usuario,
            puntuacion: valor
        };
    });
}





// Mantiene una clave independiente para cada película.
function apiClaveResenas(idPelicula) {
    return `${API_CLAVES.resenas}_${idPelicula}`;
}


// Obtiene las reseñas de una película.
async function obtenerResenas(idPelicula) {
    return apiSolicitar(async () => {
        const clave = apiClaveResenas(idPelicula);

        return apiLeerLocal(clave, []);
    });
}


// Crea una reseña.

async function crearResena(idPelicula, texto) {
    return apiSolicitar(async () => {
        // Identifica al usuario autenticado que publica la reseña
        const usuario = apiExigirSesion();

        if (!texto || !texto.trim()) {
            throw new Error("La reseña no puede estar vacía.");
        }

        const clave = apiClaveResenas(idPelicula);
        const resenas = apiLeerLocal(clave, []);

        const nuevaResena = {
            id: Date.now(),
            usuario,
            texto: texto.trim(),
            fecha: new Date().toISOString()
        };

        resenas.push(nuevaResena);

        apiGuardarLocal(clave, resenas);

        return nuevaResena;
    }, 201);
}


// Edita una reseña existente
async function editarResena(idPelicula, idResena, nuevoTexto) {
    return apiSolicitar(async () => {
        const usuario = apiExigirSesion();

        if (!nuevoTexto || !nuevoTexto.trim()) {
            throw new Error("La reseña no puede estar vacía.");
        }

        const clave = apiClaveResenas(idPelicula);
        const resenas = apiLeerLocal(clave, []);

        const indice = resenas.findIndex(
            resena => resena.id === Number(idResena)
        );

        if (indice === -1) {
            throw apiCrearError("No se encontró la reseña.", 404);
        }

        if (resenas[indice].usuario !== usuario) {
            throw new Error("No puedes editar la reseña de otro usuario.");
        }

        resenas[indice].texto = nuevoTexto.trim();

        apiGuardarLocal(clave, resenas);

        return resenas[indice];
    });
}

// Elimina una reseña existente

async function eliminarResena(idPelicula, idResena) {
    return apiSolicitar(async () => {
        const usuario = apiExigirSesion();

        const clave = apiClaveResenas(idPelicula);
        const resenas = apiLeerLocal(clave, []);

        const indice = resenas.findIndex(
            resena => resena.id === Number(idResena)
        );

        if (indice === -1) {
            throw apiCrearError("No se encontró la reseña.", 404);
        }

        if (resenas[indice].usuario !== usuario) {
            throw new Error("No puedes eliminar la reseña de otro usuario.");
        }

        const eliminada = resenas.splice(indice, 1)[0];

        apiGuardarLocal(clave, resenas);

        return eliminada;
    });
}
// Activa errores simulados para comprobar la interfaz.
function apiActivarError() {
    localStorage.setItem(API_ERROR_KEY, "true");
}


// Desactiva los errores simulados.
function apiDesactivarError() {
    localStorage.removeItem(API_ERROR_KEY);
}
