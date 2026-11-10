

let peliculasDisponibles = [];

// Guarda la consulta realizada por el usuario.
let consultaActual = "";



function normalizarTexto(texto) {
    return String(texto)
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}



function mostrarMensajeResultados(contenedor, texto) {
    contenedor.replaceChildren();

    const mensaje = document.createElement("p");

    mensaje.className = "mensaje-resultados";
    mensaje.textContent = texto;

    contenedor.appendChild(mensaje);
}


// Muestra un error junto con un botón para reintentar.
function mostrarErrorResultados(contenedor, texto, reintentar) {
    contenedor.replaceChildren();

    const mensaje = document.createElement("div");

    mensaje.className = "mensaje-resultados estado-error";

    const textoError = document.createElement("p");
    textoError.textContent = texto;

    const boton = document.createElement("button");

    boton.type = "button";
    boton.textContent = "Reintentar";

    boton.addEventListener("click", reintentar);

    mensaje.append(textoError, boton);

    contenedor.appendChild(mensaje);
}



function crearResultado(pelicula) {

    const tarjeta = document.createElement("article");

    tarjeta.className = "resultado-pelicula";

    // Permite acceder al detalle de la película.
    tarjeta.addEventListener("click", () => {
        window.location.href =
            `pelicula.html?id=${encodeURIComponent(pelicula.id)}`;
    });

    // Permite navegar mediante teclado.
    tarjeta.setAttribute("role", "link");
    tarjeta.tabIndex = 0;

    tarjeta.addEventListener("keydown", event => {

        if (event.key === "Enter" || event.key === " ") {

            event.preventDefault();
            tarjeta.click();

        }

    });


    // Imagen del póster.
    const poster = document.createElement("img");

    poster.src = pelicula.poster;
    poster.alt = `Póster de ${pelicula.titulo}`;


    // Título de la película.
    const titulo = document.createElement("h2");

    titulo.textContent = pelicula.titulo;


    // Puntuación.
    const puntuacion = document.createElement("p");

    puntuacion.textContent = `Puntuación: ${pelicula.puntuacion}/5`;


    // Géneros.
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



function renderizarResultados() {

    const contenedor = document.getElementById("resultados-peliculas");

    const orden = document.getElementById("orden-resultados");

    const filtroGenero = document.getElementById("filtro-genero");


    // Busca películas cuyo título coincida con la consulta
    const resultados = peliculasDisponibles.filter(pelicula =>
        normalizarTexto(pelicula.titulo).includes(
            normalizarTexto(consultaActual)
        )
    );



    const filtrados = resultados.filter(pelicula => {

        return filtroGenero.value === "todos" ||

            pelicula.generos.some(genero =>
                normalizarTexto(genero) ===
                normalizarTexto(filtroGenero.value)
            );

    });


    // Crea una copia antes de ordenar.
    const ordenados = [...filtrados].sort((a, b) => {

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


    // Comprueba si existen resultados.
    if (ordenados.length === 0) {

        mostrarMensajeResultados(
            contenedor,
            "No hay películas que cumplan el filtro."
        );

        return;
    }


    // Genera las tarjetas dinámicamente.
    contenedor.replaceChildren(
        ...ordenados.map(crearResultado)
    );

}


async function cargarResultados() {

    const titulo = document.getElementById("titulo-resultados");

    const contenedor = document.getElementById("resultados-peliculas");


    // Lee el parámetro q de la dirección URL.
    const parametros = new URLSearchParams(window.location.search);

    consultaActual = parametros.get("q") || "";


    // Comprueba si el usuario escribió una búsqueda.
    if (!consultaActual.trim()) {

        titulo.textContent = "Busca una película.";

        mostrarMensajeResultados(
            contenedor,
            "Escribe el nombre de una película para comenzar."
        );

        return;
    }


    titulo.textContent = `Resultados para "${consultaActual}"`;

    mostrarMensajeResultados(
        contenedor,
        "Cargando películas..."
    );


    try {

        // Consulta las películas mediante api.js.
        const respuesta = await obtenerPeliculas();


        // Comprueba si la API respondió correctamente.
        if (!respuesta.ok) {

            throw new Error(respuesta.error);

        }


        // Extrae las películas de la respuesta.
        peliculasDisponibles = respuesta.data;


        // Renderiza los resultados.
        renderizarResultados();


    } catch (error) {

        console.error(
            "No se pudieron cargar los resultados:",
            error
        );


        mostrarErrorResultados(
            contenedor,
            "No se pudieron cargar las películas.",
            cargarResultados
        );

    }

}

function inicializarBusqueda() {

    const orden = document.getElementById("orden-resultados");

    const filtroGenero = document.getElementById("filtro-genero");


    orden.addEventListener("change", renderizarResultados);

    filtroGenero.addEventListener("change", renderizarResultados);


    // Inicia la carga de los resultados.
    cargarResultados();

}


// Ejecuta la búsqueda cuando se carga el archivo.
inicializarBusqueda();
