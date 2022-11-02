/*jshint esversion: 7*/

import AV from '/build/av.module.js/av.module.js';
import rangeSlider from '../build/rangeslider/rangeslider.js';

( function () {
    const CVS = $( '#output' ).get( 0 );
    const CTX = CVS.getContext( '2d' );

    class App {
        constructor() {
            this.params = {
                show_heightmap: true
            }
            // this.initRangeSliders();
            this.initCanvas();
            this.initControls();
            this.updateCanvasStyle();
            $( window ).on( 'resize', () => {
                this.onResize();
            } );
        }

        evaluate() {
            const divisions = 10;
            const step = 1 / ( divisions + 1 );
            const elev_min = 0;
            const elev_max = 1000;
            const elev_step = step * ( elev_max - elev_min );
            const arr = new Uint8ClampedArray( CVS.width * CVS.height * 4 );
            // const obj = this.ctx_bottom.getImageData( 0, 0, CVS.width, CVS.height )
            // const data = obj.data;
            const width = CVS.width;
            const height = CVS.height;
            // const temp_data = [];

            const color_a = [ 1, 0, 0 ];
            const color_b = [ 0, 0, 1 ];
            const colors = [];
            for ( let i = 0, l = 1 / step; i < l; ++i ) {
                const v = i / ( l - 1 );
                const r = AV.lerp( color_a[ 0 ], color_b[ 0 ], v );
                const g = AV.lerp( color_a[ 1 ], color_b[ 1 ], v );
                const b = AV.lerp( color_a[ 2 ], color_b[ 2 ], v );
                colors.push( [ r, g, b ] );
            }

            for ( let y = 0; y < height; ++y ) {
                for ( let x = 0; x < width; ++x ) {
                    // if ( !temp_data[ x ] ) temp_data[ x ] = [];
                    // temp_data[ x ][ y ] = false;

                    const val = this.data[ x ][ y ];
                    const elev = AV.lerp( elev_min, elev_max, val );

                    const ind = y * width + x;
                    const out = [ 0, 0, 0, 0 ];
                    // var min = val;
                    // var max = val;
                    // var cont = true;
                    // for ( let yy = -1; yy <= 0; ++yy ) {
                    //     for ( let xx = -1; xx <= 0; ++xx ) {
                    //         const tx = x + xx;
                    //         const ty = y + yy;
                    //         if ( tx < 0 || tx > width - 1 ) continue;
                    //         if ( ty < 0 || ty > height - 1 ) continue;
                    //         const test_val = this.data[ tx ][ ty ];
                    //         min = Math.min( min, test_val );
                    //         max = Math.max( max, test_val );
                    //     }
                    // }

                    // const test_val = 0.1;
                    // min = Math.floor( min / test_val );
                    // max = Math.floor( max / test_val );
                    // if ( cont && min !== max ) {
                    //     out[ 0 ] = out[ 3 ] = 1;
                    //     temp_data[ x ][ y ] = true;
                    // }
                    for ( let i = 0, l = 1 / step; i < l; ++i ) {
                        var color = false;
                        const min = elev_min + i * elev_step;
                        const max = min + elev_step;
                        const is_val = elev >= min && elev < max;
                        for ( let yy = -1; yy <= 0; ++yy ) {
                            if ( color ) continue;
                            for ( let xx = -1; xx <= 0; ++xx ) {
                                if ( color ) continue;
                                const tx = x + xx;
                                const ty = y + yy;
                                if ( tx < 0 ) continue;
                                if ( ty < 0 ) continue;
                                const test = this.data[ tx ][ ty ];
                                const test_elev = AV.lerp( elev_min, elev_max, test );
                                const test_is_val = test_elev >= min && test_elev < max;
                                if ( is_val !== test_is_val ) {
                                    color = true;
                                }
                            }
                        }

                        if ( color ) {
                            out[ 0 ] = colors[ i ][ 0 ];
                            out[ 1 ] = colors[ i ][ 1 ];
                            out[ 2 ] = colors[ i ][ 2 ];
                            out[ 3 ] = 1;
                        }
                    }

                    arr[ 4 * ind ] = out[ 0 ] * 255;
                    arr[ 4 * ind + 1 ] = out[ 1 ] * 255;
                    arr[ 4 * ind + 2 ] = out[ 2 ] * 255;
                    arr[ 4 * ind + 3 ] = out[ 3 ] * 255;
                }
            }

            const image = new ImageData( arr, CVS.width, CVS.height );
            this.ctx_top.putImageData( image, 0, 0 );
            this.updateCanvas();
        }

        initCanvas() {
            const cvs_top = $( '<canvas>' ).get( 0 );
            const cvs_bottom = $( '<canvas>' ).get( 0 );
            this.ctx_top = cvs_top.getContext( '2d' );
            this.ctx_bottom = cvs_bottom.getContext( '2d', { willReadFrequently: true } );
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
                        const width = CVS.width = this.ctx_top.canvas.width = this.ctx_bottom.canvas.width = image.width;
                        const height = CVS.height = this.ctx_top.canvas.height = this.ctx_bottom.canvas.height = image.height;
                        this.ctx_bottom.drawImage( image, 0, 0 );

                        const obj = this.ctx_bottom.getImageData( 0, 0, CVS.width, CVS.height )
                        const data = obj.data;
                        this.data = [];
                        for ( let i = 0, l = data.length; i < l; i += 4 ) {
                            const r = 0.2126 * data[ i ] / 255;
                            const g = 0.7152 * data[ i + 1 ] / 255;
                            const b = 0.0722 * data[ i + 2 ] / 255;
                            const a = data[ i + 3 ] / 255;
                            const grey = ( r + g + b ) * a;
                            const x = ( i / 4 ) % width;
                            const y = Math.floor( ( i / 4 ) / width );
                            if ( !this.data[ x ] ) this.data[ x ] = [];
                            this.data[ x ][ y ] = grey;
                            data[ i ] = data[ i + 1 ] = data[ i + 2 ] = grey * 255;
                            data[ i + 3 ] = 255;
                        }
                        this.ctx_bottom.putImageData( obj, 0, 0 );

                        this.updateCanvasStyle();
                        this.evaluate();

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

            /// Toggle heightmap.
            $( '#ctrl-hide-hm' ).on( 'change', () => {
                this.params.show_heightmap = $( '#ctrl-hide-hm' ).is( ':checked' );
                this.updateCanvas();
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
            this.updateCanvasStyle();
        }

        updateCanvas() {
            CTX.clearRect( 0, 0, CVS.width, CVS.height );
            if ( this.params.show_heightmap ) {
                CTX.drawImage( this.ctx_bottom.canvas, 0, 0 );
            }
            CTX.drawImage( this.ctx_top.canvas, 0, 0 );
        }

        updateCanvasStyle() {
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
