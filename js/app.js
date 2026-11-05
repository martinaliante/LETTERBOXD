function cinebox() {
    return {
        peliculas: [],
        cargando: true,
        mensaje: '',
        error: false,

        async init() {
            await this.cargarPeliculas();
        },

        async cargarPeliculas() {
            this.cargando = true;
            this.error = false;
            this.mensaje = '';
            try {
                this.peliculas = await obtenerPeliculas();

                if (this.peliculas.length === 0) {
                    this.mensaje = 'No hay películas disponibles.';
                }
            } catch (error) {
                console.error(error);
                this.error = true;
                this.mensaje = 'No se pudieron cargar las películas.';
            } finally {
                this.cargando = false;
            }
        }
    };
}
