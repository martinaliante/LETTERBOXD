
async function obtenerPeliculas() {
    try {
        const respuesta = await fetch('./mocks/peliculas.json');

        if (!respuesta.ok) {
            throw new Error('No se pudieron cargar las películas');
        }

        return await respuesta.json();
    } catch (error) {
        console.error('Error al obtener películas:', error);
        return [];
    }
}
