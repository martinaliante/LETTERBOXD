
/*
============================================================
 CINEBOX - SISTEMA DE BÚSQUEDA
============================================================

Responsabilidades:
- Buscar películas por título.
- Ignorar diferencias entre mayúsculas y minúsculas.
- Ignorar tildes.
- Filtrar películas por género.
- Ordenar por puntuación o alfabéticamente.
- Mostrar estados de carga, vacío y error.
- Permitir reintentar la carga.

Los datos se obtienen exclusivamente mediante api.js.
============================================================
*/


// ============================================================
// 1. VARIABLES
// ============================================================

// Almacena las películas obtenidas desde la API.
let peliculasDisponibles = [];

// Guarda la consulta realizada por el usuario.
let consultaActual = "";


// ============================================================
// 2. NORMALIZACIÓN DE TEXTO
// ============================================================

/*
 * Convierte el texto a minúsculas y elimina las tildes.
 *
 * Ejemplo:
 * "Acción" se convierte en "accion".
 */
function normalizarTexto(texto) {
    return String(texto)
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}


// ============================================================
// 3. MENSAJES DE INTERFAZ
// ============================================================

// Muestra un mensaje dentro del contenedor de resultados.
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


// ============================================================
// 4. CREACIÓN DE TARJETAS
// ============================================================

/*
 * Construye una tarjeta para cada película.
 * El contenido se crea dinámicamente desde los datos del JSON.
 */
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


// ============================================================
// 5. FILTRADO Y ORDENAMIENTO
// ============================================================

/*
 * Aplica los filtros y el ordenamiento seleccionados.
 *
 * Se utiliza [...resultados] para crear una copia del arreglo.
 * Así evitamos modificar el orden original de las películas.
 */
function renderizarResultados() {

    const contenedor = document.getElementById("resultados-peliculas");

    const orden = document.getElementById("orden-resultados");

    const filtroGenero = document.getElementById("filtro-genero");


    // Busca películas cuyo título coincida con la consulta.
    const resultados = peliculasDisponibles.filter(pelicula =>
        normalizarTexto(pelicula.titulo).includes(
            normalizarTexto(consultaActual)
        )
    );


    // Aplica el filtro por género.
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


// ============================================================
// 6. CARGA DE RESULTADOS DESDE LA API
// ============================================================

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


// ============================================================
// 7. INICIALIZACIÓN DE EVENTOS
// ============================================================

/*
 * Los eventos se registran una sola vez.
 *
 * De esta manera, si el usuario presiona Reintentar,
 * no se agregan nuevos eventos a los filtros.
 */
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
