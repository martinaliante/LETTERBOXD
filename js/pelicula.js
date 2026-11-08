const WATCHLIST_KEY = "watchlist";
const RATINGS_KEY = "cineboxdRatings";
const REVIEWS_KEY = "cineboxdReviews";
const VISTAS_KEY = "vistas";
const WATCHLISTA_INICIAL = [6, 7];

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

function mostrarToast(texto) {
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.setAttribute("role", "status");
    toast.textContent = texto;
    document.body.appendChild(toast);
    window.setTimeout(() => toast.remove(), 2600);
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

function renderizarResenas(contenedor, resenas, peliculaId) {
    contenedor.replaceChildren();
    if (resenas.length === 0) {
        contenedor.appendChild(crearElemento("li", "Todavía no hay reseñas.", "resena"));
        return;
    }

    resenas.forEach((resena, indice) => {
        const elemento = crearElemento("li", "", "flex justify-between gap-3 border-l-4 border-blue-600 bg-gray-100 p-3.5");
        const contenido = crearElemento(
            "span",
            `${resena.usuario} (${resena.puntuacion}/5): ${resena.texto}`
        );
        elemento.appendChild(contenido);
        if (resena.usuario === usuarioActual()) {
            const acciones = crearElemento("div", "", "flex shrink-0 gap-1.5");
            const editar = crearElemento("button", "Editar", "rounded bg-gray-300 px-2 py-1.5 text-sm");
            editar.type = "button";
            editar.addEventListener("click", () => {
                const texto = window.prompt("Edita tu reseña:", resena.texto);
                if (texto === null || !texto.trim()) return;
                const actualizadas = leerJSON(`${REVIEWS_KEY}_${peliculaId}`, []);
                actualizadas[indice].texto = texto.trim();
                guardarJSON(`${REVIEWS_KEY}_${peliculaId}`, actualizadas);
                renderizarResenas(contenedor, actualizadas, peliculaId);
                mostrarToast("Reseña actualizada.");
            });
            const eliminar = crearElemento("button", "Eliminar", "rounded bg-gray-300 px-2 py-1.5 text-sm");
            eliminar.type = "button";
            eliminar.addEventListener("click", () => {
                if (!window.confirm("¿Seguro que quieres eliminar esta reseña?")) return;
                const actualizadas = leerJSON(`${REVIEWS_KEY}_${peliculaId}`, []);
                actualizadas.splice(indice, 1);
                guardarJSON(`${REVIEWS_KEY}_${peliculaId}`, actualizadas);
                renderizarResenas(contenedor, actualizadas, peliculaId);
                mostrarToast("Reseña eliminada.");
            });
            acciones.append(editar, eliminar);
            elemento.appendChild(acciones);
        }
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
    const watchlist = leerJSON(claveUsuario(WATCHLIST_KEY), WATCHLISTA_INICIAL);
    const ratings = leerJSON(`${RATINGS_KEY}_${pelicula.id}`, {});
    const reviews = leerJSON(`${REVIEWS_KEY}_${pelicula.id}`, []);
    const ratingPropio = ratings[usuarioActual()] || "";
    const estaEnWatchlist = watchlist.includes(pelicula.id);
    const vistas = leerJSON(claveUsuario(VISTAS_KEY), [4, 5]);

    const poster = document.createElement("img");
    poster.className = "w-full rounded-lg object-cover md:aspect-[2/3]";
    poster.src = pelicula.poster;
    poster.alt = `Póster de ${pelicula.titulo}`;

    const informacion = document.createElement("div");
    informacion.className = "min-w-0";
    informacion.appendChild(crearElemento("h1", pelicula.titulo, "mt-0 text-3xl font-bold"));
    informacion.appendChild(crearElemento(
        "p",
        `Puntuación general: ${calcularPuntuacion(pelicula, Object.values(ratings))}`,
        "puntuacion-general text-xl font-bold"
    ));

    const generos = crearElemento("div", "", "mb-2 mt-4 flex flex-wrap gap-1.5");
    pelicula.generos.forEach(genero => {
        generos.appendChild(crearElemento("span", genero, "rounded-full bg-blue-100 px-2 py-1 text-sm text-blue-800"));
    });
    informacion.appendChild(generos);

    const acciones = crearElemento("div", "", "grid gap-3 mt-6");
    const botonWatchlist = crearElemento("button", estaEnWatchlist ? "Quitar de watchlist" : "Agregar a watchlist", "w-fit rounded-md bg-blue-600 px-3.5 py-2.5 text-white hover:bg-blue-700 disabled:opacity-50");
    botonWatchlist.type = "button";
    botonWatchlist.addEventListener("click", () => {
        const lista = leerJSON(claveUsuario(WATCHLIST_KEY), WATCHLISTA_INICIAL);
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

    const botonVista = crearElemento(
        "button",
        vistas.includes(pelicula.id) ? "Quitar de vistas" : "Marcar como vista",
        "w-fit rounded-md bg-blue-600 px-3.5 py-2.5 text-white hover:bg-blue-700 disabled:opacity-50"
    );
    botonVista.type = "button";
    botonVista.addEventListener("click", () => {
        const vistasActualizadas = leerJSON(claveUsuario(VISTAS_KEY), [4, 5]);
        const indice = vistasActualizadas.indexOf(pelicula.id);
        if (indice === -1) {
            vistasActualizadas.push(pelicula.id);
            guardarJSON(claveUsuario(VISTAS_KEY), vistasActualizadas);
            botonVista.textContent = "Quitar de vistas";
            mostrarToast("Película marcada como vista.");
        } else {
            vistasActualizadas.splice(indice, 1);
            guardarJSON(claveUsuario(VISTAS_KEY), vistasActualizadas);
            botonVista.textContent = "Marcar como vista";
            mostrarToast("Película quitada de tus vistas.");
        }
    });
    acciones.appendChild(botonVista);

    const formulario = crearElemento("form", "", "mt-6 grid max-w-xl gap-3");
    formulario.appendChild(crearElemento("h2", "Puntuar película", "text-xl font-bold"));
    const selector = document.createElement("select");
    selector.className = "w-full max-w-xl rounded-md border border-gray-300 p-2.5 font-inherit";
    selector.name = "puntuacion";
    selector.required = true;
    selector.innerHTML = '<option value="">Elige una puntuación</option>' +
        [1, 2, 3, 4, 5].map(valor => `<option value="${valor}">${valor}/5</option>`).join("");
    selector.value = ratingPropio;
    const botonPuntuar = crearElemento("button", "Guardar puntuación", "w-fit rounded-md bg-blue-600 px-3.5 py-2.5 text-white hover:bg-blue-700 disabled:opacity-50");
    botonPuntuar.type = "submit";
    formulario.append(selector, botonPuntuar);
    formulario.addEventListener("submit", event => {
        event.preventDefault();
        botonPuntuar.disabled = true;
        botonPuntuar.textContent = "Guardando...";
        const puntuaciones = leerJSON(`${RATINGS_KEY}_${pelicula.id}`, {});
        puntuaciones[usuarioActual()] = Number(selector.value);
        guardarJSON(`${RATINGS_KEY}_${pelicula.id}`, puntuaciones);
        informacion.querySelector(".puntuacion-general").textContent =
            `Puntuación general: ${calcularPuntuacion(pelicula, Object.values(puntuaciones))}`;
        botonPuntuar.disabled = false;
        botonPuntuar.textContent = "Guardar puntuación";
        mostrarToast("Tu puntuación fue guardada.");
    });
    informacion.appendChild(formulario);

    const reseñas = crearElemento("section", "");
    reseñas.appendChild(crearElemento("h2", "Reseñas", "mt-6 text-xl font-bold"));
    const formularioResena = crearElemento("form", "", "mt-6 grid max-w-xl gap-3");
    const texto = document.createElement("textarea");
    texto.className = "w-full max-w-xl rounded-md border border-gray-300 p-2.5 font-inherit";
    texto.name = "resena";
    texto.rows = 4;
    texto.required = false;
    texto.placeholder = "Escribe una reseña (opcional)...";
    const botonResena = crearElemento("button", "Publicar reseña", "w-fit rounded-md bg-blue-600 px-3.5 py-2.5 text-white hover:bg-blue-700 disabled:opacity-50");
    botonResena.type = "submit";
    formularioResena.append(texto, botonResena);
    const listaResenas = crearElemento("ul", "", "mt-3 grid list-none gap-3 p-0");
    renderizarResenas(listaResenas, reviews, pelicula.id);
    formularioResena.addEventListener("submit", event => {
        event.preventDefault();
        if (!texto.value.trim()) {
            mostrarToast("La reseña es opcional: escribe un texto para publicarla.");
            return;
        }
        botonResena.disabled = true;
        botonResena.textContent = "Publicando...";
        const resenasActualizadas = leerJSON(`${REVIEWS_KEY}_${pelicula.id}`, []);
        const puntuacionActual = leerJSON(`${RATINGS_KEY}_${pelicula.id}`, {})[usuarioActual()] || "sin puntuación";
        resenasActualizadas.push({
            usuario: usuarioActual(),
            peliculaId: pelicula.id,
            texto: texto.value.trim(),
            puntuacion: puntuacionActual
        });
        guardarJSON(`${REVIEWS_KEY}_${pelicula.id}`, resenasActualizadas);
        texto.value = "";
        renderizarResenas(listaResenas, resenasActualizadas, pelicula.id);
        botonResena.disabled = false;
        botonResena.textContent = "Publicar reseña";
        mostrarToast("Tu reseña fue publicada.");
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
            window.location.replace("404.html");
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
