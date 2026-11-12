
// ============================================================
// CINEBOX - PERFIL DE USUARIO
// ============================================================

// Obtiene la puntuación real del usuario para una película.
function obtenerPuntuacionPerfil(puntuaciones, pelicula, usuario) {
    return puntuaciones[pelicula.id]?.[usuario] ?? null;
}

// Crea una tarjeta compacta con la actividad de una película.
function crearTarjetaActividadPerfil(pelicula, vista, puntuacion, resenas) {
    const actividad = document.createElement("article");
    actividad.className = "flex items-start gap-3 rounded-lg bg-gray-50 p-3 text-left shadow-sm";

    const poster = document.createElement("img");
    poster.src = pelicula.poster;
    poster.alt = `Póster de ${pelicula.titulo}`;
    poster.className = "h-20 w-14 shrink-0 rounded object-cover";

    const contenido = document.createElement("div");
    contenido.className = "min-w-0 flex-1";

    const enlace = document.createElement("a");
    enlace.href = `pelicula.html?id=${encodeURIComponent(pelicula.id)}`;
    enlace.className = "font-semibold hover:text-blue-700";

    const titulo = document.createElement("h3");
    titulo.textContent = pelicula.titulo;
    titulo.className = "text-base";
    enlace.appendChild(titulo);

    const acciones = [];
    if (vista) acciones.push("La marcaste como vista");
    if (puntuacion !== null) acciones.push(`Puntuaste: ${puntuacion}/5`);
    if (resenas.length > 0) acciones.push("Publicaste una reseña");

    const resumen = document.createElement("p");
    resumen.className = "mt-1 text-xs text-gray-500";
    resumen.textContent = acciones.join(" · ");

    contenido.append(enlace, resumen);

    resenas.forEach(resena => {
        const textoResena = document.createElement("p");
        textoResena.className = "mt-1 line-clamp-2 text-sm text-gray-700";
        textoResena.textContent = resena.texto;
        contenido.appendChild(textoResena);
    });

    actividad.append(poster, contenido);
    return actividad;
}

// Carga la actividad del usuario.
function cargarActividadPerfil(peliculas, vistas, puntuaciones, resenas, usuario) {
    const contenedor = document.getElementById("perfil-actividad");
    if (!contenedor) return;

    contenedor.replaceChildren();

    const vistasIds = new Set(vistas.map(Number));
    const resenasPorPelicula = new Map();

    resenas.forEach(({ pelicula, resena }) => {
        const id = Number(pelicula.id);
        const resenasPelicula = resenasPorPelicula.get(id) || [];
        resenasPelicula.push(resena);
        resenasPorPelicula.set(id, resenasPelicula);
    });

    const actividades = peliculas
        .map(pelicula => ({
            pelicula,
            vista: vistasIds.has(Number(pelicula.id)),
            puntuacion: obtenerPuntuacionPerfil(
                puntuaciones,
                pelicula,
                usuario
            ),
            resenas: resenasPorPelicula.get(Number(pelicula.id)) || []
        }))
        .filter(({ vista, puntuacion, resenas: resenasPelicula }) =>
            vista ||
            (Number.isFinite(Number(puntuacion)) &&
                Number(puntuacion) >= 1 &&
                Number(puntuacion) <= 5) ||
            resenasPelicula.length > 0
        );

    if (actividades.length === 0) {
        const mensaje = document.createElement("p");
        mensaje.className = "py-4 text-sm text-gray-600";
        mensaje.textContent = "Todavía no tienes actividad para mostrar.";
        contenedor.appendChild(mensaje);
        return;
    }

    contenedor.className = "mt-4 grid gap-2 sm:grid-cols-2";
    actividades.forEach(({ pelicula, vista, puntuacion, resenas: resenasPelicula }) =>
        contenedor.appendChild(
            crearTarjetaActividadPerfil(
                pelicula,
                vista,
                puntuacion,
                resenasPelicula
            )
        )
    );
}

// Crea una tarjeta de película para las pestañas del perfil.
function crearTarjetaPerfil(pelicula, puntuacion = null) {
    const tarjeta = document.createElement("a");
    tarjeta.href = `pelicula.html?id=${encodeURIComponent(pelicula.id)}`;
    tarjeta.className = "overflow-hidden rounded-lg bg-gray-50 text-left shadow hover:shadow-md";

    const poster = document.createElement("img");
    poster.src = pelicula.poster;
    poster.alt = `Póster de ${pelicula.titulo}`;
    poster.className = "aspect-[2/3] w-full object-cover";

    const titulo = document.createElement("h3");
    titulo.textContent = pelicula.titulo;
    titulo.className = "p-3 font-semibold";

    tarjeta.append(poster, titulo);

    if (puntuacion !== null) {
        const textoPuntuacion = document.createElement("p");
        textoPuntuacion.textContent = `Tu puntuación: ${puntuacion}/5`;
        textoPuntuacion.className = "px-3 pb-3 font-semibold text-gray-700";
        tarjeta.appendChild(textoPuntuacion);
    }

    return tarjeta;
}

