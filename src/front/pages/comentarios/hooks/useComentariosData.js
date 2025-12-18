/**
 * useComentariosData.js
 * Hook para manejo de datos y estado de comentarios
 * Parte de la modularización de ComentariosTicket.jsx
 */

import { useState, useCallback, useMemo } from 'react';

// Utilidades de token seguras
export const tokenUtils = {
    decodeToken: (token) => {
        try {
            if (!token) return null;
            const parts = token.split('.');
            if (parts.length !== 3) return null;
            return JSON.parse(atob(parts[1]));
        } catch (error) {
            return null;
        }
    },
    getUserId: (token) => {
        const payload = tokenUtils.decodeToken(token);
        return payload ? payload.user_id : null;
    },
    getRole: (token) => {
        const payload = tokenUtils.decodeToken(token);
        return payload ? payload.role : null;
    }
};

/**
 * Hook para manejo de datos de comentarios
 */
export const useComentariosData = (ticketId, store) => {
    const [comentarios, setComentarios] = useState([]);
    const [historialTicket, setHistorialTicket] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [sincronizando, setSincronizando] = useState(false);
    const [userData, setUserData] = useState(null);
    const [lastLoadedTicketId, setLastLoadedTicketId] = useState(null);
    const [mostrarHistorial, setMostrarHistorial] = useState(false);

    // Detectar si es un ticket cerrado basándose en la URL
    const esTicketCerrado = window.location.pathname.includes('/comentarios-cerrado');

    // Función para cargar datos
    const cargarDatos = useCallback(async (showLoading = true) => {
        try {
            if (showLoading) {
                setLoading(true);
            }

            const token = store.auth.token;
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/tickets/${ticketId}/comentarios`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Error al cargar datos');
            }

            const data = await response.json();

            // Procesar datos de forma más eficiente
            const movimientos = [];
            const comentariosUsuarios = [];

            // Un solo bucle para filtrar ambos tipos
            data.forEach(comentario => {
                const texto = comentario.texto;
                const esMovimiento = texto.includes('Ticket asignado') ||
                    texto.includes('Ticket reasignado') ||
                    texto.includes('Ticket solucionado') ||
                    texto.includes('Ticket escalado') ||
                    texto.includes('Ticket iniciado') ||
                    texto.includes('Ticket reabierto') ||
                    texto.includes('Cliente solicita reapertura') ||
                    texto.includes('Ticket cerrado por cliente') ||
                    texto.includes('Ticket cerrado por supervisor') ||
                    texto.includes('Ticket cerrado por administrador') ||
                    texto.includes('Supervisor aprobó solicitud de reapertura') ||
                    texto.includes('Listo para nueva asignación') ||
                    texto.includes('por supervisor') ||
                    texto.includes('por administrador') ||
                    texto.includes('Analista inició trabajo en el ticket') ||
                    texto.includes('Chat iniciado entre') ||
                    texto.includes('Mensaje de chat:');

                if (esMovimiento) {
                    movimientos.push(comentario);
                } else if (!texto.includes('🤖 RECOMENDACIÓN DE IA GENERADA') &&
                    !texto.includes('🤖 ANÁLISIS DE IMAGEN CON IA:') &&
                    !texto.includes('CHAT_ANALISTA_CLIENTE:') &&
                    !texto.includes('CHAT_SUPERVISOR_ANALISTA:')) {
                    comentariosUsuarios.push(comentario);
                }
            });

            // Ordenar por fecha (más reciente primero)
            const sortByDate = (a, b) => new Date(b.fecha_comentario) - new Date(a.fecha_comentario);

            setHistorialTicket(movimientos.sort(sortByDate));
            setComentarios(comentariosUsuarios.sort(sortByDate));
        } catch (err) {
            setError(err.message);
        } finally {
            if (showLoading) {
                setLoading(false);
            }
        }
    }, [ticketId, store.auth.token]);

    // Función para agregar comentario
    const agregarComentario = useCallback(async (comentarioTexto) => {
        if (!comentarioTexto.trim()) {
            alert('Por favor ingresa un comentario');
            return false;
        }

        // Optimistic update
        const nuevoComentarioObj = {
            id: Date.now(),
            texto: comentarioTexto.trim(),
            fecha_comentario: new Date().toISOString(),
            autor: {
                nombre: userData?.nombre || 'Usuario',
                rol: userData?.rol || 'cliente'
            }
        };

        setComentarios(prev => [nuevoComentarioObj, ...prev]);

        try {
            const token = store.auth.token;
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/comentarios`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    id_ticket: parseInt(ticketId),
                    texto: comentarioTexto.trim()
                })
            });

            if (!response.ok) {
                throw new Error('Error al agregar comentario');
            }

            // Recargar datos en background
            cargarDatos(false);

            // Actualizar chat activo en localStorage
            if (userData?.id && ticketId && window.updateActiveChat) {
                const chatsData = localStorage.getItem('activeChats');
                let activeChats = chatsData ? JSON.parse(chatsData) : [];
                const existingChat = activeChats.find(chat =>
                    chat.ticketId === parseInt(ticketId) && chat.userId === userData.id
                );

                const currentCommentsCount = comentarios.length + 1;
                const currentMessagesCount = existingChat ? existingChat.messagesCount : 0;

                window.updateActiveChat(
                    parseInt(ticketId),
                    `Ticket #${ticketId}`,
                    userData.id,
                    currentCommentsCount,
                    currentMessagesCount
                );
            }

            return true;
        } catch (err) {
            setError(err.message);
            // Revertir optimistic update
            setComentarios(prev => prev.filter(c => c.id !== nuevoComentarioObj.id));
            return false;
        }
    }, [ticketId, store.auth.token, userData, comentarios.length, cargarDatos]);

    // Memoizar funciones de utilidad
    const getRoleColor = useMemo(() => (rol) => {
        switch (rol) {
            case 'cliente': return 'text-primary';
            case 'analista': return 'text-success';
            case 'supervisor': return 'text-warning';
            case 'administrador': return 'text-danger';
            default: return 'text-secondary';
        }
    }, []);

    const getRoleIcon = useMemo(() => (rol) => {
        switch (rol) {
            case 'cliente': return 'fas fa-user';
            case 'analista': return 'fas fa-user-tie';
            case 'supervisor': return 'fas fa-user-shield';
            case 'administrador': return 'fas fa-user-cog';
            default: return 'fas fa-user';
        }
    }, []);

    return {
        // Estados
        comentarios,
        setComentarios,
        historialTicket,
        loading,
        error,
        setError,
        sincronizando,
        setSincronizando,
        userData,
        setUserData,
        lastLoadedTicketId,
        setLastLoadedTicketId,
        mostrarHistorial,
        setMostrarHistorial,
        esTicketCerrado,
        // Funciones
        cargarDatos,
        agregarComentario,
        getRoleColor,
        getRoleIcon
    };
};

export default useComentariosData;
