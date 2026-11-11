function crearEstadoComunidad(texto, error = false) {
    const estado = document.createElement("p");
    estado.className = error ? "estado-interfaz estado-error" : "estado-interfaz";
    estado.textContent = texto;
    return estado;
}

function mostrarErrorComunidad(contenedor, texto, reintentar) {
    const estado = crearEstadoComunidad(texto, true);
    const boton = document.createElement("button");
    boton.type = "button";
    boton.textContent = "Reintentar";
    boton.addEventListener("click", reintentar);
    estado.appendChild(boton);
    mostrarEstadoEnContenedor(contenedor, estado);
}

function mostrarEstadoEnContenedor(contenedor, estado) {
    if (contenedor.tagName === "UL") {
        const item = document.createElement("li");
        item.className = "item-notificacion";
        item.appendChild(estado);
        contenedor.replaceChildren(item);
        return;
    }
    contenedor.replaceChildren(estado);
}

async function cargarAmigos() {
    const contenedor = document.getElementById("lista-amigos");
    if (!contenedor) return;

    contenedor.replaceChildren(crearEstadoComunidad("Cargando amigos..."));

    try {
        const respuesta = await obtenerAmigos();
        if (!respuesta.ok) throw new Error(respuesta.error);

        if (respuesta.data.length === 0) {
            contenedor.replaceChildren(crearEstadoComunidad("Todavía no hay amigos para mostrar."));
            return;
        }

        contenedor.replaceChildren(...respuesta.data.map(amigo => {
            const tarjeta = document.createElement("article");
            tarjeta.className = "avatar-block";

            const avatar = document.createElement("img");
            avatar.src = amigo.avatar;
            avatar.alt = `Foto de ${amigo.username}`;

            const nombre = document.createElement("p");
            nombre.className = "usuario";
            nombre.textContent = amigo.username;

            tarjeta.append(avatar, nombre);
            return tarjeta;
        }));
    } catch (error) {
        console.error("No se pudieron cargar los amigos:", error);
        mostrarErrorComunidad(contenedor, "No se pudieron cargar los amigos.", cargarAmigos);
    }
}

async function obtenerDatosActividad() {
    const [respuestaActividad, respuestaAmigos, respuestaPeliculas] = await Promise.all([
        obtenerActividad(),
        obtenerAmigos(),
        obtenerPeliculas()
    ]);
    const error = [respuestaActividad, respuestaAmigos, respuestaPeliculas]
        .find(respuesta => !respuesta.ok);

    if (error) throw new Error(error.error);

    const amigos = new Map(respuestaAmigos.data.map(amigo => [amigo.username, amigo]));
    const peliculas = new Map(respuestaPeliculas.data.map(pelicula => [pelicula.id, pelicula]));

    return respuestaActividad.data.map(actividad => {
        const amigo = amigos.get(actividad.usuario);
        const pelicula = peliculas.get(actividad.peliculaId);
        if (!amigo || !pelicula) {
            throw new Error(`La actividad ${actividad.id} referencia un amigo o película inexistente.`);
        }
        return { actividad, amigo, pelicula };
    });
}

function crearTarjetaActividad(datos) {
    const { actividad, amigo, pelicula } = datos;
    const articulo = document.createElement("article");
    articulo.className = "publicacion-amigo";

    const enlace = document.createElement("a");
    enlace.className = "enlace-pelicula";
    enlace.href = `pelicula.html?id=${encodeURIComponent(pelicula.id)}`;

    const poster = document.createElement("img");
    poster.className = "poster-actividad";
    poster.src = pelicula.poster;
    poster.alt = `Póster de ${pelicula.titulo}`;

    const pie = document.createElement("div");
    pie.className = "pie-publicacion";

    const autor = document.createElement("div");
    autor.className = "autor-publicacion";
    const avatar = document.createElement("img");
    avatar.src = amigo.avatar;
    avatar.alt = "";
    avatar.className = "avatar-publicacion";
    const nombre = document.createElement("span");
    nombre.textContent = amigo.username;
    autor.append(avatar, nombre);

    const puntuacion = document.createElement("p");
    puntuacion.className = "puntuacion-publicacion";
    puntuacion.textContent = `${actividad.puntuacion}/5`;

    pie.append(autor, puntuacion);
    enlace.append(poster, pie);
    articulo.appendChild(enlace);
    return articulo;
}

function crearNotificacion(datos) {
    const { actividad, amigo, pelicula } = datos;
    const item = document.createElement("li");
    item.className = "item-notificacion";

    const texto = document.createElement("div");
    texto.className = "texto-notificacion";
    const detalle = document.createElement("div");
    detalle.className = "detalle-actividad";

    const resumen = document.createElement("div");
    resumen.append(
        document.createTextNode(`${actividad.fecha} `),
        Object.assign(document.createElement("strong"), { textContent: amigo.username }),
        document.createTextNode(" vio:")
    );

    const enlacePoster = document.createElement("a");
    enlacePoster.href = `pelicula.html?id=${encodeURIComponent(pelicula.id)}`;
    const poster = document.createElement("img");
    poster.src = pelicula.poster;
    poster.alt = `Póster de ${pelicula.titulo}`;
    poster.className = "poster-salch";
    enlacePoster.appendChild(poster);

    const informacion = document.createElement("div");
    informacion.className = "info-pelicula";
    const enlaceTitulo = document.createElement("a");
    enlaceTitulo.href = enlacePoster.href;
    const titulo = document.createElement("strong");
    titulo.textContent = pelicula.titulo;
    enlaceTitulo.appendChild(titulo);
    const puntuacion = document.createElement("span");
    puntuacion.className = "puntuacion";
    puntuacion.textContent = `${actividad.puntuacion}/5`;
    informacion.append(enlaceTitulo, document.createElement("br"), puntuacion);

    detalle.append(resumen, enlacePoster, informacion);
    texto.appendChild(detalle);
    item.appendChild(texto);
    return item;
}

async function cargarActividadComunidad() {
    const inicio = document.getElementById("actividad-amigos-lista");
    const notificaciones = document.getElementById("lista-notificaciones");
    const contenedores = [inicio, notificaciones].filter(Boolean);
    if (contenedores.length === 0) return;

    contenedores.forEach(contenedor =>
        mostrarEstadoEnContenedor(contenedor, crearEstadoComunidad("Cargando actividad..."))
    );

    try {
        const actividades = await obtenerDatosActividad();
        if (actividades.length === 0) {
            contenedores.forEach(contenedor =>
                mostrarEstadoEnContenedor(
                    contenedor,
                    crearEstadoComunidad("Todavía no hay actividad para mostrar.")
                )
            );
            return;
        }

        if (inicio) {
            inicio.replaceChildren(...actividades.map(crearTarjetaActividad));
        }
        if (notificaciones) {
            notificaciones.replaceChildren(...actividades.map(crearNotificacion));
        }
    } catch (error) {
        console.error("No se pudo cargar la actividad:", error);
        contenedores.forEach(contenedor =>
            mostrarErrorComunidad(contenedor, "No se pudo cargar la actividad.", cargarActividadComunidad)
        );
    }
}

cargarAmigos();
cargarActividadComunidad();
