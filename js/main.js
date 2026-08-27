/**
 * main.js — Punto de entrada principal de la aplicación
 *
 * Inicializa la navegación entre paneles y configura el estado
 * global compartido por todos los módulos.
 */

const App = (() => {

  /** Estado global compartido */
  const state = {
    beta: 0,      // velocidad relativa v/c actual
    events: [],   // lista de eventos definidos por el usuario
    activePanel: null,
  };

  function getState() { return state; }

  function setBeta(value) {
    state.beta = Math.max(0, Math.min(0.9999, value));
  }

  function init() {
    console.log('Laboratorio de Relatividad Especial — inicializado');
  }

  return { init, getState, setBeta };

})();

document.addEventListener('DOMContentLoaded', App.init);
