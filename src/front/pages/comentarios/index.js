/**
 * index.js
 * Exportaciones centralizadas del módulo de comentarios
 */

// Hooks
export { useComentariosData, tokenUtils } from './hooks/useComentariosData';
export { useComentariosWebSocket } from './hooks/useComentariosWebSocket';
export { useComentariosTranscripcion } from './hooks/useComentariosTranscripcion';

// Components
export { default as ComentarioForm } from './components/ComentarioForm';
export { default as ComentariosList } from './components/ComentariosList';
export { default as ComentariosHeader } from './components/ComentariosHeader';
