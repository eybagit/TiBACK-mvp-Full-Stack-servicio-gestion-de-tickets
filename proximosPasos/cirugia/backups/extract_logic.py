import re

# Leer archivo original
with open('src/front/protectedViewsRol/cliente/ClientePage.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Buscar inicio de la función ClientePage
start_func = content.find('function ClientePage() {')
# Buscar return (
return_idx = content.find('    return (', start_func)

# Extraer la lógica (todo entre "function ClientePage() {" y "return (")
logic_block = content[start_func + len('function ClientePage() {'):return_idx]

print(f"Lógica extraída: {len(logic_block.split(chr(10)))} líneas")

# Guardar la lógica para referencia
with open('proximosPasos/cirugia/logica_cliente.txt', 'w', encoding='utf-8') as f:
    f.write(logic_block)

print("Lógica guardada en proximosPasos/cirugia/logica_cliente.txt")
print("Ahora crear useClientePage.js manualmente basado en esta lógica")
