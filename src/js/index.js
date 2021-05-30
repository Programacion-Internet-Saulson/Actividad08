'use strict';

const COLORS = {
    red: 0xf25346,
    white: 0xd8d0d1,
    brown: 0x59332e,
    pink: 0xF5986E,
    brownDark: 0x23190f,
    blue: 0x68c3c0,
    fog: 0xf7d9aa,
    lava: 0xcf1020,
    green: 0x19ff83,

    //Light Colors
    sky: 0xaaaaaa,
    ground: 0x000000,
}

// Game Vars
var game;
var deltaTime = 0;
var newTime = new Date().getTime();
var oldTime = new Date().getTime();
var enemiesPool = [];
var particlesPool = [];
var particlesInUse = [];

// Scene Vars
var scene;
var camera;
var fieldOfView;
var aspectRatio;
var nearPlane;
var farPlane;
var HEIGHT;
var WIDTH;
var renderer;
var container;

// Lights Vars
var ambientLight;
var hemisphereLight;
var shadowLight;

// 3D Objects Vars
var sea;
var sky;
var airplane;
var coinsHolder;
var enemiesHolder;
var particlesHolder

// UI Vars
var fieldDistance;
var energyBar;
var replayMessage;
var fieldLevel;
var levelCircle;

// Event Vars
var mousePos = { x: 0, y: 0, };

function resetGame() {
    game = {
        speed:0,
        initSpeed:.00035,
        baseSpeed:.00035,
        targetBaseSpeed:.00035,
        incrementSpeedByTime:.0000025,
        incrementSpeedByLevel:.000005,
        distanceForSpeedUpdate:100,
        speedLastUpdate:0,

        distance:0,
        ratioSpeedDistance:50,
        energy:100,
        ratioSpeedEnergy:3,

        level:1,
        levelLastUpdate:0,
        distanceForLevelUpdate:1000,

        planeDefaultHeight:100,
        planeAmpHeight:80,
        planeAmpWidth:75,
        planeMoveSensivity:0.005,
        planeRotXSensivity:0.0004,
        planeRotZSensivity:0.0008,
        planeFallSpeed:.001,
        planeMinSpeed:1.2,
        planeMaxSpeed:1.6,
        planeSpeed:0,
        planeCollisionDisplacementX:0,
        planeCollisionSpeedX:0,

        planeCollisionDisplacementY:0,
        planeCollisionSpeedY:0,

        seaRadius:600,
        seaLength:800,
        //seaRotationSpeed:0.006,
        wavesMinAmp : 5,
        wavesMaxAmp : 20,
        wavesMinSpeed : 0.001,
        wavesMaxSpeed : 0.003,

        cameraFarPos:500,
        cameraNearPos:150,
        cameraSensivity:0.002,

        coinDistanceTolerance:15,
        coinValue:3,
        coinsSpeed:.5,
        coinLastSpawn:0,
        distanceForCoinsSpawn:100,

        enemyDistanceTolerance:10,
        enemyValue:10,
        enemiesSpeed:.6,
        enemyLastSpawn:0,
        distanceForEnemiesSpawn:50,

        status : "playing",
    };
    fieldLevel.innerHTML = Math.floor(game.level);
}

// Mouse and Screen events

function handleWindowResize() {
    // update the height and width of the renderer and the camera
    HEIGHT = window.innerHeight;
    WIDTH = window.innerWidth;
    renderer.setSize(WIDTH, HEIGHT);
    camera.aspect = WIDTH / HEIGHT;
    camera.updateProjectionMatrix();
}

function handleMouseMove(event) {
    // here we are converting the mouse position value received
    // to a normalized value varying between -1 and 1;
    // this is the formula for the horizonal axis:
    var tx = -1 + (event.clientX / WIDTH) * 2;

    // for the vertical axis, we need to inverse the formula
    // because the 2D y-axis gows the opposite direction of the 3D y-axis
    var ty = 1 - (event.clientY / HEIGHT) * 2;

    mousePos = { x: tx, y: ty, };
}

function handleTouchMove(event) {
    event.preventDefault();

    var tx = -1 + (event.touches[0].pageX / WIDTH) * 2;
    var ty = 1 - (event.touches[0].pageY / HEIGHT) * 2;

    mousePos = { x: tx, y: ty, };
}

function handleMouseUp(event) {
    if (game.status === 'waitingReplay') {
        resetGame();
        hideReplay();
    }
}

function handleTouchEnd(event) {
    if (game.status === 'waitingReplay') {
        resetGame();
        hideReplay();
    }
}

// Init Three JS, Screen and mouse events

