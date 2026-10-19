/**
 * ANISAM - Configuración de Appwrite
 * ------------------------------------------------------------------
 * 1. Entra a https://cloud.appwrite.io/console
 * 2. Abre tu proyecto -> Settings -> Overview
 * 3. Copia el "Project ID" y el "API endpoint" (según la región)
 * 4. Reemplaza los valores de abajo.
 *
 * NOTA: el Project ID es público (se usa en el navegador). NUNCA pongas
 * aquí una API key secreta.
 */
window.ANISAM_APPWRITE_CONFIG = {
  // Ejemplo Cloud: 'https://cloud.appwrite.io/v1'
  // Ejemplo región: 'https://nyc.cloud.appwrite.io/v1'
  endpoint: 'https://cloud.appwrite.io/v1',

  // Ejemplo: '67a1b2c3d4e5f6a7b8c9'
  projectId: '6abda2040008ae6691ea',

  // Base de datos y tabla creadas en la consola de Appwrite
  databaseId: 'anisam',
  tableId: 'mood_entries'
};
