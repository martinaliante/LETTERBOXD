function mostrarMensajeResultados(contenedor, texto) {
    contenedor.innerHTML = "";
    const mensaje = document.createElement("p");
    mensaje.className = "mensaje-resultados";
    mensaje.textContent = texto;
    contenedor.appendChild(mensaje);
}

function crearResultado(pelicula) {
    const tarjeta = document.createElement("article");
    tarjeta.className = "resultado-pelicula";
    tarjeta.addEventListener("click", () => {
        window.location.href = `pelicula.html?id=${encodeURIComponent(pelicula.id)}`;
    });
    tarjeta.setAttribute("role", "link");
    tarjeta.tabIndex = 0;
    tarjeta.addEventListener("keydown", event => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            tarjeta.click();
        }
    });

    const poster = document.createElement("img");
    poster.src = pelicula.poster;
    poster.alt = `Póster de ${pelicula.titulo}`;

    const titulo = document.createElement("h2");
    titulo.textContent = pelicula.titulo;

    const puntuacion = document.createElement("p");
    puntuacion.textContent = `Puntuación: ${pelicula.puntuacion}/5`;

    tarjeta.append(poster, titulo, puntuacion);
    return tarjeta;
}


//2026-11-01 Martín Aliante
function normalizarTexto(texto) {
    return texto
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}
//2026-11-01 Martín Aliante


async function cargarResultados() {
    const parametros = new URLSearchParams(window.location.search);
    const consulta = parametros.get("q") || "";
    const titulo = document.getElementById("titulo-resultados");
    const contenedor = document.getElementById("resultados-peliculas");

    if (!consulta) {
        titulo.textContent = "Busca una película";
        return;
    }

    titulo.textContent = `Resultados para "${consulta}"`;

    try {
        const peliculas = await obtenerPeliculas();
        //2026-11-01 Martín Aliante
        const consultaNormalizada = normalizarTexto(consulta);
        const resultados = peliculas.filter(pelicula =>
            normalizarTexto(pelicula.titulo).includes(consultaNormalizada)
        );
        //2026-11-01 Martín Aliante

        if (resultados.length === 0) {
            mostrarMensajeResultados(contenedor, "No se encontraron películas.");
            return;
        }

        contenedor.replaceChildren(...resultados.map(crearResultado));
    } catch (error) {
        console.error("No se pudieron cargar los resultados:", error);
        mostrarMensajeResultados(contenedor, "No se pudieron cargar las películas. Intenta nuevamente.");
    }
}

cargarResultados();