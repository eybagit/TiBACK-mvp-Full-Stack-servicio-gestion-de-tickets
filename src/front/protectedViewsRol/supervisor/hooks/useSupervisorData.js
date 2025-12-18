import { useState, useEffect } from 'react';
import { tokenUtils } from '../../../store';

/**
 * useSupervisorData - Carga de datos y gestión de estado
 */
export function useSupervisorData({ store, dispatch }) {
    const [tickets, setTickets] = useState([]);
    const [ticketsCerrados, setTicketsCerrados] = useState([]);
    const [analistas, setAnalistas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingCerrados, setLoadingCerrados] = useState(false);
    const [error, setError] = useState('');
    const [showCerrados, setShowCerrados] = useState(false);
    const [userData, setUserData] = useState(null);
    const [infoData, setInfoData] = useState({
        nombre: '', apellido: '', email: '',
        area_responsable: '', password: '', confirmPassword: ''
    });
    const [ticketsConRecomendaciones, setTicketsConRecomendaciones] = useState(new Set());
    const [expandedTickets, setExpandedTickets] = useState(new Set());

    // Combinar con datos del store global
    const analistasCombinados = store.analistas?.length > 0 ? store.analistas : analistas;
    const ticketsCerradosCombinados = store.ticketsCerrados?.length > 0 ? store.ticketsCerrados : ticketsCerrados;

    // Filtros
    const [filterEstado, setFilterEstado] = useState('');
    const [filterAsignado, setFilterAsignado] = useState('');
    const [filterPrioridad, setFilterPrioridad] = useState('');

    // Backend request helper
    const backendRequest = async (path, options = {}) => {
        const backendBase = import.meta.env.VITE_BACKEND_URL || '';
        const candidates = [];
        if (backendBase) candidates.push(`${backendBase}${path}`);
        try { candidates.push(`${window.location.origin}${path}`); } catch (e) {}
        candidates.push(path);

        for (const url of candidates) {
            if (!url) continue;
            try {
                const resp = await fetch(url, options);
                if (resp.ok) return resp;
            } catch (err) { continue; }
        }
        throw new Error('Network request failed');
    };

    // Actualizar tickets
    const actualizarTickets = async () => {
        try {
            const token = store.auth.token;
            const resp = await backendRequest('/api/tickets/supervisor', {
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
            });
            const ticketsData = await resp.json();
            setTickets(ticketsData);
        } catch (err) {
            setError('No se pudieron cargar tickets');
        }
    };

    // Actualizar analistas
    const actualizarAnalistas = async () => {
        try {
            const token = store.auth.token;
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/analistas`, {
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
            });
            if (response.ok) {
                const data = await response.json();
                setAnalistas(data);
                dispatch({ type: "analistas_set_list", payload: data });
            }
        } catch (err) {}
    };

    // Cargar tickets cerrados
    const cargarTicketsCerrados = async () => {
        try {
            setLoadingCerrados(true);
            const token = store.auth.token;
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/tickets/supervisor/cerrados`, {
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
            });
            if (response.ok) {
                const data = await response.json();
                setTicketsCerrados(data);
                dispatch({ type: "tickets_cerrados_set_list", payload: data });
            }
        } catch (err) {}
        finally { setLoadingCerrados(false); }
    };

    // Actualizar todas las tablas
    const actualizarTodasLasTablas = async () => {
        await actualizarTickets();
        await actualizarAnalistas();
        if (showCerrados) await cargarTicketsCerrados();
    };

    // Filtrar tickets
    const getFilteredTickets = () => {
        let filtered = tickets;
        if (filterEstado) filtered = filtered.filter(t => t.estado === filterEstado);
        if (filterAsignado === 'asignados') {
            filtered = filtered.filter(t => t.asignacion_actual?.analista);
        } else if (filterAsignado === 'no-asignados') {
            filtered = filtered.filter(t => !t.asignacion_actual?.analista);
        }
        if (filterPrioridad) filtered = filtered.filter(t => t.prioridad === filterPrioridad);
        return filtered;
    };

    // Estadísticas
    const getStats = () => ({
        total: tickets.length,
        activos: tickets.filter(t => t.estado === 'activo').length,
        resueltos: tickets.filter(t => t.estado === 'resuelto').length,
        escalados: tickets.filter(t => t.estado === 'escalado').length
    });

    // Toggle expansión de ticket
    const toggleTicketExpansion = (ticketId) => {
        setExpandedTickets(prev => {
            const newSet = new Set(prev);
            if (newSet.has(ticketId)) newSet.delete(ticketId);
            else newSet.add(ticketId);
            return newSet;
        });
    };

    // Cargar datos del usuario
    useEffect(() => {
        const cargarDatosUsuario = async () => {
            try {
                const token = store.auth.token;
                const userId = tokenUtils.getUserId(token);
                if (userId) {
                    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/supervisores/${userId}`, {
                        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
                    });
                    if (response.ok) {
                        const data = await response.json();
                        setUserData(data);
                        setInfoData({
                            nombre: data.nombre === 'Pendiente' ? '' : data.nombre || '',
                            apellido: data.apellido === 'Pendiente' ? '' : data.apellido || '',
                            email: data.email || '',
                            area_responsable: data.area_responsable || '',
                            password: '', confirmPassword: ''
                        });
                        dispatch({ type: 'SET_USER', payload: data });
                    }
                }
            } catch (err) {}
        };
        if (store.auth.isAuthenticated && store.auth.token && !store.auth.user) {
            cargarDatosUsuario();
        }
    }, [store.auth.isAuthenticated, store.auth.token, store.auth.user]);

    // Cargar datos iniciales
    useEffect(() => {
        const cargarDatos = async () => {
            try {
                setLoading(true);
                await actualizarTickets();
                await actualizarAnalistas();
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        cargarDatos();
    }, [store.auth.token]);

    return {
        tickets, setTickets,
        ticketsCerrados, setTicketsCerrados,
        analistas, analistasCombinados, ticketsCerradosCombinados,
        loading, loadingCerrados, error, setError,
        showCerrados, setShowCerrados,
        userData, infoData, setInfoData,
        ticketsConRecomendaciones, expandedTickets,
        filterEstado, setFilterEstado,
        filterAsignado, setFilterAsignado,
        filterPrioridad, setFilterPrioridad,
        actualizarTodasLasTablas, cargarTicketsCerrados,
        getFilteredTickets, getStats, toggleTicketExpansion,
        backendRequest
    };
}

export default useSupervisorData;
