/*jshint esversion: 7*/

import AV from '/build/av.module.js/av.module.js';
import rangeSlider from '../build/rangeslider/rangeslider.js';

( function () {
    const CVS = $( '#output' ).get( 0 );
    const CTX = CVS.getContext( '2d' );

    class App {
        constructor() {
            // this.initRangeSliders();
            this.updateCanvas();
            $( window ).on( 'resize', () => {
                this.onResize();
            } );
        }

        updateCanvas() {
            const container = $( '.container.canvas' );
            const aspect_cvs = CVS.width / CVS.height;
            const aspect_win = container.width() / container.height();
            const is_vert = aspect_win > aspect_cvs;
            container.toggleClass( 'vertical', is_vert );
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
    }

    $( function () {
        const APP = new App();
    } );
} )();
