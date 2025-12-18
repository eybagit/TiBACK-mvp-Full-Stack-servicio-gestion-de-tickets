"""
Script para extraer lógica de SupervisorPage.jsx a useSupervisorPage.js
Extrae: líneas 18-1478 (hooks, estados, efectos, funciones)
"""

# Leer archivo
with open('src/front/protectedViewsRol/supervisor/SupervisorPage.jsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

print(f"Líneas originales: {len(lines)}")

# La lógica está después de "export function SupervisorPage() {" (línea 17)
# hasta antes de "const stats = getStats();" (línea 1479)

# Encontrar inicio y fin de la lógica
logic_start = None
logic_end = None

for i, line in enumerate(lines):
    if "export function SupervisorPage()" in line:
        logic_start = i + 1  # La línea después del function declaration
        print(f"Inicio de lógica: línea {i + 2}")
        break

for i, line in enumerate(lines):
    if "const stats = getStats();" in line:
        logic_end = i
        print(f"Fin de lógica: línea {i + 1}")
        break

if logic_start is None or logic_end is None:
    print("❌ No se encontró la lógica del componente")
    exit(1)

# Extraer la lógica (sin la primera línea que tiene el {)
logic_lines = lines[logic_start:logic_end]

# Crear el hook useSupervisorPage.js
hook_header = '''import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useGlobalReducer from '../../../hooks/useGlobalReducer';

/**
 * useSupervisorPage - Hook personalizado con toda la lógica del supervisor
 * Extraído de SupervisorPage.jsx para modularización
 */
export function useSupervisorPage() {
    const navigate = useNavigate();
    const { store, logout, dispatch, connectWebSocket, disconnectWebSocket, joinRoom, joinTicketRoom, startRealtimeSync, emitCriticalTicketAction, joinCriticalRooms, joinAllCriticalRooms } = useGlobalReducer();

'''

hook_footer = '''
    // Retornar todos los estados y funciones necesarios para el componente
    return {
        // Estado
        navigate,
        store,
        logout,
        dispatch,
        connectWebSocket,
        disconnectWebSocket,
        joinRoom,
        joinTicketRoom,
        startRealtimeSync,
        emitCriticalTicketAction,
        joinCriticalRooms,
        joinAllCriticalRooms,
        tickets,
        ticketsCerrados,
        analistas,
        analistasCombinados,
        ticketsCerradosCombinados,
        loading,
        loadingCerrados,
        error,
        showCerrados,
        setShowCerrados,
        showInfoForm,
        setShowInfoForm,
        updatingInfo,
        userData,
        infoData,
        setInfoData,
        ticketsConRecomendaciones,
        expandedTickets,
        sidebarHidden,
        activeView,
        setActiveView,
        showUserDropdown,
        setShowUserDropdown,
        isDarkMode,
        searchQuery,
        setSearchQuery,
        searchResults,
        setSearchResults,
        showSearchResults,
        setShowSearchResults,
        filterEstado,
        setFilterEstado,
        filterAsignado,
        setFilterAsignado,
        filterPrioridad,
        setFilterPrioridad,
        
        // Funciones
        toggleSidebar,
        changeView,
        toggleTheme,
        handleSearch,
        selectTicketFromSearch,
        closeSearchResults,
        toggleTicketExpansion,
        getFilteredTickets,
        handleInfoChange,
        cargarTickets,
        cargarAnalistas,
        cargarTicketsCerrados,
        getStats,
        actualizarTodasLasTablas,
        asignarTicket,
        cerrarTicket,
        reabrirTicket,
        generarRecomendacion,
        escalarTicket,
        agregarComentario,
        handleInfoSubmit,
        setSelectedTicketImages,
        setSelectedImageIndex,
        getAvailableActions,
        getSemaforoColor,
        tieneSolicitudReapertura,
        fueEscaladoPorAnalista,
        getEstadoColor,
        getPrioridadColor,
        filteredTickets: getFilteredTickets(),
        stats: getStats(),
        backendRequest
    };
}

export default useSupervisorPage;
'''

# Procesar la lógica: eliminar referencias a navigate y useGlobalReducer
# porque ya están en el hook header

# Filtrar líneas que ya tenemos en el header
processed_logic = []
skip_next = False
for line in logic_lines:
    # Saltar líneas de navigate y useGlobalReducer que ya están en el header
    if "const navigate = useNavigate();" in line:
        continue
    if "const { store, logout, dispatch," in line:
        continue
    processed_logic.append(line)

# Reducir indentación (el código original tiene 4 espacios de indentación)
def reduce_indent(lines_list, spaces=4):
    result = []
    for line in lines_list:
        if line.startswith(' ' * spaces):
            result.append(line[spaces:])
        else:
            result.append(line)
    return result

processed_logic_reduced = reduce_indent(processed_logic, 4)

# Escribir hook
with open('src/front/protectedViewsRol/supervisor/hooks/useSupervisorPage.js', 'w', encoding='utf-8') as f:
    f.write(hook_header)
    f.writelines(processed_logic_reduced)
    f.write(hook_footer)

print(f"useSupervisorPage.js creado ({len(processed_logic_reduced) + 120} líneas aprox)")

# Ahora actualizar SupervisorPage.jsx para usar el hook
# Nuevo contenido del componente simplificado

new_component = '''import React from 'react';
import { Link } from 'react-router-dom';
import { SideBarCentral } from '../../components/SideBarCentral';
import { DashboardCalidad } from '../../pages/DashboardCalidad';
import VerTicketHDSupervisor from './verTicketHDsupervisor';
import ComentariosTicketEmbedded from '../../components/ComentariosTicketEmbedded';
import ChatSupervisorAnalistaEmbedded from '../../components/ChatSupervisorAnalistaEmbedded';
import RecomendacionVistaEmbedded from '../../components/RecomendacionVistaEmbedded';
import IdentificarImagenEmbedded from '../../components/IdentificarImagenEmbedded';
import SupervisorDashboard from './components/SupervisorDashboard';
import SupervisorHeader from './components/SupervisorHeader';
import SupervisorTicketsList from './components/SupervisorTicketsList';
import { useSupervisorPage } from './hooks/useSupervisorPage';

export function SupervisorPage() {
    const hook = useSupervisorPage();
    
    // Destructurar todo del hook
    const {
        navigate,
        logout,
        tickets,
        ticketsCerrados,
        analistas,
        analistasCombinados,
        ticketsCerradosCombinados,
        loading,
        loadingCerrados,
        error,
        showCerrados,
        setShowCerrados,
        userData,
        infoData,
        ticketsConRecomendaciones,
        expandedTickets,
        sidebarHidden,
        activeView,
        setActiveView,
        showUserDropdown,
        setShowUserDropdown,
        isDarkMode,
        searchQuery,
        setSearchQuery,
        searchResults,
        setSearchResults,
        showSearchResults,
        setShowSearchResults,
        filterEstado,
        setFilterEstado,
        filterAsignado,
        setFilterAsignado,
        filterPrioridad,
        setFilterPrioridad,
        toggleSidebar,
        changeView,
        toggleTheme,
        handleSearch,
        selectTicketFromSearch,
        closeSearchResults,
        toggleTicketExpansion,
        handleInfoChange,
        cargarTicketsCerrados,
        actualizarTodasLasTablas,
        asignarTicket,
        cerrarTicket,
        reabirTicket,
        generarRecomendacion,
        escalarTicket,
        agregarComentario,
        handleInfoSubmit,
        setSelectedTicketImages,
        setSelectedImageIndex,
        getAvailableActions,
        getSemaforoColor,
        tieneSolicitudReapertura,
        fueEscaladoPorAnalista,
        getEstadoColor,
        getPrioridadColor,
        filteredTickets,
        stats
    } = hook;

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center full-height">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Cargando...</span>
                </div>
            </div>
        );
    }

'''

# Encontrar donde empieza el return principal (línea 1492)
return_start = None
for i, line in enumerate(lines):
    if "return (" in line and i > logic_end:
        return_start = i
        print(f"Inicio del return encontrado en línea {i + 1}")
        break

# Tomar desde el return hasta el final
return_content = lines[return_start:]

# Escribir el nuevo componente
with open('src/front/protectedViewsRol/supervisor/SupervisorPage.jsx', 'w', encoding='utf-8') as f:
    f.write(new_component)
    f.writelines(return_content)

# Contar líneas del nuevo archivo
with open('src/front/protectedViewsRol/supervisor/SupervisorPage.jsx', 'r', encoding='utf-8') as f:
    new_lines = f.readlines()

print(f"SupervisorPage.jsx reducido a {len(new_lines)} líneas")
print(f"Líneas removidas del componente: {len(lines) - len(new_lines)}")
print("✅ Lógica extraída exitosamente a useSupervisorPage.js")
