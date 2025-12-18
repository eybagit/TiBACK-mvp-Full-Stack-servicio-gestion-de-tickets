"""
Script para extraer el Header de SupervisorPage.jsx
Reemplaza las líneas del header con el componente SupervisorHeader
"""

# Leer archivo
with open('src/front/protectedViewsRol/supervisor/SupervisorPage.jsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

print(f"Líneas actuales: {len(lines)}")

# Añadir import de SupervisorHeader después de SupervisorDashboard
for i, line in enumerate(lines):
    if "import SupervisorDashboard from" in line:
        lines.insert(i + 1, "import SupervisorHeader from './components/SupervisorHeader';\n")
        print(f"Import SupervisorHeader añadido después de línea {i + 1}")
        break

# Buscar inicio del header (línea que contiene "{/* Header superior */}")
start_line = None
end_line = None

for i, line in enumerate(lines):
    if "{/* Header superior */}" in line:
        start_line = i
        print(f"Inicio Header encontrado en línea {i + 1}")
        break

# Buscar el fin del header (línea que contiene "</header>")  
for i, line in enumerate(lines):
    if i > start_line and "</header>" in line:
        end_line = i + 1  # Incluir la línea con </header>
        print(f"Fin Header encontrado en línea {i + 1}")
        break

if start_line is not None and end_line is not None:
    # Componente de reemplazo
    new_header = '''                {/* Header superior */}
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
'''
    
    # Construir nuevo contenido
    new_lines = lines[:start_line] + [new_header] + lines[end_line:]
    
    # Escribir archivo
    with open('src/front/protectedViewsRol/supervisor/SupervisorPage.jsx', 'w', encoding='utf-8') as f:
        f.writelines(new_lines)
    
    print(f"Líneas después: {len(new_lines)}")
    print(f"Líneas eliminadas: {len(lines) - len(new_lines)}")
    print("✅ Header extraído exitosamente")
else:
    print("❌ No se encontró el bloque Header")
    print(f"start_line: {start_line}, end_line: {end_line}")
