/*jshint esversion: 7*/

import AV from '/build/av.module.js/av.module.js';

( function () {
    /** Class representing a canvas's components. */
    class CanvasObject {
        /**
         * Constructor.
         * @param {string} [id] - The element ID to search for; if not found, a canvas will be created.
         * @param {string} [context] - Whether to create a 2D or WebGL context.
         */
        constructor( id, context ) {
            const cvs = document.getElementById( id ) || document.createElement( 'canvas' );
            const ctx = cvs.getContext( context || '2d' );
            cvs.id = id;
            return {
                cvs: cvs,
                ctx: ctx
            };
        }
    }

    /** Main function. */
    class App {
        /** @type {CanvasObject} Output image. */
        output;
        /** @type {CanvasObject} User input. */
        overlay;

        /** Constructor. */
        constructor() {
            this.initCanvas();
        }

        /** Initialize the canvases and their events. */
        initCanvas() {
            this.output = new CanvasObject( 'palette' );
            this.overlay = new CanvasObject( 'overlay' );

            const resize = () => {
                const width = window.innerWidth;
                const height = window.innerHeight;
                this.output.cvs.width = width;
                this.output.cvs.height = height;
                this.overlay.cvs.width = width;
                this.overlay.cvs.height = height;
            };

            $( window ).on( 'resize', resize );
            resize();
        }
    }

    $( function () {
        const APP = new App();
    } );
} )();
