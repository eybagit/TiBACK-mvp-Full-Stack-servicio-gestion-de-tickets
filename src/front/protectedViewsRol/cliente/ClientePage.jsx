import React from 'react';
import { SideBarCentral } from '../../components/SideBarCentral';
import { VerTicketHDCliente } from './verTicketHDcliente';
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
import ClienteImageModal from './components/ClienteImageModal';
import ClienteHeader from './components/ClienteHeader';

// Custom hook que encapsula toda la lógica
import useClientePage from './hooks/useClientePage';

/**
 * ClientePage - Página principal del panel de cliente
 * Este componente solo se encarga de la presentación (JSX).
 * Toda la lógica está en el hook useClientePage.
 */
function ClientePage() {
    // Usar el custom hook para obtener todos los estados y funciones
    const {
        // Modal de imágenes
        selectedTicketImages, setSelectedTicketImages,
        selectedImageIndex, setSelectedImageIndex,

        // Imágenes
        ticketImageUrl, setTicketImageUrl,
        clienteImageUrl,
        handleImageUpload, handleImageRemove,
        handleClienteImageUpload, handleClienteImageRemove,

        // Navegación y store
        navigate, logout,

        // Tickets
        tickets, loading, error,
        ticketsConRecomendaciones,
        solicitudesReapertura,

        // Funciones de tickets
        actualizarTickets, crearTicket, cerrarTicket,
        solicitarReapertura, generarRecomendacion,
        toggleTicketForm, showTicketForm,
        getFilteredTickets,

        // Usuario
        userData,
        infoData,
        showInfoForm, setShowInfoForm,
        updatingInfo,
        updateInfo, handleInfoChange, handleLocationChange,

        // Utilidades de estado
        getEstadoColor, getPrioridadColor,
        tieneAnalistaAsignado, getAnalistaAsignado, getFechaAsignacion,

        // UI
        sidebarHidden,
        activeView,
        showUserDropdown, setShowUserDropdown,
        isDarkMode,

        // Búsqueda
        searchQuery,
        searchResults,
        showSearchResults, setShowSearchResults,

        // Funciones UI
        toggleSidebar, changeView, toggleTheme,
        handleSearch, selectTicketFromSearch, closeSearchResults,

        // Filtros
        filterEstado, setFilterEstado,
        filterPrioridad, setFilterPrioridad,
        filterAsignado, setFilterAsignado,
        showFilterDropdown, setShowFilterDropdown,
        applyFilters, clearFilters,
        expandedTickets, toggleTicketExpansion,

        // Ticket seleccionado
        selectedTicketId, setSelectedTicketId,
    } = useClientePage();

    // Mostrar loading
    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center loading-full-height">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Cargando...</span>
                </div>
            </div>
        );
    }

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
                <ClienteHeader
                    sidebarHidden={sidebarHidden}
                    toggleSidebar={toggleSidebar}
                    searchQuery={searchQuery}
                    handleSearch={handleSearch}
                    searchResults={searchResults}
                    showSearchResults={showSearchResults}
                    setShowSearchResults={setShowSearchResults}
                    closeSearchResults={closeSearchResults}
                    selectTicketFromSearch={selectTicketFromSearch}
                    getEstadoColor={getEstadoColor}
                    actualizarTickets={actualizarTickets}
                    userData={userData}
                    showUserDropdown={showUserDropdown}
                    setShowUserDropdown={setShowUserDropdown}
                    changeView={changeView}
                    navigate={navigate}
                    isDarkMode={isDarkMode}
                    toggleTheme={toggleTheme}
                    logout={logout}
                />

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
                            selectedTicketId={selectedTicketId}
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
                            ticketImageUrl={ticketImageUrl}
                            handleImageUpload={handleImageUpload}
                            handleImageRemove={handleImageRemove}
                            setTicketImageUrl={setTicketImageUrl}
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
                    {activeView.startsWith('ticket-') && selectedTicketId && (
                        <VerTicketHDCliente
                            ticketId={selectedTicketId}
                            tickets={tickets}
                            ticketsConRecomendaciones={ticketsConRecomendaciones}
                            onBack={() => changeView('tickets')}
                        />
                    )}

                    {/* Comentarios View */}
                    {activeView.startsWith('comentarios-') && selectedTicketId && (
                        <ComentariosTicketEmbedded
                            ticketId={selectedTicketId}
                            onBack={() => changeView('tickets')}
                        />
                    )}

                    {/* Chat Analista View */}
                    {activeView.startsWith('chat-') && selectedTicketId && (
                        <ChatAnalistaClienteEmbedded
                            ticketId={selectedTicketId}
                            onBack={() => changeView('tickets')}
                        />
                    )}

                    {/* Recomendación IA View */}
                    {activeView.startsWith('recomendacion-') && selectedTicketId && (
                        <RecomendacionVistaEmbedded
                            ticketId={selectedTicketId}
                            onBack={() => changeView('tickets')}
                        />
                    )}

                    {/* Identificar Imagen View */}
                    {activeView.startsWith('identificar-') && selectedTicketId && (
                        <IdentificarImagenEmbedded
                            ticketId={selectedTicketId}
                            onBack={() => changeView('tickets')}
                        />
                    )}

                    {/* Modal de imágenes tipo carrusel */}
                    <ClienteImageModal
                        selectedTicketImages={selectedTicketImages}
                        selectedImageIndex={selectedImageIndex}
                        setSelectedTicketImages={setSelectedTicketImages}
                        setSelectedImageIndex={setSelectedImageIndex}
                    />
                </div>
            </div>
        </div>
    );
}

export default ClientePage;
