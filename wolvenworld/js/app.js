/*jshint esversion: 7*/

import AV from '../../build/av.module.js/av.module.js';
import * as THREE from '../../build/three.js/build/three.module.js';
import Stats from '../build/three.js/examples/jsm/libs/stats.module.js';
import { GUI } from '../build/three.js/examples/jsm/libs/lil-gui.module.min.js';

( function () {
    //
    const CVS = $( '#output' ).get( 0 );

    class AV_3 {
        constructor() {
            this.params = {};

            this.initGUI();
            this.initCamera();
            this.initRenderer();
            this.initCanvas();
            this.initScene();
        }

        /** WebGL camera. */
        initCamera() {
            this.camera = new THREE.PerspectiveCamera(
                45,
                CVS.width / CVS.height,
                0.1, 1000
            );

            this.camera.position.set( 0, 0, 10 );
            this.camera.lookAt( 0, 0, 0 );
        }

        /** Output canvas. */
        initCanvas() {
            $( window ).on( 'resize', () => {
                const width = window.innerWidth;
                const height = window.innerHeight;
                $( CVS ).attr( {
                    'width': width,
                    'height': height
                } );
                this.camera.aspect = width / height;
                this.camera.updateProjectionMatrix();
                this.renderer.setSize( width, height );
            } ).trigger( 'resize' );
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
                canvas: CVS,
                alpha: true,
                antialias: true
            } );
            this.renderer.setPixelRatio( window.devicePixelRatio );
            this.renderer.setSize( window.innerWidth, window.innerHeight );
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
