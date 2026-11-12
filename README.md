# Cinebox

**Integrantes:** Martín Aliante, Ethan Araya y Mateo Panes.

Cinebox es una red social para compartir, puntuar y reseñar películas,
te permite llevar un registro personal de las películas que has visto o
tener una lista para ver mas tarde; tambien puedes seguir a otras personas para saber que es lo que ven o recomiendan, asi como tu tambien puedes publicar las películas que te gustaron.

## Registro de uso de IA

Consultar el [índice de uso de IA](ia/README.md).

## Tecnologías

- HTML, CSS y JavaScript.
- Tailwind CSS se carga desde CDN en las vistas de película y perfil.
- Alpine.js se carga desde CDN en la página de inicio.
- La aplicación no requiere Node.js, npm, backend ni base de datos.

## Requisitos:

- Git para la clonación del repositorio
- Visual Studio Code
- Navegador 
- Extensión Live Server para VS Code (Ritwick Dey)

## Instalación y clonación


1. Instalar la extensión Live Server si no está instalada.
2. En VS Code con una terminal abierta en la carpeta en donde se quiera guardar el proyecto, ejecutar:

git clone https://github.com/martinaliante/LETTERBOXD.git

cd LETTERBOXD

code .

Estos comandos clonan el repositorio desde GitHub, ingresan a la carpeta del proyecto y la abren en Visual Studio Code. Luego, sigue los pasos de ejecución indicados abajo para iniciar la aplicación con Live Server.

## Ejecución

1. Abrir el archivo `index.html`
2. Hacer clic derecho sobre el archivo
3. Seleccionar `Open with Live Server`
4. La aplicación se abrirá en el navegador

¡¡Advertencia!!: No se debe abrir index.html directamente como archivo (file://). La aplicación necesita Live Server para cargar los mocks JSON.

## Vistas disponibles

- Inicio: catálogo y actividad de amigos; se accede desde el titulo de la pagina o el enlace Inicio.
- Búsqueda: usa el formulario de búsqueda de la navegación; los resultados aparecen en `resultados.html`.
- Detalle de película: selecciona una película del catálogo o de los resultados.
- Registro e inicio de sesión: usa los enlaces 'Registrarse' e 'Iniciar sesión' cuando no hay una sesión activa.
- Perfil: inicia sesión y selecciona tu nombre de usuario en la barra de navegación.
- Amigos y notificaciones: accede desde los enlaces correspondientes en la barra de navegación.
- Página no encontrada: una película inexistente muestra el estado de contenido no encontrado; `404.html` también ofrece enlaces para volver al inicio o buscar.

## Registro e inicio de sesión

No hay credenciales de prueba precargadas ni un usuario administrador. Cada integrante debe crear una cuenta desde 'Registrarse' y después iniciar sesión con ese usuario. Para hacerlo se registra una cuenta con usuario "hola" y contraseña "hola". Luego inicia sesión con esas credenciales.

La API es simulada: las cuentas y los cambios se guardan únicamente en el almacenamiento local del navegador donde se crearon. No se sincronizan entre dispositivos ni se almacenan en un backend real. La contraseña se guarda como hash con salt.

## Datos y servicios

Las vistas acceden a los datos mediante `js/api.js`; no leen los archivos JSON directamente. La capa de servicios carga datos iniciales desde `mocks/`, simula latencia de red y responde con el formato `{ ok, status, data, error }`. Las escrituras se guardan en `localStorage`; `sessionStorage` conserva la sesión activa.

| Función | Método | Ruta simulada | Uso |
|---|---|---|---|
| `obtenerPeliculas()` | GET | `/api/peliculas` | Catálogo y búsqueda |
| `obtenerPeliculaPorId(id)` | GET | `/api/peliculas/:id` | Detalle de película |
| `crearPelicula(datos)` | POST | `/api/peliculas` | Crear película |
| `actualizarPelicula(id, cambios)` | PUT | `/api/peliculas/:id` | Actualizar película |
| `eliminarPelicula(id)` | DELETE | `/api/peliculas/:id` | Eliminar película |
| `obtenerUsuarios()` | GET | `/api/usuarios` | Lista de usuarios |
| `obtenerUsuario(username)` | GET | `/api/usuarios/:username` | Buscar usuario para iniciar sesión |
| `crearUsuario(datos)` | POST | `/api/usuarios` | Registrar usuario |
| `obtenerAmigos()` | GET | `/api/amigos` | Vista de amigos |
| `obtenerActividad()` | GET | `/api/actividad` | Inicio y notificaciones |
| `obtenerListaUsuario(tipo)` | GET | `/api/usuarios/:usuario/:tipo` | Consultar vistas o watchlist |
| `guardarListaUsuario(tipo, ids)` | PUT | `/api/usuarios/:usuario/:tipo` | Guardar vistas o watchlist |
| `obtenerPuntuaciones()` | GET | `/api/puntuaciones` | Consultar puntuaciones |
| `guardarPuntuacion(id, valor)` | POST | `/api/peliculas/:id/puntuaciones` | Puntuar película |
| `obtenerResenas(id)` | GET | `/api/peliculas/:id/resenas` | Consultar reseñas de una película |
| `crearResena(id, texto)` | POST | `/api/peliculas/:id/resenas` | Publicar reseña |
| `editarResena(id, idResena, texto)` | PUT | `/api/peliculas/:id/resenas/:idResena` | Editar reseña |
| `eliminarResena(id, idResena)` | DELETE | `/api/peliculas/:id/resenas/:idResena` | Eliminar reseña |
| `obtenerResenasUsuario(usuario)` | GET | `/api/usuarios/:usuario/resenas` | Consultar reseñas del perfil autenticado |

Para probar el estado de error, se debe ejecutar `apiActivarError()` en la consola del navegador. Para restaurar las solicitudes, se debe ejecutar `apiDesactivarError()`.