function createScene() {
    // Get the width and the height of the screen,
    // use them to set up the aspect ratio of the camera
    // and the size of the renderer
    HEIGHT = window.innerHeight;
    WIDTH = window.innerWidth;

    // Create the scene
    scene = new THREE.Scene();

    // Add a fog effect to th scene; same color as the
    // background color used in the style sheet
    scene.fog = new THREE.Fog(COLORS.fog, 100, 950);

    // Create the camera
    aspectRatio = WIDTH / HEIGHT;
    fieldOfView = 50;
    nearPlane = 0.1;
    farPlane = 10000;
    camera = new THREE.PerspectiveCamera(
        fieldOfView,
        aspectRatio,
        nearPlane,
        farPlane
    );

    // Set the position of the camera
    camera.position.x = 0;
    camera.position.y = game.planeDefaultHeight;
    camera.position.z = 200;

    // Create the renderer
    renderer = new THREE.WebGLRenderer({
        // Allow the transparency to show the gradient background
        // we defined in the CSS
        alpha: true,

        // Activate the anti-aliasing; this is less performant, but,
        // as our project is low-poly based, it should be fine :)
        antialias: true,
    })

    // Define the size of the renderer; in this case,
    // it will fill the entire screen
    renderer.setSize(WIDTH, HEIGHT);

    // Enable shadow rendering
    renderer.shadowMap.enabled = true;

    // Add the DOM element of the renderer to the
    // container we created in the HTML
    container = document.getElementById('world');
    container.appendChild(renderer.domElement);

    // Listen to the screen: if the user resizes it
    // we havve to update the camera and the renderer size
    window.addEventListener('resize', handleWindowResize, false);
}

function createLights() {
    // A hemisphere light is a gradient colored light;
    // the first parameter is the sky color, the second parameter is the ground color,
    // the third parameter is the intesity of the light
    hemisphereLight = new THREE.HemisphereLight(COLORS.sky, COLORS.ground, 0.9);

    // A directional light shines from a specific direction.
    // It acts like the sun, that means tha all the rays produced are parallel.
    shadowLight = new THREE.DirectionalLight(0xffffff, 0.9);

    // Set the direction of the light
    shadowLight.position.set(150, 350, 350);

    // Allow shadow casting
    shadowLight.castShadow = true;

    // define the visible area of the projected shadow
    shadowLight.shadow.camera.left = -400;
    shadowLight.shadow.camera.right = 400;
    shadowLight.shadow.camera.top = 400;
    shadowLight.shadow.camera.bottom = -400;
    shadowLight.shadow.camera.near = 1;
    shadowLight.shadow.camera.far = 1000;

    // define the resolution of the shadow; the higher the better,
    // but also the more expensive and less performant
    shadowLight.shadow.mapSize.width = 2048;
    shadowLight.shadow.mapSize.height = 2048;

    //an ambient light modifiers the global colors of a scene and makes the shadows softer
    ambientLight = new THREE.AmbientLight(0xdc8874, 0.5);

    // to activate the lights, jsut add them to the scene
    scene.add(hemisphereLight);
    scene.add(shadowLight);
    scene.add(ambientLight);
}

// Objects Functions

const Sea = function() {
    // create the geometry (shape) of the cylinder;
    // the parameters are: 
    // radius top, radius bottom, height, number of segments on the radius, number of segments vertically
    var geom = new THREE.CylinderGeometry(game.seaRadius, game.seaRadius,
        game.seaLength, 40, 10);
    
    // rotate the geometry on the x axis
    geom.applyMatrix(new THREE.Matrix4().makeRotationX(-Math.PI / 2));

    // important: by merging vertices we ensure associated to each vertex
    geom.mergeVertices();

    // get the vertices
    var l = geom.vertices.length;

    // create an array to store new data associated to each vertex
    this.waves = [];

    for (var i = 0; i < l; i ++) {
        var v = geom.vertices[i];

        // store some data associated to it
        this.waves.push({
            x: v.x,
            y: v.y,
            z: v.z,
            ang: Math.random() * Math.PI * 2,
            amp: game.wavesMinAmp + Math.random()
                * (game.wavesMaxAmp - game.wavesMinAmp),
            speed: game.wavesMinSpeed + Math.random()
                * (game.wavesMaxSpeed - game.wavesMinSpeed),
        });
    }
    
    // create the material 
    var mat = new THREE.MeshPhongMaterial({
        color: COLORS.lava,
        transparent: true,
        opacity: 0.8,
        flatShading: true,
    });

    // To create an object in Three.js, we have to create a mesh 
    // which is a combination of a geometry and some material
    this.mesh = new THREE.Mesh(geom, mat);
    this.mesh.name = 'waves';

    // Allow the sea to receive shadows
    this.mesh.receiveShadow = true; 
}

Sea.prototype.moveWaves = function() {
    // get the vertices
    var verts = this.mesh.geometry.vertices;
    var l = verts.length;

    for (var i = 0; i < l; i++) {
        var v = verts[i];

        // get the data associated to it
        var vprops = this.waves[i];

        // update the position of the vertex
        v.x = vprops.x + Math.cos(vprops.ang) * vprops.amp;
        v.y = vprops.y + Math.sin(vprops.ang) * vprops.amp;

        // increment the angle for the next frame
        vprops.ang += vprops.speed;
    }

    // Tell the renderer that the geometry of the sea has changed.
    // In fact, in order to maintain the best level of performance, 
    // three.js caches the geometries and ignores any changes
    // unless we add this line
    this.mesh.geometry.verticesNeedUpdate = true;
}

