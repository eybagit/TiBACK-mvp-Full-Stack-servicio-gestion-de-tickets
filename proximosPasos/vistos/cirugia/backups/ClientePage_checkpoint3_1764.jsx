import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useGlobalReducer from '../../hooks/useGlobalReducer';
import { tokenUtils } from '../../store';
import GoogleMapsLocation from '../../components/GoogleMapsLocation';
import ImageUpload from '../../components/ImageUpload';
import { VerTicketHDCliente } from './verTicketHDcliente';
import { SideBarCentral } from '../../components/SideBarCentral';
import ComentariosTicketEmbedded from '../../components/ComentariosTicketEmbedded';
import ChatAnalistaClienteEmbedded from '../../components/ChatAnalistaClienteEmbedded';
import RecomendacionVistaEmbedded from '../../components/RecomendacionVistaEmbedded';
import IdentificarImagenEmbedded from '../../components/IdentificarImagenEmbedded';
// Componentes modularizados
import ClienteDashboard from './components/ClienteDashboard';
import ClienteTicketsList from './components/ClienteTicketsList';
import ClienteTicketForm from './components/ClienteTicketForm';
import ClienteProfile from './components/ClienteProfile';
import ClienteChat from './components/ClienteChat';

function ClientePage() {
    // Para modal de imágenes
    const [selectedTicketImages, setSelectedTicketImages] = useState(null);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    // Estados para imágenes nuevas (ahora solo URLs)
    const [newTicketImages, setNewTicketImages] = useState([]); // URLs de Cloudinary
    const [uploading, setUploading] = useState(false);
    // const cloudinaryWidgetRef = useRef(null);

    // // Feedback visual para actualización de tickets
    // const [feedback, setFeedback] = useState("");

    // (Cloudinary widget code removed — use ImageUpload component instead)
    const navigate = useNavigate();
    const { store, logout, dispatch, connectWebSocket, disconnectWebSocket, joinRoom, joinTicketRoom, startRealtimeSync, emitCriticalTicketAction, joinCriticalRooms, joinAllCriticalRooms } = useGlobalReducer();
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showInfoForm, setShowInfoForm] = useState(false);
    const [updatingInfo, setUpdatingInfo] = useState(false);
    const [showTicketForm, setShowTicketForm] = useState(false);
    const [userData, setUserData] = useState(null);
    const [solicitudesReapertura, setSolicitudesReapertura] = useState(new Set());
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
    const [ticketImageUrl, setTicketImageUrl] = useState('');
    const [ticketsConRecomendaciones, setTicketsConRecomendaciones] = useState(new Set());
    const [expandedTickets, setExpandedTickets] = useState(new Set());
    const [clienteImageUrl, setClienteImageUrl] = useState('');

    // Funciones para manejar la imagen del ticket
    const handleImageUpload = (imageUrl) => {
        setTicketImageUrl(imageUrl);
    };

    const handleImageRemove = () => {
        setTicketImageUrl('');
    };

    // Funciones para manejar la imagen del cliente
    const handleClienteImageUpload = (imageUrl) => {
        setClienteImageUrl(imageUrl);
        // Actualizar inmediatamente userData para mostrar la imagen
        setUserData(prev => ({
            ...prev,
            url_imagen: imageUrl
        }));
    };

    const handleClienteImageRemove = () => {
        setClienteImageUrl('');
        // Actualizar userData para remover la imagen
        setUserData(prev => ({
            ...prev,
            url_imagen: null
        }));
    };

    const toggleTicketForm = () => {
        setShowTicketForm(!showTicketForm);
        if (showTicketForm) {
            // Limpiar el formulario cuando se cierre
            setTicketImageUrl('');
        }
    };

    // FunciÃ³n helper para actualizar tickets sin recargar la pÃ¡gina
    const actualizarTickets = async () => {
        try {
            const token = store.auth.token;
            // Forzar petición fresca sin cache
            const ticketsResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/tickets/cliente?t=${Date.now()}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            if (ticketsResponse.ok) {
                const ticketsData = await ticketsResponse.json();
                setTickets(ticketsData);
                console.log(`📋 Cliente - Tickets cargados: ${ticketsData.length} tickets`);

                // Limpiar solicitudes de reapertura para tickets que ya NO están en estado 'solucionado'
                // NO restaurar automáticamente solicitudes - solo confiar en el flujo de agregar cuando el cliente hace clic
                setSolicitudesReapertura(prev => {
                    const newSet = new Set(prev);
                    // Eliminar solicitudes de tickets que ya no están en 'solucionado'
                    ticketsData.forEach(ticket => {
                        if (ticket.estado && ticket.estado.toLowerCase() !== 'solucionado' && newSet.has(ticket.id)) {
                            console.log(`🧹 Limpiando solicitud de reapertura para ticket ${ticket.id} (estado: ${ticket.estado})`);
                            newSet.delete(ticket.id);
                        }
                    });
                    // También eliminar solicitudes de tickets que ya no existen
                    const ticketIds = new Set(ticketsData.map(t => t.id));
                    Array.from(newSet).forEach(ticketId => {
                        if (!ticketIds.has(ticketId)) {
                            console.log(`🧹 Limpiando solicitud de reapertura para ticket inexistente ${ticketId}`);
                            newSet.delete(ticketId);
                        }
                    });
                    return newSet;
                });
            }
        } catch (err) {
            setError("Error al actualizar la lista");
            setTimeout(() => setError(""), 2000);
            console.error('Error al actualizar tickets:', err);
        }
    };

    // Conectar WebSocket cuando el usuario estÃ© autenticado
    useEffect(() => {
        if (store.auth.isAuthenticated && store.auth.token && !store.websocket.connected) {
            const socket = connectWebSocket(store.auth.token);
            if (socket) {
                const userId = tokenUtils.getUserId(store.auth.token);
                const role = tokenUtils.getRole(store.auth.token);
                joinRoom(socket, role, userId);

                // Unirse EXPLÍCITAMENTE a la room específica del cliente para notificaciones directas
                if (userId) {
                    try {
                        const clienteRoom = `cliente_${userId}`;
                        console.log(`🔌 CLIENTE - Uniéndose a room específica: ${clienteRoom}`);
                        socket.emit('join_room', clienteRoom);
                        console.log(`✅ CLIENTE - Solicitud de unión enviada a: ${clienteRoom}`);
                    } catch (e) {
                        console.error('❌ CLIENTE - Error al unirse a room específica:', e);
                    }
                }
            }
        }

        // Cleanup al desmontar
        return () => {
            if (store.websocket.socket) {
                disconnectWebSocket(store.websocket.socket);
            }
        };
    }, [store.auth.isAuthenticated, store.auth.token]);

    // Unirse automÃ¡ticamente a los rooms de tickets del cliente
    useEffect(() => {
        if (store.websocket.socket && tickets.length > 0) {
            // Solo unirse a rooms de tickets que no estÃ©n ya unidos
            const joinedRooms = new Set();
            tickets.forEach(ticket => {
                if (!joinedRooms.has(ticket.id)) {
                    joinTicketRoom(store.websocket.socket, ticket.id);
                    joinedRooms.add(ticket.id);
                }
            });
        }
    }, [store.websocket.socket, tickets.length]); // Solo cuando cambia la cantidad de tickets

    // Configurar sincronización crítica en tiempo real PURIFICADA
    useEffect(() => {
        if (store.auth.user && store.websocket.connected && store.websocket.socket) {
            console.log('🔄 CLIENTE - Configurando sincronización crítica PURIFICADA');

            // Unirse a todas las rooms críticas inmediatamente
            joinAllCriticalRooms(store.websocket.socket, store.auth.user, store.auth.token);

            // Configurar sincronización crítica
            const syncConfig = startRealtimeSync({
                syncTypes: ['tickets', 'comentarios', 'asignaciones'],
                onSyncTriggered: (data) => {
                    console.log('🔄 CLIENTE - Sincronización crítica activada:', data);
                    if (data.type === 'tickets' || data.priority === 'critical') {
                        actualizarTickets();
                    }
                }
            });

            // Unirse a rooms críticos de todos los tickets del cliente
            const ticketIds = tickets.map(ticket => ticket.id);
            if (ticketIds.length > 0) {
                joinCriticalRooms(store.websocket.socket, ticketIds, store.auth.user, store.auth.token);

                // Unirse específicamente a cada room de ticket para sincronización completa
                ticketIds.forEach(ticketId => {
                    store.websocket.socket.emit('join_ticket_room', {
                        ticket_id: ticketId,
                        user_id: store.auth.user.id,
                        role: 'cliente'
                    });
                });

                console.log(`🎯 CLIENTE: Unido a ${ticketIds.length} rooms de tickets específicos`);
            }

            // Configurar listeners COMPLETOS para eventos de tickets en tiempo real
            const socket = store.websocket.socket;

            const handleTicketUpdate = (data) => {
                console.log('🎫 CLIENTE - ACTUALIZACIÓN DE TICKET:', data);

                // Limpiar solicitudes de reapertura si el ticket cambió a un estado diferente de solucionado
                if (data.ticket_id && data.ticket_estado) {
                    const estadoLower = data.ticket_estado.toLowerCase();
                    // Si el ticket ya no está en solucionado (fue reabierto o cerrado), limpiar solicitudes
                    if (estadoLower !== 'solucionado') {
                        setSolicitudesReapertura(prev => {
                            const newSet = new Set(prev);
                            newSet.delete(data.ticket_id);
                            return newSet;
                        });
                    }
                }

                actualizarTickets();
            };

            const handleTicketEstadoChanged = (data) => {
                console.log('🔄 CLIENTE - ESTADO DE TICKET CAMBIADO:', data);

                // Limpiar solicitudes de reapertura si el ticket cambió a un estado diferente de solucionado
                if (data.ticket_id && (data.estado || data.ticket_estado)) {
                    const estadoLower = (data.estado || data.ticket_estado).toLowerCase();
                    // Si el ticket ya no está en solucionado (fue reabierto o cerrado), limpiar solicitudes
                    if (estadoLower !== 'solucionado') {
                        setSolicitudesReapertura(prev => {
                            const newSet = new Set(prev);
                            newSet.delete(data.ticket_id);
                            return newSet;
                        });
                    }
                }

                // Si el ticket cambió a solucionado, hacer actualización agresiva
                if (data.estado === 'solucionado' || data.ticket_estado === 'solucionado') {
                    console.log('🎯 CLIENTE - TICKET SOLUCIONADO DETECTADO EN ESTADO_CHANGED');
                    actualizarTickets();
                    setTimeout(() => {
                        actualizarTickets();
                    }, 1000);
                } else {
                    actualizarTickets();
                }
            };

            const handleComentarioUpdate = (data) => {
                console.log('💬 CLIENTE - NUEVO COMENTARIO:', data);
                actualizarTickets();
            };

            const handleTicketAsignado = (data) => {
                console.log('👤 CLIENTE - TICKET ASIGNADO:', data);

                // Limpiar solicitudes de reapertura cuando el ticket es asignado (después de reapertura)
                if (data.ticket_id || data.id) {
                    const ticketId = data.ticket_id || data.id;
                    setSolicitudesReapertura(prev => {
                        const newSet = new Set(prev);
                        newSet.delete(ticketId);
                        return newSet;
                    });
                }

                actualizarTickets();
            };

            const handleTicketEscalado = (data) => {
                console.log('⬆️ CLIENTE - TICKET ESCALADO:', data);

                // Limpiar solicitudes de reapertura cuando el ticket es escalado
                if (data.ticket_id) {
                    setSolicitudesReapertura(prev => {
                        const newSet = new Set(prev);
                        newSet.delete(data.ticket_id);
                        return newSet;
                    });
                }

                actualizarTickets();
            };

            const handleTicketSolucionado = (data) => {
                console.log('✅ CLIENTE - TICKET SOLUCIONADO:', data);

                // Limpiar solicitudes de reapertura pendientes cuando el ticket vuelve a solucionado
                // Esto permite al cliente volver a cerrar o solicitar reapertura normalmente
                if (data.ticket_id) {
                    console.log(`🧹 LIMPIANDO solicitud de reapertura para ticket ${data.ticket_id} (ticket solucionado)`);
                    setSolicitudesReapertura(prev => {
                        const newSet = new Set(prev);
                        if (newSet.has(data.ticket_id)) {
                            console.log(`✅ Solicitud eliminada del Set para ticket ${data.ticket_id}`);
                        } else {
                            console.log(`ℹ️ No había solicitud pendiente para ticket ${data.ticket_id}`);
                        }
                        newSet.delete(data.ticket_id);
                        return newSet;
                    });
                }

                // Actualización inmediata y agresiva
                actualizarTickets();

                // Forzar actualización adicional después de un breve delay
                setTimeout(() => {
                    actualizarTickets();
                }, 1000);

                // Emitir evento para notificar a otros componentes
                window.dispatchEvent(new CustomEvent('ticket_solucionado_cliente', {
                    detail: { ...data, source: 'cliente_websocket' }
                }));
            };

            const handleTicketCerrado = (data) => {
                console.log('🔒 CLIENTE - TICKET CERRADO:', data);
                actualizarTickets();
            };

            const handleSolicitudReapertura = (data) => {
                console.log('🔄 CLIENTE - SOLICITUD DE REAPERTURA:', data);
                actualizarTickets();
            };

            const handleReaperturaAprobada = (data) => {
                console.log('✅ CLIENTE - REAPERTURA APROBADA:', data);

                // Remover de solicitudes pendientes si es nuestro ticket
                if (data.ticket_id) {
                    setSolicitudesReapertura(prev => {
                        const newSet = new Set(prev);
                        newSet.delete(data.ticket_id);
                        return newSet;
                    });
                }

                actualizarTickets();
            };

            const handleTicketReabierto = (data) => {
                console.log('🔄 CLIENTE - TICKET REABIERTO:', data);

                // Limpiar solicitudes de reapertura pendientes cuando el supervisor reabre el ticket
                // Esto reinicia el ciclo para que el cliente pueda interactuar normalmente después
                if (data.ticket_id) {
                    setSolicitudesReapertura(prev => {
                        const newSet = new Set(prev);
                        newSet.delete(data.ticket_id);
                        return newSet;
                    });
                }

                actualizarTickets();
            };

            const handleNuevoTicket = (data) => {
                console.log('🆕 CLIENTE - NUEVO TICKET:', data);
                actualizarTickets();
            };

            // Agregar listeners específicos
            socket.on('ticket_actualizado', handleTicketUpdate);
            socket.on('ticket_estado_changed', handleTicketEstadoChanged);
            socket.on('nuevo_comentario', handleComentarioUpdate);
            socket.on('ticket_asignado', handleTicketAsignado);
            socket.on('ticket_escalado', handleTicketEscalado);
            socket.on('ticket_solucionado', handleTicketSolucionado);
            socket.on('ticket_cerrado', handleTicketCerrado);
            socket.on('solicitud_reapertura', handleSolicitudReapertura);
            socket.on('reapertura_aprobada', handleReaperturaAprobada);
            socket.on('ticket_reabierto', handleTicketReabierto);
            socket.on('nuevo_ticket', handleNuevoTicket);

            // Cleanup al desmontar
            return () => {
                socket.off('ticket_actualizado', handleTicketUpdate);
                socket.off('ticket_estado_changed', handleTicketEstadoChanged);
                socket.off('nuevo_comentario', handleComentarioUpdate);
                socket.off('ticket_asignado', handleTicketAsignado);
                socket.off('ticket_escalado', handleTicketEscalado);
                socket.off('ticket_solucionado', handleTicketSolucionado);
                socket.off('ticket_cerrado', handleTicketCerrado);
                socket.off('solicitud_reapertura', handleSolicitudReapertura);
                socket.off('reapertura_aprobada', handleReaperturaAprobada);
                socket.off('ticket_reabierto', handleTicketReabierto);
                socket.off('nuevo_ticket', handleNuevoTicket);
            };
        }
    }, [store.auth.user, store.websocket.connected, tickets.length]);

    // Efecto para manejar sincronizaciÃ³n manual desde Footer
    useEffect(() => {
        const handleManualSync = (event) => {
            console.log('ðŸ"„ SincronizaciÃ³n manual recibida en ClientePage:', event.detail);
            if (event.detail.role === 'cliente') {
                actualizarTickets();
            }
        };

        window.addEventListener('manualSyncTriggered', handleManualSync);
        return () => window.removeEventListener('manualSyncTriggered', handleManualSync);
    }, []);

    // Escuchar eventos de sincronización total desde el Footer
    useEffect(() => {
        const handleTotalSync = (event) => {
            console.log('🔄 Sincronización total recibida en ClientePage:', event.detail);
            if (event.detail.role === 'cliente' || event.detail.source === 'footer_sync') {
                // Recargar todos los datos del cliente
                actualizarTickets();
                console.log('✅ Datos del cliente actualizados por sincronización total');
            }
        };

        const handleSyncCompleted = (event) => {
            console.log('✅ Sincronización total completada en ClientePage:', event.detail);
        };

        const handleSyncError = (event) => {
            console.error('❌ Error en sincronización total en ClientePage:', event.detail);
        };

        // Escuchar eventos de sincronización
        window.addEventListener('totalSyncTriggered', handleTotalSync);
        window.addEventListener('sync_completed', handleSyncCompleted);
        window.addEventListener('sync_error', handleSyncError);
        window.addEventListener('refresh_tickets', handleTotalSync);
        window.addEventListener('refresh_dashboard', handleTotalSync);
        window.addEventListener('sync_tickets', handleTotalSync);

        return () => {
            window.removeEventListener('totalSyncTriggered', handleTotalSync);
            window.removeEventListener('sync_completed', handleSyncCompleted);
            window.removeEventListener('sync_error', handleSyncError);
            window.removeEventListener('refresh_tickets', handleTotalSync);
            window.removeEventListener('refresh_dashboard', handleTotalSync);
            window.removeEventListener('sync_tickets', handleTotalSync);
        };
    }, []);

    // Efecto para manejar actualizaciones crÃ­ticas de tickets
    useEffect(() => {
        if (store.websocket.criticalTicketUpdate) {
            const criticalUpdate = store.websocket.criticalTicketUpdate;
            console.log('ðŸš¨ ACTUALIZACIÃ“N CRÃTICA RECIBIDA EN CLIENTE:', criticalUpdate);

            // Actualizar inmediatamente para acciones crÃ­ticas
            if (criticalUpdate.priority === 'critical') {
                actualizarTickets();

                // Mostrar notificaciÃ³n visual si es necesario
                if (criticalUpdate.action === 'comentario_agregado' ||
                    criticalUpdate.action === 'ticket_actualizado' ||
                    criticalUpdate.action.includes('estado_cambiado') ||
                    criticalUpdate.action.includes('ticket_asignado')) {
                    console.log(`ðŸš¨ AcciÃ³n crÃ­tica: ${criticalUpdate.action} en ticket ${criticalUpdate.ticket_id}`);
                }
            }
        }
    }, [store.websocket.criticalTicketUpdate]);

    // Actualizar tickets cuando lleguen notificaciones WebSocket
    useEffect(() => {
        if (store.websocket.notifications.length > 0) {
            const lastNotification = store.websocket.notifications[store.websocket.notifications.length - 1];

            // Manejo especÃ­fico para tickets eliminados - sincronizaciÃ³n inmediata
            if (lastNotification.tipo === 'eliminado' || lastNotification.tipo === 'ticket_eliminado') {

                // Remover inmediatamente de la lista de tickets
                if (lastNotification.ticket_id) {
                    setTickets(prev => {
                        const ticketRemovido = prev.find(t => t.id === lastNotification.ticket_id);
                        if (ticketRemovido) {
                        }
                        return prev.filter(ticket => ticket.id !== lastNotification.ticket_id);
                    });

                    // TambiÃ©n remover de las solicitudes de reapertura si existe
                    setSolicitudesReapertura(prev => {
                        const newSet = new Set(prev);
                        newSet.delete(lastNotification.ticket_id);
                        return newSet;
                    });
                }
                return; // No continuar con el resto de la lógica
            }

            // Actualización ULTRA RÁPIDA para todos los eventos críticos
            if (lastNotification.tipo === 'asignado' || lastNotification.tipo === 'estado_cambiado' || lastNotification.tipo === 'iniciado' || lastNotification.tipo === 'escalado' || lastNotification.tipo === 'creado' || lastNotification.tipo === 'solucionado') {
                console.log('🚀 CLIENTE - EVENTO CRÍTICO DETECTADO:', lastNotification.tipo);

                // Para tickets solucionados, hacer múltiples actualizaciones
                if (lastNotification.tipo === 'solucionado') {
                    console.log('🎯 CLIENTE - TICKET SOLUCIONADO DETECTADO EN NOTIFICACIONES');

                    // Limpiar solicitud de reapertura si existe
                    if (lastNotification.ticket_id) {
                        console.log(`🧹 LIMPIANDO solicitud de reapertura para ticket ${lastNotification.ticket_id} (notificación solucionado)`);
                        setSolicitudesReapertura(prev => {
                            const newSet = new Set(prev);
                            newSet.delete(lastNotification.ticket_id);
                            return newSet;
                        });
                    }

                    // Actualización inmediata
                    actualizarTickets();
                    // Actualización adicional después de un delay
                    setTimeout(() => {
                        actualizarTickets();
                    }, 500);
                    // Actualización final después de otro delay
                    setTimeout(() => {
                        actualizarTickets();
                    }, 1500);
                } else {
                    // Los datos ya están en el store por el WebSocket - actualización instantánea
                    actualizarTickets();
                }
            } else {
                // Sincronización ULTRA RÁPIDA con servidor para TODOS los eventos
                actualizarTickets();
            }
        }
    }, [store.websocket.notifications]);

    // Cargar datos del usuario y tickets
    useEffect(() => {
        const cargarDatos = async () => {
            try {
                console.log('🔍 ClientePage - Iniciando carga de datos:', {
                    isAuthenticated: store.auth.isAuthenticated,
                    hasToken: !!store.auth.token,
                    hasUser: !!store.auth.user
                });
                setLoading(true);
                const token = store.auth.token;
                const userId = tokenUtils.getUserId(token);

                // Cargar datos del usuario
                const userResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/clientes/${userId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (userResponse.ok) {
                    const userData = await userResponse.json();
                    setUserData(userData);

                    // Actualizar el store global con los datos del usuario
                    dispatch({
                        type: 'SET_USER',
                        payload: userData
                    });

                    setInfoData({
                        nombre: userData.nombre === 'Pendiente' ? '' : userData.nombre || '',
                        apellido: userData.apellido === 'Pendiente' ? '' : userData.apellido || '',
                        email: userData.email || '',
                        telefono: userData.telefono === '0000000000' ? '' : userData.telefono || '',
                        direccion: userData.direccion === 'Pendiente' ? '' : userData.direccion || '',
                        lat: userData.latitude || null,
                        lng: userData.longitude || null,
                        password: '',
                        confirmPassword: ''
                    });
                    setClienteImageUrl(userData.url_imagen || '');
                }

                // Cargar tickets del cliente
                const ticketsResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/tickets/cliente`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!ticketsResponse.ok) {
                    throw new Error('Error al cargar tickets');
                }

                const ticketsData = await ticketsResponse.json();
                setTickets(ticketsData);
                console.log('✅ ClientePage - Datos cargados exitosamente:', {
                    userData: userData,
                    ticketsCount: ticketsData.length
                });
            } catch (err) {
                console.error('❌ ClientePage - Error al cargar datos:', err);
                setError(err.message);
            } finally {
                setLoading(false);
                console.log('🏁 ClientePage - Carga completada, loading: false');
            }
        };

        cargarDatos();
    }, [store.auth.token]);

    // Verificar recomendaciones para todos los tickets
    useEffect(() => {
        if (tickets.length > 0 && store.auth.token && store.auth.isAuthenticated) {
            // Agregar un pequeÃ±o delay para evitar llamadas mÃºltiples
            const timeoutId = setTimeout(() => {
                verificarRecomendaciones();
            }, 500);

            return () => clearTimeout(timeoutId);
        }
    }, [tickets.length, store.auth.token, store.auth.isAuthenticated]);

    const verificarRecomendaciones = async () => {
        try {
            const token = store.auth.token;

            // Validaciones robustas
            if (!tickets || tickets.length === 0) {
                console.log('âš ï¸ No hay tickets para verificar recomendaciones');
                return;
            }

            if (!token) {
                console.log('âš ï¸ No hay token para verificar recomendaciones');
                return;
            }

            console.log(`ðŸ” Verificando recomendaciones para ${tickets.length} tickets...`);

            const recomendacionesPromises = tickets.map(async (ticket) => {
                try {
                    // Validar que el ticket tenga contenido vÃ¡lido
                    if (!ticket.titulo || !ticket.descripcion || ticket.titulo.trim() === '' || ticket.descripcion.trim() === '') {
                        console.log(`âš ï¸ Ticket ${ticket.id} sin contenido suficiente para recomendaciones`);
                        return { ticketId: ticket.id, tieneRecomendaciones: false, razon: 'sin_contenido' };
                    }

                    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/tickets/${ticket.id}/recomendaciones-similares`, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        },
                        // Aumentar timeout para requests mÃ¡s robustos
                        signal: AbortSignal.timeout(15000) // 15 segundos timeout
                    });

                    if (response.ok) {
                        const data = await response.json();
                        const tieneRecomendaciones = data.total_encontrados > 0;
                        console.log(`âœ… Ticket ${ticket.id}: ${data.total_encontrados} recomendaciones encontradas`);
                        return {
                            ticketId: ticket.id,
                            tieneRecomendaciones,
                            totalRecomendaciones: data.total_encontrados,
                            algoritmo: data.algoritmo || 'legacy'
                        };
                    } else {
                        // Log del error específico pero no fallar
                        console.warn(`âš ï¸ Error ${response.status} verificando recomendaciones para ticket ${ticket.id}`);
                        return { ticketId: ticket.id, tieneRecomendaciones: false, razon: `error_${response.status}` };
                    }
                } catch (fetchError) {
                    // Manejar errores individuales sin fallar toda la operación
                    if (fetchError.name === 'AbortError') {
                        console.warn(`â° Timeout verificando recomendaciones para ticket ${ticket.id}`);
                        return { ticketId: ticket.id, tieneRecomendaciones: false, razon: 'timeout' };
                    } else if (fetchError.name === 'TypeError' && fetchError.message.includes('Failed to fetch')) {
                        console.warn(`ðŸŒ Error de red verificando recomendaciones para ticket ${ticket.id}`);
                        return { ticketId: ticket.id, tieneRecomendaciones: false, razon: 'network_error' };
                    } else {
                        console.warn(`âŒ Error verificando recomendaciones para ticket ${ticket.id}:`, fetchError.message);
                        return { ticketId: ticket.id, tieneRecomendaciones: false, razon: 'unknown_error' };
                    }
                }
            });

            const resultados = await Promise.all(recomendacionesPromises);

            // AnÃ¡lisis detallado de resultados
            const ticketsConRecomendaciones = resultados.filter(r => r.tieneRecomendaciones);
            const ticketsSinRecomendaciones = resultados.filter(r => !r.tieneRecomendaciones);

            console.log('ðŸ“Š Resultados de recomendaciones:', {
                total: resultados.length,
                conRecomendaciones: ticketsConRecomendaciones.length,
                sinRecomendaciones: ticketsSinRecomendaciones.length,
                detalles: resultados
            });

            // Log especÃ­fico para tickets sin recomendaciones
            if (ticketsSinRecomendaciones.length > 0) {
                console.log('âš ï¸ Tickets sin recomendaciones:', ticketsSinRecomendaciones.map(t => ({
                    id: t.ticketId,
                    razon: t.razon
                })));
            }

            // Actualizar estado con validaciones robustas
            const ticketsConRecomendacionesSet = new Set();
            resultados.forEach(({ ticketId, tieneRecomendaciones }) => {
                if (tieneRecomendaciones) {
                    ticketsConRecomendacionesSet.add(ticketId);
                }
            });
            setTicketsConRecomendaciones(ticketsConRecomendacionesSet);

            console.log(`âœ… VerificaciÃ³n de recomendaciones completada para ${tickets.length} tickets`);
        } catch (error) {
            console.error('âŒ Error general verificando recomendaciones:', error);
            // En caso de error general, limpiar el estado
            setTicketsConRecomendaciones(new Set());
        }
    };

    const crearTicket = async (e) => {
        e.preventDefault();
        setUploading(true);
        const formData = new FormData(e.target);
        const img_urls = newTicketImages;
        const ticketData = {
            titulo: formData.get('titulo'),
            descripcion: formData.get('descripcion'),
            prioridad: formData.get('prioridad'),
            url_imagen: ticketImageUrl
        };
        try {
            const token = store.auth.token;
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/tickets`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(ticketData)
            });
            if (!response.ok) {
                throw new Error('Error al crear ticket');
            }

            // Limpiar el formulario despuÃ©s de crear el ticket exitosamente
            e.target.reset();
            setTicketImageUrl(''); // Limpiar la imagen tambiÃ©n
            setShowTicketForm(false); // Cerrar el formulario

            // Obtener el ID del ticket creado para emitir acciÃ³n crÃ­tica
            const responseData = await response.json();
            const ticketId = responseData.id;

            // Emitir acciÃ³n crÃ­tica de ticket creado
            if (store.websocket.socket && ticketId) {
                emitCriticalTicketAction(store.websocket.socket, ticketId, 'ticket_creado', store.auth.user);
            }

            // Actualizar tickets sin recargar la pÃ¡gina
            await actualizarTickets();

            // Unirse al room del nuevo ticket
            if (store.websocket.socket) {
                const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/tickets/cliente`, {
                    headers: {
                        'Authorization': `Bearer ${store.auth.token}`,
                        'Content-Type': 'application/json'
                    }
                });
                if (response.ok) {
                    const ticketsData = await response.json();
                    const nuevoTicket = ticketsData[ticketsData.length - 1];
                    if (nuevoTicket) {
                        joinTicketRoom(store.websocket.socket, nuevoTicket.id);
                    }
                }
                if (store.websocket.socket && ticketId) {
                    joinTicketRoom(store.websocket.socket, ticketId);
                    // TambiÃ©n unirse a rooms crÃ­ticos
                    joinCriticalRooms(store.websocket.socket, [ticketId], store.auth.user);
                }
            }

            // Navegar automÃ¡ticamente a "Mis Tickets" y posicionar el nuevo ticket
            changeView('tickets');

            // Esperar un momento para que se renderice la vista y luego hacer scroll al nuevo ticket
            setTimeout(() => {
                const newTicketElement = document.querySelector(`[data-ticket-id="${ticketId}"]`);
                if (newTicketElement) {
                    newTicketElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center'
                    });

                    // Agregar un efecto visual para destacar el nuevo ticket
                    newTicketElement.style.backgroundColor = 'rgba(40, 167, 69, 0.1)';
                    newTicketElement.style.border = '2px solid #28a745';
                    newTicketElement.style.borderRadius = '8px';

                    // Remover el efecto despuÃ©s de 3 segundos
                    setTimeout(() => {
                        newTicketElement.style.backgroundColor = '';
                        newTicketElement.style.border = '';
                        newTicketElement.style.borderRadius = '';
                    }, 3000);
                }
            }, 500);
        } catch (err) {
            setError(err.message);
        } finally {
            setUploading(false);
        }
    };

    const getEstadoColor = (estado) => {
        switch (estado.toLowerCase()) {
            case 'creado': return 'badge bg-secondary';
            case 'en_espera': return 'badge bg-warning';
            case 'en_proceso': return 'badge bg-primary';
            case 'solucionado': return 'badge bg-success';
            case 'cerrado': return 'badge bg-dark';
            case 'reabierto': return 'badge bg-danger';
            default: return 'badge bg-secondary';
        }
    };

    const getPrioridadColor = (prioridad) => {
        switch (prioridad.toLowerCase()) {
            case 'alta': return 'badge bg-danger';
            case 'media': return 'badge bg-warning';
            case 'baja': return 'badge bg-success';
            default: return 'badge bg-secondary';
        }
    };

    const evaluarTicket = async (ticketId, calificacion) => {
        try {
            const token = store.auth.token;
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/tickets/${ticketId}/evaluar`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ calificacion })
            });

            if (!response.ok) {
                throw new Error('Error al evaluar ticket');
            }

            // Actualizar tickets sin recargar la pÃ¡gina
            await actualizarTickets();
        } catch (err) {
            setError(err.message);
        }
    };

    const solicitarReapertura = async (ticketId) => {
        try {
            const token = store.auth.token;

            // Debug: Verificar el estado actual del ticket
            const ticket = tickets.find(t => t.id === ticketId);
            console.log('🔍 DEBUG - Estado del ticket antes de solicitar reapertura:', {
                ticketId,
                estado: ticket?.estado,
                estadoLower: ticket?.estado?.toLowerCase()
            });

            // Debug: Llamar al endpoint de debug del backend
            try {
                const debugResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/tickets/${ticketId}/debug`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                if (debugResponse.ok) {
                    const debugData = await debugResponse.json();
                    console.log('🔍 DEBUG BACKEND - Información del ticket:', debugData);
                    console.log('🔍 DEBUG BACKEND - Validaciones de transición:', debugData.validacion_transicion);
                }
            } catch (debugErr) {
                console.log('⚠️ No se pudo obtener debug del backend:', debugErr);
            }

            const requestBody = { estado: 'solicitud_reapertura' };
            console.log('🔍 DEBUG - Enviando al backend:', requestBody);

            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/tickets/${ticketId}/estado`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            if (response.ok) {
                // Solo agregar a solicitudes pendientes si la petición fue exitosa
                setSolicitudesReapertura(prev => {
                    const newSet = new Set(prev);
                    newSet.add(ticketId);
                    return newSet;
                });

                // Actualizar tickets sin recargar la pÃ¡gina
                await actualizarTickets();

                alert('Solicitud de reapertura enviada. El supervisor revisará tu solicitud.');
            } else {
                // Capturar el mensaje de error específico del backend
                const errorData = await response.json();
                const errorMessage = errorData.message || 'Error al solicitar reapertura';
                console.error('Error del servidor:', errorMessage);
                console.error('Response status:', response.status);
                console.error('Response data:', errorData);
                throw new Error(errorMessage);
            }
        } catch (err) {
            setError(err.message);
        }
    };


    const reabrirTicket = async (ticketId) => {
        // Usar la función principal de solicitar reapertura
        await solicitarReapertura(ticketId);
    };

    // FunciÃ³n para actualizar informaciÃ³n del cliente
    const updateInfo = async () => {
        try {
            setUpdatingInfo(true);
            const token = store.auth.token;
            const userId = tokenUtils.getUserId(token);

            // Validar contraseñas si se están cambiando
            if (infoData.password && infoData.password !== infoData.confirmPassword) {
                setError('Las contraseñas no coinciden');
                return;
            }

            const updateData = {
                nombre: infoData.nombre,
                apellido: infoData.apellido,
                email: infoData.email,
                telefono: infoData.telefono,
                direccion: infoData.direccion,
                latitude: infoData.lat,
                longitude: infoData.lng,
                url_imagen: clienteImageUrl || userData?.url_imagen
            };

            // Solo incluir contraseÃ±a si se estÃ¡ cambiando
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

            const updatedUser = await response.json();
            setUserData(updatedUser);

            // Actualizar el store global para que se refleje en el SideBarCentral
            dispatch({ type: 'SET_USER', payload: updatedUser });

            setShowInfoForm(false);
            setClienteImageUrl(''); // Limpiar imagen temporal
            setError('');

            // Limpiar contraseÃ±as del formulario
            setInfoData(prev => ({
                ...prev,
                password: '',
                confirmPassword: ''
            }));

        } catch (err) {
            setError(err.message);
        } finally {
            setUpdatingInfo(false);
        }
    };

    // FunciÃ³n para manejar cambios en el formulario de informaciÃ³n
    const handleInfoChange = (e) => {
        const { name, value } = e.target;
        setInfoData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const cerrarTicket = async (ticketId) => {
        try {
            // Solicitar calificaciÃ³n antes de cerrar
            const calificacion = prompt('Califica el servicio (1-5):');
            if (!calificacion || calificacion < 1 || calificacion > 5) {
                alert('Debes proporcionar una calificaciÃ³n vÃ¡lida entre 1 y 5');
                return;
            }

            const token = store.auth.token;
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/tickets/${ticketId}/estado`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    estado: 'cerrado',
                    calificacion: parseInt(calificacion)
                })
            });

            if (!response.ok) {
                throw new Error('Error al cerrar ticket');
            }

            // Emitir acción crítica de ticket cerrado para notificar al supervisor
            if (store.websocket.socket) {
                emitCriticalTicketAction(store.websocket.socket, ticketId, 'ticket_cerrado', store.auth.user);
            }

            // Actualizar tickets sin recargar la pÃ¡gina
            await actualizarTickets();
        } catch (err) {
            setError(err.message);
        }
    };

    const handleLocationChange = (location) => {
        setInfoData(prev => ({
            ...prev,
            direccion: location.address,
            lat: location.lat,
            lng: location.lng
        }));
    };

    const generarRecomendacion = (ticket) => {
        // Usar el sistema de vistas integradas
        setSelectedTicketId(ticket.id);
        changeView(`recomendacion-${ticket.id}`);
    };

    // FunciÃ³n para verificar si un ticket tiene analista asignado
    const tieneAnalistaAsignado = (ticket) => {
        return ticket.asignacion_actual && ticket.asignacion_actual.analista;
    };

    // FunciÃ³n para obtener el nombre del analista asignado
    const getAnalistaAsignado = (ticket) => {
        if (tieneAnalistaAsignado(ticket)) {
            const analista = ticket.asignacion_actual.analista;
            return `${analista.nombre} ${analista.apellido}`;
        }
        return null;
    };

    // FunciÃ³n para obtener la fecha de asignaciÃ³n
    const getFechaAsignacion = (ticket) => {
        if (tieneAnalistaAsignado(ticket)) {
            const fecha = ticket.asignacion_actual.fecha_asignacion;
            return new Date(fecha).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
        return null;
    };


    // Estados para el diseÃ±o Hyper
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [sidebarHidden, setSidebarHidden] = useState(false);
    const [activeView, setActiveView] = useState('dashboard');
    const [showUserDropdown, setShowUserDropdown] = useState(false);
    const [selectedTicketId, setSelectedTicketId] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [showSearchResults, setShowSearchResults] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [showFilterDropdown, setShowFilterDropdown] = useState(false);
    const [filterEstado, setFilterEstado] = useState('');
    const [filterAsignado, setFilterAsignado] = useState('');
    const [filterPrioridad, setFilterPrioridad] = useState('');

    // FunciÃ³n para alternar sidebar
    const toggleSidebar = () => {
        console.log('Toggle sidebar - Estado actual:', sidebarHidden);
        setSidebarHidden(!sidebarHidden);
        console.log('Toggle sidebar - Nuevo estado:', !sidebarHidden);
    };

    // FunciÃ³n para cambiar vista
    const changeView = (view) => {
        console.log('ClientePage - changeView called with:', view);
        console.log('ClientePage - Current activeView:', activeView);
        setActiveView(view);
        console.log('ClientePage - activeView set to:', view);
        if (view.startsWith('ticket-') || view.startsWith('comentarios-') || view.startsWith('chat-') || view.startsWith('recomendacion-') || view.startsWith('identificar-')) {
            const ticketId = view.replace(/^(ticket-|comentarios-|chat-|recomendacion-|identificar-)/, '');
            console.log('Setting selectedTicketId to:', parseInt(ticketId));
            setSelectedTicketId(parseInt(ticketId));
        } else {
            setSelectedTicketId(null);
        }
    };

    // FunciÃ³n para buscar tickets por tÃ­tulo
    const handleSearch = (query) => {
        setSearchQuery(query);

        if (query.trim().length === 0) {
            setSearchResults([]);
            setShowSearchResults(false);
            return;
        }

        // Filtrar tickets por tÃ­tulo (bÃºsqueda meticulosa)
        const filteredTickets = tickets.filter(ticket =>
            ticket.titulo.toLowerCase().includes(query.toLowerCase().trim())
        );

        // Limitar resultados a 5 para mejor UX
        const limitedResults = filteredTickets.slice(0, 5);

        setSearchResults(limitedResults);
        setShowSearchResults(limitedResults.length > 0);
    };

    // FunciÃ³n para seleccionar un ticket de la bÃºsqueda
    const selectTicketFromSearch = (ticket) => {
        setSearchQuery('');
        setSearchResults([]);
        setShowSearchResults(false);
        changeView(`ticket-${ticket.id}`);
    };

    // FunciÃ³n para cerrar resultados de bÃºsqueda
    const closeSearchResults = () => {
        setShowSearchResults(false);
    };

    // FunciÃ³n para alternar tema
    const toggleTheme = () => {
        console.log('ClientePage - toggleTheme called, current isDarkMode:', isDarkMode);
        setIsDarkMode(!isDarkMode);
        document.body.classList.toggle('dark-theme');
        console.log('ClientePage - isDarkMode set to:', !isDarkMode);
    };

    // Función para aplicar filtros
    const applyFilters = () => {
        setShowFilterDropdown(false);
    };

    // Función para limpiar filtros
    const clearFilters = () => {
        setFilterEstado('');
        setFilterAsignado('');
        setFilterPrioridad('');
        setShowFilterDropdown(false);
    };

    // Función para alternar expansión de ticket
    const toggleTicketExpansion = (ticketId) => {
        setExpandedTickets(prev => {
            const newSet = new Set(prev);
            if (newSet.has(ticketId)) {
                newSet.delete(ticketId);
            } else {
                newSet.add(ticketId);
            }
            return newSet;
        });
    };

    // Función para obtener tickets filtrados
    const getFilteredTickets = () => {
        let filtered = [...tickets];

        if (filterEstado) {
            filtered = filtered.filter(ticket =>
                ticket.estado.toLowerCase() === filterEstado.toLowerCase()
            );
        }

        if (filterAsignado) {
            if (filterAsignado === 'asignados') {
                filtered = filtered.filter(ticket =>
                    tieneAnalistaAsignado(ticket)
                );
            } else if (filterAsignado === 'sin_asignar') {
                filtered = filtered.filter(ticket =>
                    !tieneAnalistaAsignado(ticket)
                );
            }
        }

        if (filterPrioridad) {
            filtered = filtered.filter(ticket => {
                const ticketPrioridad = ticket.prioridad || 'normal';
                return ticketPrioridad.toLowerCase() === filterPrioridad.toLowerCase();
            });
        }

        return filtered;
    };

    // Cerrar dropdown al hacer clic fuera
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showUserDropdown && !event.target.closest('.dropdown')) {
                setShowUserDropdown(false);
            }
            if (showSearchResults && !event.target.closest('.hyper-search')) {
                setShowSearchResults(false);
            }
            if (showFilterDropdown && !event.target.closest('.filter-dropdown')) {
                setShowFilterDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showUserDropdown, showSearchResults, showFilterDropdown]);

    // Aplicar tema al body
    useEffect(() => {
        if (isDarkMode) {
            document.body.classList.add('dark-theme');
        } else {
            document.body.classList.remove('dark-theme');
        }
    }, [isDarkMode]);

    // CAMBIO CLIENTE 3: Sistema de sincronización mejorado para eventos críticos
    useEffect(() => {
        const handleForceUpdate = (event) => {
            console.log('🔄 CLIENTE - FORZAR ACTUALIZACIÓN:', event.detail);
            actualizarTickets();
        };

        const handleSyncCliente = (event) => {
            console.log('👤 CLIENTE - SINCRONIZACIÓN ESPECÍFICA:', event.detail);
            actualizarTickets();
        };

        const handleSyncTickets = (event) => {
            console.log('🎫 CLIENTE - SINCRONIZACIÓN TICKETS:', event.detail);
            actualizarTickets();
        };

        const handleSyncError = (event) => {
            console.error('❌ CLIENTE - ERROR DE SINCRONIZACIÓN:', event.detail);
            // Intentar actualizar de todas formas
            actualizarTickets();
        };

        // Agregar listeners para eventos del Footer (fallback HTTP)
        window.addEventListener('forceUpdateAllViews', handleForceUpdate);
        window.addEventListener('sync_cliente', handleSyncCliente);
        window.addEventListener('sync_tickets', handleSyncTickets);
        window.addEventListener('syncError', handleSyncError);

        // Listener para cuando el supervisor aprueba la reapertura
        const handleReaperturaAprobada = (event) => {
            console.log('✅ Reapertura aprobada por supervisor:', event.detail);
            const { ticket_id } = event.detail;

            // Remover de solicitudes pendientes ya que fue aprobada
            setSolicitudesReapertura(prev => {
                const newSet = new Set(prev);
                newSet.delete(ticket_id);
                return newSet;
            });

            // Actualizar tickets
            actualizarTickets();
        };

        window.addEventListener('reapertura_aprobada', handleReaperturaAprobada);

        // Cleanup
        return () => {
            window.removeEventListener('forceUpdateAllViews', handleForceUpdate);
            window.removeEventListener('sync_cliente', handleSyncCliente);
            window.removeEventListener('sync_tickets', handleSyncTickets);
            window.removeEventListener('syncError', handleSyncError);
            window.removeEventListener('reapertura_aprobada', handleReaperturaAprobada);
        };
    }, []);
    // FIN CAMBIO CLIENTE 3

    // console.log('🎨 ClientePage - Renderizando componente:', {
    //     loading,
    //     error,
    //     ticketsCount: tickets.length,
    //     activeView,
    //     sidebarHidden
    // });


    return (
        <div className="hyper-layout d-flex">
            {/* Sidebar central dinámico */}
            <SideBarCentral
                sidebarHidden={sidebarHidden}
                activeView={activeView}
                changeView={changeView}
            />

            {/* Contenido principal */}
            <div className={`hyper-main-content flex-grow-1 ${sidebarHidden ? 'sidebar-hidden' : ''}`}>
                {/* Header superior */}
                <header className="hyper-header bg-white border-bottom p-3">
                    <div className="d-flex align-items-center justify-content-between w-100">
                        <div className="d-flex align-items-center gap-3">
                            <button
                                className="hyper-sidebar-toggle btn btn-link p-2"
                                onClick={toggleSidebar}
                                title={sidebarHidden ? "Mostrar menú" : "Ocultar menú"}
                            >
                                <i className="fas fa-bars"></i>
                            </button>

                            <div className="hyper-search position-relative">
                                <i className="fas fa-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"></i>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Buscar tickets por título..."
                                    value={searchQuery}
                                    onChange={(e) => handleSearch(e.target.value)}
                                    onFocus={() => {
                                        if (searchResults.length > 0) {
                                            setShowSearchResults(true);
                                        }
                                    }}
                                />

                                {/* Resultados de búsqueda */}
                                {showSearchResults && searchResults.length > 0 && (
                                    <div className="position-absolute w-100 bg-white border border-top-0 rounded-bottom shadow-lg dropdown-menu-custom">
                                        <div className="p-3">
                                            <div className="d-flex justify-content-between align-items-center mb-3 w-100">
                                                <small className="text-muted fw-semibold">

                                                    Tickets encontrados ({searchResults.length})
                                                </small>
                                                <button
                                                    className="btn btn-sm btn-outline-secondary ms-3"
                                                    onClick={closeSearchResults}
                                                    title="Cerrar resultados"
                                                >
                                                    <span>X</span>
                                                </button>
                                            </div>
                                            {searchResults.map((ticket) => (
                                                <div
                                                    key={ticket.id}
                                                    className="search-result-item p-2 border-bottom cursor-pointer"
                                                    onClick={() => selectTicketFromSearch(ticket)}
                                                    onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--ct-gray-100)'}
                                                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                                                >
                                                    <div className="d-flex justify-content-between align-items-start">
                                                        <div className="flex-grow-1">
                                                            <div className="fw-semibold text-primary">#{ticket.id}</div>
                                                            <div className="text-dark">{ticket.titulo}</div>
                                                            <small className="text-muted">
                                                                {ticket.descripcion.length > 60
                                                                    ? `${ticket.descripcion.substring(0, 60)}...`
                                                                    : ticket.descripcion
                                                                }
                                                            </small>
                                                        </div>
                                                        <div className="ms-2">
                                                            <span className={`badge ${ticket.estado && ticket.estado.toLowerCase() === 'solucionado' ? 'bg-success' :
                                                                ticket.estado && ticket.estado.toLowerCase() === 'en_proceso' ? 'bg-warning' :
                                                                    ticket.estado && ticket.estado.toLowerCase() === 'en_espera' ? 'bg-info' :
                                                                        'bg-primary'
                                                                }`}>
                                                                {ticket.estado}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="d-flex align-items-center gap-3">
                            {/* Botón de sincronizar */}
                            <button
                                className="btn btn-outline-primary d-flex align-items-center gap-2"
                                onClick={async () => {
                                    try {
                                        console.log('🔄 Iniciando sincronización desde ClientePage...');
                                        // Llamar a actualizarTickets para recargar los datos
                                        await actualizarTickets();
                                        console.log('✅ Sincronización completada desde ClientePage');
                                    } catch (error) {
                                        console.error('❌ Error en sincronización desde ClientePage:', error);
                                    }
                                }}
                                title="Sincronizar datos"
                                style={{
                                    borderColor: 'var(--ct-primary)',
                                    color: 'var(--ct-primary)',
                                    fontSize: '0.9rem',
                                    fontWeight: '500',
                                    padding: '0.5rem 1rem',
                                    borderRadius: '0.5rem',
                                    transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.backgroundColor = 'var(--ct-primary)';
                                    e.target.style.color = 'white';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.backgroundColor = 'transparent';
                                    e.target.style.color = 'var(--ct-primary)';
                                }}
                            >
                                <i className="fas fa-sync-alt"></i>
                                <span>Sincronizar</span>
                            </button>

                            {/* Dropdown del usuario */}
                            <div className="position-relative dropdown">
                                <button
                                    className="btn btn-link d-flex align-items-center gap-2 text-decoration-none"
                                    onClick={() => {
                                        console.log('ClientePage - Dropdown toggle clicked, current state:', showUserDropdown);
                                        setShowUserDropdown(!showUserDropdown);
                                        console.log('ClientePage - Dropdown state set to:', !showUserDropdown);
                                    }}
                                >
                                    {userData?.url_imagen ? (
                                        <img
                                            src={userData.url_imagen}
                                            alt="Avatar"
                                            className="avatar-header-normal rounded-circle"
                                        />
                                    ) : (
                                        <div className="avatar-header-normal bg-primary d-flex align-content-center rounded-circle">
                                            <i className="fa-solid fa-user fa-xl text-white text-center"></i>
                                        </div>
                                    )}
                                    <span className="fw-semibold">
                                        {userData?.nombre === 'Pendiente' ? 'Cliente' : userData?.nombre}
                                    </span>
                                    <i className="fas fa-chevron-down"></i>
                                </button>

                                {showUserDropdown && (
                                    <>
                                        {console.log('ClientePage - Rendering dropdown, showUserDropdown:', showUserDropdown)}
                                        <div className="position-absolute end-0 mt-2 bg-white border rounded shadow-lg dropdown-menu-min-width" style={{ zIndex: 9999, minWidth: '200px' }}>
                                            <div className="p-3 border-bottom">
                                                <div className="fw-semibold">
                                                    {userData?.nombre === 'Pendiente' ? 'Cliente' : userData?.nombre}
                                                </div>
                                                <small className="text-muted">Cliente</small>
                                            </div>
                                            <div className="p-2">
                                                <button
                                                    className="btn btn-link w-100 text-start d-flex align-items-center gap-2"
                                                    style={{ textDecoration: 'none' }}
                                                    onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                                                    onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
                                                    onClick={() => {
                                                        console.log('ClientePage - Mi Perfil button clicked');
                                                        changeView('profile');
                                                        setShowUserDropdown(false);
                                                        console.log('ClientePage - Dropdown closed, view changed to profile');
                                                    }}
                                                >
                                                    <i className="fas fa-user-edit"></i>
                                                    Mi Perfil
                                                </button>
                                                <button
                                                    className="btn btn-link w-100 text-start d-flex align-items-center gap-2"
                                                    style={{ textDecoration: 'none' }}
                                                    onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                                                    onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
                                                    onClick={() => {
                                                        navigate('/');
                                                        setShowUserDropdown(false);
                                                    }}
                                                >
                                                    <i className="fas fa-home"></i>
                                                    Inicio
                                                </button>
                                                <div className="d-flex align-items-center justify-content-between p-2">
                                                    <span className="small">Modo Oscuro</span>
                                                    <div className="form-check form-switch">
                                                        <input
                                                            className="form-check-input"
                                                            type="checkbox"
                                                            checked={isDarkMode}
                                                            onChange={toggleTheme}
                                                        />
                                                    </div>
                                                </div>
                                                <hr className="my-2" />
                                                <button
                                                    className="btn btn-link w-100 text-start text-danger d-flex align-items-center gap-2"
                                                    onClick={logout}
                                                >
                                                    <i className="fas fa-sign-out-alt"></i>
                                                    Cerrar Sesión
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Contenido del dashboard */}
                <div className="p-4">
                    {error && (
                        <div className="alert alert-danger" role="alert">
                            {error}
                        </div>
                    )}

                    {/* Dashboard View */}
                    {activeView === 'dashboard' && (
                        <ClienteDashboard
                            tickets={tickets}
                            changeView={changeView}
                        />
                    )}

                    {/* Tickets View */}
                    {activeView === 'tickets' && (
                        <ClienteTicketsList
                            tickets={tickets}
                            loading={loading}
                            filterEstado={filterEstado}
                            filterAsignado={filterAsignado}
                            filterPrioridad={filterPrioridad}
                            showFilterDropdown={showFilterDropdown}
                            setShowFilterDropdown={setShowFilterDropdown}
                            setFilterEstado={setFilterEstado}
                            setFilterAsignado={setFilterAsignado}
                            setFilterPrioridad={setFilterPrioridad}
                            applyFilters={applyFilters}
                            clearFilters={clearFilters}
                            getFilteredTickets={getFilteredTickets}
                            expandedTickets={expandedTickets}
                            toggleTicketExpansion={toggleTicketExpansion}
                            solicitudesReapertura={solicitudesReapertura}
                            ticketsConRecomendaciones={ticketsConRecomendaciones}
                            changeView={changeView}
                            setSelectedTicketId={setSelectedTicketId}
                            tieneAnalistaAsignado={tieneAnalistaAsignado}
                            getAnalistaAsignado={getAnalistaAsignado}
                            generarRecomendacion={generarRecomendacion}
                            cerrarTicket={cerrarTicket}
                            solicitarReapertura={solicitarReapertura}
                            navigate={navigate}
                        />
                    )}

                    {/* Create Ticket View */}
                    {activeView === 'create' && (
                        <ClienteTicketForm
                            crearTicket={crearTicket}
                            handleImageUpload={handleImageUpload}
                            handleImageRemove={handleImageRemove}
                            ticketImageUrl={ticketImageUrl}
                            changeView={changeView}
                        />
                    )}

                    {/* Profile View */}
                    {activeView === 'profile' && (
                        <ClienteProfile 
                            infoData={infoData}
                            handleInfoChange={handleInfoChange}
                            handleLocationChange={handleLocationChange}
                            handleClienteImageUpload={handleClienteImageUpload}
                            handleClienteImageRemove={handleClienteImageRemove}
                            clienteImageUrl={clienteImageUrl}
                            userData={userData}
                            updateInfo={updateInfo}
                            updatingInfo={updatingInfo}
                            setShowInfoForm={setShowInfoForm}
                        />
                    )}

                    {/* Chat View */}
                    {activeView === 'chat' && (
                        <ClienteChat 
                            tickets={tickets}
                            changeView={changeView}
                            setSelectedTicketId={setSelectedTicketId}
                            tieneAnalistaAsignado={tieneAnalistaAsignado}
                            getAnalistaAsignado={getAnalistaAsignado}
                            getFechaAsignacion={getFechaAsignacion}
                            getEstadoColor={getEstadoColor}
                            getPrioridadColor={getPrioridadColor}
                            setSelectedTicketImages={setSelectedTicketImages}
                            setSelectedImageIndex={setSelectedImageIndex}
                            solicitudesReapertura={solicitudesReapertura}
                            cerrarTicket={cerrarTicket}
                            solicitarReapertura={solicitarReapertura}
                        />
                    )}


                    {/* VerTicketHD View */}
                    {
                        (() => {
                            // console.log('VerTicketHD render check:', {
                            //     activeView,
                            //     startsWithTicket: activeView.startsWith('ticket-'),
                            //     selectedTicketId,
                            //     shouldRender: activeView.startsWith('ticket-') && selectedTicketId
                            // });
                            return activeView.startsWith('ticket-') && selectedTicketId;
                        })() && (
                            <VerTicketHDCliente
                                ticketId={selectedTicketId}
                                tickets={tickets}
                                ticketsConRecomendaciones={ticketsConRecomendaciones}
                                onBack={() => changeView('tickets')}
                            />
                        )
                    }

                    {/* Comentarios View */}
                    {
                        activeView.startsWith('comentarios-') && selectedTicketId && (
                            <ComentariosTicketEmbedded
                                ticketId={selectedTicketId}
                                onBack={() => changeView('tickets')}
                            />
                        )
                    }

                    {/* Chat View */}
                    {
                        activeView.startsWith('chat-') && selectedTicketId && (
                            <ChatAnalistaClienteEmbedded
                                ticketId={selectedTicketId}
                                onBack={() => changeView('tickets')}
                            />
                        )
                    }

                    {/* Recomendación IA View */}
                    {
                        activeView.startsWith('recomendacion-') && selectedTicketId && (
                            <RecomendacionVistaEmbedded
                                ticketId={selectedTicketId}
                                onBack={() => changeView('tickets')}
                            />
                        )
                    }

                    {/* Identificar Imagen View */}
                    {
                        activeView.startsWith('identificar-') && selectedTicketId && (
                            <IdentificarImagenEmbedded
                                ticketId={selectedTicketId}
                                onBack={() => changeView('tickets')}
                            />
                        )
                    }

                    {/* Modal de imágenes tipo carrusel */}
                    {
                        selectedTicketImages && (
                            <div className="modal fade show" style={{ display: 'block', backgroundColor: 'transparent' }} tabIndex="-1" onClick={() => setSelectedTicketImages(null)}>
                                <div className="modal-dialog modal-dialog-centered modal-md" onClick={e => e.stopPropagation()}>
                                    <div className="modal-content">
                                        <div className="modal-header">
                                            <h5 className="modal-title">Vista previa</h5>
                                            <button type="button" className="btn-close" onClick={() => setSelectedTicketImages(null)}></button>
                                        </div>
                                        <div className="modal-body text-center">
                                            <div className="position-relative">
                                                <img src={selectedTicketImages[selectedImageIndex]} alt={`img-${selectedImageIndex}`} className="img-fluid rounded" style={{ maxHeight: '400px', objectFit: 'contain' }} />
                                                {selectedTicketImages.length > 1 && (
                                                    <>
                                                        <button className="btn btn-secondary position-absolute top-50 start-0 translate-middle-y" style={{ zIndex: 2 }} onClick={() => setSelectedImageIndex((prev) => (prev - 1 + selectedTicketImages.length) % selectedTicketImages.length)}>‹</button>
                                                        <button className="btn btn-secondary position-absolute top-50 end-0 translate-middle-y" style={{ zIndex: 2 }} onClick={() => setSelectedImageIndex((prev) => (prev + 1) % selectedTicketImages.length)}>›</button>
                                                    </>
                                                )}
                                            </div>
                                            <div className="mt-2">
                                                {selectedTicketImages.map((_, idx) => (
                                                    <span key={idx} className={`mx-1 rounded-circle ${idx === selectedImageIndex ? 'bg-primary' : 'bg-secondary'}`} style={{ display: 'inline-block', width: '10px', height: '10px', cursor: 'pointer' }} onClick={() => setSelectedImageIndex(idx)}></span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-backdrop fade show" style={{ zIndex: 0 }} onClick={() => setSelectedTicketImages(null)}></div>
                            </div>
                        )}
                </div>
            </div>
        </div>
    );
}

export default ClientePage;
