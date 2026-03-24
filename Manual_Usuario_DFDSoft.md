# Manual de Usuario y Descripción General - DFDSoft

## 1. Introducción y Propósito del Software
**DFDSoft** es una Aplicación Web Progresiva (PWA) interactiva diseñada específicamente para la creación, edición y simulación de Diagramas de Flujo de Datos (DFD). Su propósito principal es servir como una herramienta educativa y profesional que permite a los usuarios estructurar, visualizar y probar la lógica de sus algoritmos de manera dinámica y altamente responsiva.

Este software facilita la comprensión de la lógica de programación mediante un entorno gráfico donde los conceptos abstractos se representan visualmente a través de bloques interconectados.

## 2. Características Principales
- **Interfaz Limpia e Intuitiva:** El usuario dispone de un lienzo (canvas) de trabajo infinito por el cual puede desplazarse y hacer zoom libremente.
- **Auto-Encuadre Dinámico:** Cuenta con un motor gráfico basado en Flexbox/Grid que reajusta inteligentemente la simetría de los bloques. Esto evita que las líneas, ramas condicionales o ciclos se crucen o solapen, manteniendo el diagrama legible en todo momento.
- **Simulación en Tiempo Real:** Permite la ejecución paso a paso de los diagramas creados. El sistema puede solicitar valores de entrada al usuario, realizar cálculos y mostrar resultados de salida utilizando variables en un entorno controlado.
- **Aplicación Web Progresiva (PWA):** DFDSoft puede ser instalado como una aplicación nativa tanto en ordenadores (Windows/Mac) como en dispositivos móviles, permitiendo su uso offline y mejorando la accesibilidad.
- **Exportación de Alta Calidad:** Los diagramas pueden ser exportados como imágenes PNG de alta definición, enfocándose únicamente en el algoritmo y eliminando espacios en blanco innecesarios, ideal para documentar trabajos académicos o profesionales.

## 3. Requisitos de Funcionamiento
Al ser una aplicación web moderna (creada con React y Vite), DFDSoft requiere:
- Un navegador web moderno (Google Chrome, Mozilla Firefox, Safari, Microsoft Edge).
- Conexión a internet para el primer acceso (posteriormente puede funcionar offline si se instala como PWA).
- Funciona en sistemas operativos de escritorio (Windows, macOS, Linux) y dispositivos móviles (iOS, Android).

## 4. Guía de Uso y Operación

### 4.1. El Espacio de Trabajo
El lienzo principal funciona como un mapa infinito. 
- **Desplazamiento:** Arrastre con el clic izquierdo del ratón para moverse por el lienzo.
- **Zoom:** Utilice `CTRL + Rueda del Ratón` (o el gesto de pellizcar en pantallas táctiles) para acercar o alejar la vista.
- **Centrar Vista:** En la esquina inferior izquierda se encuentra el botón "Centrar", que devuelve la cámara a la vista global de todo el diagrama.

### 4.2. Gestión de Variables
Antes de utilizar variables en el diagrama, estas deben ser registradas:
- Utilice el **Panel Lateral Izquierdo** para definir las variables que empleará el algoritmo (por ejemplo: `x`, `contador`, `resultado`).
- Estas variables almacenarán la información y los estados durante la ejecución del diagrama.

### 4.3. Inserción y Edición de Bloques Lógicos
Los flujogramas se construyen añadiendo y configurando bloques lógicos:
- **Insertar Bloques:** Haga clic en el símbolo **`+`** flotante que aparece entre los conectores de los bloques existentes para añadir un nuevo paso al proceso.
- **Tipos de Bloques:**
  - **Entrada:** Permite solicitar datos al usuario durante la ejecución.
  - **Salida:** Muestra mensajes o el valor de las variables en pantalla.
  - **Operación / Acción:** Realiza operaciones matemáticas (suma, resta, multiplicación, división) o asignaciones a las variables.
  - **Condicional:** Bifurca el camino del algoritmo en base a una condición lógica (Verdadero / Falso).
  - **Ciclos (MQ):** Permite la repetición de un conjunto de bloques mientras se cumpla una condición específica.
- **Editar Bloques:** Haga **doble clic** sobre cualquier bloque para abrir su panel de configuración. Allí podrá enlazar las variables creadas con operaciones, condiciones o mensajes de texto.

### 4.4. Simulación y Ejecución
Una vez estructurado el diagrama:
- Presione el botón **Play** (botón verde ubicado en la parte superior derecha) para iniciar la simulación.
- El sistema guiará la ejecución paso a paso, resaltando el bloque activo, solicitando entradas si es necesario y mostrando las salidas correspondientes, permitiendo verificar que la lógica del algoritmo es correcta.

### 4.5. Guardado, Carga y Configuración
- **Guardar/Cargar Proyecto:** Puede guardar su progreso en un archivo local `.dfd` y cargarlo posteriormente para continuar su trabajo.
- **Exportar:** Utilice la opción de exportar a PNG para obtener una imagen limpia de su diagrama.
- **Configuración:** A través del botón de engranaje, puede acceder a opciones adicionales de la interfaz, como forzar actualizaciones de la aplicación o ajustar la sensibilidad del desplazamiento (scroll) para adaptarse a diferentes resoluciones o dispositivos.
