/**
 * Initial Store - Estado inicial de la aplicación
 */

export const initialStore = () => {
  return {
    message: null,
    todos: [],

    // Estado de autenticación - SOLO TOKEN COMO FUENTE DE VERDAD
    auth: {
      token: null,
      isAuthenticated: false,
      isLoading: true,
    },

    // Estado de WebSocket
    websocket: {
      socket: null,
      connected: false,
      notifications: [],
    },

    // Estado global para Clientes
    clientes: [],
    clienteDetail: null,

    // Estado global para Analistas
    analistas: [],
    analistaDetail: null,

    // Estado global para Supervisores
    supervisores: [],
    supervisorDetail: null,

    // Estado global para Comentarios
    comentarios: [],
    comentarioDetail: null,

    // Estado global para Asignaciones
    asignaciones: [],
    asignacionDetail: null,

    // Estado global para Administradores
    administradores: [],
    administradorDetail: null,

    // Estado global para gestiones
    gestiones: [],
    gestionDetail: null,

    // Estado global para Tickets
    tickets: [],
    ticketsCerrados: [],
    ticketDetail: null,

    // Datos estáticos de equipo
    imagegentle: [
      {
        id: 1,
        src: "https://res.cloudinary.com/mystoreimg/image/upload/v1759732962/zsxxv0qlqrbsdt5760cv.png",
        name: "Elkin Botero",
        subtit: "Técnico Web",
        prrfo: "Mejorando procesos de sistemas para clientes.",
        stl: "img-clp-w-1",
        skillstech: ["JavaScript", "Python", "Flask", "PostgreSQL", "React", "Node.js"],
        experiencia: ["3 años desarrollando aplicaciones web"],
        proyectos: ["Sistema de gestión documental", "Plataforma de reservas online"],
        contacto: {
          email: "elkin@empresa.com",
          linkedin: "https://linkedin.com/in/elkinbotero",
          github: "https://github.com/eybagit",
        },
      },
      {
        id: 2,
        src: "https://res.cloudinary.com/mystoreimg/image/upload/v1759732963/xb3jsgkapv50aj4vtzty.png",
        name: "Johan Gómez",
        subtit: "Tecnico Web",
        prrfo: "Trabajando para mejorar los rocesos para los sistemas de nuestros clientes",
        stl: "img-clp-w-2",
        skillstech: ["JavaScript", "Python", "Flask", "PostgreSQL", "React", "Node.js"],
        experiencia: ["Diseño de interfaces modernas"],
        proyectos: ["Dashboard Analítico", "App de control de inventarios"],
        contacto: {
          email: "johan@empresa.com",
          linkedin: "https://linkedin.com/in/johan",
          github: "https://github.com/J4gG3Rr",
        },
      },
      {
        id: 3,
        src: "https://res.cloudinary.com/mystoreimg/image/upload/v1759732962/flzh94tm0xienaqf5kbf.png",
        name: "Manuel Freire",
        subtit: "Tecnico Web",
        prrfo: "Trabajando para mejorar los rocesos para los sistemas de nuestros clientes",
        stl: "img-clp-w-3",
        skillstech: ["JavaScript", "Python", "Flask", "PostgreSQL", "React", "Node.js"],
        experiencia: ["Desarrollo de APIs REST", "Automatización de procesos internos"],
        proyectos: ["Sistema de tickets de soporte"],
        contacto: {
          email: "manuel@empresa.com",
          linkedin: "https://www.linkedin.com/in/manuel-freire-60837837b/",
          github: "https://github.com/ManuelFreire-rgb",
        },
      },
    ],

    designs: [
      { img: "https://res.cloudinary.com/mystoreimg/image/upload/v1759717169/ggffu4ot48feqozj7ryl.png", title: "Diseño Visualización de Tickets" },
      { img: "https://res.cloudinary.com/mystoreimg/image/upload/v1759728155/caoub9ckl0cdak37zkk8.png", title: "Diseño de Dashboard" },
      { img: "https://res.cloudinary.com/mystoreimg/image/upload/v1759716845/cgnezuaawg2up8uhsg9c.png", title: "Diseño de Vistas" },
      { img: "https://res.cloudinary.com/mystoreimg/image/upload/v1759728508/znxsjqcmikpmdzqt100x.png", title: "Disposición de Navegador Lateral Ligero" },
      { img: "https://res.cloudinary.com/mystoreimg/image/upload/v1759728628/nnk1kdwtj0a04qygaecl.png", title: "Diseño en Caja" },
      { img: "https://res.cloudinary.com/mystoreimg/image/upload/v1759728314/cgnrshquvfk2rgj1hxsr.png", title: "Diseño Semi Oscuro" },
    ],

    api: { loading: false, error: null },
  };
};
