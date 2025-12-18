import re

# Leer archivo original
with open('src/front/protectedViewsRol/cliente/ClientePage.jsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Encontrar líneas clave
func_start = 21  # function ClientePage() { está en línea 22 (índice 21)
return_line = None
for i, line in enumerate(lines):
    if '    return (' in line and i > func_start:
        return_line = i
        break

print(f"function ClientePage starts at line: {func_start + 1}")
print(f"return statement at line: {return_line + 1}")

# Extraer lógica (líneas entre function y return)
logic_lines = lines[func_start + 1:return_line]

# Guardar lógica extraída
with open('proximosPasos/cirugia/logica_cliente_full.txt', 'w', encoding='utf-8') as f:
    f.writelines(logic_lines)

print(f"Logic lines extracted: {len(logic_lines)}")

# Ahora crear el custom hook
hook_content = '''import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useGlobalReducer from '../../../hooks/useGlobalReducer';
import { tokenUtils } from '../../../store';

/**
 * useClientePage - Custom hook that encapsulates all the logic for ClientePage
 * This separates the logic from the presentation, making the component more maintainable.
 */
function useClientePage() {
'''

# Agregar la lógica
for line in logic_lines:
    hook_content += line

# Agregar el return del hook con todos los exports
hook_content += '''
    // Return all states and functions needed by the component
    return {
        // Modal de imágenes
        selectedTicketImages, setSelectedTicketImages,
        selectedImageIndex, setSelectedImageIndex,
        // Imágenes
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
        // Recomendaciones
        generarRecomendacion, verificarRecomendaciones,
        // Ticket seleccionado
        selectedTicketId, setSelectedTicketId,
    };
}

export default useClientePage;
'''

# Escribir el hook
with open('src/front/protectedViewsRol/cliente/hooks/useClientePage.js', 'w', encoding='utf-8') as f:
    f.write(hook_content)

print("useClientePage.js created!")
print(f"Hook lines: {len(hook_content.split(chr(10)))}")
