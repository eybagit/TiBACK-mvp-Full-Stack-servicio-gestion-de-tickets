import re

# Leer archivo
with open('src/front/protectedViewsRol/cliente/ClientePage.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# ========== 1. EXTRAER CREATE TICKET VIEW ==========
print("Extrayendo Create Ticket View...")
start_marker = "{/* Create Ticket View */}"
end_marker = "{/* Profile View */}"

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

if start_idx == -1 or end_idx == -1:
    print(f"ERROR: No se encontraron los marcadores de Create Ticket View")
    print(f"  start_marker found: {start_idx != -1}")
    print(f"  end_marker found: {end_idx != -1}")
    exit(1)

create_block = content[start_idx:end_idx].strip()
print(f"  Create Ticket View: {len(create_block.split(chr(10)))} líneas")

# ========== 2. EXTRAER PROFILE VIEW ==========
print("Extrayendo Profile View...")
start_marker2 = "{/* Profile View */}"
end_marker2 = "{/* Chat View */}"

start_idx2 = content.find(start_marker2)
end_idx2 = content.find(end_marker2)

if start_idx2 == -1 or end_idx2 == -1:
    print(f"ERROR: No se encontraron los marcadores de Profile View")
    print(f"  start_marker found: {start_idx2 != -1}")
    print(f"  end_marker found: {end_idx2 != -1}")
    exit(1)

profile_block = content[start_idx2:end_idx2].strip()
print(f"  Profile View: {len(profile_block.split(chr(10)))} líneas")

# ========== 3. EXTRAER CHAT VIEW ==========
print("Extrayendo Chat View...")
start_marker3 = "{/* Chat View */}"
# Chat View termina antes de VerTicketHD View
end_marker3 = "{/* VerTicketHD View */}"

start_idx3 = content.find(start_marker3)
end_idx3 = content.find(end_marker3)

if start_idx3 == -1 or end_idx3 == -1:
    print(f"ERROR: No se encontraron los marcadores de Chat View")
    print(f"  start_marker found: {start_idx3 != -1}")
    print(f"  end_marker found: {end_idx3 != -1}")
    exit(1)

chat_block = content[start_idx3:end_idx3].strip()
print(f"  Chat View: {len(chat_block.split(chr(10)))} líneas")

# Guardar bloques extraídos para referencia
with open('proximosPasos/cirugia/create_view_block.txt', 'w', encoding='utf-8') as f:
    f.write(create_block)
with open('proximosPasos/cirugia/profile_view_block.txt', 'w', encoding='utf-8') as f:
    f.write(profile_block)
with open('proximosPasos/cirugia/chat_view_block.txt', 'w', encoding='utf-8') as f:
    f.write(chat_block)

print("\nBloques guardados. Ahora reemplazando en ClientePage.jsx...")

# ========== REEMPLAZAR BLOQUES ==========

# Agregar imports
import_line = "import ClienteTicketsList from './components/ClienteTicketsList';"
new_imports = import_line + """
import ClienteTicketForm from './components/ClienteTicketForm';
import ClienteProfile from './components/ClienteProfile';
import ClienteChat from './components/ClienteChat';"""
content = content.replace(import_line, new_imports)

# Reemplazar Create Ticket View
create_replacement = '''                    {/* Create Ticket View */}
                    {activeView === 'create' && (
                        <ClienteTicketForm 
                            crearTicket={crearTicket}
                            handleImageUpload={handleImageUpload}
                            handleImageRemove={handleImageRemove}
                            ticketImageUrl={ticketImageUrl}
                            changeView={changeView}
                        />
                    )}

                    '''
content = content[:start_idx] + create_replacement + content[end_idx:]

# Recalcular posiciones después del primer reemplazo
start_idx2 = content.find("{/* Profile View */}")
end_idx2 = content.find("{/* Chat View */}")

# Reemplazar Profile View
profile_replacement = '''                    {/* Profile View */}
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

                    '''
content = content[:start_idx2] + profile_replacement + content[end_idx2:]

# Recalcular posiciones
start_idx3 = content.find("{/* Chat View */}")
end_idx3 = content.find("{/* VerTicketHD View */}")

# Reemplazar Chat View
chat_replacement = '''                    {/* Chat View */}
                    {activeView === 'chat' && (
                        <ClienteChat 
                            tickets={tickets}
                            changeView={changeView}
                            setSelectedTicketId={setSelectedTicketId}
                            tieneAnalistaAsignado={tieneAnalistaAsignado}
                            getAnalistaAsignado={getAnalistaAsignado}
                            setSelectedTicketImages={setSelectedTicketImages}
                            setSelectedImageIndex={setSelectedImageIndex}
                        />
                    )}

                    '''
content = content[:start_idx3] + chat_replacement + content[end_idx3:]

# Escribir archivo
with open('src/front/protectedViewsRol/cliente/ClientePage.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print('Lines after:', len(content.split('\n')))
print('SUCCESS!')
