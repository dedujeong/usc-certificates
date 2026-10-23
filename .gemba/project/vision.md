# Vision

Sistema interno para administrar el ciclo académico de alumnos (inscripción, calificaciones) y emitir su certificado de estudios en PDF. [Internal]

Le permite al personal administrativo registrar alumnos, carreras, materias e inscripciones, capturar calificaciones y generar el certificado oficial de estudios directamente desde el sistema, en vez de armarlo a mano con hojas de cálculo o documentos sueltos.

El sistema llega a cubrir todo el catálogo académico (carreras y materias), el control de inscripciones (una activa por alumno a la vez), el registro de calificaciones por materia y periodo, la configuración de los firmantes y el texto legal del certificado, y la emisión del PDF final listo para imprimir — como la única fuente de verdad en lugar de hojas de cálculo o documentos por área.

### Problem

El personal administrativo no puede emitir el certificado de estudios de un alumno de forma consistente y trazable, porque los datos de inscripción, materias y calificaciones viven en procesos y archivos separados que no comparten una sola fuente de verdad.
Today: hojas de cálculo y documentos editados a mano, apoyados en un sistema anterior (React+Vite/Express+Sequelize/MySQL) con errores conocidos de matrícula duplicada y calificaciones truncadas.

### Users

* **Admin** da de alta alumnos, carreras, materias e inscripciones, captura calificaciones y genera certificados.
* **SuperAdmin** hace todo lo que un Admin, además de administrar las cuentas de otros administradores.

### Success

Si el personal administrativo deja de usar hojas de cálculo o el sistema anterior para emitir certificados, es señal para la institución de que el sistema cumple su propósito. Medido con:
* Proporción de certificados emitidos desde el sistema frente a los emitidos fuera de él
* Tiempo entre que se completan las calificaciones de un alumno y se emite su certificado

Baseline: desconocido (Question 1) Target: 100% de los certificados se generan desde el sistema

### Constraints

* El sistema corre en un único despliegue autohospedado (Docker + PostgreSQL), sin integración con sistemas externos.
* La autenticación usa JWT guardado en localStorage, por tratarse de una herramienta interna con bajo riesgo de XSS externo, en vez de cookies httpOnly.
* Solo existen dos roles, admin y superAdmin; no hay rol de solo lectura ni acceso para alumnos.

### Risks

* **El personal no adopta el sistema y sigue usando el proceso manual anterior** [Value] [Hypothesis]
  Validation: medir qué proporción de los certificados del primer mes tras el despliegue se emiten desde el sistema.
  Threshold: al menos el 80% de los certificados del primer mes se generan desde el sistema.
* **El PDF generado no reproduce fielmente el formato del certificado original (negrita, subrayado, firmas, tipografía)** [Usability] [Evidence]
  Validation: comparación visual contra certificados del sistema anterior.
  Threshold: el certificado generado es indistinguible en formato del original.
* **Colisiones de matrícula o inscripciones duplicadas bajo uso concurrente** [Feasibility] [Evidence]
  Validation: matrícula asignada con una secuencia atómica de Postgres e índice único parcial para la inscripción activa, cubiertos por pruebas automatizadas.
  Threshold: ninguna colisión bajo inserciones concurrentes.

> Documento inferido del código por `/gemba-code:project-create` (sin Atlassian, por decisión del proyecto — ver `/gemba:setup`). No tiene sección `### Decision`: nadie ha decidido formalmente go-to-build / go-to-validate dentro de Gemba todavía.
