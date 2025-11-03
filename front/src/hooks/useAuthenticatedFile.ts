import { useEffect, useState } from 'react';
import api from '../lib/api';

/**
 * Hook para cargar archivos con autenticación JWT
 * Convierte el archivo en un Blob URL que puede usarse en <img>, <iframe>, etc.
 */
export function useAuthenticatedFile(filename: string | null | undefined) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!filename) {
      setBlobUrl(null);
      return;
    }

    let cancelled = false;
    let currentBlobUrl: string | null = null;

    const loadFile = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Descargar el archivo con axios (que envía el token JWT automáticamente)
        const response = await api.get(`/services/files/${filename}`, {
          responseType: 'blob', // Importante: pedir blob
        });

        if (cancelled) return;

        // Crear un Blob URL temporal
        const blob = new Blob([response.data], {
          type: response.headers['content-type'] || 'application/octet-stream',
        });
        const url = URL.createObjectURL(blob);
        currentBlobUrl = url;
        setBlobUrl(url);
      } catch (err: any) {
        if (!cancelled) {
          console.error('Error loading file:', err);
          setError(err.message || 'Error al cargar el archivo');
          setBlobUrl(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadFile();

    // Cleanup: revocar el Blob URL cuando el componente se desmonte
    return () => {
      cancelled = true;
      if (currentBlobUrl) {
        URL.revokeObjectURL(currentBlobUrl);
      }
    };
  }, [filename]);

  return { blobUrl, isLoading, error };
}

/**
 * Función auxiliar para descargar un archivo con autenticación
 */
export async function downloadAuthenticatedFile(filename: string, originalName?: string) {
  try {
    const response = await api.get(`/services/files/${filename}`, {
      responseType: 'blob',
    });

    // Crear un Blob URL temporal
    const blob = new Blob([response.data], {
      type: response.headers['content-type'] || 'application/octet-stream',
    });
    const url = URL.createObjectURL(blob);

    // Crear un link temporal y hacer click en él
    const link = document.createElement('a');
    link.href = url;
    link.download = originalName || filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Limpiar el Blob URL
    URL.revokeObjectURL(url);
  } catch (err: any) {
    console.error('Error downloading file:', err);
    alert('Error al descargar el archivo: ' + (err.message || 'Error desconocido'));
  }
}
