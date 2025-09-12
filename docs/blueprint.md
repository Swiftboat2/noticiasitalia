# **App Name**: NoticiasItalia

## Core Features:

- Autenticación de Administrador: Inicio de sesión seguro para el usuario administrador mediante correo electrónico y contraseña utilizando Firebase Authentication.
- Gestión de Noticias: Interfaz de administrador para crear, leer, actualizar y eliminar noticias (operaciones CRUD) en Firestore.
- Almacenamiento de Enlaces Externos: Almacena enlaces externos (imagen, video, texto) con tipo, marca de tiempo de creación y estado activo en Firestore. Incluye el aspecto de 'herramienta'.
- Visualización de Contenido en Tiempo Real: Muestra noticias activas en tiempo real, obtenidas de Firestore. Las actualizaciones se reflejan inmediatamente.
- Rotación Automática: Rota automáticamente las noticias activas en un bucle continuo.
- Manejo de la Relación de Aspecto: Asegura que todo el contenido se muestre en una relación de aspecto de 9:16, ajustando las imágenes y los videos según sea necesario para llenar la pantalla, sin barras negras. Si los tamaños de las imágenes no se alinean, una herramienta de IA ajusta los tamaños de las imágenes en CSS de manera no destructiva.
- Caché Local: Almacena en caché el contenido mostrado en LocalStorage para permitir la visualización sin conexión de las últimas noticias obtenidas.

## Style Guidelines:

- Color primario: Azul profundo (#3F51B5) para transmitir confianza y fiabilidad.
- Color de fondo: Gris claro (#F0F0F0), casi blanco para garantizar la máxima legibilidad.
- Color de acento: Naranja vibrante (#FF9800) para elementos interactivos.
- Fuente del cuerpo y del título: 'PT Sans' (sans-serif) para una apariencia limpia y moderna. Todo el contenido debe ser legible en un teléfono.
- Pantalla completa con una relación de aspecto de 9:16 mantenida en todos los dispositivos.
- Transiciones suaves entre noticias durante la rotación.