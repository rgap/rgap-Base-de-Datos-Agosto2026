// Pie de demostración presente en todas las páginas: botón "Reiniciar datos"
// con un cuadro de confirmación propio (.confirm-dialog en style.css), en lugar
// del cuadro nativo del navegador. Llama a POST /api/reset, que no requiere sesión.
(() => {
  function confirmar(titulo, detalle) {
    return new Promise((resolve) => {
      const dialogo = document.createElement("dialog");
      dialogo.className = "confirm-dialog";
      const terminar = (aceptado) => {
        dialogo.close();
        dialogo.remove();
        resolve(aceptado);
      };
      const cuerpo = document.createElement("div");
      cuerpo.className = "confirm-body";
      const encabezado = document.createElement("h2");
      encabezado.textContent = titulo;
      const texto = document.createElement("p");
      texto.textContent = detalle;
      const acciones = document.createElement("div");
      acciones.className = "confirm-actions";
      const cancelar = document.createElement("button");
      cancelar.type = "button";
      cancelar.className = "secondary";
      cancelar.textContent = "Cancelar";
      cancelar.addEventListener("click", () => terminar(false));
      const aceptar = document.createElement("button");
      aceptar.type = "button";
      aceptar.className = "primary";
      aceptar.textContent = "Reiniciar datos";
      aceptar.addEventListener("click", () => terminar(true));
      acciones.append(cancelar, aceptar);
      cuerpo.append(encabezado, texto, acciones);
      dialogo.append(cuerpo);
      // Un clic fuera del cuadro (sobre el fondo) equivale a cancelar; Escape también.
      dialogo.addEventListener("click", (event) => {
        if (event.target === dialogo) terminar(false);
      });
      dialogo.addEventListener("cancel", () => terminar(false));
      document.body.append(dialogo);
      dialogo.showModal();
    });
  }

  const pie = document.createElement("div");
  pie.className = "reset-footer";
  const boton = document.createElement("button");
  boton.type = "button";
  boton.className = "reset-datos-btn";
  boton.textContent = "Reiniciar datos";
  pie.append(boton);
  document.body.append(pie);

  boton.addEventListener("click", async () => {
    const aceptado = await confirmar(
      "¿Reiniciar todos los datos al estado inicial?",
      "Se borrarán los contactos y grupos que agregaste, y la agenda volverá a sus datos de ejemplo.",
    );
    if (!aceptado) return;
    boton.disabled = true;
    try {
      const response = await fetch("/api/reset", { method: "POST" });
      if (!response.ok) throw new Error();
      window.location.reload();
    } catch {
      boton.disabled = false;
      boton.textContent = "No se pudo reiniciar. Reintentar";
    }
  });
})();