const Cloud = function () {
    // Create an empty container that will hold the different parts of the cloud
    this.mesh = new THREE.Object3D();
    this.mesh.name = 'cloud';
    // create a cube geometry;
    // this shape will be duplicated to create the cloud
    var geom = new THREE.SphereGeometry(20, 32, 32);
    
    // create a material; a simple white material will do the trick
    var mat = new THREE.MeshPhongMaterial({
        color: COLORS.blue,
    });
    
    // duplicate the geometry a random number of times
    var nBlocs = 5 + Math.floor(Math.random() * 3);
    for (var i = 0; i < nBlocs; i++){
        // create the mesh by cloning the geometry
        var m = new THREE.Mesh(geom, mat); 
        
        // set the position and the rotation of each cube randomly
        m.position.x = i * 10;
        m.position.y = Math.random() * 5;
        m.position.z = Math.random() * 5;
        m.rotation.z = Math.random() * Math.PI * 2;
        m.rotation.y = Math.random() * Math.PI * 2;
        
        // set the size of the sphere randomly
        var s = 0.5 + Math.random() * 0.5;
        m.scale.set(s, s, s);
        
        // allow each cube to cast and to receive shadows
        m.castShadow = true;
        m.receiveShadow = true;
        
        // add the cube to the container we first created
        this.mesh.add(m);
    }
}

Cloud.prototype.rotate = function() {
    var l = this.mesh.children.length;

    for (var i = 0; i < l; i++) {
        var m = this.mesh.children[i];
        m.rotation.y += Math.random() * 0.002 * (i + 1);
        m.rotation.z += Math.random() * 0.005 * (i + 1);
    }
}

const Sky = function() {
    // Create an empty container
    this.mesh = new THREE.Object3D();

    // choose a number of clouds to be scattered in the sky
    this.nClouds = 20;

    this.clouds = [];

    // To distribute the clouds consistently,
    // we need to place them according to a uniform angle
    const stepAngle = Math.PI * 2 / this.nClouds;

    for (var i = 0; i < this.nClouds; i++) {
        var c = new Cloud();
        this.clouds.push(c);

        // set the rotation and the position of each cloud;
        // for what we use a bit of trigonometry
        var a  = stepAngle * i; // this is the final angle of the cloud
        var h = game.seaRadius + 150 + Math.random() * 200; // this is the distance between the center

        // Convert Polar coordinates (angle, distance) into Cartesian coordinates (x, y)
        c.mesh.position.x = Math.cos(a) * h;
        c.mesh.position.y = Math.sin(a) * h;

        // Rotate the cloud according to its position
        c.mesh.rotation.z = a + Math.PI / 2;

        // for a better result, we position the clouds
        // at random depths inside of the scene
        c.mesh.position.z = -300 - Math.random() * 500;

        // we also set a random scale for each cloud
        var s = 1 + Math.random() * 2;
        c.mesh.scale.set(s, s, s);

        // do not forget to add the mesh of each cloud in the scene
        this.mesh.add(c.mesh);
    }
}

Sky.prototype.moveClouds = function(){
    for(var i = 0; i < this.nClouds; i++){
        var c = this.clouds[i];
        c.rotate();
    }
    this.mesh.rotation.z += game.speed * deltaTime;
}

const Pilot = function() {
    this.mesh = new THREE.Object3D();
    this.mesh.name = "pilot";

    // angleHairs is a property used to animate the hair later
    this.angleHairs = 0;

    // Body of the pilot
    var bodyGeom = new THREE.BoxGeometry(15, 15, 15);
    var bodyMat = new THREE.MeshPhongMaterial({
        color: 0xfed700,
        flatShading: true,
    })
    var body = new THREE.Mesh(bodyGeom, bodyMat);
    body.position.set(2, -12, 0);
    this.mesh.add(body);

    // Face of the pilot
    var faceGeom = new THREE.BoxGeometry(10, 10, 10);
    var faceMat = new THREE.MeshLambertMaterial({ color: COLORS.pink, });
    var face = new THREE.Mesh(faceGeom, faceMat);
    this.mesh.add(face);

    // Hair Element
    var hairGeom = new THREE.BoxGeometry(4, 4, 4);
    var hairMat = new THREE.MeshLambertMaterial({ color: 0xbf41f1, });
    var hair = new THREE.Mesh(hairGeom, hairMat);
    // Align the shape of the hair to its bottom boundray, that will make it easier to scale.
    hair.geometry.applyMatrix(new THREE.Matrix4().makeTranslation(0, 2, 0));

    // Create a container for the hair
    var hairs = new THREE.Object3D();

    // create a container for the hairs at the top 
    // of the head (the ones that will be animated)
    this.hairsTop = new THREE.Object3D();

    // create the hairs at the top of the head
    // and position them on 3 x 4 grid
    for (var i = 0; i < 12; i++) {
        var h = hair.clone();
        var col = i % 3;
        var row = Math.floor(i / 3);
        var startPosX = -4;
        var startPosZ = -4;
        h.position.set(startPosX + row * 4, 0, startPosZ + col * 4);
        h.geometry.applyMatrix(new THREE.Matrix4().makeScale(1, 1, 1));
        this.hairsTop.add(h);
    }
    hairs.add(this.hairsTop);

    // create the hairs at he side of the face
    var hairSideGeom = new THREE.BoxGeometry(12, 4, 2);
    hairSideGeom.applyMatrix(new THREE.Matrix4().makeTranslation(-6, 0, 0));
    var hairSideR = new THREE.Mesh(hairSideGeom, hairMat);
    var hairSideL = hairSideR.clone();
    hairSideR.position.set(8, -2, 6);
    hairSideL.position.set(8, -2, -6);
    hairs.add(hairSideR);
    hairs.add(hairSideL);

    // create the hairs at the back of the head
    var hairBackGeom = new THREE.BoxGeometry(2, 8, 10);
    var hairBack = new THREE.Mesh(hairBackGeom, hairMat);
    hairBack.position.set(-1, -4, 0);
    hair.add(hairBack);
    hairs.position.set(-5, 5, 0);

    this.mesh.add(hairs);

    var glassGeom = new THREE.BoxGeometry(5, 5, 5);
    var glassMat = new THREE.MeshLambertMaterial({ color: 0x000080, });
    var glassR = new THREE.Mesh(glassGeom, glassMat);
    glassR.position.set(6, 0, 3);
    var glassL = glassR.clone();
    glassL.position.z = -glassR.position.z;

    var glassAGeom = new THREE.BoxGeometry(11, 1, 11);
    var glassA = new THREE.Mesh(glassAGeom, glassMat);
    this.mesh.add(glassR);
    this.mesh.add(glassL);
    this.mesh.add(glassA);

    var earGeom = new THREE.BoxGeometry(2, 3, 2);
    var earL = new THREE.Mesh(earGeom, faceMat);
    earL.position.set(0, 0, -6);
    var earR = earL.clone();
    earR.position.set(0, 0, -6);
    this.mesh.add(earL);
    this.mesh.add(earR);
}

