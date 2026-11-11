async function leerListaUsuario(tipo) {
    const respuesta = await obtenerListaUsuario(tipo);
    if (!respuesta.ok) throw new Error(respuesta.error);
    return respuesta.data;
}

async function peliculasDeLista(peliculas, tipo) {
    const ids = await leerListaUsuario(tipo);
    return peliculas.filter(pelicula => ids.includes(pelicula.id));
}
