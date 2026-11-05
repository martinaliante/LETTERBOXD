const WATCHLIST_KEY = "cineboxdWatchlist";
const WATCHLISTA_INICIAL = [6, 7];

function obtenerWatchlist() {
    const usuario = sessionStorage.getItem("cineboxdCurrentUser") || "invitado";
    try {
        const guardada = localStorage.getItem(`${WATCHLIST_KEY}_${usuario}`);
        return guardada ? JSON.parse(guardada) : WATCHLISTA_INICIAL;
    } catch (error) {
        console.error("No se pudo leer la watchlist:", error);
        return [];
    }
}

async function mostrarPeliculasGuardadas() {
    const contenedor = document.getElementById("watchlist-peliculas");
    const estado = document.getElementById("watchlist-estado");
    estado.textContent = "Cargando watchlist...";
    const ids = obtenerWatchlist();
    if (ids.length === 0) {
        estado.textContent = "Todavía no tienes películas en tu watchlist.";
        return;
    }

    try {
        const peliculas = await obtenerPeliculas();
        const guardadas = peliculas.filter(pelicula => ids.includes(pelicula.id));

        contenedor.replaceChildren();
        if (guardadas.length === 0) {
            estado.textContent = "Todavía no tienes películas en tu watchlist.";
            return;
        }
        estado.textContent = "";
        guardadas.forEach(pelicula => {
            const articulo = document.createElement("article");
            articulo.className = "pelicula";

            const enlace = document.createElement("a");
            enlace.href = `pelicula.html?id=${encodeURIComponent(pelicula.id)}`;
            enlace.style.color = "inherit";
            enlace.style.textDecoration = "none";

            const imagen = document.createElement("img");
            imagen.src = pelicula.poster;
            imagen.alt = `Póster de ${pelicula.titulo}`;

            const titulo = document.createElement("h2");
            titulo.textContent = pelicula.titulo;
            enlace.append(imagen, titulo);
            articulo.appendChild(enlace);
            contenedor.appendChild(articulo);
        });
    } catch (error) {
        console.error("No se pudo cargar la watchlist:", error);
        estado.textContent = "No se pudo cargar la watchlist.";
        const boton = document.createElement("button");
        boton.type = "button";
        boton.textContent = "Reintentar";
        boton.addEventListener("click", mostrarPeliculasGuardadas);
        estado.appendChild(boton);
    }
}

mostrarPeliculasGuardadas();
