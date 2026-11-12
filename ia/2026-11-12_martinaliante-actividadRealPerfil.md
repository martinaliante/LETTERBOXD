# <Mostrar puntuaciones y actividad reales en el perfil>

-**Fecha**: 2026-11-12
-**Integrante**: Martín Aliante (martinaliante)
-**Modelo y herramienta**: Chat GPT-6
-**Archivos afectados**: pelicula.js,, perfil.js y api.js

# Objetivo

Hacer que la pagina muestre valores actualizados de las peliculas vistas, reseñas y puntuaciones al hacer cambios


# Prompt 1:

En perfil.js, reemplazar PROFILE_VIEW_RATINGS por los datos de obtenerPuntuaciones() y armar la pestaña Actividad con las vistas y reseñas reales del usuario. En pelicula.js:57, mostrar la puntuación real del autor (desde obtenerPuntuaciones) o quitar el "(…/5)". En api.js:357, partir con listas vacías. Para verificar: registrar un usuario nuevo, puntuar y reseñar una película y revisar que el perfil muestre esos mismos datos.

explicame como hacer esto

# Respuesta 1:

En el código actual ya están resueltas algunas partes: perfil.js consulta obtenerPuntuaciones() y las usa para mostrar tu nota en las películas vistas; pelicula.js ya muestra la nota real del autor de cada reseña y la omite si no existe. No encontré PROFILE_VIEW_RATINGS en esta versión, así que quizá te refieres a otra revisión del archivo.

Para completar lo que pides:

1. Empezar con listas vacías. En api.js, obtenerListaUsuario() da [4, 5] y [6, 7] cuando todavía no hay datos guardados. Cambia esos valores iniciales por []. Esto solo afecta a usuarios sin una lista ya guardada.

2. Mostrar vistas y reseñas reales en Actividad. Ahora la actividad del perfil se construye únicamente a partir de vistas. Amplía esa carga para obtener las reseñas del usuario y las películas correspondientes; filtra por el usuario de la sesión y representa ambos tipos de evento. Para cada vista, busca la puntuación con puntuaciones[pelicula.id]?.[usuario]. Para cada reseña, usa el texto almacenado y esa misma búsqueda para mostrar una nota solo si existe. La reseña debe aparecer aunque la película no esté marcada como vista. Puedes aprovechar el recorrido que ya hace contarResenasPerfil(), pero conservando la película asociada a cada reseña para poder enlazarla correctamente.

3. Mantener la nota real del autor. En pelicula.js, el dato ya se obtiene como ratings[resena.usuario] y el texto alternativo omite la puntuación cuando no existe. Si en tu versión aparece un valor ficticio como (.../5), elimínalo o usa esa condición; no reemplaces la nota por la puntuación general de la película.

Cómo probarlo: usa una sesión limpia o registra un usuario nuevo, porque las listas y puntuaciones existentes en localStorage pueden conservar datos de pruebas anteriores. Marca una película como vista, puntúala y publica una reseña. Al volver al perfil, comprueba que Actividad muestre la vista con esa nota y también la reseña. Las vistas se registran al marcarlas como vistas; puntuar o reseñar por sí solo no equivale a una vista.

# Qué se incorporó

obternerUsurario() devuelve una lista vacia si aun no se guarda nada y las que ya existen se conservan en localStorage, en perfil.js se obtienen las vistas, puntuaciones y reseñas del usuario actual; Tambien en la pagina de cada pelicula aparecen las reseñas de los usuarios con su respectivo nombre de usuario y puntuación

# Verificación

Al reseñar y puntuar una pelicula aparece correctamente en la pagina de actividad del perfil.