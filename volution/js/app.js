/*jshint esversion: 7*/

import AV from '/build/av.module.js/av.module.js';

( function () {
    const CVS = document.getElementById( 'output' );
    const CTX = CVS.getContext( '2d' );

    const mulberry32 = function ( a ) {
        return function () {
            var t = a += 0x6D2B79F5;
            t = Math.imul( t ^ t >>> 15, t | 1 );
            t ^= t + Math.imul( t ^ t >>> 7, t | 61 );
            return ( ( t ^ t >>> 14 ) >>> 0 ) / 0x100000000;
        }
    }

    const polarToCartesian = function ( r, a ) {
        return {
            x: r * Math.cos( a ),
            y: r * Math.sin( a )
        };
    };
    const cartesianToPolar = function ( x, y ) {
        return {
            r: Math.sqrt( x ** 2 + y ** 2 ),
            a: Math.atan2( y, x )
        };
    }
    const hexToCartesian = function ( q, r ) {
        let w = Math.sqrt( 3 );
        let h = 3 / 2;
        return {
            x: ( q - r / 2 ) * w,
            y: r * h
        };
    }

    CTX.hexagon = function ( x, y, r, a = 0 ) {
        CTX.beginPath();
        for ( var i = 0; i < 6; i++ ) {
            CTX.lineTo( x + r * Math.sin( AV.RADIAN * i / 6 + a ), y + r * Math.cos( AV.RADIAN * i / 6 + a ) );
        }
        CTX.closePath();
    }

    class Galaxy {
        constructor() {
            this.chunk_size = 100; // light-years
            this.radius = 100000; // light-years
            this.seed = 49;
        }
    }

    class App {
        constructor() {
            const resize = function () {
                CTX.width = CVS.width = window.innerWidth;
                CTX.height = CVS.height = window.innerHeight;
            };
            window.onresize = resize;
            resize();

            // const galaxy = new Galaxy();

            CTX.fillStyle = 'black';
            CTX.fillRect( 0, 0, CVS.width, CVS.height );

            const rand = mulberry32( 49 );

            // const rad = Math.min( CVS.width, CVS.height ) * 0.45;
            // for ( let i = 0, l = 5000; i < l; ++i ) {
            //     var r = rad * i / l;
            //     var a = Math.floor( rand() * 6 ) / 6;
            //     a += 0.5 * i / l;
            //     a += rand() ** 0.5 * ( 1.1 - ( ( i / l ) ** 0.25 ) ) / 1.75;
            //     a *= AV.RADIAN;
            //     const pos = polarToCartesian( r, a );
            //     const x = pos.x + CVS.width / 2;
            //     const y = pos.y + CVS.height / 2;
            //     const s = AV.lerp( 0.5, 1, rand() );
            //     const c_h = rand() * 240;
            //     const c_s = 50 + rand() * 30;
            //     const c_l = AV.lerp( 50, 100, ( c_h / 240 ) ** 2 );
            //     CTX.fillStyle = `hsl(${ c_h }deg ${ c_s }% ${ c_l }%)`;
            //     CTX.beginPath();
            //     CTX.arc( x, y, s, 0, AV.RADIAN );
            //     CTX.fill();
            // }

            const MAX_STARS_PER_CHUNK = 2 ** 7;
            var total_num_stars = 0;

            for ( let qs = 128, q = -qs / 2; q < qs / 2; ++q ) {
                for ( let rs = 128, r = -rs / 2; r < rs / 2; ++r ) {
                    let zoom = 5; // pixels / ly
                    const pos = hexToCartesian( q, r );
                    const dist = AV.dist( pos.x, pos.y ) / ( Math.max( qs, rs ) * 0.75 );
                    // const ddd = dist; console.log( ddd ); mmmax = Math.max( mmmax, ddd ); continue;
                    if ( dist > 1 ) continue;
                    // let density = Math.floor( rand() * 6 ) / 6;
                    // density += 0.5 * dist;
                    // density += rand() ** 0.5 * ( 1.05 - ( dist ** 0.25 ) ) * AV.RADIAN / 12;
                    // density *= AV.RADIAN;
                    let ang = Math.atan2( pos.y, pos.x ) / AV.RADIAN;
                    ang = ( 1 + ang ) % 1;
                    let density = 0;
                    for ( let i = 0; i < 6; ++i ) {
                        let a = i / 6;
                        a += dist / 2;
                        // a += ( 1.1 - ( dist ** 0.25 ) ) / 1.75;
                        // a *= AV.RADIAN;
                        let d = 2 * Math.abs( a - ang );
                        if ( d > 1 ) d = 2 - d;
                        d = d ** ( 64 * dist ** 2 );
                        d *= ( 1 - dist ) ** 2;
                        if ( d ) density = Math.max( d, density );
                    }

                    let num_stars = density * MAX_STARS_PER_CHUNK;
                    num_stars *= AV.lerp( 0.9, 1.1, rand() );
                    num_stars = Math.round( num_stars );

                    if ( num_stars <= 0 ) continue;

                    let hx = pos.x * zoom + CVS.width / 2;
                    let hy = pos.y * zoom + CVS.height / 2;

                    // CTX.globalAlpha = 0.5;
                    // CTX.strokeStyle = 'red';
                    // CTX.hexagon( hx, hy, zoom );
                    // CTX.stroke();
                    // CTX.globalAlpha = 1;

                    for ( let i = 0; i < num_stars; ++i ) {
                        CTX.fillStyle = 'white';
                        const rad = AV.lerp( 7000, 70000000, rand() ) / 9.461e+12;
                        const s = Math.max( zoom * rad, 0.05 );
                        let aaa = rand() * AV.RADIAN;
                        let sss = rand() ** 0.5 * zoom * Math.sin( Math.PI / 3 ) / Math.sin( Math.PI * 2 / 3 - ( aaa % ( Math.PI / 3 ) ) );
                        CTX.beginPath();
                        CTX.arc(
                            hx + sss * Math.sin( aaa ),
                            hy - sss * Math.cos( aaa ),
                            s,
                            0, AV.RADIAN );
                        CTX.fill();
                        ++total_num_stars;
                    }
                }
            }

            console.log( total_num_stars );
        }
    }

    $( function () {
        const APP = new App();
    } );
} )();
