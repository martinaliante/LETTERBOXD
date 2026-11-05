const WATCHLIST_KEY = "cineboxdWatchlist";
const RATINGS_KEY = "cineboxdRatings";
const REVIEWS_KEY = "cineboxdReviews";

function leerJSON(clave, valorInicial) {
    try {
        const valor = localStorage.getItem(clave);
        return valor ? JSON.parse(valor) : valorInicial;
    } catch (error) {
        console.error(`No se pudo leer ${clave}:`, error);
        return valorInicial;
    }
}

function guardarJSON(clave, valor) {
    localStorage.setItem(clave, JSON.stringify(valor));
}

function usuarioActual() {
    return sessionStorage.getItem("cineboxdCurrentUser") || "invitado";
}

function claveUsuario(clave) {
    return `${clave}_${usuarioActual()}`;
}

function mostrarMensaje(texto, error = false) {
    const mensaje = document.getElementById("mensaje-pelicula");
    mensaje.textContent = texto;
    mensaje.style.color = error ? "#b42318" : "#176b2c";
}

function crearElemento(tag, texto, clase) {
    const elemento = document.createElement(tag);
    elemento.textContent = texto;
    if (clase) elemento.className = clase;
    return elemento;
}

function renderizarResenas(contenedor, resenas) {
    contenedor.replaceChildren();
    if (resenas.length === 0) {
        contenedor.appendChild(crearElemento("li", "Todavía no hay reseñas.", "resena"));
        return;
    }

    resenas.forEach(resena => {
        const elemento = crearElemento(
            "li",
            `${resena.usuario} (${resena.puntuacion}/5): ${resena.texto}`,
            "resena"
        );
        contenedor.appendChild(elemento);
    });
}

function calcularPuntuacion(pelicula, puntuaciones) {
    const valores = [Number(pelicula.puntuacion), ...puntuaciones.map(Number)]
        .filter(valor => Number.isFinite(valor));
    return (valores.reduce((total, valor) => total + valor, 0) / valores.length).toFixed(1);
}

function renderizarPelicula(pelicula) {
    const contenedor = document.getElementById("detalle-pelicula");
    const watchlist = leerJSON(claveUsuario(WATCHLIST_KEY), []);
    const ratings = leerJSON(`${RATINGS_KEY}_${pelicula.id}`, {});
    const reviews = leerJSON(`${REVIEWS_KEY}_${pelicula.id}`, []);
    const ratingPropio = ratings[usuarioActual()] || "";
    const estaEnWatchlist = watchlist.includes(pelicula.id);

    const poster = document.createElement("img");
    poster.src = pelicula.poster;
    poster.alt = `Póster de ${pelicula.titulo}`;

    const informacion = document.createElement("div");
    informacion.appendChild(crearElemento("h1", pelicula.titulo));
    informacion.appendChild(crearElemento(
        "p",
        `Puntuación general: ${calcularPuntuacion(pelicula, Object.values(ratings))}`,
        "puntuacion-general"
    ));

    const acciones = crearElemento("div", "", "acciones-pelicula");
    const botonWatchlist = crearElemento("button", estaEnWatchlist ? "Quitar de watchlist" : "Agregar a watchlist");
    botonWatchlist.type = "button";
    botonWatchlist.addEventListener("click", () => {
        const lista = leerJSON(claveUsuario(WATCHLIST_KEY), []);
        const indice = lista.indexOf(pelicula.id);
        if (indice === -1) {
            lista.push(pelicula.id);
            botonWatchlist.textContent = "Quitar de watchlist";
            mostrarMensaje("Película agregada a tu watchlist.");
        } else {
            lista.splice(indice, 1);
            botonWatchlist.textContent = "Agregar a watchlist";
            mostrarMensaje("Película quitada de tu watchlist.");
        }
        guardarJSON(claveUsuario(WATCHLIST_KEY), lista);
    });
    acciones.appendChild(botonWatchlist);
    informacion.appendChild(acciones);

    const formulario = crearElemento("form", "", "formulario-pelicula");
    formulario.appendChild(crearElemento("h2", "Puntuar película"));
    const selector = document.createElement("select");
    selector.name = "puntuacion";
    selector.required = true;
    selector.innerHTML = '<option value="">Elige una puntuación</option>' +
        [1, 2, 3, 4, 5].map(valor => `<option value="${valor}">${valor}/5</option>`).join("");
    selector.value = ratingPropio;
    const botonPuntuar = crearElemento("button", "Guardar puntuación");
    botonPuntuar.type = "submit";
    formulario.append(selector, botonPuntuar);
    formulario.addEventListener("submit", event => {
        event.preventDefault();
        const puntuaciones = leerJSON(`${RATINGS_KEY}_${pelicula.id}`, {});
        puntuaciones[usuarioActual()] = Number(selector.value);
        guardarJSON(`${RATINGS_KEY}_${pelicula.id}`, puntuaciones);
        informacion.querySelector(".puntuacion-general").textContent =
            `Puntuación general: ${calcularPuntuacion(pelicula, Object.values(puntuaciones))}`;
        mostrarMensaje("Tu puntuación fue guardada.");
    });
    informacion.appendChild(formulario);

    const reseñas = crearElemento("section", "");
    reseñas.appendChild(crearElemento("h2", "Reseñas"));
    const formularioResena = crearElemento("form", "", "formulario-pelicula");
    const texto = document.createElement("textarea");
    texto.name = "resena";
    texto.rows = 4;
    texto.placeholder = "Escribe tu reseña...";
    texto.required = true;
    const botonResena = crearElemento("button", "Publicar reseña");
    botonResena.type = "submit";
    formularioResena.append(texto, botonResena);
    const listaResenas = crearElemento("ul", "", "lista-resenas");
    renderizarResenas(listaResenas, reviews);
    formularioResena.addEventListener("submit", event => {
        event.preventDefault();
        const resenasActualizadas = leerJSON(`${REVIEWS_KEY}_${pelicula.id}`, []);
        const puntuacionActual = leerJSON(`${RATINGS_KEY}_${pelicula.id}`, {})[usuarioActual()] || "sin puntuación";
        resenasActualizadas.push({
            usuario: usuarioActual(),
            texto: texto.value.trim(),
            puntuacion: puntuacionActual
        });
        guardarJSON(`${REVIEWS_KEY}_${pelicula.id}`, resenasActualizadas);
        texto.value = "";
        renderizarResenas(listaResenas, resenasActualizadas);
        mostrarMensaje("Tu reseña fue publicada.");
    });
    reseñas.append(formularioResena, listaResenas);
    informacion.appendChild(reseñas);
    contenedor.append(poster, informacion);
}

async function cargarPelicula() {
    const id = Number(new URLSearchParams(window.location.search).get("id"));
    const detalle = document.getElementById("detalle-pelicula");
    mostrarMensaje("Cargando película...");
    try {
        const peliculas = await obtenerPeliculas();
        const pelicula = peliculas.find(item => item.id === id);
        if (!pelicula) {
            mostrarMensaje("No se encontró la película solicitada.", true);
            return;
        }
        document.title = `${pelicula.titulo} - Cinebox`;
        mostrarMensaje("");
        renderizarPelicula(pelicula);
    } catch (error) {
        console.error("No se pudo cargar la película:", error);
        detalle.replaceChildren();
        mostrarMensaje("No se pudo cargar la película. Intenta nuevamente.", true);
        const boton = document.createElement("button");
        boton.type = "button";
        boton.textContent = "Reintentar";
        boton.addEventListener("click", cargarPelicula);
        detalle.appendChild(boton);
    }
}

cargarPelicula();
