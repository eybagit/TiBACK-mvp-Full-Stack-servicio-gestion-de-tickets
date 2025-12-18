"""
Script para crear SupervisorPage simplificado usando el hook
"""

# Leer archivo original desde CP#3
with open('proximosPasos/cirugia/backups/SupervisorPage_checkpoint3_2015.jsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Encontrar donde empieza el return (línea 1492)
return_start = None
for i, line in enumerate(lines):
    if "    return (" in line and i > 1400:
        return_start = i
        print(f"Inicio del return encontrado en línea {i + 1}")
        break

# Leer desde return hasta el final
return_lines = lines[return_start:]

# Crear nuevo componente
new_header = '''import React from 'react';
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
    // Usar el hook que contiene toda la lógica
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
        reabrirTicket,
        generarRecomendacion,
        getAvailableActions,
        getSemaforoColor,
        tieneSolicitudReapertura,
        fueEscaladoPorAnalista,
        getEstadoColor,
        getPrioridadColor,
        filteredTickets,
        stats
    } = useSupervisorPage();

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

# Escribir nuevo archivo
with open('src/front/protectedViewsRol/supervisor/SupervisorPage.jsx', 'w', encoding='utf-8') as f:
    f.write(new_header)
    f.writelines(return_lines)

# Contar líneas
with open('src/front/protectedViewsRol/supervisor/SupervisorPage.jsx', 'r', encoding='utf-8') as f:
    new_lines = f.readlines()

print(f"SupervisorPage.jsx: {len(new_lines)} líneas")
print("✅ SupervisorPage.jsx creado con useSupervisorPage hook")
