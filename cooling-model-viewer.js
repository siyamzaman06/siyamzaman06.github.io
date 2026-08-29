(function () {
  'use strict';

  var dialog = document.querySelector('#coolingModelDialog');
  var trigger = document.querySelector('[data-cooling-model]');
  var closeButton = dialog && dialog.querySelector('[data-model-close]');
  var resetButton = dialog && dialog.querySelector('[data-model-reset]');
  var stage = dialog && dialog.querySelector('.model-viewer-stage');
  var status = dialog && dialog.querySelector('.model-viewer-status');

  if (!dialog || !trigger || !closeButton || !resetButton || !stage || !status) return;

  var initialized = false;
  var loadingPromise;
  var renderer;
  var scene;
  var camera;
  var controls;
  var assembly;
  var modelRadius = 1;
  var frameId;
  var dataScriptPromise;

  var partColors = {
    duct: { color: 0x3f4652, roughness: 0.52, metalness: 0.18 },
    fanFrame: { color: 0x171c26, roughness: 0.48, metalness: 0.18 },
    impeller: { color: 0x252f43, roughness: 0.42, metalness: 0.12 },
    logo: { color: 0x7aa2f7, roughness: 0.38, metalness: 0.1 },
    aluminum: { color: 0xb7c0ca, roughness: 0.3, metalness: 0.72 },
    heatsink: { color: 0x7f96a3, roughness: 0.34, metalness: 0.68 },
    mount: { color: 0x555e68, roughness: 0.48, metalness: 0.3 },
    blackSteel: { color: 0x242832, roughness: 0.3, metalness: 0.72 },
    steel: { color: 0xaeb8c3, roughness: 0.27, metalness: 0.78 },
    rubber: { color: 0x11141b, roughness: 0.86, metalness: 0 }
  };

  function setStatus(message, state) {
    status.textContent = message;
    status.classList.remove('is-ready', 'has-error');
    if (state) status.classList.add(state);
  }

  function resizeViewer() {
    if (!renderer || !camera) return;
    var width = Math.max(stage.clientWidth, 1);
    var height = Math.max(stage.clientHeight, 1);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  }

  function resetView() {
    if (!camera || !controls) return;
    camera.position.set(modelRadius * 2.1, modelRadius * 1.25, modelRadius * 0.6);
    camera.near = Math.max(modelRadius / 500, 0.01);
    camera.far = modelRadius * 20;
    camera.updateProjectionMatrix();
    controls.target.set(0, 0, 0);
    controls.minDistance = modelRadius * 0.72;
    controls.maxDistance = modelRadius * 8;
    controls.update();
  }

  function renderFrame() {
    if (!dialog.open) {
      frameId = undefined;
      return;
    }
    controls.update();
    renderer.render(scene, camera);
    frameId = window.requestAnimationFrame(renderFrame);
  }

  function startRendering() {
    if (!frameId && renderer) renderFrame();
  }

  function stopRendering() {
    if (!frameId) return;
    window.cancelAnimationFrame(frameId);
    frameId = undefined;
  }

  function loadDataScript() {
    if (window.coolingAssemblyData) return Promise.resolve(window.coolingAssemblyData);
    if (dataScriptPromise) return dataScriptPromise;
    setStatus('Loading assembly data…');
    dataScriptPromise = new Promise(function (resolve, reject) {
      var script = document.createElement('script');
      script.src = 'cooling-assembly-data.js';
      script.onload = function () {
        if (window.coolingAssemblyData) resolve(window.coolingAssemblyData);
        else reject(new Error('The assembly data was empty.'));
      };
      script.onerror = function () { reject(new Error('The assembly data could not be loaded.')); };
      document.head.appendChild(script);
    });
    return dataScriptPromise;
  }

  function decodeBinaryStl(base64) {
    var raw = window.atob(base64);
    var bytes = new Uint8Array(raw.length);
    for (var i = 0; i < raw.length; i += 1) bytes[i] = raw.charCodeAt(i);
    var view = new DataView(bytes.buffer);
    if (bytes.byteLength < 84) throw new Error('Invalid STL data.');
    var triangleCount = view.getUint32(80, true);
    var expectedLength = 84 + triangleCount * 50;
    if (expectedLength > bytes.byteLength) throw new Error('Incomplete STL data.');
    var positions = new Float32Array(triangleCount * 9);
    var normals = new Float32Array(triangleCount * 9);
    var positionOffset = 0;
    for (var triangle = 0; triangle < triangleCount; triangle += 1) {
      var offset = 84 + triangle * 50;
      var nx = view.getFloat32(offset, true);
      var ny = view.getFloat32(offset + 4, true);
      var nz = view.getFloat32(offset + 8, true);
      for (var vertex = 0; vertex < 3; vertex += 1) {
        var vertexOffset = offset + 12 + vertex * 12;
        positions[positionOffset] = view.getFloat32(vertexOffset, true);
        positions[positionOffset + 1] = view.getFloat32(vertexOffset + 4, true);
        positions[positionOffset + 2] = view.getFloat32(vertexOffset + 8, true);
        normals[positionOffset] = nx;
        normals[positionOffset + 1] = ny;
        normals[positionOffset + 2] = nz;
        positionOffset += 3;
      }
    }
    return { positions: positions, normals: normals, triangles: triangleCount };
  }

  function createPart(part) {
    var decoded = decodeBinaryStl(part.data);
    var geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(decoded.positions, 3));
    geometry.setAttribute('normal', new THREE.BufferAttribute(decoded.normals, 3));
    geometry.computeVertexNormals();
    var appearance = partColors[part.material] || partColors.duct;
    var material = new THREE.MeshStandardMaterial({
      color: appearance.color,
      roughness: appearance.roughness,
      metalness: appearance.metalness,
      flatShading: true
    });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.name = part.name;
    assembly.add(mesh);
  }

  function initializeViewer() {
    if (initialized) return Promise.resolve();
    if (loadingPromise) return loadingPromise;
    loadingPromise = loadDataScript().then(function (parts) {
      setStatus('Preparing 23-part assembly…');
      if (!window.THREE || !THREE.WebGLRenderer || !THREE.OrbitControls) {
        throw new Error('WebGL viewer libraries are unavailable.');
      }

      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(34, 1, 0.1, 5000);
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      if ('outputEncoding' in renderer && THREE.sRGBEncoding) renderer.outputEncoding = THREE.sRGBEncoding;
      renderer.toneMapping = THREE.ACESFilmicToneMapping || THREE.LinearToneMapping;
      renderer.toneMappingExposure = 1.08;
      stage.appendChild(renderer.domElement);

      controls = new THREE.OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.075;
      controls.enablePan = true;
      controls.screenSpacePanning = true;

      scene.add(new THREE.HemisphereLight(0xdde7ff, 0x151a24, 0.72));
      var keyLight = new THREE.DirectionalLight(0xffffff, 1.35);
      keyLight.position.set(2.5, 3.5, 4.5);
      scene.add(keyLight);
      var rimLight = new THREE.DirectionalLight(0x7dcfff, 0.55);
      rimLight.position.set(-3, 1.5, -4);
      scene.add(rimLight);

      assembly = new THREE.Group();
      scene.add(assembly);
      for (var index = 0; index < parts.length; index += 1) {
        createPart(parts[index]);
        setStatus('Loading assembly… ' + (index + 1) + ' / ' + parts.length);
      }

      var bounds = new THREE.Box3().setFromObject(assembly);
      var center = bounds.getCenter(new THREE.Vector3());
      var size = bounds.getSize(new THREE.Vector3());
      assembly.position.set(-center.x, -center.y, -center.z);
      modelRadius = Math.max(size.length() * 0.52, 1);
      resetView();
      resizeViewer();
      setStatus('Drag to rotate · Scroll or pinch to zoom', 'is-ready');
      initialized = true;
    });
	    loadingPromise.catch(function (error) {
	      loadingPromise = null;
	      dataScriptPromise = null;
	      console.error('Unable to load cooling assembly model.', error);
	      setStatus('The 3D model could not be loaded. Please try again.', 'has-error');
    });
    return loadingPromise;
  }

  if (window.ResizeObserver) new ResizeObserver(resizeViewer).observe(stage);
  else window.addEventListener('resize', resizeViewer);

  trigger.addEventListener('click', function () {
    try {
      if (!dialog.open && dialog.showModal) dialog.showModal();
      else if (!dialog.open) dialog.setAttribute('open', '');
      document.body.classList.add('model-viewer-open');
      if (!initialized) setStatus('Loading assembly…');
      initializeViewer().then(function () {
        resizeViewer();
        startRendering();
      }).catch(function (error) {
        console.error('Unable to initialize cooling assembly viewer.', error);
        setStatus('The 3D model could not be loaded. Please try again.', 'has-error');
      });
    } catch (error) {
      console.error('Unable to open cooling assembly viewer.', error);
      setStatus('The 3D viewer could not be opened.', 'has-error');
    }
  });

  closeButton.addEventListener('click', function () {
    if (dialog.close) dialog.close();
    else dialog.removeAttribute('open');
  });
  resetButton.addEventListener('click', resetView);
  dialog.addEventListener('click', function (event) {
    if (event.target === dialog) {
      if (dialog.close) dialog.close();
      else dialog.removeAttribute('open');
    }
  });
  dialog.addEventListener('close', function () {
    stopRendering();
    document.body.classList.remove('model-viewer-open');
    trigger.focus({ preventScroll: true });
  });
}());
