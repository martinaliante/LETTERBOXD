
function obtenerPeliculasVistas() {
    return leerListaUsuario("vistas");
}

function mostrarEstadoVistas(texto, reintentar = false) {
    const estado = document.getElementById("vistas-estado");
    if (!estado) return;

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

    if (!contenedor) return;

    mostrarEstadoVistas("Cargando películas vistas...");
    contenedor.replaceChildren();

    try {
        const [
            respuestaPeliculas,
            respuestaVistas,
            respuestaPuntuaciones
        ] = await Promise.all([
            obtenerPeliculas(),
            obtenerListaUsuario("vistas"),
            obtenerPuntuaciones()
        ]);

        const respuestas = [
            respuestaPeliculas,
            respuestaVistas,
            respuestaPuntuaciones
        ];

        const error = respuestas.find(respuesta => !respuesta.ok);

        if (error) {
            throw new Error(error.error);
        }

        const peliculas = respuestaPeliculas.data;
        const idsVistas = respuestaVistas.data;
        const puntuaciones = respuestaPuntuaciones.data;

        const usuario = sessionStorage.getItem("cineboxdCurrentUser");

        const peliculasVistas = peliculas.filter(
            pelicula => idsVistas.includes(Number(pelicula.id))
        );

        if (peliculasVistas.length === 0) {
            mostrarEstadoVistas("Todavía no has marcado películas como vistas.");
            return;
        }

        mostrarEstadoVistas("");

        peliculasVistas.forEach(pelicula => {
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

            const valor = puntuaciones[pelicula.id]?.[usuario];

            puntuacion.textContent = valor !== undefined
                ? `Tu puntuación: ${valor}/5`
                : "Todavía no has puntuado esta película.";

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
