/**
 * useClienteProfile - Hook para manejar el perfil del cliente
 * Refactorizado para usar el store global (clienteSlice)
 * NO useState - arquitectura tiback-hello
 */

import { tokenUtils } from '../../../store';
import useGlobalReducer from '../../../hooks/useGlobalReducer';

function useClienteProfile(passedStore, passedDispatch) {
    const { store: globalStore, dispatch: globalDispatch } = useGlobalReducer();
    
    // Usar store y dispatch pasados o globales
    const store = passedStore || globalStore;
    const dispatch = passedDispatch || globalDispatch;
    
    // Acceso al estado del cliente desde el store global
    const clientePage = store.clientePage || {};
    
    // Estados del store
    const userData = clientePage.userData || null;
    const clienteImageUrl = clientePage.clienteImageUrl || '';
    const showInfoForm = clientePage.showInfoForm || false;
    const updatingInfo = clientePage.updatingInfo || false;
    const infoData = clientePage.infoData || {
        nombre: '',
        apellido: '',
        email: '',
        telefono: '',
        direccion: '',
        lat: null,
        lng: null,
        password: '',
        confirmPassword: ''
    };

    // Helpers
    const setLoading = (v) => dispatch({ type: 'CLIENTE_SET_LOADING', payload: v });

    // Cargar datos del usuario
    const cargarDatosUsuario = async (setLoadingFn) => {
        try {
            (setLoadingFn || setLoading)(true);
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
                dispatch({ type: 'CLIENTE_SET_USER_DATA', payload: data });

                dispatch({
                    type: 'SET_USER',
                    payload: data
                });

                dispatch({
                    type: 'CLIENTE_SET_INFO_DATA',
                    payload: {
                        nombre: data.nombre === 'Pendiente' ? '' : data.nombre || '',
                        apellido: data.apellido === 'Pendiente' ? '' : data.apellido || '',
                        email: data.email || '',
                        telefono: data.telefono === '0000000000' ? '' : data.telefono || '',
                        direccion: data.direccion === 'Pendiente' ? '' : data.direccion || '',
                        lat: data.latitude || null,
                        lng: data.longitude || null,
                        password: '',
                        confirmPassword: ''
                    }
                });
                dispatch({ type: 'CLIENTE_SET_CLIENTE_IMAGE_URL', payload: data.url_imagen || '' });
            }
        } catch (err) {
            console.error('Error al cargar datos del usuario:', err);
        } finally {
            (setLoadingFn || setLoading)(false);
        }
    };

    // Función para actualizar información del cliente
    const updateInfo = async () => {
        if (infoData.password && infoData.password !== infoData.confirmPassword) {
            alert('Las contraseñas no coinciden');
            return;
        }

        dispatch({ type: 'CLIENTE_SET_UPDATING_INFO', payload: true });
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
            dispatch({ type: 'CLIENTE_SET_USER_DATA', payload: updatedData });
            dispatch({
                type: 'SET_USER',
                payload: updatedData
            });

            dispatch({ type: 'CLIENTE_RESET_PASSWORD_FIELDS' });

            alert('Información actualizada correctamente');
        } catch (err) {
            console.error('Error al actualizar información:', err);
            alert('Error al actualizar información');
        } finally {
            dispatch({ type: 'CLIENTE_SET_UPDATING_INFO', payload: false });
        }
    };

    // Función para manejar cambios en el formulario
    const handleInfoChange = (e) => {
        const { name, value } = e.target;
        dispatch({ type: 'CLIENTE_UPDATE_INFO_FIELD', payload: { name, value } });
    };

    // Función para manejar cambios de ubicación
    const handleLocationChange = (location) => {
        dispatch({ type: 'CLIENTE_SET_LOCATION', payload: location });
    };

    // Funciones para imagen del cliente
    const handleClienteImageUpload = (imageUrl) => {
        dispatch({ type: 'CLIENTE_SET_CLIENTE_IMAGE_URL', payload: imageUrl });
    };

    const handleClienteImageRemove = () => {
        dispatch({ type: 'CLIENTE_SET_CLIENTE_IMAGE_URL', payload: '' });
    };

    // Setters para compatibilidad
    const setUserData = (data) => dispatch({ type: 'CLIENTE_SET_USER_DATA', payload: data });
    const setClienteImageUrl = (url) => dispatch({ type: 'CLIENTE_SET_CLIENTE_IMAGE_URL', payload: url });
    const setShowInfoForm = (v) => dispatch({ type: 'CLIENTE_SET_SHOW_INFO_FORM', payload: v });
    const setUpdatingInfo = (v) => dispatch({ type: 'CLIENTE_SET_UPDATING_INFO', payload: v });
    const setInfoData = (data) => dispatch({ type: 'CLIENTE_SET_INFO_DATA', payload: data });

    return {
        // Estados (desde store)
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
