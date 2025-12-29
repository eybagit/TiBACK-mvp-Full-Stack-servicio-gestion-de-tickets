import React from 'react';
import { SideBarCentral } from '../../components/SideBarCentral';
import { DashboardCalidad } from '../../pages/DashboardCalidad';
import VerTicketHDSupervisor from './verTicketHDsupervisor';
import ComentariosTicketEmbedded from '../../components/ComentariosTicketEmbedded';
import ChatSupervisorAnalistaEmbedded from '../../components/ChatSupervisorAnalistaEmbedded';
import RecomendacionVistaEmbedded from '../../components/RecomendacionVistaEmbedded';
import IdentificarImagenEmbedded from '../../components/IdentificarImagenEmbedded';
import {
    SupervisorDashboard,
    SupervisorHeader,
    SupervisorTicketsList,
    AnalistasView,
    AsignacionesView,
    EscalacionesView,
    SupervisorProfile,
    InfoFormModal
} from './components';
import { useSupervisorPage } from './hooks/useSupervisorPage';

export function SupervisorPage() {
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
        setInfoData,
        ticketsConRecomendaciones,
        expandedTickets,
        sidebarHidden,
        activeView,
        setActiveView,
        showUserDropdown,
        setShowUserDropdown,
        showInfoForm,
        setShowInfoForm,
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
        reasignarTicket,
        cerrarTicket,
        reabrirTicket,
        escalarTicket,
        generarRecomendacion,
        agregarComentario,
        getAvailableActions,
        getSemaforoColor,
        tieneSolicitudReapertura,
        fueEscaladoPorAnalista,
        getEstadoColor,
        getPrioridadColor,
        filteredTickets,
        stats,
        updateInfo,
        updatingInfo,
        actualizarInformacion,
        setSelectedTicketImages,
        setSelectedImageIndex,
        openComments,
        openChat,
        openVerHD,
        openRecomendacion,
        openIdentificar
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

    return (
        <div className="hyper-layout d-flex">
            <SideBarCentral
                sidebarHidden={sidebarHidden}
                activeView={activeView}
                changeView={changeView}
            />

            <div className={`hyper-main-content flex-grow-1 ${sidebarHidden ? 'sidebar-hidden' : ''}`}>
                <SupervisorHeader
                    sidebarHidden={sidebarHidden}
                    toggleSidebar={toggleSidebar}
                    searchQuery={searchQuery}
                    handleSearch={handleSearch}
                    searchResults={searchResults}
                    showSearchResults={showSearchResults}
                    setShowSearchResults={setShowSearchResults}
                    setSearchQuery={setSearchQuery}
                    setSearchResults={setSearchResults}
                    closeSearchResults={closeSearchResults}
                    selectTicketFromSearch={selectTicketFromSearch}
                    actualizarTodasLasTablas={actualizarTodasLasTablas}
                    userData={userData}
                    showUserDropdown={showUserDropdown}
                    setShowUserDropdown={setShowUserDropdown}
                    changeView={changeView}
                    navigate={navigate}
                    isDarkMode={isDarkMode}
                    toggleTheme={toggleTheme}
                    logout={logout}
                />

                <div className="p-4">
                    {error && (
                        <div className="alert alert-danger" role="alert">
                            <i className="fas fa-exclamation-triangle me-2"></i>
                            {error}
                        </div>
                    )}

                    {activeView === 'dashboard' && (
                        <SupervisorDashboard
                            stats={stats}
                            tickets={tickets}
                            changeView={changeView}
                            tieneSolicitudReapertura={tieneSolicitudReapertura}
                        />
                    )}

                    {activeView === 'tickets' && (
                        <SupervisorTicketsList
                            tickets={tickets}
                            filteredTickets={filteredTickets}
                            analistas={analistas}
                            analistasCombinados={analistasCombinados}
                            filterEstado={filterEstado}
                            setFilterEstado={setFilterEstado}
                            filterAsignado={filterAsignado}
                            setFilterAsignado={setFilterAsignado}
                            filterPrioridad={filterPrioridad}
                            setFilterPrioridad={setFilterPrioridad}
                            expandedTickets={expandedTickets}
                            toggleTicketExpansion={toggleTicketExpansion}
                            getSemaforoColor={getSemaforoColor}
                            tieneSolicitudReapertura={tieneSolicitudReapertura}
                            fueEscaladoPorAnalista={fueEscaladoPorAnalista}
                            ticketsConRecomendaciones={ticketsConRecomendaciones}
                            getAvailableActions={getAvailableActions}
                            asignarTicket={asignarTicket}
                            reasignarTicket={reasignarTicket}
                            setSelectedTicketImages={setSelectedTicketImages}
                            setSelectedImageIndex={setSelectedImageIndex}
                            setActiveView={setActiveView}
                            changeView={changeView}
                            navigate={navigate}
                            cerrarTicket={cerrarTicket}
                            reabrirTicket={reabrirTicket}
                            escalarTicket={escalarTicket}
                            generarRecomendacion={generarRecomendacion}
                            agregarComentario={agregarComentario}
                            showCerrados={showCerrados}
                            setShowCerrados={setShowCerrados}
                            ticketsCerrados={ticketsCerrados}
                            ticketsCerradosCombinados={ticketsCerradosCombinados}
                            loadingCerrados={loadingCerrados}
                            cargarTicketsCerrados={cargarTicketsCerrados}
                            getEstadoColor={getEstadoColor}
                            getPrioridadColor={getPrioridadColor}
                            openComments={openComments}
                            openChat={openChat}
                            openVerHD={openVerHD}
                            openRecomendacion={openRecomendacion}
                            openIdentificar={openIdentificar}
                        />
                    )}

                    {activeView === 'analistas' && (
                        <AnalistasView
                            analistasCombinados={analistasCombinados}
                            tickets={tickets}
                        />
                    )}

                    {activeView === 'asignaciones' && (
                        <AsignacionesView tickets={tickets} changeView={changeView} />
                    )}

                    {activeView === 'escalaciones' && (
                        <EscalacionesView tickets={tickets} changeView={changeView} />
                    )}

                    {activeView === 'reportes' && (
                        <>
                            <h1 className="hyper-page-title">Reportes</h1>
                            <div className="hyper-widget card border-0 shadow-sm">
                                <div className="hyper-widget-body">
                                    <div className="text-center py-4">
                                        <i className="fas fa-chart-bar fa-3x text-muted mb-3"></i>
                                        <p className="text-muted">Módulo de reportes en desarrollo</p>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {activeView === 'dashboard-calidad' && <DashboardCalidad />}

                    {activeView === 'configuracion' && (
                        <>
                            <h1 className="hyper-page-title">Configuración</h1>
                            <div className="hyper-widget card border-0 shadow-sm">
                                <div className="hyper-widget-body">
                                    <div className="text-center py-4">
                                        <i className="fas fa-cog fa-3x text-muted mb-3"></i>
                                        <p className="text-muted">Módulo de configuración en desarrollo</p>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {activeView.startsWith('ticket-') && (
                        <VerTicketHDSupervisor
                            ticketId={parseInt(activeView.split('-')[1])}
                            tickets={tickets}
                            ticketsCerrados={ticketsCerradosCombinados}
                            ticketsConRecomendaciones={ticketsConRecomendaciones}
                            analistas={analistas}
                            onBack={() => setActiveView('tickets')}
                            setActiveView={setActiveView}
                        />
                    )}

                    {activeView.startsWith('comentarios-') && (
                        <ComentariosTicketEmbedded
                            ticketId={parseInt(activeView.split('-')[1])}
                            onBack={() => setActiveView('tickets')}
                        />
                    )}

                    {activeView.startsWith('supervisor-chat-') && (
                        <ChatSupervisorAnalistaEmbedded
                            ticketId={parseInt(activeView.split('-')[2])}
                            onBack={() => setActiveView('tickets')}
                        />
                    )}

                    {activeView.startsWith('recomendacion-') && (
                        <RecomendacionVistaEmbedded
                            ticketId={parseInt(activeView.split('-')[1])}
                            onBack={() => setActiveView('tickets')}
                        />
                    )}

                    {activeView.startsWith('identificar-') && (
                        <IdentificarImagenEmbedded
                            ticketId={parseInt(activeView.split('-')[1])}
                            onBack={() => setActiveView('tickets')}
                        />
                    )}

                    {activeView === 'profile' && (
                        <SupervisorProfile
                            infoData={infoData}
                            handleInfoChange={handleInfoChange}
                            setActiveView={setActiveView}
                            updateInfo={updateInfo}
                            updatingInfo={updatingInfo}
                        />
                    )}

                    {showInfoForm && (
                        <InfoFormModal
                            infoData={infoData}
                            setInfoData={setInfoData}
                            setShowInfoForm={setShowInfoForm}
                            actualizarInformacion={actualizarInformacion}
                            updatingInfo={updatingInfo}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
