const PROFILE_REVIEWS_KEY = "cineboxdReviews";
const PROFILE_VIEW_RATINGS = {
    4: 4.5,
    5: 4
};

function crearActividadVista(pelicula) {
    const actividad = document.createElement("article");
    actividad.className = "mx-auto max-w-md text-left";

    const texto = document.createElement("p");
    texto.className = "mb-3 text-lg";
    texto.textContent = "Viste:";

    const enlace = document.createElement("a");
    enlace.href = `pelicula.html?id=${encodeURIComponent(pelicula.id)}`;
    enlace.className = "block overflow-hidden rounded-lg bg-gray-50 shadow hover:shadow-md";

    const poster = document.createElement("img");
    poster.src = pelicula.poster;
    poster.alt = `Póster de ${pelicula.titulo}`;
    poster.className = "max-h-96 w-full object-contain";

    const titulo = document.createElement("h3");
    titulo.textContent = pelicula.titulo;
    titulo.className = "px-3 pt-3 text-xl font-semibold";

    const puntuacion = document.createElement("p");
    puntuacion.textContent = `Tu puntuación: ${PROFILE_VIEW_RATINGS[pelicula.id] || pelicula.puntuacion}/5`;
    puntuacion.className = "px-3 pb-3 pt-1 font-semibold text-gray-700";

    enlace.append(poster, titulo, puntuacion);
    actividad.append(texto, enlace);
    return actividad;
}

async function cargarActividadPerfil(usuario) {
    const contenedor = document.getElementById("perfil-actividad");
    try {
        const peliculas = await obtenerPeliculas();
        const peliculaVista = peliculasDeLista(peliculas, "vistas")
            .find(pelicula => pelicula.id === 4);
        contenedor.replaceChildren();
        if (!peliculaVista) {
            const mensaje = document.createElement("p");
            mensaje.className = "py-6 text-gray-600";
            mensaje.textContent = "Todavía no tienes actividad para mostrar.";
            contenedor.appendChild(mensaje);
            return;
        }
        contenedor.appendChild(crearActividadVista(peliculaVista));
    } catch (error) {
        console.error("No se pudo cargar la actividad del perfil:", error);
        contenedor.textContent = "No se pudo cargar la actividad.";
        contenedor.className += " text-red-700";
    }
}

function crearTarjetaPerfil(pelicula, esVista = false) {
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

    if (esVista) {
        const puntuacion = document.createElement("p");
        puntuacion.textContent = `Tu puntuación: ${PROFILE_VIEW_RATINGS[pelicula.id] || pelicula.puntuacion}/5`;
        puntuacion.className = "px-3 pb-3 font-semibold text-gray-700";
        tarjeta.appendChild(puntuacion);
    }

    return tarjeta;
}

async function cargarPeliculasPerfil(usuario) {
    const panelVistas = document.getElementById("perfil-peliculas-vistas");
    const panelWatchlist = document.getElementById("perfil-peliculas-watchlist");
    try {
        const peliculas = await obtenerPeliculas();
        const vistas = peliculasDeLista(peliculas, "vistas");
        const watchlist = peliculasDeLista(peliculas, "watchlist");
        const renderizar = (panel, ids, vacio, esVista = false) => {
            const seleccionadas = ids;
            panel.replaceChildren();
            if (seleccionadas.length === 0) {
                const mensaje = document.createElement("p");
                mensaje.className = "col-span-full py-6 text-gray-600";
                mensaje.textContent = vacio;
                panel.appendChild(mensaje);
                return;
            }
            seleccionadas.forEach(pelicula => {
                panel.appendChild(crearTarjetaPerfil(pelicula, esVista));
            });
        };
        renderizar(panelVistas, vistas, "Todavía no tienes películas vistas.", true);
        renderizar(panelWatchlist, watchlist, "Todavía no tienes películas en tu watchlist.");
    } catch (error) {
        console.error("No se pudieron cargar las películas del perfil:", error);
        [panelVistas, panelWatchlist].forEach(panel => {
            panel.textContent = "No se pudieron cargar las películas.";
            panel.className += " text-red-700";
        });
    }
}

function leerDatosPerfil(clave, valorInicial) {
    try {
        const dato = localStorage.getItem(clave);
        return dato ? JSON.parse(dato) : valorInicial;
    } catch (error) {
        console.error(`No se pudo leer ${clave}:`, error);
        return valorInicial;
    }
}

function cargarPerfil() {
    const usuario = sessionStorage.getItem("cineboxdCurrentUser");
    const mensaje = document.getElementById("perfil-mensaje");
    const contenido = document.getElementById("perfil-contenido");

    if (!usuario) {
        mensaje.textContent = "Debes iniciar sesión para ver tu perfil.";
        const enlace = document.createElement("a");
        enlace.href = "login.html";
        enlace.textContent = "Iniciar sesión";
        mensaje.append(" ", enlace);
        return;
    }

    const watchlist = leerListaUsuario("watchlist");
    const vistas = leerListaUsuario("vistas");
    const reseñas = Object.keys(localStorage)
        .filter(clave => clave.startsWith(`${PROFILE_REVIEWS_KEY}_`))
        .reduce((total, clave) => {
            const peliculas = leerDatosPerfil(clave, []);
            return total + peliculas.filter(resena => resena.usuario === usuario).length;
        }, 0);

    document.getElementById("perfil-nombre").textContent = `@${usuario}`;
    document.getElementById("perfil-vistas").textContent = vistas.length;
    document.getElementById("perfil-watchlist").textContent = watchlist.length;
    document.getElementById("perfil-vistas-tab").textContent = vistas.length;
    document.getElementById("perfil-watchlist-tab").textContent = watchlist.length;
    document.getElementById("perfil-resenas").textContent = reseñas;
    contenido.hidden = false;
    mensaje.textContent = "";
    cargarPeliculasPerfil(usuario);
    cargarActividadPerfil(usuario);
}

document.getElementById("cerrar-sesion")?.addEventListener("click", () => {
    sessionStorage.removeItem("cineboxdCurrentUser");
    window.location.href = "index.html";
});

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

cargarPerfil();

window.addEventListener("pageshow", cargarPerfil);
window.addEventListener("storage", event => {
    if (event.key?.startsWith("vistas_") || event.key?.startsWith("watchlist_")) {
        cargarPerfil();
    }
});
