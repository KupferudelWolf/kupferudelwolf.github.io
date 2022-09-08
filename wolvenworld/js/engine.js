/*jshint esversion: 7*/

import AV from '/build/av.module.js/av.module.js';
import * as THREE from '/build/three.js/build/three.module.js';
import Stats from '/build/three.js/examples/jsm/libs/stats.module.js';
import { OrbitControls } from '/build/three.js/examples/jsm/controls/OrbitControls.js';
import { GUI } from '/build/three.js/examples/jsm/libs/lil-gui.module.min.js';

( function () {

    class ENGINE {
        constructor() {
            /// THREE objects for reuse.
            this.cache = {
                // color: new THREE.Color(),
                matrix: new THREE.Matrix4(),
                // object: new THREE.Object3D(),
                // position: new THREE.Vector3(),
                // rotation: new THREE.Euler(),
                // quaternion: new THREE.Quaternion(),
                // scale: new THREE.Vector3(),
                vector: new THREE.Vector3()
            };
            this.raycaster = new THREE.Raycaster();

            this.unit_scale = 1 / 50;
            this.params = {
                gravity: 0.98 * this.unit_scale
            };

            this.colliders = new THREE.Group();
            this.dynamics = [];


            this.initGUI();
            this.initCamera();
            this.initRenderer();
            this.initControls();
            this.initScene();
        }

        /** WebGL camera. */
        initCamera() {
            this.camera = new THREE.PerspectiveCamera(
                45,
                window.width / window.height,
                0.1, 1000
            );

            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();

            $( window ).on( 'resize', () => {
                this.camera.aspect = window.innerWidth / window.innerHeight;
                this.camera.updateProjectionMatrix();
            } );
        }

        /** Controls. */
        initControls() {
            this.controls = new OrbitControls( this.camera, this.renderer.domElement );
            this.controls.enablePan = false;
            this.controls.enableRotate = true;
            this.controls.enableZoom = true;
        }

        /** DEBUG GUI. */
        initGUI() {
            /// Framerate display.
            this.stats = new Stats();
            $( 'body' ).prepend( this.stats.dom );

            /// User controls for debugging.
            this.gui = new GUI();
        }

        /** WebGL renderer. */
        initRenderer() {
            this.renderer = new THREE.WebGLRenderer( {
                alpha: true,
                antialias: true
            } );
            this.renderer.setPixelRatio( window.devicePixelRatio );
            this.renderer.setSize( window.innerWidth, window.innerHeight );
            document.body.appendChild( this.renderer.domElement );
            $( window ).on( 'resize', () => {
                this.renderer.setSize( window.innerWidth, window.innerHeight );
            } );
        }

        /** WebGL scene. */
        initScene() {
            /// Scene.
            this.scene = new THREE.Scene();
            this.scene.background = new THREE.Color( 0x6f6f6f );

            /// Camera.
            this.camera.position.set( 2, 1, 4 );
            this.camera.position.multiplyScalar( 4 );
            this.camera.lookAt( 0, 0, 0 );
            this.scene.add( this.camera );

            /// Groups.
            this.scene.add( this.colliders );

            /// Lights.
            const ambient = new THREE.HemisphereLight( 0xffffff, 0x000000, 1 );
            this.scene.add( ambient );

            const ground_geo = new THREE.PlaneGeometry( 20, 20 );
            const ground_mat = new THREE.MeshStandardMaterial( {
                color: 'green'
            } );
            const ground_mesh = new THREE.Mesh( ground_geo, ground_mat );
            ground_mesh.rotation.x = -Math.PI / 2;
            ground_mesh.rotation.y = -Math.PI / 8;
            this.colliders.add( ground_mesh );

            const player = new THREE.AxesHelper( 1 );
            this.dynamics.push( {
                mesh: player,
                ray: new THREE.Vector3(),
                velocity: new THREE.Vector3( 0, 0, 0 )
            } );
            this.scene.add( player );

            player.position.set( 0, 4, 0 );

            this.player = player;

            this.raycaster_helper = new THREE.ArrowHelper();
            this.scene.add( this.raycaster_helper );
        }

        /** Step function. */
        animate( delta ) {
            if ( this.controls ) {
                this.controls.update();
            }

            /// Gravity.
            this.dynamics.forEach( ( obj ) => {
                obj.velocity.y -= this.params.gravity * delta;


                /// Collision
                var magnitude = obj.velocity.length();
                var direction = this.cache.vector;
                direction.copy( obj.velocity ).normalize();
                this.raycaster.set( obj.mesh.position, direction );
                const collides = this.raycaster.intersectObjects( this.colliders.children, false );
                var dist = Infinity,
                    normal = null,
                    coll_obj;
                collides.forEach( ( obj ) => {
                    const obj_dist = obj.distance;
                    if ( obj_dist < dist ) {
                        dist = obj_dist;
                        normal = obj.face.normal;
                        coll_obj = obj.object;
                    }
                } );
                if ( normal && dist < magnitude ) {
                    if ( magnitude < this.unit_scale / 10 ) {
                        obj.velocity.set( 0, 0, 0 );
                    }
                    this.cache.matrix.extractRotation( coll_obj.matrixWorld );
                    normal.applyMatrix4( this.cache.matrix ).normalize();
                    obj.velocity.reflect( normal ).multiplyScalar( 0.25 );
                    magnitude = obj.velocity.length();
                }

                this.raycaster_helper.position.copy( obj.mesh.position );
                const ray_len = magnitude / delta;
                this.raycaster_helper.setLength( ray_len, 0.2 * ray_len, 0.1 * ray_len );
                this.raycaster_helper.setDirection( direction );

                ///
                obj.mesh.position.add( obj.velocity );
            } );
        }

        /** Renders a frame of the WebGL scene. */
        render() {
            /// Render to canvas.
            this.renderer.render( this.scene, this.camera );
        }

        /** Initialize step function. */
        run() {
            var time_last = 0;
            const step = ( time ) => {
                const delta = ( time - time_last ) / 1000;
                time_last = time;
                // console.log( time );
                /// Step function.
                this.animate( delta );
                /// Render function.
                this.render();
                /// Update the framerate display.
                if ( this.stats ) this.stats.update();

                window.requestAnimationFrame( step );
            };
            window.requestAnimationFrame( step );
        }
    }

    $( function () {
        const APP = new ENGINE();
        APP.run();
    } );
} )();