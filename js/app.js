
/*
============================================================
 CINEBOX - COMPONENTE PRINCIPAL
============================================================

Este archivo controla la pantalla principal de Cinebox.

Responsabilidades:
- Cargar las películas desde la API.
- Mostrar el estado de carga.
- Mostrar un mensaje si no existen películas.
- Mostrar errores cuando no se pueden obtener los datos.
- Permitir volver a intentar la carga.

Utiliza Alpine.js para actualizar la interfaz automáticamente.
============================================================
*/

function cinebox() {
    return {

        // Arreglo donde se almacenarán las películas.
        peliculas: [],

        // Indica si la API está cargando información.
        cargando: true,

        // Mensaje que se muestra al usuario.
        mensaje: '',

        // Indica si ocurrió un error.
        error: false,


        // ----------------------------------------------------
        // INICIALIZACIÓN
        // ----------------------------------------------------

        /*
         * Alpine ejecuta init() automáticamente
         * cuando inicializa el componente.
         */
        async init() {
            await this.cargarPeliculas();
        },


        // ----------------------------------------------------
        // CARGA DE PELÍCULAS
        // ----------------------------------------------------

        async cargarPeliculas() {

            // Restablece los estados antes de consultar.
            this.cargando = true;
            this.error = false;
            this.mensaje = '';

            try {

                // Consulta las películas mediante la API.
                const respuesta = await obtenerPeliculas();

                // Comprueba si la operación fue exitosa.
                if (!respuesta.ok) {
                    throw new Error(respuesta.error);
                }

                // Extrae los datos de la respuesta uniforme.
                this.peliculas = respuesta.data;

                // Comprueba si existen películas disponibles.
                if (this.peliculas.length === 0) {
                    this.mensaje = 'No hay películas disponibles.';
                }

            } catch (error) {

                // Registra el error para facilitar la depuración.
                console.error(
                    'No se pudieron cargar las películas:',
                    error
                );

                // Actualiza el estado de error.
                this.error = true;
                this.mensaje = 'No se pudieron cargar las películas.';

            } finally {

                // Finaliza el estado de carga.
                this.cargando = false;

            }
        }
    };
}
