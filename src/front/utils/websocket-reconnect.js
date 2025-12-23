/**
 * @fileoverview Utilidades de reconexión automática para WebSocket
 * 
 * Proporciona lógica de reconexión inteligente con exponential backoff
 * para mejorar la experiencia del usuario cuando se pierde la conexión.
 * 
 * @module utils/websocket-reconnect
 */

/**
 * Calcular delay para reconexión con exponential backoff
 * 
 * Estrategia:
 * - Intento 1: 1s
 * - Intento 2: 2s
 * - Intento 3: 4s
 * - Intento 4: 8s
 * - Intento 5: 16s
 * - Intento 6+: 30s (máximo)
 * 
 * @param {number} attemptNumber - Número de intento (1-based)
 * @returns {number} Delay en milisegundos
 */
export function calculateBackoffDelay(attemptNumber) {
    const baseDelay = 1000; // 1 segundo
    const maxDelay = 30000; // 30 segundos
    const delay = baseDelay * Math.pow(2, attemptNumber - 1);
    return Math.min(delay, maxDelay);
}

/**
 * Gestor de reconexión con límite de intentos
 * 
 * Maneja la lógica de reconexión automática, tracking de intentos,
 * y scheduling con exponential backoff.
 */
export class ReconnectionManager {
    /**
     * @param {number} maxAttempts - Número máximo de intentos de reconexión
     */
    constructor(maxAttempts = 10) {
        this.maxAttempts = maxAttempts;
        this.currentAttempt = 0;
        this.reconnectTimer = null;
        this.isReconnecting = false;
    }
    
    /**
     * Programar intento de reconexión
     * 
     * @param {Function} connectFn - Función que ejecuta la conexión
     * @param {Function} onAttempt - Callback (attempt, delay) cuando se programa un intento
     * @returns {boolean} true si se programó, false si se alcanzó el máximo
     */
    scheduleReconnect(connectFn, onAttempt) {
        if (this.currentAttempt >= this.maxAttempts) {
            console.error('[WebSocket] Max reconnection attempts reached');
            this.isReconnecting = false;
            return false;
        }
        
        this.currentAttempt++;
        this.isReconnecting = true;
        const delay = calculateBackoffDelay(this.currentAttempt);
        
        if (onAttempt) {
            onAttempt(this.currentAttempt, delay);
        }
        
        this.reconnectTimer = setTimeout(() => {
            connectFn();
        }, delay);
        
        return true;
    }
    
    /**
     * Resetear estado de reconexión
     * Llamar cuando se conecta exitosamente
     */
    reset() {
        this.currentAttempt = 0;
        this.isReconnecting = false;
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
    }
    
    /**
     * Cancelar reconexión en progreso
     */
    cancel() {
        this.reset();
    }
    
    /**
     * Obtener estado actual
     * @returns {Object} Estado de reconexión
     */
    getStatus() {
        return {
            isReconnecting: this.isReconnecting,
            currentAttempt: this.currentAttempt,
            maxAttempts: this.maxAttempts,
            hasReachedMax: this.currentAttempt >= this.maxAttempts
        };
    }
}