// move the hair
Pilot.prototype.updateHairs = function() {
    // get the hair
    var hairs = this.hairsTop.children;

    // update the according to the angle angleHairs
    var l = hairs.length;
    for (var i = 0; i < l; i++) {
        var h = hairs[i];
        // each hair element will scale on cyclical basis between 75% and 100% of its original size
        h.scale.y = 0.75 + Math.cos(this.angleHairs + i / 3) * 0.25;
    }

    // increment the angle for the next frame
    this.angleHairs += game.speed * deltaTime * 40;
}

const AirPlane = function() {
    this.mesh = new THREE.Object3D();
    this.mesh.name = 'airPlane';

    // Create the cabin
    var geomCockpit = new THREE.BoxGeometry(80, 50, 50, 1, 1, 1);
    var matCockpit = new THREE.MeshPhongMaterial({
        color: COLORS.green,
        flatShading: true,
    });

    // we can access a specific vertex of a shape through 
    // the vertices array, and then move its x, y and z property:
    geomCockpit.vertices[4].y -= 10;
    geomCockpit.vertices[4].z += 20;
    geomCockpit.vertices[5].y -= 10;
    geomCockpit.vertices[5].z -= 20;
    geomCockpit.vertices[6].y += 30;
    geomCockpit.vertices[6].z += 20;
    geomCockpit.vertices[7].y += 30;
    geomCockpit.vertices[7].z -= 20;

    var cockpit = new THREE.Mesh(geomCockpit, matCockpit);
    cockpit.castShadow = true;
    cockpit.receiveShadow = true;
    this.mesh.add(cockpit);

    // Create the engine
    var geomEngine = new THREE.BoxGeometry(20, 50, 50, 1, 1, 1);
    var matEngine = new THREE.MeshPhongMaterial({
        color: COLORS.white,
        flatShading: true,
    });
    var engine = new THREE.Mesh(geomEngine, matEngine);
    engine.position.x = 40;
    engine.castShadow = true;
    engine.receiveShadow = true;
    this.mesh.add(engine);

    // Create the tail
    var geomTailPlane = new THREE.BoxGeometry(15, 20, 5, 1, 1, 1);
    var matTailPlane = new THREE.MeshPhongMaterial({
        color: COLORS.green,
        flatShading: true,
    });
    var tailPlane = new THREE.Mesh(geomTailPlane, matTailPlane);
    tailPlane.position.set(-40, 20, 0);
    tailPlane.castShadow = true;
    tailPlane.receiveShadow = true;
    this.mesh.add(tailPlane);

    // Create the wing
    var geomSideWing = new THREE.BoxGeometry(30, 5, 120, 1, 1, 1);
    var matSideWing = new THREE.MeshPhongMaterial({
        color: 0x000000,
        flatShading: true,
    });
    var sideWing = new THREE.Mesh(geomSideWing, matSideWing);
    sideWing.position.set(0, 15, 0);
    sideWing.castShadow = true;
    sideWing.receiveShadow = true;
    this.mesh.add(sideWing);

    // Creat Wind Shield
    var geomWindshield = new THREE.BoxGeometry(3,15,20,1,1,1);
    var matWindshield = new THREE.MeshPhongMaterial({
        color: COLORS.white,
        transparent:true,
        opacity:.3,
        flatShading: true,
    });
    var windshield = new THREE.Mesh(geomWindshield, matWindshield);
    windshield.position.set(5,27,0);
    windshield.castShadow = true;
    windshield.receiveShadow = true;
    this.mesh.add(windshield);    

    // propeller
    var geomPropeller = new THREE.BoxGeometry(20, 10, 10, 1, 1, 1);
    geomPropeller.vertices[4].y -= 5;
    geomPropeller.vertices[4].z += 5;
    geomPropeller.vertices[5].y -= 5;
    geomPropeller.vertices[5].z -= 5;
    geomPropeller.vertices[6].y += 5;
    geomPropeller.vertices[6].z += 5;
    geomPropeller.vertices[7].y += 5;
    geomPropeller.vertices[7].z -= 5;
    var matPropeller = new THREE.MeshPhongMaterial({
        color: 0x000000,
        flatShading: true,
    });
    this.propeller = new THREE.Mesh(geomPropeller, matPropeller);
    this.propeller.castShadow = true;
    this.propeller.receiveShadow = true;

    // blades
    var geomBlade = new THREE.BoxGeometry(1, 80, 20, 1, 1, 1);
    var matBlade = new THREE.MeshPhongMaterial({
        color: COLORS.brownDark,
        flatShading: true,
    });
    var blade = new THREE.Mesh(geomBlade, matBlade);
    blade.position.set(8, 0, 0);
    blade.castShadow = true;
    blade.receiveShadow = true;
    this.propeller.add(blade);
    var blade = new THREE.Mesh(geomBlade, matBlade);
    blade.position.set(8, 0, 0);
    blade.castShadow = true;
    blade.receiveShadow = true;
    blade.rotation.x = 0.25 * Math.PI * 2;
    this.propeller.add(blade);

    this.propeller.position.set(60, 0, 0);
    this.mesh.add(this.propeller);

    // Wheel Protec
    var wheelProtecGeom = new THREE.BoxGeometry(30, 15, 10, 1, 1, 1);
    var wheelProtecMat = new THREE.MeshPhongMaterial({
        color: COLORS.green,
        flatShading: true,
    });
    var wheelProtecR = new THREE.Mesh(wheelProtecGeom, wheelProtecMat);
    wheelProtecR.position.set(25, -20, 25);
    var wheelProtecL = wheelProtecR.clone();
    wheelProtecL.position.z = -wheelProtecR.position.z;
    this.mesh.add(wheelProtecR);
    this.mesh.add(wheelProtecL);

    // Wheel Axis
    var wheelAxisGeom = new THREE.BoxGeometry(10, 10, 6);
    var wheelAxisMat = new THREE.MeshPhongMaterial({
        color: 0x000000,
        flatShading: true,
    });
    var wheelAxis = new THREE.Mesh(wheelAxisGeom, wheelAxisMat);

    // Wheel Tires
    var wheelTireGeom = new THREE.BoxGeometry(24, 24, 4);
    var wheelTireMat = new THREE.MeshPhongMaterial({
        color: COLORS.white,
        flatShading: true,
    });
    var wheelTireR = new THREE.Mesh(wheelTireGeom, wheelTireMat);
    wheelTireR.position.set(25, -28, 25);
    wheelTireR.add(wheelAxis);
    var wheelTireL = wheelTireR.clone();
    wheelTireL.position.z = -wheelTireR.position.z;
    this.mesh.add(wheelTireR);
    this.mesh.add(wheelTireL);
    var wheelTireB = wheelTireR.clone();
    wheelTireB.scale.set(0.5, 0.5, 0.5);
    wheelTireB.position.set(-35, -5, 0);
    this.mesh.add(wheelTireB);

    // Suspension
    var suspensionGeom = new THREE.BoxGeometry(4, 20, 4);
    suspensionGeom.applyMatrix(new THREE.Matrix4().makeTranslation(0, 10, 0));
    var suspensionMat = new THREE.MeshPhongMaterial({
        color: COLORS.green,
        flatShading: true,
    });
    var suspension = new THREE.Mesh(suspensionGeom, suspensionMat);
    suspension.position.set(-35, -5, 0);
    suspension.rotation.z = -0.3;
    this.mesh.add(suspension);

    // Pilot
    this.pilot = new Pilot();
    this.pilot.mesh.position.set(-10, 27, 0);
    this.mesh.add(this.pilot.mesh);

    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
}

