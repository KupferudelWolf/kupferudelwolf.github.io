/*jshint esversion: 7*/

import AV from '/build/av.module.js/av.module.js';
import rangeSlider from '../build/rangeslider/rangeslider.js';

( function () {
    const CVS = $( '#output' ).get( 0 );
    const CTX = CVS.getContext( '2d' );

    class App {
        constructor() {
            // this.initRangeSliders();
            this.initControls();
            this.updateCanvas();
            $( window ).on( 'resize', () => {
                this.onResize();
            } );
        }

        initControls() {
            var double_click = 0;
            $( '#import' ).on( 'click', () => {
                $( '#import-file' ).trigger( 'click' );
            } );
            $( '#output' ).on( 'click', () => {
                const delta = Date.now() - double_click;
                double_click = Date.now();
                if ( this.state && delta > 200 ) return;
                console.log( delta );
                $( '#import-file' ).trigger( 'click' );
            } );
            $( '#import-file' ).on( 'change', ( event ) => {
                this.state = 'loading';
                const files = event.target.files;

                if ( !files.length ) return;

                const reader = new FileReader();
                reader.onload = ( e ) => {
                    const img = new Image();
                    img.onload = () => {
                        CVS.width = img.width;
                        CVS.height = img.height;
                        CTX.drawImage( img, 0, 0 );
                        this.updateCanvas();
                        this.state = 'ready';
                    };
                    img.src = e.target.result;
                };
                reader.readAsDataURL( files[ 0 ] );
            } );
        }

        initRangeSliders() {
            this.range_sliders = {};
            const elements = $( '.input-rangeslider' );
            for ( let i = 0, l = elements.length; i < l; ++i ) {
                const element = elements.get( i );
                const slider = rangeSlider( element );
                console.log( slider, element.min, element.max );
                if ( !element.id ) continue;
                this.range_sliders[ element.id ] = slider;
            }
        }

        onResize() {
            this.updateCanvas();
        }

        updateCanvas() {
            const container = $( '.container.canvas' );
            const aspect_cvs = CVS.width / CVS.height;
            const aspect_win = container.width() / container.height();
            const is_vert = aspect_win > aspect_cvs;
            container.toggleClass( 'vertical', is_vert );
        }
    }

    $( function () {
        const APP = new App();
    } );
} )();
