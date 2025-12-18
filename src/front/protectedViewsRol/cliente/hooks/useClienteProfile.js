import { useState, useEffect } from 'react';
import { tokenUtils } from '../../../store';

/**
 * useClienteProfile - Hook para manejar el perfil del cliente
 * Incluye: datos del usuario, actualización de información, imagen de perfil
 */
function useClienteProfile(store, dispatch) {
    // Estados del usuario
    const [userData, setUserData] = useState(null);
    const [clienteImageUrl, setClienteImageUrl] = useState('');
    const [showInfoForm, setShowInfoForm] = useState(false);
    const [updatingInfo, setUpdatingInfo] = useState(false);
    
    // Estado del formulario de información
    const [infoData, setInfoData] = useState({
        nombre: '',
        apellido: '',
        email: '',
        telefono: '',
        direccion: '',
        lat: null,
        lng: null,
        password: '',
        confirmPassword: ''
    });

    // Cargar datos del usuario
    const cargarDatosUsuario = async (setLoading) => {
        try {
            setLoading(true);
            const token = store.auth.token;
            const userId = tokenUtils.getUserId(token);

            const userResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/clientes/${userId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (userResponse.ok) {
                const data = await userResponse.json();
                setUserData(data);

                dispatch({
                    type: 'SET_USER',
                    payload: data
                });

                setInfoData({
                    nombre: data.nombre === 'Pendiente' ? '' : data.nombre || '',
                    apellido: data.apellido === 'Pendiente' ? '' : data.apellido || '',
                    email: data.email || '',
                    telefono: data.telefono === '0000000000' ? '' : data.telefono || '',
                    direccion: data.direccion === 'Pendiente' ? '' : data.direccion || '',
                    lat: data.latitude || null,
                    lng: data.longitude || null,
                    password: '',
                    confirmPassword: ''
                });
                setClienteImageUrl(data.url_imagen || '');
            }
        } catch (err) {
            console.error('Error al cargar datos del usuario:', err);
        } finally {
            setLoading(false);
        }
    };

    // Función para actualizar información del cliente
    const updateInfo = async () => {
        if (infoData.password && infoData.password !== infoData.confirmPassword) {
            alert('Las contraseñas no coinciden');
            return;
        }

        setUpdatingInfo(true);
        try {
            const token = store.auth.token;
            const userId = tokenUtils.getUserId(token);

            const updateData = {
                nombre: infoData.nombre,
                apellido: infoData.apellido,
                telefono: infoData.telefono,
                direccion: infoData.direccion,
                latitude: infoData.lat,
                longitude: infoData.lng,
                url_imagen: clienteImageUrl
            };

            if (infoData.password) {
                updateData.password = infoData.password;
            }

            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/clientes/${userId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updateData)
            });

            if (!response.ok) {
                throw new Error('Error al actualizar información');
            }

            const updatedData = await response.json();
            setUserData(updatedData);
            dispatch({
                type: 'SET_USER',
                payload: updatedData
            });

            setInfoData(prev => ({
                ...prev,
                password: '',
                confirmPassword: ''
            }));

            alert('Información actualizada correctamente');
        } catch (err) {
            console.error('Error al actualizar información:', err);
            alert('Error al actualizar información');
        } finally {
            setUpdatingInfo(false);
        }
    };

    // Función para manejar cambios en el formulario
    const handleInfoChange = (e) => {
        const { name, value } = e.target;
        setInfoData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Función para manejar cambios de ubicación
    const handleLocationChange = (location) => {
        setInfoData(prev => ({
            ...prev,
            direccion: location.address || prev.direccion,
            lat: location.lat,
            lng: location.lng
        }));
    };

    // Funciones para imagen del cliente
    const handleClienteImageUpload = (imageUrl) => {
        setClienteImageUrl(imageUrl);
        setUserData(prev => ({
            ...prev,
            url_imagen: imageUrl
        }));
    };

    const handleClienteImageRemove = () => {
        setClienteImageUrl('');
        setUserData(prev => ({
            ...prev,
            url_imagen: null
        }));
    };

    return {
        // Estados
        userData, setUserData,
        clienteImageUrl, setClienteImageUrl,
        showInfoForm, setShowInfoForm,
        updatingInfo, setUpdatingInfo,
        infoData, setInfoData,
        
        // Funciones
        cargarDatosUsuario,
        updateInfo,
        handleInfoChange,
        handleLocationChange,
        handleClienteImageUpload,
        handleClienteImageRemove
    };
}

export default useClienteProfile;
