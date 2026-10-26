# Requirements

### Unassigned

* **R-01** Un usuario inicia sesión con email y contraseña verificada contra un hash bcrypt y recibe un JWT con su rol, válido 8 horas por defecto. [Functional] Source: Material
* **R-02** Un superAdmin crea, lista, edita y desactiva cuentas de administrador. [Functional] Source: Material
* **R-03** Un admin o superAdmin registra, lista, edita y desactiva alumnos, normalizando sus nombres a mayúsculas. [Functional] Source: Material
* **R-04** El sistema asigna la matrícula de un alumno nuevo de forma atómica con una secuencia de Postgres, sin colisiones bajo registros concurrentes; al registrar o editar un alumno también se puede escribir la matrícula a mano, siempre que no esté asignada a otro alumno, y la secuencia se adelanta para no repetirla. [Business rule] Source: Material
* **R-05** Un admin o superAdmin registra, lista, edita y desactiva carreras y materias, asociando cada materia a una carrera y a un periodo. [Functional] Source: Material
* **R-06** Un admin o superAdmin inscribe a un alumno en una carrera con fecha de inicio y de fin. [Functional] Source: Material
* **R-07** Un alumno solo puede tener una inscripción activa a la vez; para inscribirlo a otra carrera primero se da de baja la inscripción activa. [Business rule] Source: Material
* **R-08** Un admin o superAdmin registra y edita la calificación de un alumno en una materia, con un valor decimal entre 0 y 10 con un decimal exacto y una observación opcional entre EX, TS, EQ o REC. [Functional] Source: Material
* **R-09** Un alumno tiene como máximo una calificación por materia. [Business rule] Source: Material
* **R-10** Un admin o superAdmin configura los datos de los firmantes del certificado y los campos de texto legal, incluyendo tipografía e interlineado por párrafo para los párrafos legales. [Functional] Source: Material
* **R-11** El sistema genera el certificado de estudios de un alumno en PDF, con sus materias y calificaciones agrupadas por periodo y los datos de los firmantes. [Functional] Source: Material
* **R-12** Las calificaciones se redondean para su presentación en el certificado, conservando el valor decimal exacto en el promedio. [Business rule] Source: Material
* **R-13** Cada endpoint de la API exige un JWT válido; las operaciones sobre cuentas de administrador exigen además el rol superAdmin. [Non-functional] Source: Material
* **R-14** Los intentos de inicio de sesión están limitados por una ventana de rate limiting para mitigar fuerza bruta. [Non-functional] Source: Material
* **R-15** El sistema se despliega de forma autohospedada con Docker, con un servicio de migración separado del servicio de la aplicación. [Constraint] Source: Material

### Assumptions and open questions

* **Question 1.** ¿Cuántos certificados emitía la institución antes de este sistema y en cuánto tiempo se emitía cada uno? Assumption: se asume que no hay una métrica histórica registrada, por lo que el baseline de éxito queda en desconocido hasta medirlo. Affects R-11. [Open]
* **Question 2.** ¿Se necesita un rol de solo lectura o un acceso para que el propio alumno consulte su certificado? Assumption: se asume que no, porque el modelo de datos y las rutas solo contemplan los roles admin y superAdmin. Affects R-13. [Open]

> Documento inferido del código (modelos de `prisma/schema.prisma`, validadores de `lib/validators/`, rutas de `app/api/` y guards de `lib/auth/`) por `/gemba-code:project-create`, sin Atlassian.
