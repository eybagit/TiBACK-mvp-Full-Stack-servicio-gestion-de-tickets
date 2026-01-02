/**
 * useHeatmapData.js
 * Hook para manejo de datos del mapa de calor
 * Parte de la modularización de HeatmapComponent.jsx
 */

import { useState, useCallback, useMemo } from 'react';
import { TICKET_STATES } from '../../../constants/ticketEnums';
import { normalizeFromBackend } from '../../../utils/normalize';

/**
 * Hook para manejo de datos del heatmap
 */
export const useHeatmapData = (store) => {
    const [rawData, setRawData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Función para obtener color del marcador
    const getMarkerColor = useCallback((estado) => {
        if (!estado) return '#6c757d';
        const estadoLower = estado.toLowerCase().trim();
        const colorMap = {
            'creado': '#6c757d',
            'en_espera': '#ffc107',
            'en_proceso': '#0d6efd',
            'solucionado': '#198754',
            'cerrado': '#dc3545'
        };
        return colorMap[estadoLower] || '#6c757d';
    }, []);

    // Función para calcular peso del heatmap
    const calculateHeatmapWeight = useCallback((item) => {
        let weight = 1;
        const priorityWeights = { 'alta': 3, 'media': 2, 'baja': 1 };
        weight += priorityWeights[item.ticket_prioridad] || 0;
        const stateWeights = { 'en_proceso': 2, 'en_espera': 1.5, 'creado': 1 };
        weight += stateWeights[item.ticket_estado] || 0;
        return Math.max(0.5, Math.min(10, weight));
    }, []);

    // Función para procesar datos de tickets
    const processTicketData = useCallback((ticketsData) => {
        return ticketsData
            .filter(ticket => {
                const lat = ticket.latitud || ticket.cliente?.latitude;
                const lng = ticket.longitud || ticket.cliente?.longitude;
                return lat && lng && lat !== 0 && lng !== 0;
            })
            .map(ticket => {
                const lat = ticket.latitud || ticket.cliente?.latitude;
                const lng = ticket.longitud || ticket.cliente?.longitude;

                return {
                    lat: parseFloat(lat),
                    lng: parseFloat(lng),
                    ticket_id: ticket.id,
                    ticket_titulo: ticket.titulo,
                    ticket_descripcion: ticket.descripcion,
                    ticket_estado: ticket.estado,
                    ticket_prioridad: ticket.prioridad,
                    ticket_fecha_creacion: ticket.fecha_creacion,
                    cliente_nombre: ticket.cliente?.nombre || 'N/A',
                    cliente_apellido: ticket.cliente?.apellido || '',
                    cliente_email: ticket.cliente?.email || 'N/A',
                    cliente_direccion: ticket.cliente?.direccion || 'N/A',
                    cliente_telefono: ticket.cliente?.telefono || null
                };
            });
    }, []);

    // Función para cargar datos
    const fetchHeatmapData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const token = store.auth.token;
            if (!token) {
                throw new Error('Token de autorización no encontrado');
            }

            const backendUrl = import.meta.env.VITE_BACKEND_URL;
            const response = await fetch(`${backendUrl}/api/tickets`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const ticketsData = await response.json();
            const transformedData = processTicketData(ticketsData);

            setRawData(transformedData);

            if (transformedData.length === 0) {
                setError('No se encontraron tickets con ubicación geográfica. Los clientes necesitan tener coordenadas de latitud y longitud válidas en sus perfiles.');
            }

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [store.auth.token, processTicketData]);

    // Estadísticas calculadas
    const stats = useMemo(() => ({
        total: rawData.length,
        pendientes: rawData.filter(t => {
            const estado = normalizeFromBackend(t.ticket_estado);
            return estado === TICKET_STATES.CREADO || estado === TICKET_STATES.EN_ESPERA;
        }).length,
        enProceso: rawData.filter(t => normalizeFromBackend(t.ticket_estado) === TICKET_STATES.EN_PROCESO).length,
        solucionados: rawData.filter(t => normalizeFromBackend(t.ticket_estado) === TICKET_STATES.SOLUCIONADO).length,
        cerrados: rawData.filter(t => normalizeFromBackend(t.ticket_estado) === TICKET_STATES.CERRADO).length,
        altaPrioridad: rawData.filter(t => t.ticket_prioridad?.toLowerCase() === 'alta').length
    }), [rawData]);

    return {
        rawData,
        loading,
        error,
        stats,
        fetchHeatmapData,
        getMarkerColor,
        calculateHeatmapWeight
    };
};

export default useHeatmapData;
