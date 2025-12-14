 # 🎟️TiBACK
 
###  _"Tu turno, tu tiempo, tu solución. Con la velocidad que mereces..."_

###### TiBACK es una plataforma de atención al cliente basada en tickets, diseñada para gestionar solicitudes y ofrecer soluciones de manera eficiente.


### Desplegado en Render.com

- Sitio-Web [TiBACK](https://tiback-production.onrender.com)


## Flujo principal de los tickets:

- Cliente Ingresa el ticket en la plataforma 
- Supervisor Revisa y asigna ticket a analista especializado
- Analista Resuelve el ticket o lo reescala a otro analista de mayor rango o
especialidad

## 💻 Tecnologías Utilizadas

#### Frontend:
- 🟨 JavaScript

- ⚛️ React

- 🎨 Bootstrap

- 🌐 Font Awesome

- ☁️ Cloudinary

- 🌍🗺️ Google Maps

- 🔌📡 WebSockets

- 🐘💾 PostgreSQL

- 📄🌐 HTML

- 🎨📄 CSS

- 🟢🖥️ Node.js

#### Backend:
- 🐍 Python

- 🌐⚡ Flask

#### Base de Datos:

- 🗄️💾 MySQL / SQL

## 🚀 Instalación y Ejecución (codespace)

#### 🖥 ️Backend:

#### Instalar dependencias del Backend:
```
 pipenv install
 pipenv install PyJWT
 pipenv install requests==2.31.0 (API ia)
 pipenv install python-socketio==5.8.0 (WebSockets)
 pipenv install google-cloud-vision (De imágenes a texto)
pipenv install flask clou
```

#### Crear archivo .env:
```
cp .env.example .env
```

####  Ejecutar servidor (en el Bash):
```
pipenv run start
```

#### Para hacer migraciones (modelado de base de datos):

```
pipenv run migrate
pipenv run upgrade
```

#### Para desahcer una migración:

```
pipenv run downgrade
```

#### Para crear usuarios de test:
```
pipenv shell
pipenv run flask insert-test-data
```

#### 💻 Frontend:

#### Instalar dependencias del Frontend:

```
npm install
-
npm install socket.io-client <@> 4.7.4
(Sacar el arroba de los símbolos de mayor y menor y también los espacios)
-
npm install @cloudinary/react @cloudinary/url-gen (Subir fotos a Cloudinary)
npm install --save @google-cloud/speech (De voz a texto)
npm install @react-google-maps/api (Mapa de calor)
Ejecutar servidor (en el Bash):
npm run start (4 veces una para cada rol)
```

##  👥 Autores

| Nombre y apellido | Github |
| ------ | ------ |
| Elkin Botero | https://github.com/eybagit |
| Johan Gomez | https://github.com/J4gG3Rr |
| Manuel Freire | https://github.com/ManuelFreire-rgb |

##  📌 Notas

> -- Este proyecto está en desarrollo y puede actualizarse con nuevas
funcionalidades

> -- Para reportar errores o sugerencias, abrir un issue en los repositorios de
GitHub de los autores.

> -- Este README está optimiz