// Renderiza las películas vistas y la watchlist.
function renderizarPeliculasPerfil(
    peliculas,
    vistas,
    watchlist,
    puntuaciones,
    usuario
) {
    const panelVistas = document.getElementById("perfil-peliculas-vistas");
    const panelWatchlist = document.getElementById("perfil-peliculas-watchlist");

    const renderizar = (panel, ids, mensajeVacio, mostrarPuntuacion = false) => {
        if (!panel) return;

        panel.replaceChildren();

        const seleccionadas = peliculas.filter(
            pelicula => ids.includes(Number(pelicula.id))
        );

        if (seleccionadas.length === 0) {
            const mensaje = document.createElement("p");
            mensaje.className = "col-span-full py-6 text-gray-600";
            mensaje.textContent = mensajeVacio;
            panel.appendChild(mensaje);
            return;
        }

        seleccionadas.forEach(pelicula => {
            const puntuacion = mostrarPuntuacion
                ? obtenerPuntuacionPerfil(puntuaciones, pelicula, usuario)
                : null;

            panel.appendChild(
                crearTarjetaPerfil(pelicula, puntuacion)
            );
        });
    };

    renderizar(
        panelVistas,
        vistas,
        "Todavía no tienes películas vistas.",
        true
    );

    renderizar(
        panelWatchlist,
        watchlist,
        "Todavía no tienes películas en tu watchlist."
    );
}

// Obtiene las reseñas publicadas por el usuario.
async function obtenerResenasPerfil(peliculas, usuario) {
    const respuestas = await Promise.all(
        peliculas.map(pelicula => obtenerResenas(pelicula.id))
    );

    const error = respuestas.find(respuesta => !respuesta.ok);
    if (error) {
        throw new Error(error.error);
    }

    return respuestas.flatMap((respuesta, indice) =>
        respuesta.data
            .filter(resena => resena.usuario === usuario)
            .map(resena => ({
                pelicula: peliculas[indice],
                resena
            }))
    );
}

// Carga todos los datos del perfil mediante la API.
async function cargarDatosPerfil(usuario) {
    const [respuestaPeliculas, respuestaVistas, respuestaWatchlist, respuestaPuntuaciones] =
        await Promise.all([
            obtenerPeliculas(),
            obtenerListaUsuario("vistas", usuario),
            obtenerListaUsuario("watchlist", usuario),
            obtenerPuntuaciones()
        ]);

    const respuestas = [
        respuestaPeliculas,
        respuestaVistas,
        respuestaWatchlist,
        respuestaPuntuaciones
    ];

    const error = respuestas.find(respuesta => !respuesta.ok);

    if (error) {
        throw new Error(error.error);
    }

    const peliculas = respuestaPeliculas.data;
    const vistas = respuestaVistas.data;
    const watchlist = respuestaWatchlist.data;
    const puntuaciones = respuestaPuntuaciones.data;

    const resenas = await obtenerResenasPerfil(peliculas, usuario);

    // Actualiza los contadores.
    document.getElementById("perfil-vistas").textContent = vistas.length;
    document.getElementById("perfil-watchlist").textContent = watchlist.length;
    document.getElementById("perfil-vistas-tab").textContent = vistas.length;
    document.getElementById("perfil-watchlist-tab").textContent = watchlist.length;
    document.getElementById("perfil-resenas").textContent = resenas.length;

    // Renderiza las películas y la actividad.
    renderizarPeliculasPerfil(
        peliculas,
        vistas,
        watchlist,
        puntuaciones,
        usuario
    );

    cargarActividadPerfil(
        peliculas,
        vistas,
        puntuaciones,
        resenas,
        usuario
    );
}

// Inicializa el perfil.
async function cargarPerfil() {
    const usuario = sessionStorage.getItem("cineboxdCurrentUser");
    const mensaje = document.getElementById("perfil-mensaje");
    const contenido = document.getElementById("perfil-contenido");

    if (!mensaje || !contenido) return;

    if (!usuario) {
        contenido.hidden = true;
        mensaje.textContent = "Debes iniciar sesión para ver tu perfil.";

        const enlace = document.createElement("a");
        enlace.href = "login.html";
        enlace.textContent = "Iniciar sesión";

        mensaje.append(" ", enlace);
        return;
    }

    document.getElementById("perfil-nombre").textContent = `@${usuario}`;

    mensaje.textContent = "Cargando tu perfil...";
    contenido.hidden = true;

    try {
        await cargarDatosPerfil(usuario);

        contenido.hidden = false;
        mensaje.textContent = "";

    } catch (error) {
        console.error("No se pudo cargar el perfil:", error);
        mensaje.textContent = "No se pudo cargar tu perfil. Intenta nuevamente.";
        mensaje.className += " text-red-700";
    }
}

// Control de pestañas.
document.querySelectorAll("[data-tab]").forEach(tab => {
    tab.addEventListener("click", () => {
        document.querySelectorAll("[data-tab]").forEach(item => {
            const activo = item === tab;

            item.classList.toggle("border-blue-600", activo);
            item.classList.toggle("text-blue-600", activo);
            item.classList.toggle("font-bold", activo);
            item.classList.toggle("border-transparent", !activo);

            item.setAttribute("aria-selected", String(activo));
        });

        document.querySelectorAll("[role='tabpanel']").forEach(panel => {
            panel.hidden = panel.id !== `panel-${tab.dataset.tab}`;
        });
    });
});

// Eventos de carga y actualización.
cargarPerfil();

window.addEventListener("pageshow", cargarPerfil);

window.addEventListener("storage", event => {
    if (
        event.key?.startsWith("vistas_") ||
        event.key?.startsWith("watchlist_") ||
        event.key === "cineboxdRatings" ||
        event.key?.startsWith("cineboxdReviews_")
    ) {
        cargarPerfil();
    }
});