const Enemy = function() {
    var geom = new THREE.TetrahedronGeometry(8, 2);
    var mat = new THREE.MeshPhongMaterial({
        color: COLORS.lava,
        shininess: 0,
        specular: 0xffffff,
        flatShading: true,
    });

    this.mesh = new THREE.Mesh(geom,mat);
    this.mesh.name = 'enemy';
    this.mesh.castShadow = true;
    this.angle = 0;
    this.distance = 0;
}

const EnemiesHolder = function() {
    this.mesh = new THREE.Object3D();
    this.enemiesInUse = [];
}

EnemiesHolder.prototype.spawnEnemies = function() {
    var nEnemies = game.level;

    for (var i = 0; i < nEnemies; i++) {
        var enemy = enemiesPool.length 
            ? enemiesPool.pop()
            : new Enemy();

        enemy.angle = -(i * 0.1);
        enemy.distance = game.seaRadius + game.planeDefaultHeight 
            + (-1 + Math.random() * 2) * (game.planeAmpHeight - 20);
        enemy.mesh.position.x = Math.cos(enemy.angle) * enemy.distance;
        enemy.mesh.position.y = -game.seaRadius + Math.sin(enemy.angle)
            * enemy.distance;

        this.mesh.add(enemy.mesh);
        this.enemiesInUse.push(enemy);
    }
}

