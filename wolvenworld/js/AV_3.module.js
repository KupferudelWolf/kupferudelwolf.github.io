/*jshint esversion: 7*/

import AV from '/build/av.module.js/av.module.js';
import * as THREE from '/build/three.js/build/three.module.js';
import Stats from '/build/three.js/examples/jsm/libs/stats.module.js';
import { GUI } from '/build/three.js/examples/jsm/libs/lil-gui.module.min.js';

( function () {

    class AV_3 {
        constructor() {
            this.params = {};

            // this.initCanvas();
            this.initGUI();
            this.initCamera();
            this.initRenderer();
            this.initScene();
        }

        /** WebGL camera. */
        initCamera() {
            this.camera = new THREE.PerspectiveCamera(
                45,
                window.width / window.height,
                0.1, 1000
            );

            $( window ).on( 'resize', () => {
                this.camera.aspect = window.innerWidth / window.innerHeight;
                this.camera.updateProjectionMatrix();
            } );
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
                canvas: this._cvs,
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

            /// Camera.
            this.scene.add( this.camera );

            /// Lights.
            const ambient = new THREE.HemisphereLight( 0xffffff, 0x000000, 1 );
            this.scene.add( ambient );
        }

        /** Step function. */
        animate() {
            //
        }

        /** Renders a frame of the WebGL scene. */
        render() {
            /// Render to CVS.
            this.renderer.render( this.scene, this.camera );
        }

        /** Initialize step function. */
        run() {
            const step = () => {
                /// Step function.
                this.animate();
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
        const APP = new AV_3();
        APP.run();
    } );
} )();