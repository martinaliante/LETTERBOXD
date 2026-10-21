function cinebox() {
    return {
        peliculas: [],
        cargando: true,
        mensaje: '',

        async init() {
            try {
                this.peliculas = await obtenerPeliculas();

                if (this.peliculas.length === 0) {
                    this.mensaje = 'No hay películas disponibles.';
                }
            } catch (error) {
                console.error(error);
                this.mensaje = 'No se pudieron cargar las películas.';
            } finally {
                this.cargando = false;
            }
        }
    };
}
