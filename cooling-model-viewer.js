(function () {
  'use strict';

  var dialog = document.querySelector('#coolingModelDialog');
  var trigger = document.querySelector('[data-cooling-model]');
  var fsaeStage = document.querySelector('[data-fsae-model-stage]');
  var coolingInlineStage = document.querySelector('[data-cooling-model-inline]');

  // Inline and expanded viewers share the same rendering code, but keep independent controls.
  function mountViewer(stage, resetButton, options) {
    var isFsae = Boolean(options.isFsae);
    var isModal = Boolean(options.isModal);
    var closeButton = isModal && dialog.querySelector('[data-model-close]');
    var status = stage && stage.querySelector('.model-viewer-status');

    if (!resetButton || !stage || !status || (isModal && !closeButton)) return;

    var initialized = false;
    var loadingPromise;
    var renderer;
    var scene;
    var camera;
    var controls;
    var assembly;
    var presentation;
    var modelRadius = 1;
    var frameId;
    var dataScriptPromise;
    var runtimePromise;
    var threeRuntimeUrl = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
    var orbitControlsUrl = 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js';

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
    var fsaeColors = {
      'Left mount': 0x6f7e97,
      'Right mount': 0x6f7e97,
      'Left cam': 0x56647a,
      'Right cam': 0x56647a,
      '50 x 72 x 12 bearing': 0x8490a0,
      '55 x 100 x 21 bearing': 0x8490a0,
      'Drexler differential': 0x394559
    };

    function setStatus(message, state) {
      if (isFsae && state !== 'has-error') {
        status.textContent = '';
        status.classList.remove('is-ready', 'has-error');
        return;
      }
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
      if (isFsae && presentation) {
        presentation.rotation.y = 20 * Math.PI / 180;
        presentation.rotation.x = 0 * Math.PI / 180;
      }
      var verticalFov = camera.fov * Math.PI / 180;
      var horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * Math.max(camera.aspect, 0.1));
      var limitingFov = Math.min(verticalFov, horizontalFov);
      var fitDistance = modelRadius * 1.12 / Math.sin(Math.max(limitingFov / 2, 0.08));
      if (isFsae) fitDistance *= Math.pow(0.95, 5);
      var viewDirection = new THREE.Vector3(2.1, 1.25, 0.6).normalize();
      camera.position.copy(viewDirection.multiplyScalar(fitDistance));
      camera.near = Math.max(modelRadius / 500, 0.01);
      camera.far = modelRadius * 20;
      camera.updateProjectionMatrix();
      controls.target.set(0, 0, 0);
      controls.minDistance = modelRadius * 0.9;
      controls.maxDistance = Math.max(modelRadius * 8, fitDistance * 2);
      controls.update();
    }

    function renderFrame() {
      if (isModal && !dialog.open) {
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

    function loadExternalScript(src, ready) {
      if (ready()) return Promise.resolve();
      return new Promise(function (resolve, reject) {
        var existing = document.querySelector('script[data-viewer-runtime="' + src + '"]');
        if (existing) {
          existing.addEventListener('load', function () { ready() ? resolve() : reject(new Error('Viewer runtime did not initialize.')); }, { once: true });
          existing.addEventListener('error', function () { reject(new Error('Viewer runtime could not be loaded.')); }, { once: true });
          return;
        }
        var script = document.createElement('script');
        script.src = src;
        script.async = true;
        script.dataset.viewerRuntime = src;
        script.onload = function () { ready() ? resolve() : reject(new Error('Viewer runtime did not initialize.')); };
        script.onerror = function () { reject(new Error('Viewer runtime could not be loaded.')); };
        document.head.appendChild(script);
      });
    }

    function loadViewerRuntime() {
      if (window.THREE && THREE.WebGLRenderer && THREE.OrbitControls) return Promise.resolve();
      if (runtimePromise) return runtimePromise;
      setStatus('Loading 3D viewer…');
      runtimePromise = loadExternalScript(threeRuntimeUrl, function () {
        return Boolean(window.THREE && THREE.WebGLRenderer);
      }).then(function () {
        return loadExternalScript(orbitControlsUrl, function () {
          return Boolean(window.THREE && THREE.OrbitControls);
        });
      }).catch(function (error) {
        runtimePromise = null;
        throw error;
      });
      return runtimePromise;
    }

    function loadDataScript() {
      var data = isFsae ? window.fsaeAssemblyData : window.coolingAssemblyData;
      if (data) return Promise.resolve(data);
      if (dataScriptPromise) return dataScriptPromise;
      setStatus('Loading assembly data…');
      dataScriptPromise = new Promise(function (resolve, reject) {
        var script = document.createElement('script');
        script.src = isFsae ? 'fsae-assembly-data.js?v=20260901d' : 'cooling-assembly-data.js?v=20260829';
        script.onload = function () {
          var loadedData = isFsae ? window.fsaeAssemblyData : window.coolingAssemblyData;
          if (loadedData) resolve(loadedData);
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
      var appearance = isFsae ? { color: fsaeColors[part.name] || part.color, roughness: 0.58, metalness: 0.18 } : (partColors[part.material] || partColors.duct);
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

    function buildParts(parts) {
      return new Promise(function (resolve, reject) {
        var index = 0;
        function buildBatch() {
          try {
            var batchEnd = Math.min(index + 2, parts.length);
            while (index < batchEnd) {
              createPart(parts[index]);
              index += 1;
            }
            setStatus('Loading assembly… ' + index + ' / ' + parts.length);
            if (index < parts.length) window.requestAnimationFrame(buildBatch);
            else resolve();
          } catch (error) {
            reject(error);
          }
        }
        buildBatch();
      });
    }

    function initializeViewer() {
      if (initialized) return Promise.resolve();
      if (loadingPromise) return loadingPromise;
      loadingPromise = Promise.all([loadViewerRuntime(), loadDataScript()]).then(function (results) {
        var parts = results[1];
        setStatus('Preparing assembly…');
        if (!window.THREE || !THREE.WebGLRenderer || !THREE.OrbitControls) {
          throw new Error('WebGL viewer libraries are unavailable.');
        }

        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(34, 1, 0.1, 5000);
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        if ('outputEncoding' in renderer && THREE.sRGBEncoding) renderer.outputEncoding = THREE.sRGBEncoding;
        renderer.toneMapping = THREE.ACESFilmicToneMapping || THREE.LinearToneMapping;
        renderer.toneMappingExposure = isFsae ? 0.72 : 1.08;
        stage.appendChild(renderer.domElement);

        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.075;
        controls.enablePan = true;
        controls.screenSpacePanning = true;

        scene.add(new THREE.HemisphereLight(0xdde7ff, 0x151a24, isFsae ? 0.38 : 0.72));
        var keyLight = new THREE.DirectionalLight(0xffffff, isFsae ? 0.78 : 1.35);
        keyLight.position.set(2.5, 3.5, 4.5);
        scene.add(keyLight);
        var rimLight = new THREE.DirectionalLight(0x7dcfff, isFsae ? 0.22 : 0.55);
        rimLight.position.set(-3, 1.5, -4);
        scene.add(rimLight);

        presentation = new THREE.Group();
        scene.add(presentation);
        assembly = new THREE.Group();
        presentation.add(assembly);
        return buildParts(parts).then(function () {
          var bounds = new THREE.Box3().setFromObject(assembly);
          var center = bounds.getCenter(new THREE.Vector3());
          if (isFsae) {
            var differential = assembly.getObjectByName('Drexler differential');
            if (differential) {
              differential.geometry.computeBoundingBox();
              center = differential.geometry.boundingBox.getCenter(new THREE.Vector3());
            }
          }
          var size = bounds.getSize(new THREE.Vector3());
          assembly.position.set(-center.x, -center.y, -center.z);
          modelRadius = Math.max(size.length() * 0.52, 1);
          resizeViewer();
          resetView();
          setStatus(isFsae ? '' : 'Drag to rotate · Scroll or pinch to zoom', 'is-ready');
          initialized = true;
        });
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

    resetButton.addEventListener('click', resetView);
    if (isModal) {
      trigger.addEventListener('click', function () {
        if (!dialog.open && dialog.showModal) dialog.showModal();
        else if (!dialog.open) dialog.setAttribute('open', '');
        document.body.classList.add('model-viewer-open');
        if (!initialized) setStatus('Loading 3D viewer…');
        initializeViewer().then(function () {
          resizeViewer();
          startRendering();
        }).catch(function (error) {
          console.error('Unable to initialize cooling assembly viewer.', error);
          setStatus('The 3D model could not be loaded. Please try again.', 'has-error');
        });
      });
      closeButton.addEventListener('click', function () { dialog.close(); });
      dialog.addEventListener('click', function (event) { if (event.target === dialog) dialog.close(); });
      dialog.addEventListener('close', function () {
        stopRendering();
        document.body.classList.remove('model-viewer-open');
        trigger.focus({ preventScroll: true });
      });
    } else {
      setStatus('Loading 3D viewer…');
      initializeViewer().then(function () {
        resizeViewer();
        startRendering();
      }).catch(function (error) {
        console.error('Unable to initialize cooling assembly viewer.', error);
        setStatus('The 3D model could not be loaded. Please try again.', 'has-error');
      });
    }
  }

  if (fsaeStage) {
    mountViewer(fsaeStage, document.querySelector('[data-fsae-model-reset]'), { isFsae: true });
  }
  if (coolingInlineStage) {
    mountViewer(coolingInlineStage, document.querySelector('[data-cooling-model-inline-reset]'), {});
  }
  if (dialog && trigger) {
    mountViewer(dialog.querySelector('.model-viewer-stage'), dialog.querySelector('[data-model-reset]'), { isModal: true });
  }
}());
