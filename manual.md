# Manual de Usuario - DFDSoft

**DFDSoft** es una aplicación web tipo PWA diseñada para la creación, simulación y depuración de Diagramas de Flujo de Datos (DFD). Este manual detalla cómo utilizar las herramientas para diseñar algoritmos y simularlos.

## 1. Interfaz Principal

La interfaz está dividida en tres áreas clave:
- **Barra Superior (Topbar)**: Contiene los botones de control de simulación (Play, Continuar, Detener) y las herramientas de gestión de archivos (Importar `.dfd`, Exportar `.dfd`, Exportar a `.png`).
- **Barra Lateral (Sidebar)**: Ofrece el acceso rápido al gestor de Variables y contiene el inventario de bloques lógicos (Entrada, Salida, Acción, Condicional, Mientras Que).
- **Espacio de Trabajo (Canvas)**: Extensa área de cuadrícula donde se construyen los diagramas. Permite arrastrar, soltar y hacer zoom (Pinch-to-zoom en móviles o scroll en PC).

## 2. Creando el Primer Diagrama

1. **Variables Primero:** Antes de usar operaciones o guardar datos, haz clic en **"Gestionar Variables"**. Aquí puedes crear tu variable (ej: `CONTADOR`) y asignarle un valor inicial.
2. **Añadir Bloques:** Arrastra cualquier bloque desde la barra lateral hacia la ruta principal en el Canvas. El diagrama se auto-dibujará y direccionará las flechas de conexión.
3. **Configurar Bloques:** **Haz doble clic** sobre cualquier bloque (Salida, Entrada, Acción, etc.) en el Canvas para abrir su menú de configuración.
   - *Salida de Datos*: Ingresa el texto a mostrar. Usa comillas simples o dobles para texto estático.
   - *Entrada de Datos*: Selecciona a qué variable de la memoria se debe asignar la entrada del usuario.
   - *Acciones*: Selecciona una variable destino, los operandos (texto, números o variables del gestor) y la operación aritmética (+, -, *, /).
   - *Condicionales*: Configura dos valores a evaluar y el comparador lógico. El flujo se dividirá automáticamente en **SI** o **NO**.
   - *Ciclo MQ*: Configura la condición evaluativa de la misma manera que un condicional.

## 3. Eliminando Bloques

Si te equivocas o deseas borrar un bloque, haz clic sobre él sin soltar y **arrástralo hacia el ícono de Papelera** emergente en la esquina inferior derecha. Los bloques "Inicio" y "Fin" no pueden ser borrados.

## 4. Simulación (Ejecución Paso a Paso)

Una vez tu algoritmo esté listo:
1. Haz clic en el botón azul **Play** de la barra superior.
2. El botón cambiará a **Continuar**. Haz clic en "Continuar" para avanzar paso a paso de manera manual por la red lógica que trazaste.
3. Verás cómo el bloque actualmente en ejecución **se ilumina en el lienzo**.
4. Si hay interacción (ej. Entrada de Datos o Salida de Datos), aparecerán ventanas emergentes nativas pidiendo valores o mostrando resultados.
5. El flujo tomará los caminos automáticamente dependiendo del estado de la memoria en ese paso (útil en Condicionales y Ciclos).
6. Si ocurre algún error sintáctico (ej. variable no existente o sintaxis de comillas), el programa detendrá la simulación y **pintará de Rojo brillante** el bloque defectuoso.

## 5. Guardar y Exportar
- Para no perder tu progreso temporal, usa el botón **Exportar .dfd** en la barra superior. Esto descargará el archivo JSON del proyecto.
- Cuando quieras retomarlo, haz clic en **Importar .dfd**.
- Para guardar una imagen fotográfica del algoritmo, utiliza el botón de **Exportar Imagen .png** para generar un render final.

## 6. Despliegue en GitHub Pages (Para Administradores)
La aplicación es _Serverless_ y puramente construida en Frontend (HTML5, CSS, JS). 
1. Sube el contenido de la carpeta de este proyecto a un repositorio de GitHub.
2. Ve a Configuración (Settings) > Pages.
3. En la sección "Build and deployment", selecciona `Deploy from a branch` y escoge la rama `main` de la carpeta raíz (`/root`).
4. Dale *Save* y la aplicación estará disponible en la URL provista por GitHub en un par de minutos. Al ser una PWA, los navegadores en móviles mostrarán el botón de "Instalar/Añadir a Inicio".
