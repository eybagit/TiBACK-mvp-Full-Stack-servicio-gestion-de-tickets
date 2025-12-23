/**
 * @fileoverview Middleware de debugging para WebSocket
 * 
 * Proporciona herramientas de logging y monitoreo de eventos WebSocket
 * para facilitar el debugging en desarrollo. Solo activo en modo DEV.
 * 
 * @module utils/websocket-debug
 */

/**
 * Logger de eventos WebSocket para desarrollo
 * 
 * Rastrea conexiones, eventos, desconexiones y estadísticas útiles
 * para debugging. Solo funciona en modo desarrollo.
 */
class WebSocketDebugger {
    constructor() {
        this.enabled = import.meta.env.DEV;
        this.eventCounts = {};
        this.connectionStartTime = null;
        this.totalEvents = 0;
        this.lastEventTime = null;
    }
    
    /**
     * Log inicio de conexión
     * @param {string} url - URL del servidor WebSocket
     */
    logConnection(url) {
        if (!this.enabled) return;
        this.connectionStartTime = Date.now();
        console.log(`%c[WebSocket] 🔌 Connecting to ${url}...`, 'color: #3498db; font-weight: bold');
    }
    
    /**
     * Log conexión exitosa
     */
    logConnected() {
        if (!this.enabled) return;
        const duration = Date.now() - this.connectionStartTime;
        console.log(
            `%c[WebSocket] ✅ Connected in ${duration}ms`, 
            'color: #2ecc71; font-weight: bold'
        );
    }
    
    /**
     * Log evento recibido
     * @param {string} eventName - Nombre del evento
     * @param {Object} data - Datos del evento
     */
    logEvent(eventName, data) {
        if (!this.enabled) return;
        
        this.eventCounts[eventName] = (this.eventCounts[eventName] || 0) + 1;
        this.totalEvents++;
        this.lastEventTime = Date.now();
        
        console.log(
            `%c[WebSocket] 📩 Event: ${eventName}`, 
            'color: #9b59b6',
            `(#${this.totalEvents})`,
            data
        );
    }
    
    /**
     * Log desconexión
     * @param {string} reason - Razón de la desconexión
     */
    logDisconnect(reason) {
        if (!this.enabled) return;
        
        if (this.connectionStartTime) {
            const duration = Date.now() - this.connectionStartTime;
            const minutes = Math.floor(duration / 60000);
            const seconds = Math.floor((duration % 60000) / 1000);
            
            console.log(
                `%c[WebSocket] ❌ Disconnected after ${minutes}m ${seconds}s`, 
                'color: #e74c3c; font-weight: bold',
                { 
                    reason, 
                    eventsReceived: this.totalEvents,
                    eventBreakdown: this.eventCounts 
                }
            );
        } else {
            console.log(
                `%c[WebSocket] ❌ Disconnected`, 
                'color: #e74c3c; font-weight: bold',
                { reason }
            );
        }
    }
    
    /**
     * Log intento de reconexión
     * @param {number} attempt - Número de intento
     * @param {number} delay - Delay en ms
     */
    logReconnectAttempt(attempt, delay) {
        if (!this.enabled) return;
        console.log(
            `%c[WebSocket] 🔄 Reconnecting in ${delay/1000}s (attempt ${attempt})...`, 
            'color: #f39c12; font-weight: bold'
        );
    }
    
    /**
     * Log reconexión exitosa
     * @param {number} attempts - Número de intentos que tomó
     */
    logReconnected(attempts) {
        if (!this.enabled) return;
        console.log(
            `%c[WebSocket] ✅ Reconnected successfully after ${attempts} attempt(s)`, 
            'color: #2ecc71; font-weight: bold'
        );
    }
    
    /**
     * Log error de reconexión
     */
    logReconnectFailed() {
        if (!this.enabled) return;
        console.error(
            `%c[WebSocket] ⚠️ Failed to reconnect after maximum attempts`, 
            'color: #e74c3c; font-weight: bold'
        );
    }
    
    /**
     * Obtener estadísticas de conexión
     * @returns {Object} Estadísticas
     */
    getStats() {
        return {
            totalEvents: this.totalEvents,
            eventCounts: { ...this.eventCounts },
            uptime: this.connectionStartTime 
                ? Date.now() - this.connectionStartTime 
                : 0,
            lastEventTime: this.lastEventTime
        };
    }
    
    /**
     * Resetear contadores
     */
    reset() {
        this.eventCounts = {};
        this.totalEvents = 0;
        this.lastEventTime = null;
        // No resetear connectionStartTime para mantener uptime
    }
    
    /**
     * Imprimir estadísticas en consola
     */
    printStats() {
        if (!this.enabled) return;
        
        const stats = this.getStats();
        console.group('%c[WebSocket] 📊 Statistics', 'color: #3498db; font-weight: bold');
        console.log('Total Events:', stats.totalEvents);
        console.log('Event Breakdown:', stats.eventCounts);
        console.log('Uptime:', `${Math.floor(stats.uptime / 1000)}s`);
        console.groupEnd();
    }
}

// Instancia singleton
export const wsDebugger = new WebSocketDebugger();

// Exponer en window para debugging manual (solo dev)
if (import.meta.env.DEV) {
    window.__wsDebugger = wsDebugger;
}
