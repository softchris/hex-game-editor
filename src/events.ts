import { emitter } from './event-bus';

var onKeyDown = function (e) {
  switch (e.keyCode) {
    case 37:
    case 39:
    case 38:
    case 40: // Arrow keys
    case 32:
      e.preventDefault();
      break; // Space
    default:
      break; // do not block other keys
  }
};

export function setupEventHandlers() {
 window.addEventListener("keydown", onKeyDown, false);
 window.addEventListener("click", (evt) => {
  emitter.emit("selected", { x: evt.clientX, y: evt.clientY });
 });
 window.addEventListener("keyup", (evt) => {
  emitter.emit("keyup", evt);
 });

  const terrainEl = document.getElementById('terrain');
  terrainEl?.addEventListener('change', (evt) => {
    emitter.emit("terrainSelection", evt);
  })

  const saveEl = document.getElementById('saveBtn');
  saveEl?.addEventListener('click', (evt) => {
    emitter.emit("saveLevel", evt);
  })


  const fileEl = document.getElementById('file');
  const loadEl = document.getElementById('loadBtn');
  loadEl?.addEventListener('click', () => {
    if( fileEl?.['files'].length > 0) {
      emitter.emit('loadLevel', fileEl?.['files'][0]);
    }
  })

  const fogEl = document.getElementById('fog');
  fogEl?.addEventListener('click', (evt) => {
    emitter.emit('fogChecked', evt);
  })
}





