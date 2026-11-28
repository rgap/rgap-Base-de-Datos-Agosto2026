// Simulación del checkout overlay de Lemon Squeezy en modo de prueba (HU-02).
// No carga lemon.js ni se conecta con Lemon Squeezy: muestra una ventana de pago
// "de terceros", valida la tarjeta en el navegador y, si el pago se aprueba,
// genera una referencia de orden (UUID, como el `identifier` de una orden de
// Lemon Squeezy) y llama a `alAprobar` (equivale al evento Checkout.Success).
// Los datos de la tarjeta nunca salen de esta ventana.
//
// Uso: abrirCheckout({ tienda, concepto, precio, comprador: { dni, nombre, correo },
//        alAprobar: async (referencia) => recibo, alCerrar: (huboCompra) => {} })
// `alAprobar` registra la compra y devuelve el recibo; si lanza un Error, su
// mensaje se muestra y se informa que no se realizó ningún cargo.

const LemonCheckout = (() => {
  const formato = new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" });

  // Tarjetas de prueba (las mismas que usa el modo de prueba de Lemon Squeezy).
  const TARJETA_APROBADA = "4242424242424242";
  const TARJETA_RECHAZADA = "4000000000000002";

  const soloDigitos = (texto) => texto.replace(/\D/g, "");

  // Dígito verificador de Luhn: descarta números de tarjeta mal escritos.
  function luhnValido(numero) {
    let suma = 0;
    let doble = false;
    for (let i = numero.length - 1; i >= 0; i -= 1) {
      let digito = Number(numero[i]);
      if (doble) {
        digito *= 2;
        if (digito > 9) digito -= 9;
      }
      suma += digito;
      doble = !doble;
    }
    return suma % 10 === 0;
  }

  // Vencimiento MM/AA aún vigente (vale hasta el último día del mes).
  function vencimientoValido(texto) {
    const coincidencia = /^(\d{2})\s*\/\s*(\d{2})$/.exec(texto.trim());
    if (!coincidencia) return false;
    const mes = Number(coincidencia[1]);
    const anio = 2000 + Number(coincidencia[2]);
    if (mes < 1 || mes > 12) return false;
    return new Date(anio, mes, 1) > new Date();
  }

  function referenciaOrden() {
    if (window.crypto?.randomUUID) return window.crypto.randomUUID();
    return `ls-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  }

  const esperar = (ms) => new Promise((resolve) => { window.setTimeout(resolve, ms); });

  function crear(etiqueta, clase, texto) {
    const elemento = document.createElement(etiqueta);
    if (clase) elemento.className = clase;
    if (texto !== undefined) elemento.textContent = texto;
    return elemento;
  }

  // Campo con su etiqueta visible y su mensaje de error debajo.
  function campo(texto, atributos) {
    const etiqueta = crear("label", "", texto);
    const input = document.createElement("input");
    Object.assign(input, atributos);
    const error = crear("span", "ls-field-error");
    error.id = `${atributos.id}-error`;
    error.hidden = true;
    input.setAttribute("aria-describedby", error.id);
    etiqueta.append(input, error);
    return { etiqueta, input, error };
  }

  function abrirCheckout(opciones) {
    const {
      tienda, concepto, precio, comprador, alAprobar, alCerrar,
    } = opciones;
    const disparador = document.activeElement;
    let procesando = false;
    let huboCompra = false;

    const overlay = crear("div", "ls-overlay");
    const panel = crear("div", "ls-panel");
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-modal", "true");
    panel.setAttribute("aria-labelledby", "ls-titulo");

    const aviso = crear("p", "ls-testmode", "Modo de prueba · Simulación de Lemon Squeezy · No se realiza ningún cobro");

    const cabecera = crear("div", "ls-head");
    const logo = crear("span", "ls-logo");
    logo.setAttribute("aria-hidden", "true");
    const marca = crear("div");
    const titulo = crear("strong", "", tienda);
    titulo.id = "ls-titulo";
    marca.append(titulo, crear("small", "", "Pago seguro con Lemon Squeezy (simulado)"));
    const cerrarBoton = crear("button", "ls-close", "✕");
    cerrarBoton.type = "button";
    cerrarBoton.setAttribute("aria-label", "Cerrar el pago");
    cabecera.append(logo, marca, cerrarBoton);

    const cuerpo = crear("div", "ls-body");
    const pie = crear("p", "ls-foot", "Los datos de la tarjeta solo se validan en esta ventana: no se envían ni se guardan.");

    panel.append(aviso, cabecera, cuerpo, pie);
    overlay.append(panel);
    document.body.append(overlay);
    document.body.style.overflow = "hidden";

    function cerrar() {
      if (procesando) return;
      document.removeEventListener("keydown", alTeclear, true);
      overlay.remove();
      document.body.style.overflow = "";
      if (disparador && disparador.isConnected && disparador.focus) disparador.focus();
      if (alCerrar) alCerrar(huboCompra);
    }

    // Escape cierra la ventana; Tab queda atrapado dentro del panel.
    function alTeclear(evento) {
      if (evento.key === "Escape") {
        evento.preventDefault();
        evento.stopImmediatePropagation();
        cerrar();
        return;
      }
      if (evento.key === "Tab") {
        const enfocables = [...panel.querySelectorAll("button, input, [href]")]
          .filter((el) => !el.disabled && el.offsetParent !== null);
        if (!enfocables.length) return;
        const primero = enfocables[0];
        const ultimo = enfocables[enfocables.length - 1];
        if (evento.shiftKey && document.activeElement === primero) {
          evento.preventDefault();
          ultimo.focus();
        } else if (!evento.shiftKey && document.activeElement === ultimo) {
          evento.preventDefault();
          primero.focus();
        }
      }
    }
    document.addEventListener("keydown", alTeclear, true);
    cerrarBoton.addEventListener("click", cerrar);
    overlay.addEventListener("click", (evento) => {
      if (evento.target === overlay) cerrar();
    });

    function fila(izquierda, derecha, clase = "ls-summary-row") {
      const contenedor = crear("div", clase);
      contenedor.append(crear("span", "", izquierda), crear("span", "", derecha));
      return contenedor;
    }

    // ---------- Paso 1: resumen + tarjeta ----------
    function pintarFormulario() {
      const resumen = crear("div", "ls-summary");
      resumen.append(
        fila(concepto, "1 entrada"),
        fila("Comprador", `${comprador.nombre} · DNI ${comprador.dni}`),
        fila("Comprobante a", comprador.correo),
        fila("Total", formato.format(precio), "ls-summary-row ls-summary-total"),
      );

      const formulario = crear("form", "ls-form");
      formulario.noValidate = true;

      const cabezaForm = crear("div", "ls-form-head");
      const demo = crear("button", "ls-demo", "Datos demo");
      demo.type = "button";
      cabezaForm.append(crear("h3", "", "Datos de la tarjeta"), demo);

      const numero = campo("Número de tarjeta", {
        id: "ls-numero", inputMode: "numeric", autocomplete: "cc-number", placeholder: "1234 1234 1234 1234", maxLength: 23,
      });
      const vence = campo("Vencimiento", {
        id: "ls-vence", inputMode: "numeric", autocomplete: "cc-exp", placeholder: "MM/AA", maxLength: 5,
      });
      const cvc = campo("CVC", {
        id: "ls-cvc", inputMode: "numeric", autocomplete: "cc-csc", placeholder: "123", maxLength: 4,
      });
      const titular = campo("Nombre en la tarjeta", {
        id: "ls-titular", autocomplete: "cc-name", value: comprador.nombre,
      });
      const filaDoble = crear("div", "ls-row");
      filaDoble.append(vence.etiqueta, cvc.etiqueta);

      const ayuda = crear("p", "ls-test-cards");
      ayuda.innerHTML = "Tarjetas de prueba: <code>4242 4242 4242 4242</code> se aprueba · "
        + "<code>4000 0000 0000 0002</code> se rechaza. Cualquier vencimiento futuro y CVC.";

      const errorGeneral = crear("p", "ls-error");
      errorGeneral.setAttribute("role", "alert");
      errorGeneral.hidden = true;

      const pagar = crear("button", "ls-pay");
      pagar.type = "submit";
      const textoPagar = "Pagar";
      pagar.textContent = textoPagar;

      formulario.append(cabezaForm, numero.etiqueta, filaDoble, titular.etiqueta, ayuda, errorGeneral, pagar);
      cuerpo.replaceChildren(resumen, formulario);

      // Formato mientras se escribe: grupos de 4 en el número y "/" en el vencimiento.
      numero.input.addEventListener("input", () => {
        numero.input.value = soloDigitos(numero.input.value).slice(0, 19).replace(/(\d{4})(?=\d)/g, "$1 ");
      });
      vence.input.addEventListener("input", (evento) => {
        const digitos = soloDigitos(vence.input.value).slice(0, 4);
        vence.input.value = digitos.length > 2 || (digitos.length === 2 && evento.inputType !== "deleteContentBackward")
          ? `${digitos.slice(0, 2)}/${digitos.slice(2)}`
          : digitos;
      });
      cvc.input.addEventListener("input", () => {
        cvc.input.value = soloDigitos(cvc.input.value).slice(0, 4);
      });

      demo.addEventListener("click", () => {
        const proximoAnio = String((new Date().getFullYear() + 3) % 100).padStart(2, "0");
        numero.input.value = "4242 4242 4242 4242";
        vence.input.value = `12/${proximoAnio}`;
        cvc.input.value = "123";
        if (!titular.input.value.trim()) titular.input.value = comprador.nombre;
        [numero, vence, cvc, titular].forEach(limpiar);
        pagar.focus();
      });

      function marcar(item, mensaje) {
        item.input.setAttribute("aria-invalid", "true");
        item.error.textContent = mensaje;
        item.error.hidden = false;
      }
      function limpiar(item) {
        item.input.removeAttribute("aria-invalid");
        item.error.hidden = true;
      }
      [numero, vence, cvc, titular].forEach((item) => item.input.addEventListener("input", () => limpiar(item)));

      formulario.addEventListener("submit", async (evento) => {
        evento.preventDefault();
        errorGeneral.hidden = true;
        [numero, vence, cvc, titular].forEach(limpiar);

        const digitos = soloDigitos(numero.input.value);
        const errores = [];
        if (digitos.length < 13 || !luhnValido(digitos)) errores.push([numero, "El número de tarjeta no es válido."]);
        if (!vencimientoValido(vence.input.value)) errores.push([vence, "Usa el formato MM/AA con una fecha futura."]);
        if (!/^\d{3,4}$/.test(cvc.input.value)) errores.push([cvc, "El CVC tiene 3 o 4 dígitos."]);
        if (!titular.input.value.trim()) errores.push([titular, "Escribe el nombre que figura en la tarjeta."]);
        if (errores.length) {
          errores.forEach(([item, mensaje]) => marcar(item, mensaje));
          errores[0][0].input.focus();
          return;
        }

        procesando = true;
        cerrarBoton.disabled = true;
        formulario.querySelectorAll("input, button").forEach((el) => { el.disabled = true; });
        pagar.replaceChildren(crear("span", "ls-spinner"), document.createTextNode("Procesando pago…"));
        pagar.querySelector(".ls-spinner").setAttribute("aria-hidden", "true");

        const reactivar = (mensaje) => {
          procesando = false;
          cerrarBoton.disabled = false;
          formulario.querySelectorAll("input, button").forEach((el) => { el.disabled = false; });
          pagar.textContent = textoPagar;
          errorGeneral.textContent = mensaje;
          errorGeneral.hidden = false;
          errorGeneral.scrollIntoView({ block: "nearest" });
        };

        await esperar(1200);

        if (digitos === TARJETA_RECHAZADA) {
          reactivar("La tarjeta fue rechazada por el banco (simulación). Prueba con otra tarjeta.");
          return;
        }
        if (digitos !== TARJETA_APROBADA) {
          reactivar("En modo de prueba solo se aceptan tarjetas de prueba. Usa 4242 4242 4242 4242.");
          return;
        }

        try {
          const recibo = await alAprobar(referenciaOrden());
          procesando = false;
          huboCompra = true;
          cerrarBoton.disabled = false;
          pintarExito(recibo, digitos.slice(-4));
        } catch (error) {
          reactivar(`${error.message || "No se pudo registrar la compra."} No se realizó ningún cargo.`);
        }
      });

      numero.input.focus();
    }

    // ---------- Paso 2: confirmación ----------
    function pintarExito(recibo, ultimos4) {
      const contenedor = crear("div", "ls-success");
      const check = crear("div", "ls-check");
      check.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
      const encabezado = crear("h2", "", "¡Pago confirmado!");
      encabezado.tabIndex = -1;
      const texto = crear("p", "", `La entrada quedó registrada a nombre de ${recibo.nombre} (DNI ${recibo.dni}). Enviaremos el comprobante a ${recibo.correo}.`);

      const datos = [
        ["Orden", recibo.referencia_pago],
        ["Entrada", recibo.entrada],
        ["Tarjeta", `•••• ${ultimos4}`],
        ["Total pagado", formato.format(recibo.precio)],
      ];
      const lista = crear("dl", "ls-receipt");
      datos.forEach(([clave, valor]) => {
        const filaRecibo = crear("div");
        filaRecibo.append(crear("dt", "", clave), crear("dd", "", valor));
        lista.append(filaRecibo);
      });

      const listo = crear("button", "ls-pay", "Listo");
      listo.type = "button";
      listo.addEventListener("click", cerrar);

      contenedor.append(check, encabezado, texto, lista, listo);
      cuerpo.replaceChildren(contenedor);
      encabezado.focus();
    }

    pintarFormulario();
  }

  return { abrirCheckout };
})();
