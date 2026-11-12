
const botonMenu = document.querySelector(".boton-menu-movil");
const menu = document.getElementById("menu-desplegable");

if (botonMenu && menu) {
  botonMenu.addEventListener("click", () => {
    const abierto = botonMenu.getAttribute("aria-expanded") === "true";

    botonMenu.setAttribute("aria-expanded", String(!abierto));
    botonMenu.setAttribute(
      "aria-label",
      !abierto ? "Cerrar menú de navegación" : "Abrir menú de navegación"
    );

    menu.classList.toggle("menu-abierto", !abierto);
  });

  document.addEventListener("keydown", (evento) => {
    if (evento.key === "Escape") {
      menu.classList.remove("menu-abierto");
      botonMenu.setAttribute("aria-expanded", "false");
      botonMenu.setAttribute("aria-label", "Abrir menú de navegación");
    }
  });

  menu.querySelectorAll("a").forEach((enlace) => {
    enlace.addEventListener("click", () => {
      menu.classList.remove("menu-abierto");
      botonMenu.setAttribute("aria-expanded", "false");
      botonMenu.setAttribute("aria-label", "Abrir menú de navegación");
    });
  });
}
