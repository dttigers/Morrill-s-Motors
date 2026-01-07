/**
 * Staging Markup Tool
 * A lightweight annotation/markup tool for staging environments
 *
 * Usage:
 *   - Include this script on staging sites
 *   - Press Ctrl+Shift+M (or Cmd+Shift+M on Mac) to toggle the toolbar
 *   - Remove the script before going to production
 */

(function(window, document) {
  'use strict';

  // Configuration
  const CONFIG = {
    storageKey: 'stagingMarkupAnnotations',
    toggleShortcut: { key: 'M', ctrlKey: true, shiftKey: true },
    colors: ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ff6600', '#000000'],
    defaultColor: '#ff0000',
    defaultStrokeWidth: 3
  };

  // State
  let state = {
    enabled: false,
    currentTool: 'pointer',
    currentColor: CONFIG.defaultColor,
    strokeWidth: CONFIG.defaultStrokeWidth,
    isDrawing: false,
    startX: 0,
    startY: 0,
    annotations: [],
    currentAnnotation: null,
    selectedAnnotation: null
  };

  // Styles
  const STYLES = `
    .sm-toolbar {
      position: fixed;
      top: 10px;
      right: 10px;
      background: #2d2d2d;
      border-radius: 8px;
      padding: 10px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 12px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      user-select: none;
    }

    .sm-toolbar-row {
      display: flex;
      gap: 4px;
      align-items: center;
    }

    .sm-toolbar-section {
      display: flex;
      gap: 4px;
      padding: 4px;
      background: #3d3d3d;
      border-radius: 4px;
    }

    .sm-btn {
      width: 32px;
      height: 32px;
      border: none;
      border-radius: 4px;
      background: #4d4d4d;
      color: white;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s;
    }

    .sm-btn:hover {
      background: #5d5d5d;
    }

    .sm-btn.active {
      background: #007bff;
    }

    .sm-btn svg {
      width: 18px;
      height: 18px;
      fill: currentColor;
    }

    .sm-color-picker {
      display: flex;
      gap: 2px;
      flex-wrap: wrap;
      max-width: 140px;
    }

    .sm-color-swatch {
      width: 16px;
      height: 16px;
      border-radius: 2px;
      cursor: pointer;
      border: 2px solid transparent;
    }

    .sm-color-swatch.active {
      border-color: white;
    }

    .sm-stroke-slider {
      width: 80px;
      height: 4px;
      -webkit-appearance: none;
      background: #5d5d5d;
      border-radius: 2px;
      outline: none;
    }

    .sm-stroke-slider::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 12px;
      height: 12px;
      background: white;
      border-radius: 50%;
      cursor: pointer;
    }

    .sm-canvas {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 999998;
      pointer-events: none;
    }

    .sm-canvas.active {
      pointer-events: auto;
      cursor: crosshair;
    }

    .sm-canvas.pointer-mode {
      cursor: default;
    }

    .sm-label {
      color: #aaa;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .sm-comment-box {
      position: absolute;
      background: #fffde7;
      border: 1px solid #fbc02d;
      border-radius: 4px;
      padding: 8px;
      min-width: 150px;
      max-width: 300px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
      z-index: 999999;
    }

    .sm-comment-box textarea {
      width: 100%;
      min-height: 60px;
      border: none;
      background: transparent;
      resize: vertical;
      font-family: inherit;
      font-size: 12px;
      outline: none;
    }

    .sm-comment-box .sm-comment-actions {
      display: flex;
      justify-content: flex-end;
      gap: 4px;
      margin-top: 8px;
    }

    .sm-comment-box button {
      padding: 4px 8px;
      border: none;
      border-radius: 3px;
      cursor: pointer;
      font-size: 11px;
    }

    .sm-comment-box .sm-save-btn {
      background: #4caf50;
      color: white;
    }

    .sm-comment-box .sm-cancel-btn {
      background: #e0e0e0;
    }

    .sm-comment-box .sm-delete-btn {
      background: #f44336;
      color: white;
    }

    .sm-pin {
      position: absolute;
      width: 24px;
      height: 24px;
      background: #fbc02d;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      cursor: pointer;
      box-shadow: 0 2px 5px rgba(0,0,0,0.3);
      z-index: 999997;
    }

    .sm-pin::after {
      content: attr(data-number);
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(45deg);
      font-size: 10px;
      font-weight: bold;
      color: #333;
    }

    .sm-hidden {
      display: none !important;
    }

    .sm-badge {
      position: fixed;
      bottom: 10px;
      right: 10px;
      background: #ff6600;
      color: white;
      padding: 8px 12px;
      border-radius: 4px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 11px;
      font-weight: bold;
      z-index: 999999;
      cursor: pointer;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    }

    .sm-export-panel {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 4px 30px rgba(0,0,0,0.3);
      z-index: 1000000;
      max-width: 500px;
      width: 90%;
    }

    .sm-export-panel h3 {
      margin: 0 0 15px 0;
      color: #333;
    }

    .sm-export-panel textarea {
      width: 100%;
      height: 200px;
      border: 1px solid #ddd;
      border-radius: 4px;
      padding: 10px;
      font-family: monospace;
      font-size: 11px;
      resize: vertical;
    }

    .sm-export-panel .sm-export-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      margin-top: 15px;
    }

    .sm-export-panel button {
      padding: 8px 16px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 13px;
    }

    .sm-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.5);
      z-index: 999999;
    }
  `;

  // SVG Icons
  const ICONS = {
    pointer: '<svg viewBox="0 0 24 24"><path d="M13.64 21.97C13.14 22.21 12.54 22 12.31 21.5L10.13 16.76L7.62 18.78C7.45 18.92 7.24 19 7 19C6.45 19 6 18.55 6 18V3C6 2.45 6.45 2 7 2C7.24 2 7.47 2.09 7.64 2.23L7.65 2.22L19.14 11.86C19.57 12.22 19.62 12.85 19.27 13.27C19.1 13.5 18.85 13.61 18.58 13.61L14.41 13.69L16.69 18.5C16.93 19 16.71 19.6 16.21 19.84L13.64 21.97Z"/></svg>',
    highlight: '<svg viewBox="0 0 24 24"><path d="M4 19H20V21H4V19M18.3 5.71L16.12 3.53C15.73 3.14 15.1 3.14 14.71 3.53L6 12.24V15H8.76L17.47 6.29C17.86 5.9 17.86 5.27 17.47 4.88L18.3 5.71M6.41 16L4 18.41L5.59 20L8 17.59L6.41 16Z"/></svg>',
    arrow: '<svg viewBox="0 0 24 24"><path d="M4 12L14 12M14 12L10 8M14 12L10 16M14 4L20 12L14 20"/></svg>',
    rect: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
    circle: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
    text: '<svg viewBox="0 0 24 24"><path d="M5 4V7H10.5V19H13.5V7H19V4H5Z"/></svg>',
    comment: '<svg viewBox="0 0 24 24"><path d="M20 2H4C2.9 2 2 2.9 2 4V16C2 17.1 2.9 18 4 18H8L12 22L16 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2M20 16H15.17L12 19.17L8.83 16H4V4H20V16Z"/></svg>',
    undo: '<svg viewBox="0 0 24 24"><path d="M12.5 8C9.85 8 7.45 9 5.6 10.6L2 7V16H11L7.38 12.38C8.77 11.22 10.54 10.5 12.5 10.5C16.04 10.5 19.05 12.81 20.1 16L22.47 15.22C21.08 11.03 17.15 8 12.5 8Z"/></svg>',
    clear: '<svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z"/></svg>',
    save: '<svg viewBox="0 0 24 24"><path d="M17 3H5C3.89 3 3 3.9 3 5V19C3 20.1 3.89 21 5 21H19C20.1 21 21 20.1 21 19V7L17 3M19 19H5V5H16.17L19 7.83V19M12 12C10.34 12 9 13.34 9 15S10.34 18 12 18 15 16.66 15 15 13.66 12 12 12M6 6H15V10H6V6Z"/></svg>',
    export: '<svg viewBox="0 0 24 24"><path d="M12 1L8 5H11V14H13V5H16L12 1M18 23H6C4.89 23 4 22.1 4 21V9C4 7.9 4.89 7 6 7H9V9H6V21H18V9H15V7H18C19.1 7 20 7.9 20 9V21C20 22.1 19.1 23 18 23Z"/></svg>',
    close: '<svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z"/></svg>'
  };

  // DOM Elements
  let toolbar = null;
  let canvas = null;
  let ctx = null;
  let badge = null;
  let commentContainer = null;

  /**
   * Initialize the markup tool
   */
  function init() {
    injectStyles();
    createBadge();
    createToolbar();
    createCanvas();
    createCommentContainer();
    loadAnnotations();
    bindEvents();
  }

  /**
   * Inject CSS styles
   */
  function injectStyles() {
    const style = document.createElement('style');
    style.id = 'sm-styles';
    style.textContent = STYLES;
    document.head.appendChild(style);
  }

  /**
   * Create the staging badge indicator
   */
  function createBadge() {
    badge = document.createElement('div');
    badge.className = 'sm-badge';
    badge.innerHTML = 'STAGING MODE';
    badge.title = 'Press Ctrl+Shift+M to toggle markup tools';
    badge.addEventListener('click', toggleToolbar);
    document.body.appendChild(badge);
  }

  /**
   * Create the toolbar
   */
  function createToolbar() {
    toolbar = document.createElement('div');
    toolbar.className = 'sm-toolbar sm-hidden';
    toolbar.innerHTML = `
      <div class="sm-toolbar-row">
        <span class="sm-label">Tools</span>
      </div>
      <div class="sm-toolbar-row">
        <div class="sm-toolbar-section">
          <button class="sm-btn active" data-tool="pointer" title="Pointer (P)">${ICONS.pointer}</button>
          <button class="sm-btn" data-tool="highlight" title="Highlighter (H)">${ICONS.highlight}</button>
          <button class="sm-btn" data-tool="arrow" title="Arrow (A)">${ICONS.arrow}</button>
          <button class="sm-btn" data-tool="rect" title="Rectangle (R)">${ICONS.rect}</button>
          <button class="sm-btn" data-tool="circle" title="Circle (C)">${ICONS.circle}</button>
          <button class="sm-btn" data-tool="text" title="Text (T)">${ICONS.text}</button>
          <button class="sm-btn" data-tool="comment" title="Comment (N)">${ICONS.comment}</button>
        </div>
      </div>
      <div class="sm-toolbar-row">
        <span class="sm-label">Color</span>
      </div>
      <div class="sm-toolbar-row">
        <div class="sm-color-picker">
          ${CONFIG.colors.map(c => `<div class="sm-color-swatch ${c === state.currentColor ? 'active' : ''}" data-color="${c}" style="background: ${c}"></div>`).join('')}
        </div>
      </div>
      <div class="sm-toolbar-row">
        <span class="sm-label">Size</span>
        <input type="range" class="sm-stroke-slider" min="1" max="10" value="${state.strokeWidth}">
      </div>
      <div class="sm-toolbar-row">
        <span class="sm-label">Actions</span>
      </div>
      <div class="sm-toolbar-row">
        <div class="sm-toolbar-section">
          <button class="sm-btn" data-action="undo" title="Undo (Ctrl+Z)">${ICONS.undo}</button>
          <button class="sm-btn" data-action="clear" title="Clear All">${ICONS.clear}</button>
          <button class="sm-btn" data-action="save" title="Save">${ICONS.save}</button>
          <button class="sm-btn" data-action="export" title="Export">${ICONS.export}</button>
          <button class="sm-btn" data-action="close" title="Close Toolbar">${ICONS.close}</button>
        </div>
      </div>
    `;
    document.body.appendChild(toolbar);
  }

  /**
   * Create the canvas for drawing
   */
  function createCanvas() {
    canvas = document.createElement('canvas');
    canvas.className = 'sm-canvas';
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    ctx = canvas.getContext('2d');
    document.body.appendChild(canvas);
  }

  /**
   * Create container for comment pins
   */
  function createCommentContainer() {
    commentContainer = document.createElement('div');
    commentContainer.id = 'sm-comment-container';
    document.body.appendChild(commentContainer);
  }

  /**
   * Bind event listeners
   */
  function bindEvents() {
    // Keyboard shortcut
    document.addEventListener('keydown', handleKeydown);

    // Toolbar events
    toolbar.addEventListener('click', handleToolbarClick);
    toolbar.querySelector('.sm-stroke-slider').addEventListener('input', handleStrokeChange);

    // Canvas events
    canvas.addEventListener('mousedown', handleCanvasMousedown);
    canvas.addEventListener('mousemove', handleCanvasMousemove);
    canvas.addEventListener('mouseup', handleCanvasMouseup);
    canvas.addEventListener('mouseleave', handleCanvasMouseup);

    // Window resize
    window.addEventListener('resize', handleResize);

    // Prevent toolbar drag
    toolbar.addEventListener('mousedown', (e) => e.stopPropagation());
  }

  /**
   * Handle keyboard shortcuts
   */
  function handleKeydown(e) {
    const { toggleShortcut } = CONFIG;

    // Toggle toolbar
    if (e.key.toUpperCase() === toggleShortcut.key &&
        (e.ctrlKey || e.metaKey) === toggleShortcut.ctrlKey &&
        e.shiftKey === toggleShortcut.shiftKey) {
      e.preventDefault();
      toggleToolbar();
      return;
    }

    if (!state.enabled) return;

    // Tool shortcuts
    const toolShortcuts = {
      'P': 'pointer',
      'H': 'highlight',
      'A': 'arrow',
      'R': 'rect',
      'C': 'circle',
      'T': 'text',
      'N': 'comment'
    };

    if (toolShortcuts[e.key.toUpperCase()] && !e.ctrlKey && !e.metaKey) {
      selectTool(toolShortcuts[e.key.toUpperCase()]);
    }

    // Undo
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
      e.preventDefault();
      undo();
    }

    // Escape to close
    if (e.key === 'Escape') {
      if (state.enabled) {
        toggleToolbar();
      }
    }
  }

  /**
   * Handle toolbar clicks
   */
  function handleToolbarClick(e) {
    const btn = e.target.closest('.sm-btn');
    const swatch = e.target.closest('.sm-color-swatch');

    if (btn) {
      const tool = btn.dataset.tool;
      const action = btn.dataset.action;

      if (tool) {
        selectTool(tool);
      } else if (action) {
        handleAction(action);
      }
    }

    if (swatch) {
      selectColor(swatch.dataset.color);
    }
  }

  /**
   * Handle stroke width change
   */
  function handleStrokeChange(e) {
    state.strokeWidth = parseInt(e.target.value);
  }

  /**
   * Select a tool
   */
 function selectTool(tool) {
  state.currentTool = tool;

  // Update UI
  toolbar.querySelectorAll('[data-tool]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tool === tool);
  });

  // Update canvas - activate for drawing tools, deactivate for pointer
  canvas.classList.toggle('active', tool !== 'pointer');
  canvas.classList.toggle('pointer-mode', tool === 'pointer');
}

  /**
   * Select a color
   */
  function selectColor(color) {
    state.currentColor = color;
    toolbar.querySelectorAll('.sm-color-swatch').forEach(swatch => {
      swatch.classList.toggle('active', swatch.dataset.color === color);
    });
  }

  /**
   * Handle toolbar actions
   */
  function handleAction(action) {
    switch (action) {
      case 'undo':
        undo();
        break;
      case 'clear':
        clearAll();
        break;
      case 'save':
        saveAnnotations();
        break;
      case 'export':
        showExportPanel();
        break;
      case 'close':
        toggleToolbar();
        break;
    }
  }

  /**
   * Toggle toolbar visibility
   */
  function toggleToolbar() {
    state.enabled = !state.enabled;
    toolbar.classList.toggle('sm-hidden', !state.enabled);
    canvas.classList.toggle('active', state.enabled && state.currentTool !== 'pointer');

    if (state.enabled) {
      redraw();
    }
  }

  /**
   * Handle canvas mousedown
   */
  function handleCanvasMousedown(e) {
    if (!state.enabled || state.currentTool === 'pointer') return;

    const rect = canvas.getBoundingClientRect();
    state.startX = e.clientX - rect.left;
    state.startY = e.clientY - rect.top;
    state.isDrawing = true;

    if (state.currentTool === 'comment') {
      createComment(state.startX, state.startY);
      state.isDrawing = false;
      return;
    }

    if (state.currentTool === 'text') {
      createTextInput(state.startX, state.startY);
      state.isDrawing = false;
      return;
    }

    state.currentAnnotation = {
      type: state.currentTool,
      color: state.currentColor,
      strokeWidth: state.strokeWidth,
      startX: state.startX,
      startY: state.startY,
      endX: state.startX,
      endY: state.startY,
      points: state.currentTool === 'highlight' ? [{ x: state.startX, y: state.startY }] : null
    };
  }

  /**
   * Handle canvas mousemove
   */
  function handleCanvasMousemove(e) {
    if (!state.isDrawing || !state.currentAnnotation) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    state.currentAnnotation.endX = x;
    state.currentAnnotation.endY = y;

    if (state.currentTool === 'highlight' && state.currentAnnotation.points) {
      state.currentAnnotation.points.push({ x, y });
    }

    redraw();
    drawAnnotation(state.currentAnnotation);
  }

  /**
   * Handle canvas mouseup
   */
  function handleCanvasMouseup() {
    if (state.isDrawing && state.currentAnnotation) {
      state.annotations.push(state.currentAnnotation);
      state.currentAnnotation = null;
      saveAnnotations();
      redraw();
    }
    state.isDrawing = false;
  }

  /**
   * Create a comment at position
   */
  function createComment(x, y) {
    const commentId = Date.now();
    const commentNumber = state.annotations.filter(a => a.type === 'comment').length + 1;

    // Create pin
    const pin = document.createElement('div');
    pin.className = 'sm-pin';
    pin.dataset.id = commentId;
    pin.dataset.number = commentNumber;
    pin.style.left = (x - 12) + 'px';
    pin.style.top = (y - 24) + 'px';
    commentContainer.appendChild(pin);

    // Create comment box
    const box = document.createElement('div');
    box.className = 'sm-comment-box';
    box.style.left = (x + 20) + 'px';
    box.style.top = y + 'px';
    box.innerHTML = `
      <textarea placeholder="Add your comment..."></textarea>
      <div class="sm-comment-actions">
        <button class="sm-delete-btn">Delete</button>
        <button class="sm-cancel-btn">Cancel</button>
        <button class="sm-save-btn">Save</button>
      </div>
    `;
    commentContainer.appendChild(box);

    const textarea = box.querySelector('textarea');
    textarea.focus();

    // Event handlers
    box.querySelector('.sm-save-btn').addEventListener('click', () => {
      const text = textarea.value.trim();
      if (text) {
        state.annotations.push({
          id: commentId,
          type: 'comment',
          x: x,
          y: y,
          text: text,
          number: commentNumber
        });
        saveAnnotations();
        box.remove();
        pin.addEventListener('click', () => showComment(commentId));
      } else {
        box.remove();
        pin.remove();
      }
    });

    box.querySelector('.sm-cancel-btn').addEventListener('click', () => {
      box.remove();
      pin.remove();
    });

    box.querySelector('.sm-delete-btn').addEventListener('click', () => {
      box.remove();
      pin.remove();
    });
  }

  /**
   * Show existing comment
   */
  function showComment(id) {
    const annotation = state.annotations.find(a => a.id === id);
    if (!annotation) return;

    // Remove any existing open comment boxes
    document.querySelectorAll('.sm-comment-box').forEach(b => b.remove());

    const box = document.createElement('div');
    box.className = 'sm-comment-box';
    box.style.left = (annotation.x + 20) + 'px';
    box.style.top = annotation.y + 'px';
    box.innerHTML = `
      <textarea>${annotation.text}</textarea>
      <div class="sm-comment-actions">
        <button class="sm-delete-btn">Delete</button>
        <button class="sm-cancel-btn">Close</button>
        <button class="sm-save-btn">Save</button>
      </div>
    `;
    commentContainer.appendChild(box);

    box.querySelector('.sm-save-btn').addEventListener('click', () => {
      annotation.text = box.querySelector('textarea').value.trim();
      saveAnnotations();
      box.remove();
    });

    box.querySelector('.sm-cancel-btn').addEventListener('click', () => {
      box.remove();
    });

    box.querySelector('.sm-delete-btn').addEventListener('click', () => {
      state.annotations = state.annotations.filter(a => a.id !== id);
      document.querySelector(`.sm-pin[data-id="${id}"]`)?.remove();
      saveAnnotations();
      box.remove();
    });
  }

  /**
   * Create text input at position
   */
  function createTextInput(x, y) {
    const input = document.createElement('input');
    input.type = 'text';
    input.style.cssText = `
      position: fixed;
      left: ${x}px;
      top: ${y}px;
      font-size: 16px;
      font-weight: bold;
      color: ${state.currentColor};
      background: rgba(255,255,255,0.9);
      border: 2px solid ${state.currentColor};
      border-radius: 4px;
      padding: 4px 8px;
      outline: none;
      z-index: 1000000;
    `;
    document.body.appendChild(input);
    input.focus();

    const saveText = () => {
      const text = input.value.trim();
      if (text) {
        state.annotations.push({
          type: 'text',
          x: x,
          y: y,
          text: text,
          color: state.currentColor,
          fontSize: 16
        });
        saveAnnotations();
        redraw();
      }
      input.remove();
    };

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        saveText();
      } else if (e.key === 'Escape') {
        input.remove();
      }
    });

    input.addEventListener('blur', saveText);
  }

  /**
   * Draw an annotation on canvas
   */
  function drawAnnotation(annotation) {
    ctx.strokeStyle = annotation.color;
    ctx.fillStyle = annotation.color;
    ctx.lineWidth = annotation.strokeWidth || state.strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    switch (annotation.type) {
      case 'highlight':
        drawHighlight(annotation);
        break;
      case 'arrow':
        drawArrow(annotation);
        break;
      case 'rect':
        drawRect(annotation);
        break;
      case 'circle':
        drawCircle(annotation);
        break;
      case 'text':
        drawText(annotation);
        break;
    }
  }

  /**
   * Draw highlighter stroke
   */
  function drawHighlight(annotation) {
    if (!annotation.points || annotation.points.length < 2) return;

    ctx.globalAlpha = 0.4;
    ctx.lineWidth = annotation.strokeWidth * 4;
    ctx.beginPath();
    ctx.moveTo(annotation.points[0].x, annotation.points[0].y);

    for (let i = 1; i < annotation.points.length; i++) {
      ctx.lineTo(annotation.points[i].x, annotation.points[i].y);
    }

    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  /**
   * Draw arrow
   */
  function drawArrow(annotation) {
    const { startX, startY, endX, endY } = annotation;
    const headLength = 15;
    const angle = Math.atan2(endY - startY, endX - startX);

    // Line
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    // Arrowhead
    ctx.beginPath();
    ctx.moveTo(endX, endY);
    ctx.lineTo(
      endX - headLength * Math.cos(angle - Math.PI / 6),
      endY - headLength * Math.sin(angle - Math.PI / 6)
    );
    ctx.moveTo(endX, endY);
    ctx.lineTo(
      endX - headLength * Math.cos(angle + Math.PI / 6),
      endY - headLength * Math.sin(angle + Math.PI / 6)
    );
    ctx.stroke();
  }

  /**
   * Draw rectangle
   */
  function drawRect(annotation) {
    const { startX, startY, endX, endY } = annotation;
    ctx.beginPath();
    ctx.rect(startX, startY, endX - startX, endY - startY);
    ctx.stroke();
  }

  /**
   * Draw circle/ellipse
   */
  function drawCircle(annotation) {
    const { startX, startY, endX, endY } = annotation;
    const radiusX = Math.abs(endX - startX) / 2;
    const radiusY = Math.abs(endY - startY) / 2;
    const centerX = Math.min(startX, endX) + radiusX;
    const centerY = Math.min(startY, endY) + radiusY;

    ctx.beginPath();
    ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
    ctx.stroke();
  }

  /**
   * Draw text annotation
   */
  function drawText(annotation) {
    ctx.font = `bold ${annotation.fontSize || 16}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
    ctx.fillText(annotation.text, annotation.x, annotation.y);
  }

  /**
   * Redraw all annotations
   */
  function redraw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    state.annotations.forEach(annotation => {
      if (annotation.type !== 'comment') {
        drawAnnotation(annotation);
      }
    });
  }

  /**
   * Undo last annotation
   */
  function undo() {
    const last = state.annotations.pop();
    if (last && last.type === 'comment') {
      document.querySelector(`.sm-pin[data-id="${last.id}"]`)?.remove();
    }
    saveAnnotations();
    redraw();
  }

  /**
   * Clear all annotations
   */
  function clearAll() {
    if (confirm('Are you sure you want to clear all annotations?')) {
      state.annotations = [];
      commentContainer.innerHTML = '';
      saveAnnotations();
      redraw();
    }
  }

  /**
   * Save annotations to localStorage
   */
  function saveAnnotations() {
    try {
      const data = {
        url: window.location.href,
        annotations: state.annotations,
        timestamp: Date.now()
      };
      localStorage.setItem(CONFIG.storageKey + '_' + btoa(window.location.pathname), JSON.stringify(data));
    } catch (e) {
      console.warn('Failed to save annotations:', e);
    }
  }

  /**
   * Load annotations from localStorage
   */
  function loadAnnotations() {
    try {
      const data = localStorage.getItem(CONFIG.storageKey + '_' + btoa(window.location.pathname));
      if (data) {
        const parsed = JSON.parse(data);
        state.annotations = parsed.annotations || [];

        // Restore comment pins
        state.annotations.forEach(annotation => {
          if (annotation.type === 'comment') {
            const pin = document.createElement('div');
            pin.className = 'sm-pin';
            pin.dataset.id = annotation.id;
            pin.dataset.number = annotation.number;
            pin.style.left = (annotation.x - 12) + 'px';
            pin.style.top = (annotation.y - 24) + 'px';
            pin.addEventListener('click', () => showComment(annotation.id));
            commentContainer.appendChild(pin);
          }
        });

        redraw();
      }
    } catch (e) {
      console.warn('Failed to load annotations:', e);
    }
  }

  /**
   * Show export panel
   */
  function showExportPanel() {
    const overlay = document.createElement('div');
    overlay.className = 'sm-overlay';

    const panel = document.createElement('div');
    panel.className = 'sm-export-panel';

    const exportData = {
      url: window.location.href,
      title: document.title,
      exportedAt: new Date().toISOString(),
      annotations: state.annotations.map(a => ({
        ...a,
        pageX: a.x || a.startX,
        pageY: a.y || a.startY
      }))
    };

    panel.innerHTML = `
      <h3>Export Annotations</h3>
      <textarea readonly>${JSON.stringify(exportData, null, 2)}</textarea>
      <div class="sm-export-actions">
        <button class="sm-copy-btn" style="background: #007bff; color: white;">Copy to Clipboard</button>
        <button class="sm-download-btn" style="background: #28a745; color: white;">Download JSON</button>
        <button class="sm-close-btn" style="background: #6c757d; color: white;">Close</button>
      </div>
    `;

    document.body.appendChild(overlay);
    document.body.appendChild(panel);

    panel.querySelector('.sm-copy-btn').addEventListener('click', () => {
      navigator.clipboard.writeText(JSON.stringify(exportData, null, 2));
      panel.querySelector('.sm-copy-btn').textContent = 'Copied!';
      setTimeout(() => {
        panel.querySelector('.sm-copy-btn').textContent = 'Copy to Clipboard';
      }, 2000);
    });

    panel.querySelector('.sm-download-btn').addEventListener('click', () => {
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `annotations-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });

    const closePanel = () => {
      overlay.remove();
      panel.remove();
    };

    panel.querySelector('.sm-close-btn').addEventListener('click', closePanel);
    overlay.addEventListener('click', closePanel);
  }

  /**
   * Handle window resize
   */
  function handleResize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    redraw();
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose API for programmatic control
  window.StagingMarkup = {
    toggle: toggleToolbar,
    enable: () => { if (!state.enabled) toggleToolbar(); },
    disable: () => { if (state.enabled) toggleToolbar(); },
    clear: clearAll,
    export: () => state.annotations,
    destroy: () => {
      document.getElementById('sm-styles')?.remove();
      toolbar?.remove();
      canvas?.remove();
      badge?.remove();
      commentContainer?.remove();
    }
  };

})(window, document);
