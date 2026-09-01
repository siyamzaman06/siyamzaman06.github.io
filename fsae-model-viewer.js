(function () {
  'use strict';

  var stage = document.querySelector('[data-fsae-model-stage]');
  var resetButton = document.querySelector('[data-fsae-model-reset]');
  var status = stage && stage.querySelector('.model-viewer-status');

  if (!stage || !resetButton || !status) return;

  var parts = window.fsaeAssemblyData || [];

  var canvas = document.createElement('canvas');
  var gl = canvas.getContext('webgl', { alpha: true, antialias: true }) || canvas.getContext('experimental-webgl', { alpha: true, antialias: true });
  var program;
  var positionLocation;
  var normalLocation;
  var mvpLocation;
  var modelLocation;
  var colorLocation;
  var meshes = [];
  var modelRadius = 1;
  var cameraDistance = 4;
  var viewScale = 4;
  var initialViewScale = 4;
  var rotationX = Math.asin(1 / Math.sqrt(3));
  var rotationY = -Math.PI / 4;
  var rotationZ = -14 * Math.PI / 180;
  var pointers = new Map();
  var lastSinglePoint = null;
  var lastPinchDistance = null;

  function setStatus(message, state) {
    status.textContent = message;
    status.classList.remove('is-ready', 'has-error');
    if (state) status.classList.add(state);
  }

  function compileShader(type, source) {
    var shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      var message = gl.getShaderInfoLog(shader);
      gl.deleteShader(shader);
      throw new Error(message || 'Unable to compile a 3D viewer shader.');
    }
    return shader;
  }

  function createProgram() {
    var vertexSource = [
      'attribute vec3 a_position;',
      'attribute vec3 a_normal;',
      'uniform mat4 u_mvp;',
      'uniform mat4 u_model;',
      'varying vec3 v_normal;',
      'void main() {',
      '  v_normal = mat3(u_model) * a_normal;',
      '  gl_Position = u_mvp * vec4(a_position, 1.0);',
      '}'
    ].join('\n');
    var fragmentSource = [
      'precision highp float;',
      'uniform vec3 u_color;',
      'varying vec3 v_normal;',
      'void main() {',
      '  vec3 normal = normalize(v_normal);',
      '  if (!gl_FrontFacing) normal = -normal;',
      '  vec3 key = normalize(vec3(0.55, 0.8, 0.7));',
      '  vec3 fill = normalize(vec3(-0.65, 0.2, 0.7));',
      '  float keyLight = max(dot(normal, key), 0.0);',
      '  float fillLight = max(dot(normal, fill), 0.0);',
      '  float rim = pow(1.0 - abs(normal.z), 2.0);',
      '  vec3 lit = u_color * (0.24 + keyLight * 0.82 + fillLight * 0.22);',
      '  lit += vec3(0.23, 0.52, 0.72) * rim * 0.18;',
      '  gl_FragColor = vec4(lit, 1.0);',
      '}'
    ].join('\n');
    var vertexShader = compileShader(gl.VERTEX_SHADER, vertexSource);
    var fragmentShader = compileShader(gl.FRAGMENT_SHADER, fragmentSource);
    var linkedProgram = gl.createProgram();
    gl.attachShader(linkedProgram, vertexShader);
    gl.attachShader(linkedProgram, fragmentShader);
    gl.linkProgram(linkedProgram);
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    if (!gl.getProgramParameter(linkedProgram, gl.LINK_STATUS)) {
      var message = gl.getProgramInfoLog(linkedProgram);
      gl.deleteProgram(linkedProgram);
      throw new Error(message || 'Unable to initialize the 3D viewer.');
    }
    return linkedProgram;
  }

  function identityMatrix() {
    return new Float32Array([
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1
    ]);
  }

  function multiplyMatrices(a, b) {
    var out = new Float32Array(16);
    for (var column = 0; column < 4; column += 1) {
      for (var row = 0; row < 4; row += 1) {
        out[column * 4 + row] =
          a[row] * b[column * 4] +
          a[4 + row] * b[column * 4 + 1] +
          a[8 + row] * b[column * 4 + 2] +
          a[12 + row] * b[column * 4 + 3];
      }
    }
    return out;
  }

  function orthographicMatrix(left, right, bottom, top, near, far) {
    var out = new Float32Array(16);
    out[0] = 2 / (right - left);
    out[5] = 2 / (top - bottom);
    out[10] = -2 / (far - near);
    out[12] = -(right + left) / (right - left);
    out[13] = -(top + bottom) / (top - bottom);
    out[14] = -(far + near) / (far - near);
    out[15] = 1;
    return out;
  }

  function translationMatrix(x, y, z) {
    var out = identityMatrix();
    out[12] = x;
    out[13] = y;
    out[14] = z;
    return out;
  }

  function rotationXMatrix(angle) {
    var out = identityMatrix();
    var cosine = Math.cos(angle);
    var sine = Math.sin(angle);
    out[5] = cosine;
    out[6] = sine;
    out[9] = -sine;
    out[10] = cosine;
    return out;
  }

  function rotationYMatrix(angle) {
    var out = identityMatrix();
    var cosine = Math.cos(angle);
    var sine = Math.sin(angle);
    out[0] = cosine;
    out[2] = -sine;
    out[8] = sine;
    out[10] = cosine;
    return out;
  }

  function rotationZMatrix(angle) {
    var out = identityMatrix();
    var cosine = Math.cos(angle);
    var sine = Math.sin(angle);
    out[0] = cosine;
    out[1] = sine;
    out[4] = -sine;
    out[5] = cosine;
    return out;
  }

  function colorVector(hex) {
    return new Float32Array([
      ((hex >> 16) & 255) / 255,
      ((hex >> 8) & 255) / 255,
      (hex & 255) / 255
    ]);
  }

  function decodeBase64Stl(data) {
    var raw = window.atob(data);
    var bytes = new Uint8Array(raw.length);
    for (var index = 0; index < raw.length; index += 1) bytes[index] = raw.charCodeAt(index);
    return bytes.buffer;
  }

  function parseBinaryStl(buffer, part) {
    if (buffer.byteLength < 84) throw new Error(part.name + ' is not a valid binary STL.');
    var view = new DataView(buffer);
    var triangleCount = view.getUint32(80, true);
    var expectedLength = 84 + triangleCount * 50;
    if (expectedLength > buffer.byteLength) throw new Error(part.name + ' STL data is incomplete.');

    var positions = new Float32Array(triangleCount * 9);
    var normals = new Float32Array(triangleCount * 9);
    var minimum = [Infinity, Infinity, Infinity];
    var maximum = [-Infinity, -Infinity, -Infinity];
    var outputOffset = 0;

    for (var triangle = 0; triangle < triangleCount; triangle += 1) {
      var offset = 84 + triangle * 50;
      var normalX = view.getFloat32(offset, true);
      var normalY = view.getFloat32(offset + 4, true);
      var normalZ = view.getFloat32(offset + 8, true);
      for (var vertex = 0; vertex < 3; vertex += 1) {
        var vertexOffset = offset + 12 + vertex * 12;
        var x = view.getFloat32(vertexOffset, true);
        var y = view.getFloat32(vertexOffset + 4, true);
        var z = view.getFloat32(vertexOffset + 8, true);
        positions[outputOffset] = x;
        positions[outputOffset + 1] = y;
        positions[outputOffset + 2] = z;
        normals[outputOffset] = normalX;
        normals[outputOffset + 1] = normalY;
        normals[outputOffset + 2] = normalZ;
        minimum[0] = Math.min(minimum[0], x);
        minimum[1] = Math.min(minimum[1], y);
        minimum[2] = Math.min(minimum[2], z);
        maximum[0] = Math.max(maximum[0], x);
        maximum[1] = Math.max(maximum[1], y);
        maximum[2] = Math.max(maximum[2], z);
        outputOffset += 3;
      }
    }

    return {
      name: part.name,
      color: colorVector(part.color),
      positions: positions,
      normals: normals,
      minimum: minimum,
      maximum: maximum,
      vertexCount: triangleCount * 3
    };
  }

  function createMeshBuffers(mesh) {
    mesh.positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, mesh.positions, gl.STATIC_DRAW);
    mesh.normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, mesh.normals, gl.STATIC_DRAW);
    mesh.positions = null;
    mesh.normals = null;
  }

  function resizeCanvas() {
    if (!gl) return;
    var pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    var width = Math.max(1, Math.round(stage.clientWidth * pixelRatio));
    var height = Math.max(1, Math.round(stage.clientHeight * pixelRatio));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      gl.viewport(0, 0, width, height);
    }
    render();
  }

  function render() {
    if (!program || !meshes.length) return;
    var aspect = Math.max(canvas.width / Math.max(canvas.height, 1), 0.01);
    var near = Math.max(modelRadius / 100, 0.01);
    var far = Math.max(modelRadius * 30, cameraDistance + modelRadius * 4);
    var projection = orthographicMatrix(-viewScale * aspect, viewScale * aspect, -viewScale, viewScale, near, far);
    var view = translationMatrix(0, 0, -cameraDistance);
    var model = multiplyMatrices(rotationZMatrix(rotationZ), multiplyMatrices(rotationYMatrix(rotationY), rotationXMatrix(rotationX)));
    var mvp = multiplyMatrices(multiplyMatrices(projection, view), model);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.useProgram(program);
    gl.uniformMatrix4fv(mvpLocation, false, mvp);
    gl.uniformMatrix4fv(modelLocation, false, model);

    meshes.forEach(function (mesh) {
      gl.bindBuffer(gl.ARRAY_BUFFER, mesh.positionBuffer);
      gl.enableVertexAttribArray(positionLocation);
      gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, mesh.normalBuffer);
      gl.enableVertexAttribArray(normalLocation);
      gl.vertexAttribPointer(normalLocation, 3, gl.FLOAT, false, 0, 0);
      gl.uniform3fv(colorLocation, mesh.color);
      gl.drawArrays(gl.TRIANGLES, 0, mesh.vertexCount);
    });
  }

  function resetView() {
    // Match the CAD reference: front flange lower-left, rear flange upper-right, viewed from above.
    rotationX = Math.asin(1 / Math.sqrt(3));
    rotationY = -Math.PI / 4;
    rotationZ = -14 * Math.PI / 180;
    viewScale = initialViewScale;
    render();
  }

  function clampZoom() {
    viewScale = Math.max(modelRadius * 0.65, Math.min(modelRadius * 4, viewScale));
  }

  function pointerDistance() {
    var values = Array.from(pointers.values());
    if (values.length < 2) return null;
    var deltaX = values[0].x - values[1].x;
    var deltaY = values[0].y - values[1].y;
    return Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  }

  function handlePointerDown(event) {
    canvas.setPointerCapture(event.pointerId);
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.size === 1) lastSinglePoint = { x: event.clientX, y: event.clientY };
    if (pointers.size === 2) lastPinchDistance = pointerDistance();
  }

  function handlePointerMove(event) {
    if (!pointers.has(event.pointerId)) return;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.size === 1 && lastSinglePoint) {
      rotationY += (event.clientX - lastSinglePoint.x) * 0.008;
      rotationX += (event.clientY - lastSinglePoint.y) * 0.008;
      rotationX = Math.max(-Math.PI * 0.49, Math.min(Math.PI * 0.49, rotationX));
      lastSinglePoint = { x: event.clientX, y: event.clientY };
      render();
    } else if (pointers.size === 2) {
      var distance = pointerDistance();
      if (distance && lastPinchDistance) {
        viewScale *= lastPinchDistance / distance;
        clampZoom();
        render();
      }
      lastPinchDistance = distance;
    }
  }

  function handlePointerEnd(event) {
    pointers.delete(event.pointerId);
    lastSinglePoint = pointers.size === 1 ? Array.from(pointers.values())[0] : null;
    lastPinchDistance = pointers.size === 2 ? pointerDistance() : null;
  }

  function loadAssembly() {
    if (!parts.length) throw new Error('The embedded 2028 assembly data is unavailable.');
    setStatus('Loading 2028 assembly… 0 / ' + parts.length);
    var loaded = 0;
    var loadedMeshes = parts.map(function (part) {
      var mesh = parseBinaryStl(decodeBase64Stl(part.data), part);
      loaded += 1;
      setStatus('Loading 2028 assembly… ' + loaded + ' / ' + parts.length);
      return mesh;
    });

    var differential = loadedMeshes.find(function (mesh) { return mesh.name === 'Drexler differential'; });
    if (!differential) throw new Error('The differential STL is unavailable.');
    var center = [
      (differential.minimum[0] + differential.maximum[0]) / 2,
      (differential.minimum[1] + differential.maximum[1]) / 2,
      (differential.minimum[2] + differential.maximum[2]) / 2
    ];
    modelRadius = 1;

    loadedMeshes.forEach(function (mesh) {
      for (var offset = 0; offset < mesh.positions.length; offset += 3) {
        mesh.positions[offset] -= center[0];
        mesh.positions[offset + 1] -= center[1];
        mesh.positions[offset + 2] -= center[2];
        modelRadius = Math.max(modelRadius, Math.hypot(mesh.positions[offset], mesh.positions[offset + 1], mesh.positions[offset + 2]));
      }
      createMeshBuffers(mesh);
    });
    meshes = loadedMeshes;

    cameraDistance = modelRadius * 2;
    initialViewScale = modelRadius * 0.96;
    viewScale = initialViewScale;
    resizeCanvas();
    setStatus('Interactive 3D assembly ready', 'is-ready');
  }

  async function initializeViewer() {
    if (!gl) {
      setStatus('3D viewing is not supported in this browser.', 'has-error');
      return;
    }
    try {
      program = createProgram();
      positionLocation = gl.getAttribLocation(program, 'a_position');
      normalLocation = gl.getAttribLocation(program, 'a_normal');
      mvpLocation = gl.getUniformLocation(program, 'u_mvp');
      modelLocation = gl.getUniformLocation(program, 'u_model');
      colorLocation = gl.getUniformLocation(program, 'u_color');
      gl.clearColor(0, 0, 0, 0);
      gl.enable(gl.DEPTH_TEST);
      gl.depthFunc(gl.LEQUAL);
      canvas.tabIndex = 0;
      canvas.setAttribute('role', 'img');
      canvas.setAttribute('aria-label', 'Interactive 3D model. Drag to rotate, scroll or pinch to zoom.');
      stage.appendChild(canvas);
      loadAssembly();
    } catch (error) {
      console.error('Unable to load the inline 2028 differential-mount assembly.', error);
      setStatus('The 3D assembly could not be loaded.', 'has-error');
    }
  }

  canvas.addEventListener('pointerdown', handlePointerDown);
  canvas.addEventListener('pointermove', handlePointerMove);
  canvas.addEventListener('pointerup', handlePointerEnd);
  canvas.addEventListener('pointercancel', handlePointerEnd);
  canvas.addEventListener('wheel', function (event) {
    event.preventDefault();
    viewScale *= Math.exp(event.deltaY * 0.0014);
    clampZoom();
    render();
  }, { passive: false });
  canvas.addEventListener('keydown', function (event) {
    var handled = true;
    if (event.key === 'ArrowLeft') rotationY -= 0.09;
    else if (event.key === 'ArrowRight') rotationY += 0.09;
    else if (event.key === 'ArrowUp') rotationX -= 0.09;
    else if (event.key === 'ArrowDown') rotationX += 0.09;
    else if (event.key === '+' || event.key === '=') viewScale *= 0.9;
    else if (event.key === '-' || event.key === '_') viewScale *= 1.1;
    else handled = false;
    if (handled) {
      event.preventDefault();
      clampZoom();
      render();
    }
  });
  canvas.addEventListener('webglcontextlost', function (event) {
    event.preventDefault();
    setStatus('The 3D viewer paused. Refresh to reload it.', 'has-error');
  });
  resetButton.addEventListener('click', resetView);
  if (window.ResizeObserver) new ResizeObserver(resizeCanvas).observe(stage);
  else window.addEventListener('resize', resizeCanvas);

  initializeViewer();
}());
