/*jshint esversion: 7*/

import Voronoi from '../build/rhill-voronoi-core.js';
import AV from '/build/av.module.js/av.module.js';

( function () {
    const $CVS = $( '#output' );
    const CVS = $CVS.get( 0 );
    const CTX = CVS.getContext( '2d' );

    const resize = function () {
        $CVS.attr( 'width', $CVS.width() );
        $CVS.attr( 'height', $CVS.height() );
    };
    window.onresize = resize;
    resize();

    class App {
        constructor() {
            this.voronoi = new Voronoi();

            const width = CVS.width / 2;
            const height = CVS.height / 2;
            const bbox = {
                xl: 0,
                xr: width,
                yt: 0,
                yb: height
            };
            const sites = [];
            for ( let y = 0; y < 10; ++y ) {
                const vec = {
                    x: width * Math.random(),
                    y: height * Math.random()
                };
                sites.push( vec );
            }
            this.diagram = this.voronoi.compute( sites, bbox );

            for ( let y = 0, h = 2; y < h; ++y ) {
                for ( let x = 0, w = 4; x < w; ++x ) {
                    const vec = {
                        x: width * Math.random(),
                        y: height * Math.random()
                    };
                    sites.push( vec );
                }
            }
            this.run();
        }

        step() {
            CTX.clearRect( 0, 0, CVS.width, CVS.height );
            CTX.fillStyle = "red"
            CTX.strokeStyle = 'black';
            CTX.lineWidth = 1;

            // const width = CVS.width / 2;
            // const height = CVS.height / 2;
            // const bbox = {
            //     xl: 0,
            //     xr: width,
            //     yt: 0,
            //     yb: height
            // };
            // const sites = [];
            // for ( let y = 0, h = 2; y < h; ++y ) {
            //     for ( let x = 0, w = 4; x < w; ++x ) {
            //         const vec = {
            //             x: width * ( x + 1 ) / ( w + 1 ),
            //             y: height * ( y + 1 ) / ( h + 1 )
            //         };
            //         vec.x += 50 * Math.cos( y / h + Date.now() / 1000 )
            //         vec.y += 50 * Math.sin( x / w + Date.now() / 1000 )
            //         sites.push( vec );
            //     }
            // }
            // this.voronoi.recycle( this.diagram );
            // this.diagram = this.voronoi.compute( sites, bbox );

            this.diagram.edges.forEach( ( edge ) => {
                CTX.beginPath();
                CTX.moveTo( edge.va.x, edge.va.y );
                CTX.lineTo( edge.vb.x, edge.vb.y );
                CTX.stroke();
            } );
            this.diagram.cells.forEach( ( cell ) => {
                CTX.beginPath();
                CTX.arc( cell.site.x, cell.site.y, 2, 0, 2 * Math.PI );
                CTX.fill();
            } );
        }

        run() {
            // let start;
            // const rate = 1000 / 60;
            const step = ( time ) => {
                // let delta = Math.floor( time - start );
                // if ( delta >= rate || !start ) {
                //     start = time;
                this.step();
                // }
                window.requestAnimationFrame( step );
            };
            window.requestAnimationFrame( step );
        }
    }

    $( function () {
        const APP = new App();
    } );
} )();
