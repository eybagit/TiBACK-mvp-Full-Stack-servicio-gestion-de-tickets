import { useState } from 'react';
import useGlobalReducer from '../../../hooks/useGlobalReducer';

/**
 * useImageUpload - Hook para manejar la subida de imágenes
 */
export function useImageUpload({ onImageUpload }) {
    const { store } = useGlobalReducer();
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);

    const validateFile = (file) => {
        if (!file.type.startsWith('image/')) {
            return 'Por favor selecciona un archivo de imagen válido';
        }
        if (file.size > 5 * 1024 * 1024) {
            return 'La imagen debe ser menor a 5MB';
        }
        return null;
    };

    const uploadImage = async (file) => {
        setUploading(true);
        setError(null);

        try {
            if (!store.auth.token) {
                throw new Error('No hay token de autenticación disponible');
            }

            const formData = new FormData();
            formData.append('image', file);

            const url = `${import.meta.env.VITE_BACKEND_URL}/api/upload-image`;

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${store.auth.token}`
                },
                body: formData
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Error ${response.status}: ${errorText}`);
            }

            const data = await response.json();

            if (data.url && data.url.includes('data:image/svg+xml')) {
                setError('⚠️ Cloudinary no está configurado. Se usará una imagen placeholder temporal.');
                return false;
            }

            onImageUpload(data.url);
            return true;
        } catch (err) {
            setError('Error subiendo imagen: ' + err.message);
            return false;
        } finally {
            setUploading(false);
        }
    };

    const handleFileSelect = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const validationError = validateFile(file);
        if (validationError) {
            setError(validationError);
            return;
        }

        await uploadImage(file);
    };

    const testCloudinaryConfig = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/cloudinary-status`);
            const data = await response.json();

            if (data.cloudinary_configured) {
                setError('✅ Cloudinary está configurado correctamente');
            } else {
                setError('❌ Cloudinary no está configurado. Verifica las variables de entorno.');
            }
        } catch (err) {
            setError('Error verificando configuración de Cloudinary');
        }
    };

    const clearError = () => setError(null);

    return {
        uploading,
        error,
        setError,
        clearError,
        uploadImage,
        handleFileSelect,
        testCloudinaryConfig
    };
}

export default useImageUpload;
