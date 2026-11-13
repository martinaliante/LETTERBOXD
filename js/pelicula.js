
const WATCHLIST_KEY = "watchlist";
const RATINGS_KEY = "cineboxdRatings";
const REVIEWS_KEY = "cineboxdReviews";
const VISTAS_KEY = "vistas";
const WATCHLISTA_INICIAL = [6, 7];

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

function mostrarMensaje(texto, error = false) {
    const mensaje = document.getElementById("mensaje-pelicula");

    if (!mensaje) return;

    mensaje.textContent = texto;
    mensaje.style.color = error ? "#b42318" : "#176b2c";
}

function crearElemento(tag, texto, clase) {
    const elemento = document.createElement(tag);
    elemento.textContent = texto;
    if (clase) elemento.className = clase;
    return elemento;
}

// Las reseñas se muestran con la puntuación real de cada usuario.
function renderizarResenas(contenedor, resenas, peliculaId, autenticado, ratings = {}) {
    contenedor.replaceChildren();

    if (resenas.length === 0) {
        contenedor.appendChild(
            crearElemento("li", "Todavía no hay reseñas.", "resena")
        );
        return;
    }

    resenas.forEach(resena => {
        const elemento = crearElemento(
            "li",
            "",
            "flex flex-col gap-3 border-l-4 border-blue-600 bg-gray-100 p-3.5 sm:flex-row sm:justify-between"
        );

        const puntuacion = ratings[resena.usuario];
        const tienePuntuacion = puntuacion !== null &&
            puntuacion !== undefined &&
            Number.isFinite(Number(puntuacion)) &&
            Number(puntuacion) >= 1 &&
            Number(puntuacion) <= 5;

        const textoResena = tienePuntuacion
            ? `${resena.usuario} ⭐ ${Number(puntuacion)}/5: ${resena.texto}`
            : `${resena.usuario}: ${resena.texto}`;

        const contenido = crearElemento(
            "span",
            textoResena,
            "min-w-0 break-words"
        );

        elemento.appendChild(contenido);

        if (autenticado && resena.usuario === usuarioActual()) {
            const acciones = crearElemento(
                "div",
                "",
                "flex shrink-0 flex-wrap gap-1.5"
            );

            const editar = crearElemento(
                "button",
                "Editar",
                "min-h-11 rounded bg-gray-300 px-2 py-2 text-sm"
            );

            editar.type = "button";

            editar.addEventListener("click", async () => {
                if (resena.id === undefined) {
                    mostrarToast("Esta reseña antigua necesita actualizarse antes de editarse.");
                    return;
                }

                const texto = window.prompt("Edita tu reseña:", resena.texto);

                if (texto === null || !texto.trim()) return;

                editar.disabled = true;

                const respuesta = await editarResena(
                    peliculaId,
                    resena.id,
                    texto
                );

                editar.disabled = false;

                if (!respuesta.ok) {
                    mostrarToast(respuesta.error);
                    return;
                }

                const actualizadas = await obtenerResenas(peliculaId);

                if (actualizadas.ok) {
                    renderizarResenas(
                        contenedor,
                        actualizadas.data,
                        peliculaId,
                        Boolean(sessionStorage.getItem("cineboxdCurrentUser")),
                        ratings
                    );

                    mostrarToast("Reseña actualizada.");
                }
            });

            const eliminar = crearElemento(
                "button",
                "Eliminar",
                "min-h-11 rounded bg-gray-300 px-2 py-2 text-sm"
            );

            eliminar.type = "button";

            eliminar.addEventListener("click", async () => {
                if (!window.confirm("¿Seguro que quieres eliminar esta reseña?")) {
                    return;
                }

                if (resena.id === undefined) {
                    mostrarToast("Esta reseña antigua necesita actualizarse antes de eliminarse.");
                    return;
                }

                eliminar.disabled = true;

                const respuesta = await eliminarResena(
                    peliculaId,
                    resena.id
                );

                eliminar.disabled = false;

                if (!respuesta.ok) {
                    mostrarToast(respuesta.error);
                    return;
                }

                const actualizadas = await obtenerResenas(peliculaId);

                if (actualizadas.ok) {
                    renderizarResenas(
                        contenedor,
                        actualizadas.data,
                        peliculaId,
                        Boolean(sessionStorage.getItem("cineboxdCurrentUser")),
                        ratings
                    );

                    mostrarToast("Reseña eliminada.");
                }
            });

            acciones.append(editar, eliminar);
            elemento.appendChild(acciones);
        }

        contenedor.appendChild(elemento);
    });
}