EnemiesHolder.prototype.rotateEnemies = function() {
    for (var i = 0; i < this.enemiesInUse.length; i++) {
        var enemy = this.enemiesInUse[i];
        enemy.angle += game.speed * deltaTime * game.enemiesSpeed;

        if (enemy.angle > Math.PI * 2) {
            enemy.angle -= Math.PI * 2;
        }

        enemy.mesh.position.x = Math.cos(enemy.angle) * enemy.distance;
        enemy.mesh.position.y = -game.seaRadius + Math.sin(enemy.angle)
            * enemy.distance;
        enemy.mesh.rotation.y += Math.random() * 0.1;
        enemy.mesh.rotation.z += Math.random() * 0.1;

        var diffPos = airplane.mesh.position.clone().sub(
            enemy.mesh.position.clone());
        var d = diffPos.length();
        if (d < game.enemyDistanceTolerance) {
            particlesHolder.spawnParticles(enemy.mesh.position.clone(),
                15, COLORS.lava, 3);

            enemiesPool.unshift(this.enemiesInUse.splice(i, 1)[0]);
            this.mesh.remove(enemy.mesh);
            game.planeCollisionSpeedX = 100 * diffPos.x / d;
            game.planeCollisionSpeedY = 100 * diffPos.y / d;
            ambientLight.intensity = 2;

            removeEnergy();
            i--;
        } else if (enemy.angle > Math.PI) {
            enemiesPool.unshift(this.enemiesInUse.splice(i, 1)[0]);
            this.mesh.remove(enemy.mesh);

            i--;
        }
    }
}

const Particle = function() {
    var geom = new THREE.TetrahedronGeometry(3, 0);
    var mat = new THREE.MeshPhongMaterial({
        color: 0x72daa6,
        shininess: 0,
        specular: 0xffffff,
        flatShading: true,
    });
    this.mesh = new THREE.Mesh(geom,mat);
    this.mesh.name = 'particle';
}

Particle.prototype.explode = function(pos, color, scale) {
    var _this = this;
    var _p = this.mesh.parent;
    this.mesh.material.color = new THREE.Color(color);
    this.mesh.material.needsUpdate = true;
    this.mesh.scale.set(scale, scale, scale);
    var targetX = pos.x + (-1 + Math.random() * 2) * 50;
    var targetY = pos.y + (-1 + Math.random() * 2) * 50;
    var speed = 0.6 + Math.random() * 0.2;
    TweenMax.to(this.mesh.rotation, speed, {
        x: Math.random() * 12, 
        y: Math.random() * 12,
    });
    TweenMax.to(this.mesh.scale, speed, {
        x: 0.1,
        y: 0.1,
        z: 0.1,
    });
    TweenMax.to(this.mesh.position, speed, {
        x: targetX,
        y: targetY,
        delay: Math.random() * 0.1,
        ease: Power2.easeOut,
        onComplete: function() {
            if(_p) {
                _p.remove(_this.mesh);
            }
            _this.mesh.scale.set(1, 1, 1);
            particlesPool.unshift(_this);
        }
    });
}

const ParticlesHolder = function () {
    this.mesh = new THREE.Object3D();
    this.particlesInUse = [];
}

ParticlesHolder.prototype.spawnParticles = function(pos, density, color, 
    scale) {
    var nPArticles = density;
    for (var i = 0; i < nPArticles; i++) {
        var particle = particlesPool.length
            ? particlesPool.pop()
            : new Particle();

        this.mesh.add(particle.mesh);
        particle.mesh.visible = true;
        particle.mesh.position.x = pos.x;
        particle.mesh.position.y = pos.y;
        particle.explode(pos, color, scale);
    }
}

const Coin = function(){
    var geom = new THREE.CylinderGeometry(5, 5,
        2, 40, 10);
    // rotate the geometry on the x axis
    geom.applyMatrix(new THREE.Matrix4().makeRotationX(-Math.PI / 2));
    var mat = new THREE.MeshPhongMaterial({
        color: 0xffd700,
        shininess: 0,
        specular: 0xffffff,
        flatShading: true,
    });
    this.mesh = new THREE.Mesh(geom,mat);
    this.mesh.name = 'Coin';
    this.mesh.castShadow = true;
    this.angle = 0;
    this.distance = 0;
    this.exploding = false;
}

const CoinsHolder = function (nCoins) {
    this.mesh = new THREE.Object3D();
    this.coinsInUse = [];
    this.coinsPool = [];
    for (var i = 0; i < nCoins; i++) {
        var coin = new Coin();
        this.coinsPool.push(coin);
    }
}

