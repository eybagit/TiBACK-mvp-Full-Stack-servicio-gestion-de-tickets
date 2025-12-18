import { useState, useEffect } from 'react';
import { tokenUtils } from '../../../store';

/**
 * useAnalistaData - Estados y carga de datos del analista
 */
export function useAnalistaData({ store, dispatch }) {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [ticketsSolicitudReapertura, setTicketsSolicitudReapertura] = useState(new Set());
    const [expandedTickets, setExpandedTickets] = useState(new Set());
    const [modalTicketId, setModalTicketId] = useState(null);
    const [userData, setUserData] = useState(null);
    
    // Estados para perfil
    const [showInfoForm, setShowInfoForm] = useState(false);
    const [updatingInfo, setUpdatingInfo] = useState(false);
    const [infoData, setInfoData] = useState({
        nombre: '', apellido: '', email: '',
        especialidad: '', password: '', confirmPassword: ''
    });

    // Toggle expansión de ticket
    const toggleTicketExpansion = (ticketId) => {
        setExpandedTickets(prev => {
            const copy = new Set(prev);
            if (copy.has(ticketId)) copy.delete(ticketId);
            else copy.add(ticketId);
            return copy;
        });
    };

    // Actualizar lista de tickets
    const actualizarTickets = async () => {
        try {
            const token = store.auth.token;
            if (!token) return;
            const resp = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/tickets/analista`, {
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
            });
            if (!resp.ok) {
                setError(`Error cargando tickets: ${resp.status}`);
                return;
            }
            const data = await resp.json();
            setTickets(data);
        } catch (e) {
            console.error('Error actualizando tickets:', e);
        }
    };

    // Cargar datos iniciales
    useEffect(() => {
        const load = async () => {
            setLoading(true);
            await actualizarTickets();
            setLoading(false);
        };
        load();
    }, [store.auth.token]);

    // Cargar datos del usuario
    useEffect(() => {
        const cargarDatosUsuario = async () => {
            try {
                const token = store.auth.token;
                const userId = tokenUtils.getUserId(token);

                if (userId) {
                    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/analistas/${userId}`, {
                        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
                    });

                    if (response.ok) {
                        const data = await response.json();
                        setUserData(data);
                        dispatch({ type: 'SET_USER', payload: data });
                        setInfoData({
                            nombre: data.nombre === 'Pendiente' ? '' : data.nombre || '',
                            apellido: data.apellido === 'Pendiente' ? '' : data.apellido || '',
                            email: data.email || '',
                            especialidad: data.especialidad || '',
                            password: '', confirmPassword: ''
                        });
                    }
                }
            } catch (error) {
                console.error('Error cargando datos del usuario:', error);
            }
        };

        if (store.auth.isAuthenticated && store.auth.token) {
            cargarDatosUsuario();
        }
    }, [store.auth.isAuthenticated, store.auth.token]);

    // Manejar cambios en formulario
    const handleInfoChange = (e) => {
        const { name, value } = e.target;
        setInfoData(prev => ({ ...prev, [name]: value }));
    };

    // Actualizar información del analista
    const updateInfo = async () => {
        try {
            if (infoData.password && infoData.password !== infoData.confirmPassword) {
                setError('Las contraseñas no coinciden');
                return;
            }
            if (infoData.password && infoData.password.length < 6) {
                setError('La contraseña debe tener al menos 6 caracteres');
                return;
            }

            setUpdatingInfo(true);
            const token = store.auth.token;
            const userId = tokenUtils.getUserId(token);

            const updateData = {
                nombre: infoData.nombre,
                apellido: infoData.apellido,
                email: infoData.email,
                especialidad: infoData.especialidad
            };
            if (infoData.password) updateData.password = infoData.password;

            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/analistas/${userId}`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(updateData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al actualizar información');
            }

            const updatedUserData = { ...userData, ...updateData };
            setUserData(updatedUserData);
            dispatch({ type: 'SET_USER', payload: updatedUserData });
            dispatch({ type: 'analistas_upsert', payload: updatedUserData });

            alert('Información actualizada exitosamente');
            setShowInfoForm(false);
            setError('');
            setInfoData(prev => ({ ...prev, password: '', confirmPassword: '' }));

        } catch (err) {
            setError(err.message);
        } finally {
            setUpdatingInfo(false);
        }
    };

    return {
        tickets, setTickets,
        loading, error, setError,
        ticketsSolicitudReapertura, setTicketsSolicitudReapertura,
        expandedTickets, toggleTicketExpansion,
        modalTicketId, setModalTicketId,
        userData, setUserData,
        showInfoForm, setShowInfoForm,
        updatingInfo, infoData, setInfoData,
        actualizarTickets, handleInfoChange, updateInfo
    };
}

export default useAnalistaData;
