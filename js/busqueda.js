function mostrarMensajeResultados(contenedor, texto) {
    contenedor.innerHTML = "";
    const mensaje = document.createElement("p");
    mensaje.className = "mensaje-resultados";
    mensaje.textContent = texto;
    contenedor.appendChild(mensaje);
}

function mostrarErrorResultados(contenedor, texto, reintentar) {
    contenedor.replaceChildren();
    const mensaje = document.createElement("div");
    mensaje.className = "mensaje-resultados estado-error";
    mensaje.appendChild(document.createTextNode(texto));
    const boton = document.createElement("button");
    boton.type = "button";
    boton.textContent = "Reintentar";
    boton.addEventListener("click", reintentar);
    mensaje.appendChild(boton);
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

    const generos = document.createElement("div");
    generos.className = "etiquetas-genero";
    pelicula.generos.forEach(genero => {
        const etiqueta = document.createElement("span");
        etiqueta.textContent = genero;
        generos.appendChild(etiqueta);
    });

    tarjeta.append(poster, titulo, puntuacion, generos);
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
        mostrarMensajeResultados(contenedor, "Escribe el nombre de una película para comenzar.");
        return;
    }

    titulo.textContent = `Resultados para "${consulta}"`;
    mostrarMensajeResultados(contenedor, "Cargando películas...");

    try {
        const peliculas = await obtenerPeliculas();
        //2026-11-01 Martín Aliante
        const consultaNormalizada = normalizarTexto(consulta);
        const resultados = peliculas.filter(pelicula =>
            normalizarTexto(pelicula.titulo).includes(consultaNormalizada)
        );
        //2026-11-01 Martín Aliante

        const orden = document.getElementById("orden-resultados");
        const filtroGenero = document.getElementById("filtro-genero");
        const renderizarResultados = () => {
            const filtrados = resultados
                .filter(pelicula =>
                    filtroGenero.value === "todos" ||
                    pelicula.generos.some(genero =>
                        normalizarTexto(genero) === normalizarTexto(filtroGenero.value)
                    )
                )
                .sort((a, b) => {
                    if (orden.value === "alfabetico") {
                        return a.titulo.localeCompare(b.titulo, "es");
                    }
                    if (orden.value === "peor") {
                        return Number(a.puntuacion) - Number(b.puntuacion);
                    }
                    if (orden.value === "mejor") {
                        return Number(b.puntuacion) - Number(a.puntuacion);
                    }
                    return 0;
                });

            if (filtrados.length === 0) {
                mostrarMensajeResultados(contenedor, "No hay películas que cumplan el filtro.");
                return;
            }
            contenedor.replaceChildren(...filtrados.map(crearResultado));
        };

        orden.addEventListener("change", renderizarResultados);
        filtroGenero.addEventListener("change", renderizarResultados);
        renderizarResultados();
    } catch (error) {
        console.error("No se pudieron cargar los resultados:", error);
        mostrarErrorResultados(
            contenedor,
            "No se pudieron cargar las películas.",
            cargarResultados
        );
    }
}

cargarResultados();