CoinsHolder.prototype.spawnCoins = function() {
    var nCoins = 1 + Math.floor(Math.random() * 10);
    var d = game.seaRadius + game.planeDefaultHeight
        + (-1 + Math.random() * 2) * (game.planeAmpHeight - 20);
    var amplitude = 10 + Math.round(Math.random() * 10);
    for (var i=0; i<nCoins; i++) {
        var coin = this.coinsPool.length
            ? this.coinsPool.pop()
            : new Coin();

        this.mesh.add(coin.mesh);
        this.coinsInUse.push(coin);
        coin.angle = -(i * 0.02);
        coin.distance = d + Math.cos(i * 0.5) * amplitude;
        coin.mesh.position.x = Math.cos(coin.angle) * coin.distance;
        coin.mesh.position.y = -game.seaRadius + Math.sin(coin.angle)
            * coin.distance;
    }
}

CoinsHolder.prototype.rotateCoins = function() {
    for (var i = 0; i < this.coinsInUse.length; i++) {
        var coin = this.coinsInUse[i];

        coin.angle += game.speed * deltaTime * game.coinsSpeed;
        if (coin.angle > Math.PI * 2) {
            coin.angle -= Math.PI * 2;
        }

        coin.mesh.position.x = Math.cos(coin.angle) * coin.distance;
        coin.mesh.position.y = -game.seaRadius + Math.sin(coin.angle)
            * coin.distance;
        coin.mesh.rotation.y += 0.5;

        var diffPos = airplane.mesh.position.clone().sub(
            coin.mesh.position.clone());
        var d = diffPos.length();

        if (d < game.coinDistanceTolerance) {
            this.coinsPool.unshift(this.coinsInUse.splice(i,1)[0]);
            this.mesh.remove(coin.mesh);
            particlesHolder.spawnParticles(coin.mesh.position.clone(), 5,
                0xffd700, 0.8);

            addEnergy();
            i--;
        } else if (coin.angle > Math.PI) {
            this.coinsPool.unshift(this.coinsInUse.splice(i,1)[0]);
            this.mesh.remove(coin.mesh);
            i--;
        }
    }
}

function createSea() {
    sea = new Sea();

    // push it a lttle bit at the bottom of the scene
    sea.mesh.position.y = -game.seaRadius;

    // add the mesh of the sea to the scene
    scene.add(sea.mesh);
}

function createSky() {
    sky = new Sky();
    sky.mesh.position.y = -game.seaRadius;
    scene.add(sky.mesh);
}

function createPlane() {
    airplane = new AirPlane();
    airplane.mesh.scale.set(0.25, 0.25, 0.25);
    airplane.mesh.position.y = game.planeDefaultHeight;
    scene.add(airplane.mesh);
}

function createCoins() {
    coinsHolder = new CoinsHolder(50);
    scene.add(coinsHolder.mesh)
}

function createEnemies() {
    for (var i = 0; i < 10; i++) {
        var enemy = new Enemy();
        enemiesPool.push(enemy);
    }
    enemiesHolder = new EnemiesHolder();
    scene.add(enemiesHolder.mesh);
}

function createParticles() {
    for (var i = 0; i < 10; i++) {
        var particle = new Particle();
        particlesPool.push(particle);
    }
    particlesHolder = new ParticlesHolder();
    scene.add(particlesHolder.mesh)
}

// Game Methods

function normalize(v, vmin, vmax, tmin, tmax) {
    var nv = Math.max(Math.min(v, vmax), vmin);
    var dv = vmax - vmin;
    var pc = (nv - vmin) / dv;
    var dt = tmax - tmin;
    var tv = tmin + (pc * dt);

    return tv;
}

function updatePlane() {
    game.planeSpeed = normalize(mousePos.x, -0.5, 0.5, game.planeMinSpeed,
        game.planeMaxSpeed);
    var targetX = normalize(mousePos.x, -1, 1, -game.planeAmpWidth * 0.7,
        -game.planeAmpWidth);
    var targetY = normalize(mousePos.y, -0.75, 0.75,
        game.planeDefaultHeight - game.planeAmpHeight,
        game.planeDefaultHeight + game.planeAmpHeight);

    game.planeCollisionDisplacementX += game.planeCollisionSpeedX;
    targetX += game.planeCollisionDisplacementX;

    game.planeCollisionDisplacementY += game.planeCollisionSpeedY;
    targetY += game.planeCollisionDisplacementY;

    airplane.mesh.position.x += (targetX - airplane.mesh.position.x)
        * deltaTime * game.planeMoveSensivity;
    airplane.mesh.position.y += (targetY - airplane.mesh.position.y)
        * deltaTime * game.planeMoveSensivity;

    airplane.mesh.rotation.x = (airplane.mesh.position.y - targetY)
        * deltaTime * game.planeRotXSensivity;
    airplane.mesh.rotation.z = (targetY - airplane.mesh.position.y)
        * deltaTime * game.planeRotZSensivity;

    var targetCameraZ = normalize(game.planeSpeed, game.planeMinSpeed,
        game.planeMaxSpeed, game.cameraNearPos, game.cameraFarPos);
    camera.fov = normalize(mousePos.x, -1 , 1, 40, 80);
    camera.updateProjectionMatrix ();
    camera.position.y += (airplane.mesh.position.y - camera.position.y)
        * deltaTime * game.cameraSensivity;

    game.planeCollisionSpeedX += (0 - game.planeCollisionSpeedX) * deltaTime
        * 0.03;
    game.planeCollisionDisplacementX += (0 - game.planeCollisionDisplacementX)
        * deltaTime * 0.01;
    game.planeCollisionSpeedY += (0 - game.planeCollisionSpeedY) * deltaTime
        * 0.03;
    game.planeCollisionDisplacementY += (0 - game.planeCollisionDisplacementY)
        * deltaTime * 0.01;

    airplane.pilot.updateHairs();
}

