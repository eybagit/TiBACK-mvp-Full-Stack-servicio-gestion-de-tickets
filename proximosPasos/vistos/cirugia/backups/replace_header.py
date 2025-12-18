import re

# Leer archivo
with open('src/front/protectedViewsRol/cliente/ClientePage.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Buscar el bloque del header
start_marker = '{/* Header superior */}'
end_marker = '</header>'

start_idx = content.find(start_marker)
end_idx = content.find(end_marker) + len(end_marker)

if start_idx == -1 or end_idx == -1:
    print(f"ERROR: No se encontraron los marcadores")
    print(f"  start_marker found: {start_idx != -1}")
    print(f"  end_marker found: {end_idx != -1}")
    exit(1)

header_block = content[start_idx:end_idx]
print(f"Header block: {len(header_block.split(chr(10)))} líneas")

# Reemplazar con componente
header_replacement = '''<ClienteHeader 
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
                />'''

content = content[:start_idx] + header_replacement + content[end_idx:]

# Escribir archivo
with open('src/front/protectedViewsRol/cliente/ClientePage.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print('Lines after:', len(content.split('\n')))
print('SUCCESS!')
