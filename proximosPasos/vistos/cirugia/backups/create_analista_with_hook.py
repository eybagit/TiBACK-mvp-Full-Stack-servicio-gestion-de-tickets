"""
Script para crear AnalistaPage.jsx simplificado usando useAnalistaPage hook
Mantiene el JSX original pero usa el hook para la lógica
"""

# Leer el archivo original
with open('src/front/protectedViewsRol/analista/AnalistaPage.jsx', 'r', encoding='utf-8') as f:
    original = f.read()

# Crear el nuevo contenido con el hook
new_content = '''import React from 'react';
import { useAnalistaPage } from './hooks/useAnalistaPage';
import { SideBarCentral } from '../../components/SideBarCentral';
import VerTicketHDanalista from './verTicketHDanalista';
import ComentariosTicketEmbedded from '../../components/ComentariosTicketEmbedded';
import ChatAnalistaClienteEmbedded from '../../components/ChatAnalistaClienteEmbedded';
import ChatSupervisorAnalistaEmbedded from '../../components/ChatSupervisorAnalistaEmbedded';
import RecomendacionVistaEmbedded from '../../components/RecomendacionVistaEmbedded';
import IdentificarImagenEmbedded from '../../components/IdentificarImagenEmbedded';

function AnalistaPage() {
    const {
        navigate, logout,
        // Estados UI
        sidebarHidden, activeView, setActiveView,
        searchQuery, setSearchQuery,
        searchResults, setSearchResults,
        showSearchResults, setShowSearchResults,
        showUserDropdown, setShowUserDropdown,
        isDarkMode,
        // Estados datos
        tickets, loading, error,
        ticketsSolicitudReapertura, expandedTickets,
        modalTicketId, setModalTicketId,
        userData, showInfoForm, setShowInfoForm,
        updatingInfo, infoData, setInfoData,
        // Funciones UI
        toggleSidebar, toggleTheme,
        handleSearch, closeSearchResults, selectTicketFromSearch,
        toggleTicketExpansion,
        // Funciones de navegación
        openComments, openChat, openSupervisorChat, openVerHD,
        // Funciones de datos
        actualizarTickets, handleInfoChange, updateInfo,
        // Funciones de tickets
        iniciarTrabajo, marcarComoResuelto, escalarTicket, getEstadoColor
    } = useAnalistaPage();

    if (loading) return (
        <div className="d-flex justify-content-center align-items-center full-height">
            <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Cargando...</span>
            </div>
        </div>
    );

'''

# Extraer el JSX desde la línea 665 (return) hasta el final
lines = original.split('\n')

# Encontrar la línea del return (
jsx_start = None
for i, line in enumerate(lines):
    if '    return (' in line and i > 600:
        jsx_start = i
        break

if jsx_start:
    # Tomar desde return hasta export
    jsx_lines = []
    for i in range(jsx_start, len(lines)):
        if lines[i].strip().startswith('export default'):
            break
        jsx_lines.append(lines[i])
    
    new_content += '\n'.join(jsx_lines)
    new_content += '\n}\n\nexport default AnalistaPage;\n'

# Escribir el nuevo archivo
with open('src/front/protectedViewsRol/analista/AnalistaPage.jsx', 'w', encoding='utf-8') as f:
    f.write(new_content)

# Contar líneas
print(f"Líneas originales: {len(lines)}")
print(f"Líneas nuevas: {len(new_content.split(chr(10)))}")
