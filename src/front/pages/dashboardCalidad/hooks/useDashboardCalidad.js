/**
 * useDashboardCalidad.js
 * Hook para manejo de datos del dashboard de calidad
 * Parte de la modularización de DashboardCalidad.jsx
 */

import { useState, useEffect, useCallback } from 'react';
import { TICKET_STATES } from '../../../constants/ticketEnums';
import { normalizeFromBackend } from '../../../utils/normalize';
import { fueEscaladoPorAnalista } from '../../../utils/ticketHelpers';

/**
 * Hook para manejo de datos del dashboard
 */
export const useDashboardCalidad = (store) => {
    const [analistas, setAnalistas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedAnalista, setSelectedAnalista] = useState(null);

    // Función para calcular métricas de un analista
    const calcularMetricas = useCallback((tickets) => {
        const ticketsAsignados = tickets.length;
        const ticketsSolucionados = tickets.filter(t => {
            const estado = normalizeFromBackend(t.estado);
            return estado === TICKET_STATES.SOLUCIONADO || estado === TICKET_STATES.CERRADO;
        }).length;
        const ticketsReabiertos = tickets.filter(t => normalizeFromBackend(t.estado) === TICKET_STATES.REABIERTO).length;
        // Detectar escalados por comentarios, no por estado inválido
        const ticketsEscalados = tickets.filter(t => fueEscaladoPorAnalista(t)).length;

        // Calificación promedio
        const ticketsConCalificacion = tickets.filter(t => t.calificacion && t.calificacion > 0);
        const calificacionPromedio = ticketsConCalificacion.length > 0
            ? (ticketsConCalificacion.reduce((sum, t) => sum + t.calificacion, 0) / ticketsConCalificacion.length)
            : 0;

        // Tiempo de respuesta promedio
        const ticketsConTiempo = tickets.filter(t => t.tiempo_respuesta);
        const tiempoRespuestaPromedio = ticketsConTiempo.length > 0
            ? (ticketsConTiempo.reduce((sum, t) => sum + t.tiempo_respuesta, 0) / ticketsConTiempo.length)
            : 0;

        // Eficiencia
        const eficiencia = ticketsAsignados > 0 ? (ticketsSolucionados / ticketsAsignados) * 100 : 0;

        // Promedios por período
        const ahora = new Date();
        const haceUnDia = new Date(ahora.getTime() - 24 * 60 * 60 * 1000);
        const haceUnaSemana = new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000);
        const haceUnMes = new Date(ahora.getTime() - 30 * 24 * 60 * 60 * 1000);

        const ticketsHoy = tickets.filter(t => new Date(t.fecha_creacion) >= haceUnDia);
        const ticketsSemana = tickets.filter(t => new Date(t.fecha_creacion) >= haceUnaSemana);
        const ticketsMes = tickets.filter(t => new Date(t.fecha_creacion) >= haceUnMes);

        const solucionadosHoy = ticketsHoy.filter(t => {
            const estado = normalizeFromBackend(t.estado);
            return estado === TICKET_STATES.CERRADO || estado === TICKET_STATES.SOLUCIONADO;
        }).length;
        const solucionadosSemana = ticketsSemana.filter(t => {
            const estado = normalizeFromBackend(t.estado);
            return estado === TICKET_STATES.CERRADO || estado === TICKET_STATES.SOLUCIONADO;
        }).length;
        const solucionadosMes = ticketsMes.filter(t => {
            const estado = normalizeFromBackend(t.estado);
            return estado === TICKET_STATES.CERRADO || estado === TICKET_STATES.SOLUCIONADO;
        }).length;

        // Satisfacción
        const satisfaccion = ticketsConCalificacion.length > 0
            ? (ticketsConCalificacion.filter(t => t.calificacion >= 4).length / ticketsConCalificacion.length) * 100
            : 0;

        return {
            ticketsAsignados,
            ticketsSolucionados,
            ticketsReabiertos,
            ticketsEscalados,
            calificacionPromedio: Math.round(calificacionPromedio * 10) / 10,
            tiempoRespuestaPromedio: Math.round(tiempoRespuestaPromedio),
            eficiencia: Math.round(eficiencia * 10) / 10,
            solucionadosPorDia: solucionadosHoy,
            solucionadosPorSemana: solucionadosSemana,
            solucionadosPorMes: solucionadosMes,
            satisfaccion
        };
    }, []);

    // Cargar datos
    const cargarDatos = useCallback(async () => {
        try {
            setLoading(true);
            const token = store.auth.token;

            const analistasResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/analistas`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (analistasResponse.ok) {
                const analistasData = await analistasResponse.json();

                const analistasConMetricas = await Promise.all(
                    analistasData.map(async (analista) => {
                        try {
                            const ticketsResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/tickets/analista/${analista.id}`, {
                                headers: {
                                    'Authorization': `Bearer ${token}`,
                                    'Content-Type': 'application/json'
                                }
                            });

                            if (ticketsResponse.ok) {
                                const tickets = await ticketsResponse.json();
                                return {
                                    ...analista,
                                    metricas: calcularMetricas(tickets)
                                };
                            } else {
                                return {
                                    ...analista,
                                    metricas: calcularMetricas([])
                                };
                            }
                        } catch (err) {
                            return {
                                ...analista,
                                metricas: calcularMetricas([])
                            };
                        }
                    })
                );

                setAnalistas(analistasConMetricas);
            } else {
                setError('Error al cargar los analistas');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [store.auth.token, calcularMetricas]);

    // Cargar datos al montar
    useEffect(() => {
        if (store.auth.isAuthenticated && store.auth.token) {
            cargarDatos();
        }
    }, [store.auth.token, store.auth.isAuthenticated, cargarDatos]);

    // Funciones de utilidad para colores
    const getCalificacionColor = useCallback((calificacion) => {
        if (calificacion >= 4.5) return 'success';
        if (calificacion >= 3.5) return 'warning';
        return 'danger';
    }, []);

    const getEficienciaColor = useCallback((eficiencia) => {
        if (eficiencia >= 80) return 'success';
        if (eficiencia >= 60) return 'warning';
        return 'danger';
    }, []);

    // Obtener métricas del analista seleccionado o totales
    const getMetrica = useCallback((campo) => {
        if (selectedAnalista) {
            const analista = analistas.find(a => a.id === selectedAnalista);
            return analista?.metricas[campo] || 0;
        }
        return analistas.reduce((sum, a) => sum + a.metricas[campo], 0);
    }, [selectedAnalista, analistas]);

    const getMetricaPromedio = useCallback((campo) => {
        if (selectedAnalista) {
            const analista = analistas.find(a => a.id === selectedAnalista);
            return analista?.metricas[campo] || 0;
        }
        if (analistas.length === 0) return 0;
        return analistas.reduce((sum, a) => sum + a.metricas[campo], 0) / analistas.length;
    }, [selectedAnalista, analistas]);

    return {
        analistas,
        loading,
        error,
        selectedAnalista,
        setSelectedAnalista,
        cargarDatos,
        getCalificacionColor,
        getEficienciaColor,
        getMetrica,
        getMetricaPromedio
    };
};

export default useDashboardCalidad;
