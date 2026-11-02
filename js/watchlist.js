const WATCHLIST_KEY = "cineboxdWatchlist";

function obtenerWatchlist() {
    const usuario = sessionStorage.getItem("cineboxdCurrentUser") || "invitado";
    try {
        return JSON.parse(localStorage.getItem(`${WATCHLIST_KEY}_${usuario}`)) || [];
    } catch (error) {
        console.error("No se pudo leer la watchlist:", error);
        return [];
    }
}

async function mostrarPeliculasGuardadas() {
    const ids = obtenerWatchlist();
    if (ids.length === 0) {
        return;
    }

    try {
        const peliculas = await obtenerPeliculas();
        const contenedor = document.getElementById("watchlist-peliculas");
        const guardadas = peliculas.filter(pelicula => ids.includes(pelicula.id));

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
    }
}

mostrarPeliculasGuardadas();
