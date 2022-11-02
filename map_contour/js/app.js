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
            /// Import map.
            var double_click = 0;
            $( '#import' ).on( 'click', () => {
                $( '#import-file' ).trigger( 'click' );
            } );
            $( '#output' ).on( 'click', () => {
                const delta = Date.now() - double_click;
                double_click = Date.now();
                if ( this.state && delta > 200 ) return;
                $( '#import-file' ).trigger( 'click' );
            } );
            $( '#import-file' ).on( 'change', ( event ) => {
                this.state = 'loading';
                const files = event.target.files;

                if ( !files.length ) return;

                const reader = new FileReader();
                reader.onload = ( e ) => {
                    const image = new Image();
                    image.onload = () => {
                        CVS.width = image.width;
                        CVS.height = image.height;
                        CTX.drawImage( image, 0, 0 );
                        this.updateCanvas();
                        this.state = 'ready';
                        var filename = $( '#import-file' ).val();
                        filename = filename.split( '/' ).pop().split( '.' );
                        filename.pop();
                        this.filename = filename.join( '.' );
                    };
                    image.src = e.target.result;
                };
                reader.readAsDataURL( files[ 0 ] );
            } );

            /// Save as PNG.
            var saves = 0;
            const export_link = $( '<a>' ).get( 0 );
            $( '#export-png' ).on( 'click', () => {
                if ( this.state !== 'ready' ) return;
                export_link.setAttribute( 'href', CVS.toDataURL( 'image/png' ) );
                const num = String( saves ).padStart( 4, '0' );
                export_link.setAttribute( 'download', `${ this.filename } - Countour #${ num }` );
                export_link.click();
                ++saves;
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
