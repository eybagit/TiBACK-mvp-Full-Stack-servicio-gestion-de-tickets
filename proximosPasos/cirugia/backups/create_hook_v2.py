"""
Script para extraer lógica de ClientePage.jsx a useClientePage.js
Incluye: useState, funciones y useEffect (líneas 22-1350)
"""

# Leer archivo original
with open('src/front/protectedViewsRol/cliente/ClientePage.jsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Líneas de lógica: desde línea 23 hasta línea 1349 (índices 22-1348)
logic_lines = lines[22:1349]  # Después de "function ClientePage() {" hasta antes de "return ("

print(f"Lógica extraída: {len(logic_lines)} líneas")

# Crear el custom hook
hook_header = '''import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useGlobalReducer from '../../../hooks/useGlobalReducer';
import { tokenUtils } from '../../../store';

/**
 * useClientePage - Custom hook que encapsula toda la lógica del componente ClientePage
 * Separa la lógica de la presentación, haciendo el componente más mantenible.
 * 
 * @returns {Object} Estados y funciones necesarios para ClientePage
 */
function useClientePage() {
'''

# Limpiar indentación de la lógica (quitar 4 espacios del inicio)
cleaned_logic = []
for line in logic_lines:
    if line.startswith('    '):
        cleaned_logic.append(line[4:])  # Quitar 4 espacios de indentación
    else:
        cleaned_logic.append(line)

# Agregar el return del hook
hook_return = '''
    // Retornar todos los estados y funciones del hook
    return {
        // Modal de imágenes
        selectedTicketImages, setSelectedTicketImages,
        selectedImageIndex, setSelectedImageIndex,
        
        // Imágenes nuevas
        newTicketImages, setNewTicketImages,
        uploading, setUploading,
        ticketImageUrl, setTicketImageUrl,
        clienteImageUrl, setClienteImageUrl,
        
        // Funciones de imágenes
        handleImageUpload, handleImageRemove,
        handleClienteImageUpload, handleClienteImageRemove,
        
        // Navegación y store
        navigate, store, logout, dispatch,
        connectWebSocket, disconnectWebSocket,
        joinRoom, joinTicketRoom, startRealtimeSync,
        emitCriticalTicketAction, joinCriticalRooms, joinAllCriticalRooms,
        
        // Tickets
        tickets, setTickets, loading, error,
        ticketsConRecomendaciones, setTicketsConRecomendaciones,
        expandedTickets, setExpandedTickets,
        solicitudesReapertura, setSolicitudesReapertura,
        
        // Funciones de tickets
        actualizarTickets, crearTicket, cerrarTicket,
        evaluarTicket, solicitarReapertura, reabrirTicket,
        toggleTicketForm, showTicketForm,
        toggleTicketExpansion, getFilteredTickets,
        
        // Usuario
        userData, setUserData,
        infoData, setInfoData,
        showInfoForm, setShowInfoForm,
        updatingInfo, setUpdatingInfo,
        updateInfo, handleInfoChange, handleLocationChange,
        
        // Utilidades de estado
        getEstadoColor, getPrioridadColor,
        tieneAnalistaAsignado, getAnalistaAsignado, getFechaAsignacion,
        generarRecomendacion,
        
        // UI
        sidebarHidden, setSidebarHidden,
        sidebarCollapsed, setSidebarCollapsed,
        activeView, setActiveView,
        showUserDropdown, setShowUserDropdown,
        isDarkMode, setIsDarkMode,
        
        // Búsqueda
        searchQuery, setSearchQuery,
        searchResults, setSearchResults,
        showSearchResults, setShowSearchResults,
        
        // Funciones UI
        toggleSidebar, changeView, toggleTheme,
        handleSearch, selectTicketFromSearch, closeSearchResults,
        applyFilters, clearFilters,
        
        // Filtros
        filterEstado, setFilterEstado,
        filterPrioridad, setFilterPrioridad,
        
        // Ticket seleccionado
        selectedTicketId, setSelectedTicketId,
    };
}

export default useClientePage;
'''

# Combinar todo
hook_content = hook_header + ''.join(cleaned_logic) + hook_return

# Escribir el hook
with open('src/front/protectedViewsRol/cliente/hooks/useClientePage.js', 'w', encoding='utf-8') as f:
    f.write(hook_content)

hook_lines = len(hook_content.split('\n'))
print(f"✅ useClientePage.js creado: {hook_lines} líneas")
print(f"📁 Ubicación: src/front/protectedViewsRol/cliente/hooks/useClientePage.js")
