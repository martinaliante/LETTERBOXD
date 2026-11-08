const LISTAS_USUARIO = {
    vistas: {
        clave: "vistas",
        inicial: [4, 5]
    },
    watchlist: {
        clave: "watchlist",
        inicial: [6, 7]
    }
};

function usuarioListaActual() {
    return sessionStorage.getItem("cineboxdCurrentUser") || "invitado";
}

function leerListaUsuario(tipo) {
    const configuracion = LISTAS_USUARIO[tipo];
    const clave = `${configuracion.clave}_${usuarioListaActual()}`;
    try {
        const guardada = localStorage.getItem(clave);
        return guardada ? JSON.parse(guardada) : [...configuracion.inicial];
    } catch (error) {
        console.error(`No se pudo leer la lista ${tipo}:`, error);
        return [...configuracion.inicial];
    }
}

function peliculasDeLista(peliculas, tipo) {
    const ids = leerListaUsuario(tipo);
    return peliculas.filter(pelicula => ids.includes(pelicula.id));
}