function updateDistance() {
    game.distance += game.speed * deltaTime * game.ratioSpeedDistance;
    fieldDistance.innerHTML = Math.floor(game.distance);
    var d = 502 * (1 - (game.distance % game.distanceForLevelUpdate)
        / game.distanceForLevelUpdate);
    levelCircle.setAttribute('stroke-dashoffset', d);
}

function updateEnergy() {
    game.energy -= game.speed * deltaTime * game.ratioSpeedEnergy;
    game.energy = Math.max(0, game.energy);

    energyBar.style.right = `${100 - game.energy}%`;
    energyBar.style.backgroundColor = (game.energy < 50)
        ? '#f25346'
        : '#fed700';

    if (game.energy < 30) {
        energyBar.style.animationName = 'blinking';
    }else{
        energyBar.style.animationName = 'none';
    }

    if (game.energy < 1){
        game.status = 'gameover';
    }
}

function addEnergy() {
    game.energy += game.coinValue;
    game.energy = Math.min(game.energy, 100);
}

function removeEnergy() {
    game.energy -= game.ennemyValue;
    game.energy = Math.max(0, game.energy);
}

function showReplay() {
    replayMessage.style.display = 'block';
}

function hideReplay() {
    replayMessage.style.display = 'none';
}

function loop() {
    newTime = new Date().getTime();
    deltaTime = newTime-oldTime;
    oldTime = newTime;

    if (game.status === 'playing') {
        // Add energy coins every 100m;
        if (Math.floor(game.distance) % game.distanceForCoinsSpawn === 0
            && Math.floor(game.distance) > game.coinLastSpawn) {
            game.coinLastSpawn = Math.floor(game.distance);
            coinsHolder.spawnCoins();
        }

        if (Math.floor(game.distance) % game.distanceForSpeedUpdate === 0
            && Math.floor(game.distance) > game.speedLastUpdate) {
            game.speedLastUpdate = Math.floor(game.distance);
            game.targetBaseSpeed += game.incrementSpeedByTime * deltaTime;
        }

        if (Math.floor(game.distance) % game.distanceForEnemiesSpawn === 0
            && Math.floor(game.distance) > game.enemyLastSpawn) {
            game.enemyLastSpawn = Math.floor(game.distance);
            enemiesHolder.spawnEnemies();
        }

        if (Math.floor(game.distance) % game.distanceForLevelUpdate === 0 
            && Math.floor(game.distance) > game.levelLastUpdate) {
            game.levelLastUpdate = Math.floor(game.distance);
            game.level++;
            fieldLevel.innerHTML = Math.floor(game.level);

            game.targetBaseSpeed = game.initSpeed + game.incrementSpeedByLevel
                * game.level;
        }

        updatePlane();
        updateDistance();
        updateEnergy();
        game.baseSpeed += (game.targetBaseSpeed - game.baseSpeed) * deltaTime
            * 0.02;
        game.speed = game.baseSpeed * game.planeSpeed;
    } else if(game.status === 'gameover') {
        game.speed *= 0.99;
        airplane.mesh.rotation.z += (-Math.PI / 2 - airplane.mesh.rotation.z)
            * 0.0002 * deltaTime;
        airplane.mesh.rotation.x += 0.0003 * deltaTime;
        game.planeFallSpeed *= 1.05;
        airplane.mesh.position.y -= game.planeFallSpeed * deltaTime;

        if (airplane.mesh.position.y < -200) {
            showReplay();
            game.status = 'waitingReplay';
        }
    } else if (game.status === 'waitingReplay') { }

    airplane.propeller.rotation.x += 0.2 + game.planeSpeed * deltaTime * 0.005;
    sea.mesh.rotation.z += game.speed * deltaTime;

    if (sea.mesh.rotation.z > 2 * Math.PI) {
        sea.mesh.rotation.z -= 2 * Math.PI;
    }

    ambientLight.intensity += (0.5 - ambientLight.intensity) * deltaTime
        * 0.005;

    coinsHolder.rotateCoins();
    enemiesHolder.rotateEnemies();

    sky.moveClouds();
    sea.moveWaves();

    renderer.render(scene, camera);
    setTimeout()
    requestAnimationFrame(loop);
}

function init() {
    fieldDistance = document.getElementById('distValue');
    energyBar = document.getElementById('energyBar');
    replayMessage = document.getElementById('replayMessage');
    fieldLevel = document.getElementById('levelValue');
    levelCircle = document.getElementById('levelCircleStroke');

    resetGame();
    createScene();

    createLights();
    createPlane();
    createSea();
    createSky();
    createCoins();
    createEnemies();
    createParticles();

    document.addEventListener('mousemove', handleMouseMove, false);
    document.addEventListener('touchmove', handleTouchMove, false);
    document.addEventListener('mouseup', handleMouseUp, false);
    document.addEventListener('touchend', handleTouchEnd, false);

    loop();
}

window.addEventListener('load', init, false);
