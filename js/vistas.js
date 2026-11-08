const PUNTUACIONES_ARTIFICIALES = {
    4: 4.5,
    5: 4
};

function obtenerPeliculasVistas() {
    return leerListaUsuario("vistas");
}

function mostrarEstadoVistas(texto, reintentar) {
    const estado = document.getElementById("vistas-estado");
    estado.replaceChildren();
    estado.appendChild(document.createTextNode(texto));
    if (reintentar) {
        const boton = document.createElement("button");
        boton.type = "button";
        boton.textContent = "Reintentar";
        boton.addEventListener("click", cargarPeliculasVistas);
        estado.appendChild(boton);
    }
}

async function cargarPeliculasVistas() {
    const contenedor = document.getElementById("peliculas-vistas");
    mostrarEstadoVistas("Cargando películas vistas...");
    try {
        const peliculas = await obtenerPeliculas();
        const vistas = peliculasDeLista(peliculas, "vistas");
        contenedor.replaceChildren();
        if (vistas.length === 0) {
            mostrarEstadoVistas("Todavía no has marcado películas como vistas.");
            return;
        }

        mostrarEstadoVistas("");
        vistas.forEach(pelicula => {
            const articulo = document.createElement("article");
            articulo.className = "pelicula";
            const enlace = document.createElement("a");
            enlace.href = `pelicula.html?id=${encodeURIComponent(pelicula.id)}`;
            enlace.className = "enlace-pelicula";
            const titulo = document.createElement("h2");
            titulo.textContent = pelicula.titulo;
            const imagen = document.createElement("img");
            imagen.src = pelicula.poster;
            imagen.alt = `Póster de ${pelicula.titulo}`;
            const puntuacion = document.createElement("p");
            puntuacion.className = "puntuacion";
            puntuacion.textContent =
                `Tu puntuación: ${PUNTUACIONES_ARTIFICIALES[pelicula.id] || pelicula.puntuacion}/5`;
            enlace.append(titulo, imagen, puntuacion);
            articulo.appendChild(enlace);
            contenedor.appendChild(articulo);
        });
    } catch (error) {
        console.error("No se pudieron cargar las películas vistas:", error);
        mostrarEstadoVistas("No se pudieron cargar las películas vistas.", true);
    }
}

cargarPeliculasVistas();
