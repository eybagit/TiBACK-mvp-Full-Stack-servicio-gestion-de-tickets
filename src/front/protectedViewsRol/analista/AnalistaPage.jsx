import React from 'react';
import { SideBarCentral } from '../../components/SideBarCentral';
import VerTicketHDanalista from './verTicketHDanalista';
import ComentariosTicketEmbedded from '../../components/ComentariosTicketEmbedded';
import ChatAnalistaClienteEmbedded from '../../components/ChatAnalistaClienteEmbedded';
import ChatSupervisorAnalistaEmbedded from '../../components/ChatSupervisorAnalistaEmbedded';
import RecomendacionVistaEmbedded from '../../components/RecomendacionVistaEmbedded';
import IdentificarImagenEmbedded from '../../components/IdentificarImagenEmbedded';

// Hooks modularizados
import { useAnalistaPage } from './hooks';

// Componentes de presentación modularizados
import {
    AnalistaHeader,
    AnalistaDashboard,
    AnalistaTicketsList,
    AnalistaProfile
} from './components';

/**
 * AnalistaPage - Página principal del analista
 * Refactorizada para cumplir con el límite de 500 líneas (modular.md)
 * La lógica está en hooks/, la presentación en components/
 */
function AnalistaPage() {
    // Hook orquestador que centraliza toda la lógica
    const {
        // Core
        store, navigate, logout,
        // Estados UI
        sidebarHidden, activeView, setActiveView,
        searchQuery, setSearchQuery,
        searchResults,
        showSearchResults, setShowSearchResults,
        showUserDropdown, setShowUserDropdown,
        isDarkMode,
        // Estados datos
        tickets, loading, error, setError,
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

    // Loading state
    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center full-height">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Cargando...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="hyper-layout d-flex">
            <SideBarCentral
                sidebarHidden={sidebarHidden}
                activeView={activeView}
                changeView={(view) => {
                    setActiveView(view);
                    if (view === 'dashboard' || view === 'tickets' || view === 'profile') {
                        setModalTicketId(null);
                    }
                }}
            />
            <div className={`hyper-main-content flex-grow-1 ${sidebarHidden ? 'sidebar-hidden' : ''}`}>
                {/* Header */}
                <AnalistaHeader
                    sidebarHidden={sidebarHidden}
                    toggleSidebar={toggleSidebar}
                    searchQuery={searchQuery}
                    handleSearch={handleSearch}
                    setSearchQuery={setSearchQuery}
                    searchResults={searchResults}
                    showSearchResults={showSearchResults}
                    setShowSearchResults={setShowSearchResults}
                    closeSearchResults={closeSearchResults}
                    selectTicketFromSearch={selectTicketFromSearch}
                    actualizarTickets={actualizarTickets}
                    userData={userData}
                    store={store}
                    showUserDropdown={showUserDropdown}
                    setShowUserDropdown={setShowUserDropdown}
                    setActiveView={setActiveView}
                    isDarkMode={isDarkMode}
                    toggleTheme={toggleTheme}
                    navigate={navigate}
                    logout={logout}
                />

                <div className="p-4">
                    {error && (
                        <div className="alert alert-danger" role="alert">
                            {error}
                        </div>
                    )}

                    {/* Dashboard View */}
                    {activeView === 'dashboard' && (
                        <AnalistaDashboard
                            tickets={tickets}
                            setActiveView={setActiveView}
                        />
                    )}

                    {/* Tickets View */}
                    {activeView === 'tickets' && (
                        <AnalistaTicketsList
                            tickets={tickets}
                            expandedTickets={expandedTickets}
                            ticketsSolicitudReapertura={ticketsSolicitudReapertura}
                            toggleTicketExpansion={toggleTicketExpansion}
                            openVerHD={openVerHD}
                            openComments={openComments}
                            openChat={openChat}
                            openSupervisorChat={openSupervisorChat}
                            setModalTicketId={setModalTicketId}
                            setActiveView={setActiveView}
                            iniciarTrabajo={iniciarTrabajo}
                            marcarComoResuelto={marcarComoResuelto}
                            escalarTicket={escalarTicket}
                        />
                    )}
                </div>

                {/* Profile View */}
                {activeView === 'profile' && (
                    <AnalistaProfile
                        infoData={infoData}
                        handleInfoChange={handleInfoChange}
                        error={error}
                        setActiveView={setActiveView}
                        setError={setError}
                        setInfoData={setInfoData}
                        updateInfo={updateInfo}
                        updatingInfo={updatingInfo}
                    />
                )}

                {/* Comentarios View */}
                {activeView.startsWith('comentarios-') && modalTicketId && (
                    <ComentariosTicketEmbedded
                        ticketId={modalTicketId}
                        onBack={() => {
                            setActiveView('tickets');
                            setModalTicketId(null);
                        }}
                    />
                )}

                {/* Chat View */}
                {activeView.startsWith('chat-') && modalTicketId && (
                    <ChatAnalistaClienteEmbedded
                        ticketId={modalTicketId}
                        onBack={() => {
                            setActiveView('tickets');
                            setModalTicketId(null);
                        }}
                    />
                )}

                {/* Supervisor Chat View */}
                {activeView.startsWith('supervisor-chat-') && modalTicketId && (
                    <ChatSupervisorAnalistaEmbedded
                        ticketId={modalTicketId}
                        onBack={() => {
                            setActiveView('tickets');
                            setModalTicketId(null);
                        }}
                    />
                )}

                {/* Recomendación IA View */}
                {activeView.startsWith('recomendacion-') && modalTicketId && (
                    <RecomendacionVistaEmbedded
                        ticketId={modalTicketId}
                        onBack={() => {
                            setActiveView('tickets');
                            setModalTicketId(null);
                        }}
                    />
                )}

                {/* Identificar Imagen View */}
                {activeView.startsWith('identificar-') && modalTicketId && (
                    <IdentificarImagenEmbedded
                        ticketId={modalTicketId}
                        onBack={() => {
                            setActiveView('tickets');
                            setModalTicketId(null);
                        }}
                    />
                )}

                {/* Ticket View */}
                {activeView.startsWith('ticket-') && modalTicketId && (
                    <VerTicketHDanalista
                        ticketId={modalTicketId}
                        tickets={tickets}
                        onBack={() => {
                            setActiveView('tickets');
                            setModalTicketId(null);
                        }}
                    />
                )}
            </div>

            {/* Modal overlay para ticket (fallback) */}
            {modalTicketId &&
                !activeView.startsWith('chat-') &&
                !activeView.startsWith('supervisor-chat-') &&
                !activeView.startsWith('comentarios-') &&
                !activeView.startsWith('recomendacion-') &&
                !activeView.startsWith('identificar-') &&
                !activeView.startsWith('ticket-') && (
                    <div className="analista-modal-overlay">
                        <div className="analista-modal-content">
                            <button
                                className="btn btn-sm btn-outline-secondary mb-2"
                                onClick={() => setModalTicketId(null)}
                            >
                                Cerrar
                            </button>
                            <VerTicketHDanalista
                                ticketId={modalTicketId}
                                tickets={tickets}
                                onBack={() => setModalTicketId(null)}
                            />
                        </div>
                    </div>
                )}
        </div>
    );
}

export default AnalistaPage;