function calcularPuntuacion(pelicula, puntuaciones) {
    const valores = [
        Number(pelicula.puntuacion),
        ...Object.values(puntuaciones).map(Number)
    ].filter(valor => Number.isFinite(valor));

    return (
        valores.reduce((total, valor) => total + valor, 0) /
        valores.length
    ).toFixed(1);
}

async function renderizarPelicula(pelicula) {
    const contenedor = document.getElementById("detalle-pelicula");

    // Comprobamos si existe una sesión activa.
    const autenticado = Boolean(sessionStorage.getItem("cineboxdCurrentUser"));
    contenedor.replaceChildren();

    // Consultamos las listas, puntuaciones y reseñas mediante api.js.
    const [
        respuestaWatchlist,
        respuestaVistas,
        respuestaRatings,
        respuestaReviews
    ] = await Promise.all([
        obtenerListaUsuario("watchlist"),
        obtenerListaUsuario("vistas"),
        obtenerPuntuaciones(),
        obtenerResenas(pelicula.id)
    ]);

    const respuestas = [
        respuestaWatchlist,
        respuestaVistas,
        respuestaRatings,
        respuestaReviews
    ];

    const error = respuestas.find(respuesta => !respuesta.ok);

    if (error) {
        throw new Error(error.error);
    }

    const watchlist = respuestaWatchlist.data;
    const vistas = respuestaVistas.data;

    // Las puntuaciones se guardan agrupadas por ID de película.
    const todasLasRatings = respuestaRatings.data;
    const ratings = todasLasRatings[pelicula.id] || {};

    const reviews = respuestaReviews.data;

    const ratingPropio = ratings[usuarioActual()] || "";
    const estaEnWatchlist = watchlist.includes(pelicula.id);

    const poster = document.createElement("img");
    poster.className = "w-full rounded-lg object-cover md:aspect-[2/3]";
    poster.src = pelicula.poster;
    poster.alt = `Póster de ${pelicula.titulo}`;

    const informacion = document.createElement("div");
    informacion.className = "min-w-0";

    informacion.appendChild(
        crearElemento("h1", pelicula.titulo, "mt-0 text-3xl font-bold")
    );

    informacion.appendChild(crearElemento(
        "p",
        `Puntuación general: ${calcularPuntuacion(pelicula, ratings)}`,
        "puntuacion-general text-xl font-bold"
    ));

    const generos = crearElemento("div", "", "mb-2 mt-4 flex flex-wrap gap-1.5");

    pelicula.generos.forEach(genero => {
        generos.appendChild(
            crearElemento(
                "span",
                genero,
                "rounded-full bg-blue-100 px-2 py-1 text-sm text-blue-800"
            )
        );
    });

    informacion.appendChild(generos);

    const acciones = crearElemento("div", "", "grid gap-3 mt-6");

    const botonWatchlist = crearElemento(
        "button",
        estaEnWatchlist ? "Quitar de watchlist" : "Agregar a watchlist",
        "w-fit rounded-md bg-blue-600 px-3.5 py-2.5 text-white hover:bg-blue-700 disabled:opacity-50"
    );

    botonWatchlist.type = "button";

    // Agregar y quitar de watchlist mediante la API.
    botonWatchlist.addEventListener("click", async () => {
        botonWatchlist.disabled = true;

        const respuestaLista = await obtenerListaUsuario("watchlist");

        if (!respuestaLista.ok) {
            mostrarToast(respuestaLista.error);
            botonWatchlist.disabled = false;
            return;
        }

        const lista = respuestaLista.data;
        const indice = lista.indexOf(pelicula.id);

        if (indice === -1) {
            lista.push(pelicula.id);
        } else {
            lista.splice(indice, 1);
        }

        const respuesta = await guardarListaUsuario("watchlist", lista);

        if (!respuesta.ok) {
            mostrarToast(respuesta.error);
        } else {
            botonWatchlist.textContent = indice === -1
                ? "Quitar de watchlist"
                : "Agregar a watchlist";
            if (indice === -1) {
                botonVista.textContent = "Marcar como vista";
            }

            mostrarMensaje(
                indice === -1
                    ? "Película agregada a tu watchlist."
                    : "Película quitada de tu watchlist."
            );
        }

        botonWatchlist.disabled = false;
    });

    if (autenticado) {
        acciones.appendChild(botonWatchlist);
        informacion.appendChild(acciones);
    }

    const botonVista = crearElemento(
        "button",
        vistas.includes(pelicula.id) ? "Quitar de vistas" : "Marcar como vista",
        "w-fit rounded-md bg-blue-600 px-3.5 py-2.5 text-white hover:bg-blue-700 disabled:opacity-50"
    );

    botonVista.type = "button";

    // Registrar o quitar una película vista mediante la API.
    botonVista.addEventListener("click", async () => {
        botonVista.disabled = true;

        const respuestaLista = await obtenerListaUsuario("vistas");

        if (!respuestaLista.ok) {
            mostrarToast(respuestaLista.error);
            botonVista.disabled = false;
            return;
        }

        const vistasActualizadas = respuestaLista.data;
        const indice = vistasActualizadas.indexOf(pelicula.id);

        if (indice === -1) {
            vistasActualizadas.push(pelicula.id);
        } else {
            vistasActualizadas.splice(indice, 1);
        }

        const respuesta = await guardarListaUsuario(
            "vistas",
            vistasActualizadas
        );

        if (!respuesta.ok) {
            mostrarToast(respuesta.error);
        } else {
            botonVista.textContent = indice === -1
                ? "Quitar de vistas"
                : "Marcar como vista";
            if (indice === -1) {
                botonWatchlist.textContent = "Agregar a watchlist";
            }

            mostrarToast(
                indice === -1
                    ? "Película marcada como vista."
                    : "Película quitada de tus vistas."
            );
        }

        botonVista.disabled = false;
    });

    if (autenticado) {
        acciones.appendChild(botonVista);
    }

    const formulario = crearElemento("form", "", "mt-6 grid max-w-xl gap-3");

    formulario.appendChild(
        crearElemento("h2", "Puntuar película", "text-xl font-bold")
    );

    const selector = document.createElement("select");
    selector.className = "w-full max-w-xl rounded-md border border-gray-300 p-2.5 font-inherit";
    selector.name = "puntuacion";
    selector.required = true;

    selector.innerHTML = '<option value="">Elige una puntuación</option>' +
        [1, 2, 3, 4, 5].map(valor =>
            `<option value="${valor}">${valor}/5</option>`
        ).join("");

    selector.value = ratingPropio;

    const botonPuntuar = crearElemento(
        "button",
        "Guardar puntuación",
        "w-fit rounded-md bg-blue-600 px-3.5 py-2.5 text-white hover:bg-blue-700 disabled:opacity-50"
    );

    botonPuntuar.type = "submit";

    formulario.append(selector, botonPuntuar);

    // Guardar la puntuación mediante la API.
    formulario.addEventListener("submit", async event => {
        event.preventDefault();

        if (!selector.value) return;

        botonPuntuar.disabled = true;
        botonPuntuar.textContent = "Guardando...";

        const respuesta = await guardarPuntuacion(
            pelicula.id,
            selector.value
        );

        botonPuntuar.disabled = false;
        botonPuntuar.textContent = "Guardar puntuación";

        if (!respuesta.ok) {
            mostrarToast(respuesta.error);
            return;
        }

        const nuevasRatings = {
            ...ratings,
            [usuarioActual()]: Number(selector.value)
        };

        informacion.querySelector(".puntuacion-general").textContent =
            `Puntuación general: ${calcularPuntuacion(pelicula, nuevasRatings)}`;

        mostrarToast("Tu puntuación fue guardada.");
    });

    if (autenticado) {
        informacion.appendChild(formulario);
    } else {
        informacion.appendChild(
            crearElemento(
                "p",
                "Inicia sesión para agregar películas a tus listas y puntuar.",
                "mt-6 text-gray-600"
            )
        );
    }

    const resenas = crearElemento("section", "");

    resenas.appendChild(
        crearElemento("h2", "Reseñas", "mt-6 text-xl font-bold")
    );

    const formularioResena = crearElemento("form", "", "mt-6 grid max-w-xl gap-3");

    const texto = document.createElement("textarea");
    texto.className = "w-full max-w-xl rounded-md border border-gray-300 p-2.5 font-inherit";
    texto.name = "resena";
    texto.rows = 4;
    texto.required = false;
    texto.placeholder = "Escribe una reseña (opcional)...";

    const botonResena = crearElemento(
        "button",
        "Publicar reseña",
        "w-fit rounded-md bg-blue-600 px-3.5 py-2.5 text-white hover:bg-blue-700 disabled:opacity-50"
    );

    botonResena.type = "submit";

    formularioResena.append(texto, botonResena);

    const listaResenas = crearElemento("ul", "", "mt-3 grid list-none gap-3 p-0");

    renderizarResenas(listaResenas, reviews, pelicula.id, autenticado, ratings);

    // Crear reseñas mediante la API.
    formularioResena.addEventListener("submit", async event => {
        event.preventDefault();

        if (!texto.value.trim()) {
            mostrarToast("La reseña es opcional: escribe un texto para publicarla.");
            return;
        }

        botonResena.disabled = true;
        botonResena.textContent = "Publicando...";

        const respuesta = await crearResena(
            pelicula.id,
            texto.value
        );

        botonResena.disabled = false;
        botonResena.textContent = "Publicar reseña";

        if (!respuesta.ok) {
            mostrarToast(respuesta.error);
            return;
        }

        const nuevasResenas = await obtenerResenas(pelicula.id);

        if (nuevasResenas.ok) {
            texto.value = "";

            renderizarResenas(
                listaResenas,
                nuevasResenas.data,
                pelicula.id,
                autenticado,
                ratings
            );

            mostrarToast("Tu reseña fue publicada.");
        }
    });

    if (autenticado) {
        resenas.append(formularioResena, listaResenas);
    } else {
        resenas.appendChild(
            crearElemento(
                "p",
                "Inicia sesión para publicar reseñas.",
                "mt-3 text-gray-600"
            )
        );

        resenas.appendChild(listaResenas);
    }

    informacion.appendChild(resenas);

    contenedor.append(poster, informacion);
}

async function cargarPelicula() {
    const id = Number(new URLSearchParams(window.location.search).get("id"));

    const detalle = document.getElementById("detalle-pelicula");

    mostrarMensaje("Cargando película...");

    detalle.replaceChildren();

    try {
        // La API devuelve la película en respuesta.data.
        const respuesta = await obtenerPeliculaPorId(id);

        if (!respuesta.ok) {
            if (respuesta.status === 404) {
                window.location.replace("404.html");
                return;
            }

            throw new Error(respuesta.error);
        }

        const pelicula = respuesta.data;

        document.title = `${pelicula.titulo} - Cinebox`;

        mostrarMensaje("");

        await renderizarPelicula(pelicula);

    } catch (error) {
        console.error("No se pudo cargar la película:", error);

        detalle.replaceChildren();

        mostrarMensaje(
            "No se pudo cargar la película. Intenta nuevamente.",
            true
        );

        const boton = document.createElement("button");

        boton.type = "button";
        boton.textContent = "Reintentar";

        boton.addEventListener("click", cargarPelicula);

        detalle.appendChild(boton);
    }
}

cargarPelicula();
