
async function obtenerPeliculas() {
    const respuesta = await fetch('./mocks/peliculas.json');

    if (!respuesta.ok) {
        throw new Error('No se pudieron cargar las películas');
    }

    const peliculas = await respuesta.json();
    if (!Array.isArray(peliculas)) {
        throw new Error('El formato de las películas no es válido');
    }

    return peliculas;
}
