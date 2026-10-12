"use strict";

(function iniciarModuloIngresoMorbilidad() {
    const patronTelegram = /^CI:(?<ci>[^|]*)\|NOM:(?<nom>[^|]*)\|EDAD:(?<edad>\d+)\|DX:(?<dx>[^|]*)$/;
    const patronEdadNegativa = /^CI:[^|]*\|NOM:[^|]*\|EDAD:-\d+\|DX:[^|]*$/;
    const camposObligatorios = ["ci", "nom", "edad", "dx", "indigena", "talla", "peso", "direccion"];
    const camposCriticos = ["ci", "dx"];

    function limpiarTextoTelegram(textoCrudo) {
        return textoCrudo.replace(/[\r\n]+/g, "").trim();
    }

    function validarEstructuraTelegram(textoCrudo) {
        const textoNormalizado = limpiarTextoTelegram(textoCrudo);
        const coincidencia = patronTelegram.exec(textoNormalizado);

        if (!coincidencia) {
            if (patronEdadNegativa.test(textoNormalizado)) {
                return { valido: false, datos: null, error: "edad_fuera_rango" };
            }
            return { valido: false, datos: null, error: "estructura" };
        }

        const datos = {
            ci: coincidencia.groups.ci.trim(),
            nom: coincidencia.groups.nom.trim(),
            edad: Number(coincidencia.groups.edad),
            dx: coincidencia.groups.dx.trim(),
        };

        if (!datos.ci || !datos.dx) {
            return { valido: false, datos: null, error: "campos_criticos" };
        }

        if (datos.edad < 0 || datos.edad > 125) {
            return { valido: false, datos: null, error: "edad_fuera_rango" };
        }

        return {
            valido: true,
            datos,
            error: null,
        };
    }

    function obtenerColorInstitucional(nombreToken, respaldo) {
        return getComputedStyle(document.documentElement).getPropertyValue(nombreToken).trim() || respaldo;
    }

    function inicializarGraficosEpidemiologicos() {
        if (typeof window.Chart !== "function") {
            return;
        }

        const colorPrimario = obtenerColorInstitucional("--primary", "#2C3E50");
        const colorTexto = obtenerColorInstitucional("--text-muted", "#526471");
        const colorAlerta = "#E74C3C";
        const configuracionBase = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: { displayColors: false },
            },
            scales: {
                x: { ticks: { color: colorTexto }, grid: { color: "rgb(44 62 80 / 8%)" } },
                y: { beginAtZero: true, ticks: { color: colorTexto, precision: 0 }, grid: { color: "rgb(44 62 80 / 8%)" } },
            },
        };
        const canvasPicos = document.querySelector("#chart-picos");
        const canvasPatologias = document.querySelector("#chart-patologias");

        if (canvasPicos && !window.Chart.getChart(canvasPicos)) {
            new window.Chart(canvasPicos, {
                type: "line",
                data: {
                    labels: ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"],
                    datasets: [{
                        label: "Atenciones",
                        data: [7, 11, 8, 15, 12, 6, 4],
                        borderColor: colorPrimario,
                        backgroundColor: "rgb(44 62 80 / 12%)",
                        borderWidth: 2,
                        fill: true,
                        pointBackgroundColor: colorPrimario,
                        pointRadius: 3,
                        tension: 0.35,
                    }],
                },
                options: configuracionBase,
            });
        }

        if (canvasPatologias && !window.Chart.getChart(canvasPatologias)) {
            new window.Chart(canvasPatologias, {
                type: "bar",
                data: {
                    labels: ["Rinofaringitis", "Hipertensión", "Lumbalgia", "Gastroenteritis", "Dermatitis"],
                    datasets: [{
                        label: "Casos",
                        data: [18, 14, 10, 7, 5],
                        backgroundColor: [colorPrimario, colorPrimario, colorPrimario, colorPrimario, colorAlerta],
                        borderRadius: 5,
                        borderSkipped: false,
                    }],
                },
                options: {
                    ...configuracionBase,
                    indexAxis: "y",
                },
            });
        }
    }

    function obtenerCsrfToken(contenedor = document) {
        return contenedor.querySelector("[name=csrfmiddlewaretoken]")?.value || "";
    }

    function actualizarEstadoValidacion(textarea, botonProcesar, ayuda, resultado) {
        const tieneContenido = textarea.value.trim().length > 0;
        textarea.classList.toggle("telegram-textarea--valid", resultado.valido);
        textarea.classList.toggle("telegram-textarea--invalid", tieneContenido && !resultado.valido);
        textarea.classList.toggle("telegram-textarea--age-warning", resultado.error === "edad_fuera_rango");
        textarea.setAttribute("aria-invalid", String(tieneContenido && !resultado.valido));
        botonProcesar.disabled = !resultado.valido;

        if (!tieneContenido) {
            ayuda.textContent = "El validador inspeccionará el formato en tiempo real antes de procesar el lote.";
        } else if (resultado.valido) {
            ayuda.textContent = "Formato válido. El registro se incorporará como PENDIENTE.";
        } else if (resultado.error === "edad_fuera_rango") {
            ayuda.textContent = "Edad fuera del rango biológico permitido (0 a 125 años).";
        } else if (resultado.error === "campos_criticos") {
            ayuda.textContent = "Cédula y diagnóstico son obligatorios para procesar el parte.";
        } else {
            ayuda.textContent = "Formato no válido. Use CI, NOM, EDAD y DX separados por barras verticales.";
        }
    }

    function crearFilaPendiente(registro) {
        const fila = document.createElement("tr");
        fila.className = "fila-pendiente";
        fila.dataset.id = registro.id || "nuevo";

        const valores = [
            ["ci", registro.ci],
            ["nom", registro.nom],
            ["edad", registro.edad],
            ["dx", registro.dx],
            ["indigena", registro.indigena],
            ["talla", registro.talla],
            ["peso", registro.peso],
            ["direccion", registro.direccion],
        ];

        valores.forEach(([campo, valor]) => {
            const celda = document.createElement("td");
            celda.dataset.campo = campo;
            celda.contentEditable = "true";
            celda.textContent = valor ?? "";
            fila.append(celda);
        });

        const celdaAcciones = document.createElement("td");
        celdaAcciones.textContent = "Pendiente";
        fila.append(celdaAcciones);
        actualizarEstadoFila(fila);
        return fila;
    }

    function normalizarValorCelda(valor) {
        const valorNormalizado = valor.trim();
        return valorNormalizado === "—" ? "" : valorNormalizado;
    }

    function obtenerRegistroDeFila(fila) {
        return Object.fromEntries(camposObligatorios.map((campo) => [
            campo,
            normalizarValorCelda(fila.querySelector(`[data-campo="${campo}"]`)?.textContent || ""),
        ]));
    }

    function calcularCompletitudFila(registro) {
        return camposObligatorios.filter((campo) => !normalizarValorCelda(String(registro[campo] ?? "")));
    }

    function actualizarEstadoAprobacion() {
        const botonAprobar = document.querySelector("#btn-aprobar-lote");
        if (!botonAprobar) {
            return;
        }

        const hayInconsistenciaCritica = [...document.querySelectorAll("#tabla-pendientes-body tr")]
            .some((fila) => {
                const registro = obtenerRegistroDeFila(fila);
                return camposCriticos.some((campo) => !registro[campo]);
            });
        botonAprobar.disabled = hayInconsistenciaCritica;
        botonAprobar.setAttribute("aria-disabled", String(hayInconsistenciaCritica));
    }

    function actualizarEstadoFila(fila) {
        const registro = obtenerRegistroDeFila(fila);
        const camposFaltantes = calcularCompletitudFila(registro);
        fila.classList.toggle("fila-pendiente--incomplete", camposFaltantes.length > 0);
        fila.setAttribute("aria-label", camposFaltantes.length
            ? `Registro incompleto. Faltan: ${camposFaltantes.join(", ")}.`
            : "Registro íntegro.");

        camposObligatorios.forEach((campo) => {
            const celda = fila.querySelector(`[data-campo="${campo}"]`);
            celda?.classList.toggle("cell-warning", camposFaltantes.includes(campo));
        });
        actualizarEstadoAprobacion();
        return camposFaltantes;
    }

    function notificarEstadoTabla(mensaje) {
        const estadoTabla = document.querySelector("#tabla-estado");
        if (estadoTabla) {
            estadoTabla.textContent = mensaje;
        }
    }

    function obtenerFilasExportables() {
        return [...document.querySelectorAll("#tabla-pendientes-body tr")]
            .filter((fila) => !fila.classList.contains("fila-pendiente--validada"))
            .filter((fila) => calcularCompletitudFila(obtenerRegistroDeFila(fila)).length === 0);
    }

    function actualizarFilasAEstadoValidado(filas) {
        filas.forEach((fila) => {
            fila.classList.remove("fila-pendiente--incomplete");
            fila.classList.add("fila-pendiente--validada");
            fila.dataset.estado = "VALIDADO";
            fila.querySelectorAll("td[data-campo]").forEach((celda) => {
                celda.contentEditable = "false";
                celda.classList.remove("cell-warning");
            });

            const celdaAcciones = fila.lastElementChild;
            celdaAcciones.replaceChildren();
            const estado = document.createElement("span");
            estado.className = "estado-validado";
            estado.textContent = "VALIDADO";
            celdaAcciones.append(estado);
        });
    }

    function configurarModalAprobacion() {
        const botonAprobar = document.querySelector("#btn-aprobar-lote");
        const modal = document.querySelector("#modal-aprobacion");
        const botonCancelar = document.querySelector("#btn-cancelar-inyeccion");
        const botonConfirmar = document.querySelector("#btn-confirmar-inyeccion");
        const totalRegistros = document.querySelector("#total-registros-exportables");
        const estadoModal = document.querySelector("#modal-aprobacion-estado");

        if (!botonAprobar || !modal || !botonCancelar || !botonConfirmar || !totalRegistros || !estadoModal) {
            return;
        }

        let disparadorModal = null;

        function cerrarModal(forzar = false) {
            if (modal.classList.contains("is-loading") && !forzar) {
                return;
            }
            modal.hidden = true;
            modal.setAttribute("aria-hidden", "true");
            disparadorModal?.focus();
        }

        function abrirModal() {
            const filasExportables = obtenerFilasExportables();
            if (!filasExportables.length) {
                notificarEstadoTabla("No hay registros íntegros disponibles para inyectar.");
                return;
            }
            disparadorModal = botonAprobar;
            totalRegistros.textContent = String(filasExportables.length);
            estadoModal.textContent = "Revise el total antes de confirmar.";
            modal.hidden = false;
            modal.setAttribute("aria-hidden", "false");
            botonConfirmar.focus();
        }

        async function confirmarInyeccion() {
            const filasExportables = obtenerFilasExportables();
            if (!filasExportables.length) {
                cerrarModal(true);
                notificarEstadoTabla("No hay registros íntegros disponibles para inyectar.");
                return;
            }

            modal.classList.add("is-loading");
            document.body.classList.add("is-exporting");
            botonCancelar.disabled = true;
            botonConfirmar.disabled = true;
            modal.setAttribute("aria-busy", "true");
            estadoModal.textContent = "Inyectando datos en la plantilla institucional…";

            try {
                const respuesta = await fetch("/api/v1/export/excel/", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "X-CSRFToken": obtenerCsrfToken(),
                    },
                    body: JSON.stringify({ registros: filasExportables.map((fila) => fila.dataset.id) }),
                });

                if (!respuesta.ok) {
                    throw new Error("No fue posible completar la inyección en Excel.");
                }

                const cuerpo = await respuesta.json().catch(() => ({}));
                actualizarFilasAEstadoValidado(filasExportables);
                cerrarModal(true);
                const archivoAlternativo = cuerpo.archivo_alternativo || cuerpo.copia_alternativa;
                notificarEstadoTabla(archivoAlternativo
                    ? "La plantilla estaba en uso; se generó una copia institucional alternativa."
                    : "Inyección completada. Los registros exportados fueron marcados como VALIDADOS.");
            } catch (error) {
                estadoModal.textContent = error.message;
            } finally {
                modal.classList.remove("is-loading");
                document.body.classList.remove("is-exporting");
                botonCancelar.disabled = false;
                botonConfirmar.disabled = false;
                modal.removeAttribute("aria-busy");
            }
        }

        botonAprobar.addEventListener("click", abrirModal);
        botonCancelar.addEventListener("click", () => cerrarModal());
        modal.querySelector("[data-modal-cerrar]").addEventListener("click", () => cerrarModal());
        botonConfirmar.addEventListener("click", confirmarInyeccion);
        document.addEventListener("keydown", (evento) => {
            if (evento.key === "Tab" && !modal.hidden) {
                const controles = [...modal.querySelectorAll("button:not([disabled])")];
                const primero = controles[0];
                const ultimo = controles.at(-1);
                if (evento.shiftKey && document.activeElement === primero) {
                    evento.preventDefault();
                    ultimo.focus();
                } else if (!evento.shiftKey && document.activeElement === ultimo) {
                    evento.preventDefault();
                    primero.focus();
                }
            }
            if (evento.key === "Escape" && !modal.hidden) {
                cerrarModal();
            }
        });
    }

    async function persistirCambioCelda(celda) {
        const fila = celda.closest("tr");
        const valorAnterior = celda.dataset.valorOriginal ?? "";
        const valorActual = normalizarValorCelda(celda.textContent || "");
        celda.textContent = valorActual;

        if (valorAnterior === valorActual) {
            return;
        }

        actualizarEstadoFila(fila);
        celda.setAttribute("aria-busy", "true");
        notificarEstadoTabla("Guardando cambio en el registro pendiente…");

        try {
            const respuesta = await fetch("/api/v1/morbilidad/validar/", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": obtenerCsrfToken(),
                },
                body: JSON.stringify({
                    id: fila.dataset.id,
                    campo: celda.dataset.campo,
                    valor: valorActual,
                }),
            });

            if (!respuesta.ok) {
                throw new Error("No fue posible guardar el cambio.");
            }
            notificarEstadoTabla("Cambio guardado. El estado de completitud está actualizado.");
        } catch (error) {
            celda.textContent = valorAnterior;
            actualizarEstadoFila(fila);
            notificarEstadoTabla(error.message);
        } finally {
            celda.removeAttribute("aria-busy");
        }
    }

    async function procesarRegistro(evento) {
        evento.preventDefault();

        const formulario = evento.currentTarget;
        const textarea = formulario.querySelector("#texto-telegram");
        const botonProcesar = formulario.querySelector("#btn-procesar");
        const ayuda = formulario.querySelector("#telegram-help");
        const resultado = validarEstructuraTelegram(textarea.value);

        actualizarEstadoValidacion(textarea, botonProcesar, ayuda, resultado);
        if (!resultado.valido) {
            return;
        }

        botonProcesar.disabled = true;
        botonProcesar.setAttribute("aria-busy", "true");
        ayuda.textContent = "Procesando el parte clínico…";

        try {
            const respuesta = await fetch("/api/v1/morbilidad/ingresar/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": obtenerCsrfToken(formulario),
                },
                body: JSON.stringify(resultado.datos),
            });

            if (!respuesta.ok) {
                throw new Error("No fue posible registrar el parte clínico.");
            }

            const cuerpo = await respuesta.json();
            const registro = cuerpo.registro || cuerpo.data || cuerpo;
            document.querySelector("#tabla-pendientes-body").append(crearFilaPendiente({
                ...resultado.datos,
                ...registro,
            }));

            formulario.reset();
            actualizarEstadoValidacion(textarea, botonProcesar, ayuda, { valido: false, datos: null });
            ayuda.textContent = "Parte clínico registrado como PENDIENTE.";
        } catch (error) {
            ayuda.textContent = error.message;
            botonProcesar.disabled = false;
        } finally {
            botonProcesar.removeAttribute("aria-busy");
        }
    }

    const formulario = document.querySelector("#form-telegram");
    if (!formulario) {
        return;
    }

    const textarea = formulario.querySelector("#texto-telegram");
    const botonProcesar = formulario.querySelector("#btn-procesar");
    const ayuda = formulario.querySelector("#telegram-help");

    textarea.addEventListener("input", () => {
        actualizarEstadoValidacion(
            textarea,
            botonProcesar,
            ayuda,
            validarEstructuraTelegram(textarea.value),
        );
    });
    formulario.addEventListener("submit", procesarRegistro);

    const cuerpoTabla = document.querySelector("#tabla-pendientes-body");
    cuerpoTabla?.querySelectorAll("tr").forEach(actualizarEstadoFila);
    cuerpoTabla?.addEventListener("focusin", (evento) => {
        const celda = evento.target.closest("td[data-campo]");
        if (celda) {
            celda.dataset.valorOriginal = normalizarValorCelda(celda.textContent || "");
        }
    });
    cuerpoTabla?.addEventListener("input", (evento) => {
        const celda = evento.target.closest("td[data-campo]");
        if (celda) {
            actualizarEstadoFila(celda.closest("tr"));
        }
    });
    cuerpoTabla?.addEventListener("focusout", (evento) => {
        const celda = evento.target.closest("td[data-campo]");
        if (celda) {
            persistirCambioCelda(celda);
        }
    });
    inicializarGraficosEpidemiologicos();
    configurarModalAprobacion();

    window.validarEstructuraTelegram = validarEstructuraTelegram;
    window.calcularCompletitudFila = calcularCompletitudFila;
}());
