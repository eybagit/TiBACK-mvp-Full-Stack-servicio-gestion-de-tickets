/**
 * useComentariosWebSocket.js
 * Hook para manejo de WebSocket en comentarios
 * Parte de la modularización de ComentariosTicket.jsx
 */

import { useEffect } from 'react';

/**
 * Hook para manejo de WebSocket y sincronización
 */
export const useComentariosWebSocket = ({
    ticketId,
    store,
    joinTicketRoom,
    leaveTicketRoom,
    cargarDatos,
    setSincronizando
}) => {
    // Efecto para unirse al room del ticket
    useEffect(() => {
        if (ticketId && store.websocket.socket && store.websocket.connected) {
            // Unirse al room del ticket
            joinTicketRoom(store.websocket.socket, parseInt(ticketId));

            const socket = store.websocket.socket;

            // Escuchar nuevos comentarios del room del ticket
            const handleNuevoComentario = (data) => {
                console.log('💬 NUEVO COMENTARIO EN ROOM DEL TICKET:', data);
                if (data.comentario && data.comentario.id_ticket === parseInt(ticketId)) {
                    setSincronizando(true);
                    cargarDatos(false).finally(() => setSincronizando(false));
                }
            };

            // Escuchar actualizaciones del ticket en el room
            const handleTicketActualizado = (data) => {
                console.log('🔄 TICKET ACTUALIZADO EN ROOM:', data);
                if (data.ticket_id === parseInt(ticketId)) {
                    setSincronizando(true);
                    cargarDatos(false).finally(() => setSincronizando(false));
                }
            };

            // Agregar listeners específicos del room
            socket.on('nuevo_comentario', handleNuevoComentario);
            socket.on('ticket_actualizado', handleTicketActualizado);
            socket.on('ticket_asignado', handleTicketActualizado);

            // Cleanup al desmontar
            return () => {
                socket.off('nuevo_comentario', handleNuevoComentario);
                socket.off('ticket_actualizado', handleTicketActualizado);
                socket.off('ticket_asignado', handleTicketActualizado);
                leaveTicketRoom(socket, parseInt(ticketId));
            };
        }
    }, [ticketId, store.websocket.socket, store.websocket.connected, joinTicketRoom, leaveTicketRoom, cargarDatos, setSincronizando]);

    // Escuchar eventos de sincronización total desde el Footer
    useEffect(() => {
        const handleTotalSync = (event) => {
            console.log('🔄 Sincronización total recibida en ComentariosTicket:', event.detail);
            if (event.detail.source === 'footer_sync') {
                cargarDatos(false);
                console.log('✅ Comentarios del ticket actualizados por sincronización total');
            }
        };

        const handleSyncCompleted = (event) => {
            console.log('✅ Sincronización total completada en ComentariosTicket:', event.detail);
        };

        const handleSyncError = (event) => {
            console.error('❌ Error en sincronización total en ComentariosTicket:', event.detail);
        };

        // Escuchar eventos de sincronización
        window.addEventListener('totalSyncTriggered', handleTotalSync);
        window.addEventListener('sync_completed', handleSyncCompleted);
        window.addEventListener('sync_error', handleSyncError);
        window.addEventListener('refresh_comentarios', handleTotalSync);
        window.addEventListener('sync_comentarios', handleTotalSync);
        window.addEventListener('refresh_tickets', handleTotalSync);

        return () => {
            window.removeEventListener('totalSyncTriggered', handleTotalSync);
            window.removeEventListener('sync_completed', handleSyncCompleted);
            window.removeEventListener('sync_error', handleSyncError);
            window.removeEventListener('refresh_comentarios', handleTotalSync);
            window.removeEventListener('sync_comentarios', handleTotalSync);
            window.removeEventListener('refresh_tickets', handleTotalSync);
        };
    }, [cargarDatos]);
};

export default useComentariosWebSocket;
