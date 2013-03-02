/**
 * dat.globe Javascript WebGL Globe Toolkit
 * http://dataarts.github.com/dat.globe
 *
 * Copyright 2011 Data Arts Team, Google Creative Lab
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 */

var DAT = DAT || {};

DAT.Globe = function(container, colorFn) {

	colorFn = colorFn || function(x) {
		var c = new THREE.Color();
		c.setHSV( ( 0.6 - ( x * 0.5 ) ), 1.0, 1.0 );
		return c;
	};

	var Shaders = {
		'earth' : {
			uniforms: {
				'texture': { type: 't', value: 0, texture: null }
			},
			vertexShader: [
				'varying vec3 vNormal;',
				'varying vec2 vUv;',
				'void main() {',
					'gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',
					'vNormal = normalize( normalMatrix * normal );',
					'vUv = uv;',
				'}'
			].join('\n'),
			fragmentShader: [
				'uniform sampler2D texture;',
				'varying vec3 vNormal;',
				'varying vec2 vUv;',
				'void main() {',
					'vec3 diffuse = texture2D( texture, vUv ).xyz;',
					'float intensity = 1.05 - dot( vNormal, vec3( 0.0, 0.0, 1.0 ) );',
					'vec3 atmosphere = vec3( 1.0, 1.0, 1.0 ) * pow( intensity, 3.0 );',
					'gl_FragColor = vec4( diffuse + atmosphere, 1.0 );',
				'}'
			].join('\n')
		},
		'atmosphere' : {
			uniforms: {},
			vertexShader: [
				'varying vec3 vNormal;',
				'void main() {',
					'vNormal = normalize( normalMatrix * normal );',
					'gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',
				'}'
			].join('\n'),
			fragmentShader: [
				'varying vec3 vNormal;',
				'void main() {',
					'float intensity = pow( 0.8 - dot( vNormal, vec3( 0, 0, 1.0 ) ), 12.0 );',
					'gl_FragColor = vec4( 1.0, 1.0, 1.0, 1.0 ) * intensity;',
				'}'
			].join('\n')
		}
	};

	var camera, scene, sceneAtmosphere, renderer, w, h;
	var vector, mesh, atmosphere, point;

	var godSprite, thoughtSprite, godParticle, particles, selectedParticles, thoughtParticles = [], tweetLife = 30;

	var thoughtLimit = 10000, currentThought = 0;

	var tweetGeometry, tweetMaterial, tweetSelectedMaterial, nearest;

	var overRenderer;

	var imgDir = '/images/';

	var curZoomSpeed = 0;
	var zoomSpeed = 50;

	var mouse = { x: 0, y: 0 }, mouseOnDown = { x: 0, y: 0 };
	var rotation = { x: 0, y: 0 },
			target = { x: Math.PI*3/2, y: Math.PI / 6.0 },
			targetOnDown = { x: 0, y: 0 };

	var distance = 100000, distanceTarget = 100000;
	var padding = 40;
	var PI_HALF = Math.PI / 2;

	var clock, hasHand = false;
	var nearestLine;

	function init() {
		thoughtSprite = THREE.ImageUtils.loadTexture( "/images/thoughtparticle.png" );

		clock = new THREE.Clock();
		clock.start();

		container.style.color = '#fff';
		container.style.font = '13px/20px Arial, sans-serif';

		var shader, uniforms, material;
		w = container.offsetWidth || window.innerWidth;
		h = container.offsetHeight || window.innerHeight;

		camera = new THREE.Camera(
				30, w / h, 1, 10000);
		camera.position.z = distance;

		vector = new THREE.Vector3();

		scene = new THREE.Scene();
		// sceneAtmosphere = new THREE.Scene();

		var geometry = new THREE.Sphere(200, 40, 30);

		shader = Shaders['earth'];
		uniforms = THREE.UniformsUtils.clone(shader.uniforms);

		uniforms['texture'].texture = THREE.ImageUtils.loadTexture(imgDir+'world' +
				'.jpg');

		material = new THREE.MeshShaderMaterial({

					uniforms: uniforms,
					vertexShader: shader.vertexShader,
					fragmentShader: shader.fragmentShader

				});

		mesh = new THREE.Mesh(geometry, material);
		mesh.matrixAutoUpdate = false;
		scene.addObject(mesh);

		// shader = Shaders['atmosphere'];
		// uniforms = THREE.UniformsUtils.clone(shader.uniforms);

		// material = new THREE.MeshShaderMaterial({

		// 			uniforms: uniforms,
		// 			vertexShader: shader.vertexShader,
		// 			fragmentShader: shader.fragmentShader

		// 		});

		// mesh = new THREE.Mesh(geometry, material);
		// mesh.scale.x = mesh.scale.y = mesh.scale.z = 1.1;
		// mesh.flipSided = true;
		// mesh.matrixAutoUpdate = false;
		// mesh.updateMatrix();
		// sceneAtmosphere.addObject(mesh);

		// geometry = new THREE.Cube(0.75, 0.75, 1, 1, 1, 1, null, false, { px: true,
		// 			nx: true, py: true, ny: true, pz: false, nz: true});

		// for (var i = 0; i < geometry.vertices.length; i++) {

		// 	var vertex = geometry.vertices[i];
		// 	vertex.position.z += 0.5;

		// }

		// point = new THREE.Mesh(geometry);

		tweetGeometry = new THREE.Sphere(1, 40, 30);

		tweetMaterial =	new THREE.ParticleBasicMaterial({
					color: 0xffffff,
					map: thoughtSprite,
					blending: THREE.AdditiveBlending,
					transparent: true,
					size: 10
				});

		// tweetMaterial = new THREE.MeshBasicMaterial({
		// 		color: 0xffffff,
		// 		shading: THREE.FlatShading
		// 		// vertexColors: THREE.FaceColors
		// 	});

		tweetSelectedMaterial =	new THREE.ParticleBasicMaterial({
					color: 0xff0000,
					map: thoughtSprite,
					blending: THREE.AdditiveBlending,
					transparent: true,
					size: 20
				});
		
		// tweetSelectedMaterial = new THREE.MeshBasicMaterial({
		// 		color: 0xff0000,
		// 		shading: THREE.FlatShading
		// 		// vertexColors: THREE.FaceColors
		// 	});

		renderer = new THREE.WebGLRenderer({antialias: true});
		renderer.autoClear = false;
		renderer.setClearColorHex(0x000000, 0.0);
		renderer.setSize(w, h);

		renderer.domElement.style.position = 'absolute';

		container.appendChild(renderer.domElement);

		container.addEventListener('mousedown', onMouseDown, false);

		container.addEventListener('mousewheel', onMouseWheel, false);

		document.addEventListener('keydown', onDocumentKeyDown, false);

		window.addEventListener('resize', onWindowResize, false);

		container.addEventListener('mouseover', function() {
			overRenderer = true;
		}, false);

		container.addEventListener('mouseout', function() {
			overRenderer = false;
		}, false);

		initParticleSystem();

		var lineMat = new THREE.LineBasicMaterial( { color: 0xff0000, opacity: 1, linewidth: 3 } );

		var lineGeometry = new THREE.Geometry();
		var from = new THREE.Vertex(
					new THREE.Vector3(0,0,0)
				);
		var to = new THREE.Vertex(
					new THREE.Vector3(1000,1000,0)
				);

		lineGeometry.vertices.push(from);
		lineGeometry.vertices.push(to);

		nearestLine = new THREE.Line(lineGeometry, lineMat);

		// scene.addChild(nearestLine);
	}

	addData = function(data, opts) {
		var lat, lng, size, color, i, step, colorFnWrapper;

		opts.animated = opts.animated || false;
		this.is_animated = opts.animated;
		opts.format = opts.format || 'magnitude'; // other option is 'legend'
		console.log(opts.format);
		if (opts.format === 'magnitude') {
			step = 3;
			colorFnWrapper = function(data, i) { return colorFn(data[i+2]); }
		} else if (opts.format === 'legend') {
			step = 4;
			colorFnWrapper = function(data, i) { return colorFn(data[i+3]); }
		} else {
			throw('error: format not supported: '+opts.format);
		}

		if (opts.animated) {
			if (this._baseGeometry === undefined) {
				this._baseGeometry = new THREE.Geometry();
				for (i = 0; i < data.length; i += step) {
					lat = data[i];
					lng = data[i + 1];
//				size = data[i + 2];
					color = colorFnWrapper(data,i);
					size = 0;
					addPoint(lat, lng, size, color, this._baseGeometry);
				}
			}
			if(this._morphTargetId === undefined) {
				this._morphTargetId = 0;
			} else {
				this._morphTargetId += 1;
			}
			opts.name = opts.name || 'morphTarget'+this._morphTargetId;
		}
		var subgeo = new THREE.Geometry();
		for (i = 0; i < data.length; i += step) {
			lat = data[i];
			lng = data[i + 1];
			color = colorFnWrapper(data,i);
			size = data[i + 2];
			size = size*200;
			addPoint(lat, lng, size, color, subgeo);
		}
		if (opts.animated) {
			this._baseGeometry.morphTargets.push({'name': opts.name, vertices: subgeo.vertices});
		} else {
			this._baseGeometry = subgeo;
		}

	};

	function initParticleSystem() {
		// create the particle variables
		particles = new THREE.Geometry();
		var particleCount = thoughtLimit,
			pMaterial = tweetMaterial;

		// now create the individual particles
		for(var p = 0; p < particleCount; p++) {
			// create a particle with random
			// position values, -250 -> 250
			var particle = new THREE.Vertex(
						new THREE.Vector3(0,0,0)
						// new THREE.Vector3(Math.random() * 500 - 250, Math.random() * 500 - 250, Math.random() * 500 - 250)
					);

			// add it to the geometry
			particles.vertices.push(particle);
		}

		// create the particle system
		var thoughtParticleSystem =
		  new THREE.ParticleSystem(
			particles,
			tweetMaterial);

		thoughtParticleSystem.sortParticles = true;

		// add it to the scene
		scene.addChild(thoughtParticleSystem);




		// create the particle variables
		selectedParticles = new THREE.Geometry();

		var particle = new THREE.Vertex(
					new THREE.Vector3(0,0,0)
				);

		// add it to the geometry
		selectedParticles.vertices.push(particle);

		// create the particle system
		var pSystem =
		  new THREE.ParticleSystem(
			selectedParticles,
			tweetSelectedMaterial);

		pSystem.sortParticles = true;

		// add it to the scene
		scene.addChild(pSystem);
	}

	addTweet = function (tweet) {
		if (tweet.geo != null) {
			if (thoughtParticles.length < thoughtLimit) {
				thoughtParticles.push( {birth:clock.getElapsedTime(), data:tweet, particle: updateParticleLatLon(particles, currentThought, tweet.geo.coordinates[0], tweet.geo.coordinates[1])} );
				// console.log(tweet);
			} else {
				var dyingThought = thoughtParticles.shift();
				// console.log("killed:", dyingThought);
				scene.removeObject( dyingThought );
				thoughtParticles.push( {birth:clock.getElapsedTime(), data:tweet, particle: updateParticleLatLon(particles, currentThought, tweet.geo.coordinates[0], tweet.geo.coordinates[1])} );
			}
			currentThought++;
		}
	}

	function cleanTweets() {
		// kill particles
		var i,l = thoughtParticles.length, t;
		selectedParticles.vertices[0].position = new THREE.Vector3(0,0,0);
		for (i=l-1;i>=0;--i) {
			t = thoughtParticles[i];
			if (clock.getElapsedTime() - t.birth > tweetLife) {
				// console.log("kill",t);
				t.particle.position = new THREE.Vector3(0,0,0);
				thoughtParticles.splice(i, 1);
			}
		}
		if (hasHand && nearest) {
			updateParticleLatLon(selectedParticles, 0, nearest.data.geo.coordinates[0], nearest.data.geo.coordinates[1]);
		}
	}

	findNearestTweet = function () {
		var i,l = thoughtParticles.length, t, newNear, lowest = 100000, d;

		if (l>0) {
			for (i=0;i<l;++i) {
				t = thoughtParticles[i];
				// t.particle.alpha = 1;
				d = t.particle.position.distanceTo( camera.position );
				// if (t.particle.material!=tweetMaterial) {
				// 	t.particle.material = tweetMaterial;
				// }
				if (d < lowest) {
					lowest = d;
					newNear = t;
				}
			}
			// console.log( "nearest", nearest );
			// newNear.particle.material = tweetSelectedMaterial;
			if (nearest != newNear) {
				nearest = newNear;
				// console.log("clock:", clock.getElapsedTime(), nearest);
			}
			// nearest.particle.alpha = 0;
		}

		// if (nearest) {
		// 	nearestLine.geometry.vertices[0] = new THREE.Vertex(
		// 				0,0,0
		// 			);
		// 	nearestLine.geometry.vertices[1] = new THREE.Vertex(
		// 				nearest.particle.position
		// 			);
		// }

		// if (Math.random()<0.001) console.log(nearestLine);

		return nearest;
	}

	updateParticleLatLon = function(p, index, lat, lng) {
		// console.log("updateParticleLatLon: ", lat, lng, index)
		var phi = (90 - lat) * Math.PI / 180;
		var theta = (180 - lng) * Math.PI / 180;


		var point = p.vertices[index];

		point.position.x = 200 * Math.sin(phi) * Math.cos(theta);
		point.position.y = 200 * Math.cos(phi);
		point.position.z = 200 * Math.sin(phi) * Math.sin(theta);

		return point;
	};

	/*
	add a sphere in the given lat lon
	*/
	addSpherePoint = function(lat, lng, size) {
		// console.log("addSpherePoint: ", lat, lng, size)
		var phi = (90 - lat) * Math.PI / 180;
		var theta = (180 - lng) * Math.PI / 180;


		var point = new THREE.Mesh(tweetGeometry, tweetMaterial);

		point.position.x = 200 * Math.sin(phi) * Math.cos(theta);
		point.position.y = 200 * Math.cos(phi);
		point.position.z = 200 * Math.sin(phi) * Math.sin(theta);

		// point.lookAt(mesh.position);

		// point.scale.z = -size;
		point.updateMatrix();

		// var i;
		// for (i = 0; i < point.geometry.faces.length; i++) {

		//	point.geometry.faces[i].color = color;

		// }

		scene.addObject(point);

		// console.log("point: ", point)

		return point;

		// GeometryUtils.merge(subgeo, point);
	};

	setHand = function(hand) {
		hasHand = hand;
	}

	function createPoints() {
		if (this._baseGeometry !== undefined) {
			if (this.is_animated === false) {
				this.points = new THREE.Mesh(this._baseGeometry, new THREE.MeshBasicMaterial({
				color: 0xffffff,
				vertexColors: THREE.FaceColors,
				morphTargets: false
			}));
			} else {
				if (this._baseGeometry.morphTargets.length < 8) {
					console.log('t l',this._baseGeometry.morphTargets.length);
					var padding = 8-this._baseGeometry.morphTargets.length;
					console.log('padding', padding);
					for(var i=0; i<=padding; i++) {
			console.log('padding',i);
			this._baseGeometry.morphTargets.push({'name': 'morphPadding'+i, vertices: this._baseGeometry.vertices});
					}
				}
				this.points = new THREE.Mesh(this._baseGeometry, new THREE.MeshBasicMaterial({
				color: 0xffffff,
				vertexColors: THREE.FaceColors,
				morphTargets: true
			}));
			}
			scene.addObject(this.points);
		}
	}

	function addPoint(lat, lng, size, color, subgeo) {
		var phi = (90 - lat) * Math.PI / 180;
		var theta = (180 - lng) * Math.PI / 180;

		point.position.x = 200 * Math.sin(phi) * Math.cos(theta);
		point.position.y = 200 * Math.cos(phi);
		point.position.z = 200 * Math.sin(phi) * Math.sin(theta);

		point.lookAt(mesh.position);

		point.scale.z = -size;
		point.updateMatrix();

		var i;
		for (i = 0; i < point.geometry.faces.length; i++) {

			point.geometry.faces[i].color = color;

		}

		GeometryUtils.merge(subgeo, point);
	}

	function onMouseDown(event) {
		event.preventDefault();

		container.addEventListener('mousemove', onMouseMove, false);
		container.addEventListener('mouseup', onMouseUp, false);
		container.addEventListener('mouseout', onMouseOut, false);

		mouseOnDown.x = - event.clientX;
		mouseOnDown.y = event.clientY;

		targetOnDown.x = target.x;
		targetOnDown.y = target.y;

		container.style.cursor = 'move';
	}

	function onMouseMove(event) {
		mouse.x = - event.clientX;
		mouse.y = event.clientY;

		var zoomDamp = distance/1000;

		target.x = targetOnDown.x + (mouse.x - mouseOnDown.x) * 0.005 * zoomDamp;
		target.y = targetOnDown.y + (mouse.y - mouseOnDown.y) * 0.005 * zoomDamp;

		// target.y = target.y > PI_HALF ? PI_HALF : target.y;
		// target.y = target.y < - PI_HALF ? - PI_HALF : target.y;
	}

	function onMouseUp(event) {
		container.removeEventListener('mousemove', onMouseMove, false);
		container.removeEventListener('mouseup', onMouseUp, false);
		container.removeEventListener('mouseout', onMouseOut, false);
		container.style.cursor = 'auto';
	}

	function onMouseOut(event) {
		container.removeEventListener('mousemove', onMouseMove, false);
		container.removeEventListener('mouseup', onMouseUp, false);
		container.removeEventListener('mouseout', onMouseOut, false);
	}

	function onMouseWheel(event) {
		event.preventDefault();
		if (overRenderer) {
			zoom(event.wheelDeltaY * 0.3);
		}
		return false;
	}

	function onDocumentKeyDown(event) {
		switch (event.keyCode) {
			case 38:
				zoom(100);
				event.preventDefault();
				break;
			case 40:
				zoom(-100);
				event.preventDefault();
				break;
		}
	}

	function onWindowResize( event ) {
		console.log('resize');
		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();
		renderer.setSize( window.innerWidth, window.innerHeight );
	}

	function zoom(delta) {
		distanceTarget -= delta;
		distanceTarget = distanceTarget > 1000 ? 1000 : distanceTarget;
		distanceTarget = distanceTarget < 350 ? 350 : distanceTarget;
	}

	setDistance = function (distance) {
		distanceTarget = distance;
		distanceTarget = distanceTarget > 1000 ? 1000 : distanceTarget;
		distanceTarget = distanceTarget < 350 ? 350 : distanceTarget;
	}

	function animate() {
		requestAnimationFrame(animate);
		render();
	}

	setRotation = function(positionVector) {
		positionVector.x *= .0001;
		positionVector.y *= .0001;

		if (camera.up.y < 0) {
			target.x -= positionVector.x;
		} else {
			target.x += positionVector.x;
		}

		target.y += positionVector.y;

		// target.y += .01;
		// target.y += positionVector.y;
		// console.log(target.y, PI_HALF)
		// target.y = target.y > PI_HALF ? PI_HALF : target.y;
		// target.y = target.y < - PI_HALF ? - PI_HALF : target.y;
	};

	function render() {
		cleanTweets();
		
		setRotation({x:0,y:0});

		zoom(curZoomSpeed);

		rotation.x += (target.x - rotation.x) * 0.1;
		rotation.y += (target.y - rotation.y) * 0.1;
		distance += (distanceTarget - distance) * 0.3;

		camera.position.x = distance * Math.sin(rotation.x) * Math.cos(rotation.y);
		camera.position.y = distance * Math.sin(rotation.y);
		camera.position.z = distance * Math.cos(rotation.x) * Math.cos(rotation.y);

		var temp;
		temp = (rotation.y - PI_HALF)%(Math.PI*2);
		temp = temp < 0 ? temp + (Math.PI * 2) : temp;
		temp -= Math.PI;

		// temp = ((rotation.y - PI_HALF) / (2 * Math.PI)) - Math.PI;

		camera.up.y = temp < 0 ? -1 : 1;

		// $("#tweet").html("cam:" + camera.up.y + "<br />" + temp + "<br />rx:" + rotation.x + "<br />ry:" + rotation.y);

		vector.copy(camera.position);

		renderer.clear();
		renderer.render(scene, camera);
		// renderer.render(sceneAtmosphere, camera);
	}

	init();
	this.animate = animate;


	this.__defineGetter__('time', function() {
		return this._time || 0;
	});

	this.__defineSetter__('time', function(t) {
		var validMorphs = [];
		var morphDict = this.points.morphTargetDictionary;
		for(var k in morphDict) {
			if(k.indexOf('morphPadding') < 0) {
				validMorphs.push(morphDict[k]);
			}
		}
		validMorphs.sort();
		var l = validMorphs.length-1;
		var scaledt = t*l+1;
		var index = Math.floor(scaledt);
		for (i=0;i<validMorphs.length;i++) {
			this.points.morphTargetInfluences[validMorphs[i]] = 0;
		}
		var lastIndex = index - 1;
		var leftover = scaledt - index;
		if (lastIndex >= 0) {
			this.points.morphTargetInfluences[lastIndex] = 1 - leftover;
		}
		this.points.morphTargetInfluences[index] = leftover;
		this._time = t;
	});

	this.addData = addData;
	this.addSpherePoint = addSpherePoint;
	this.setRotation = setRotation;
	this.createPoints = createPoints;
	this.renderer = renderer;
	this.scene = scene;
	this.setDistance = setDistance;
	this.addTweet = addTweet;
	this.findNearestTweet = findNearestTweet;
	this.setHand = setHand;

	return this;

};

