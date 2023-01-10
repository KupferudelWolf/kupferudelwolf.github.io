/*jshint esversion: 7*/

import * as THREE from '/build/three.js/build/three.module.js';
import AV from '/build/av.module.js/av.module.js';
import KEPLER from './av.kepler.module.js';

( function () {
    class App {
        constructor() {
            this.cvs = $( 'canvas#output' ).first();
            this.ctx = this.cvs.get( 0 ).getContext( '2d' );
            this.bodies = [];
            this.ready = true;

            /** @type {number} Kilometers per pixel. */
            this.scale_space = 5e5;
            /** @type {number} Seconds per step / frame. */
            this.scale_time = 60 * 60 * 24;
            this.scale_time /= 60;
        }

        load( url ) {
            this.ready = false;
            $.getJSON( url, ( data ) => {
                var scale_space = 0;
                this.bodies = data.map( ( prop ) => {
                    const body = new KEPLER.Body( prop );
                    body._prop = prop;
                    return body;
                } );
                this.bodies.forEach( ( body ) => {
                    if ( !body._prop.parent && !body._prop.a ) return;
                    var parent;
                    for ( let i = 0, l = this.bodies.length; i < l; ++i ) {
                        if ( this.bodies[ i ].name === body._prop.parent ) {
                            parent = this.bodies[ i ];
                            break;
                        }
                    }
                    if ( !parent ) return;
                    scale_space = Math.max( scale_space, body._prop.a * ( 1 + ( body._prop.e || 0 ) ) / 2 );
                    body.setFromOrbitalElements( parent.params.mass.length(), body._prop, 0 );
                    body.state.r.add( parent.state.r );
                    body.state.v.add( parent.state.v );
                } );
                console.log( this.bodies );

                // this.rings = [];
                // if ( this.bodies[ 1 ].name === 'Kidishi' ) {
                //     const parent = this.bodies[ 1 ];
                //     const r_0 = 141 + parent.params.radius.x;
                //     const r_1 = 18351 + parent.params.radius.x;
                //     for ( let a = r_0, incr = 5000; a < r_1; a += incr ) {
                //         for ( let j = 0, l = 32; j < l; ++j ) {
                //             const body = new KEPLER.Body( { radius: 1 } );
                //             body.setFromOrbitalElements( parent.params.mass.length(), {
                //                 a: a + incr * j / l,
                //                 // v: AV.RADIAN * j / l
                //             }, 0 );
                //             body.state.r.add( parent.state.r );
                //             body.state.v.add( parent.state.v );
                //             this.rings.push( body );
                //         }
                //     }
                // }

                if ( scale_space ) {
                    scale_space /= Math.min( this.ctx.canvas.width, this.ctx.canvas.height );
                    scale_space *= 1.01;
                    this.scale_space = scale_space;
                    // this.scale_space = 4e3;
                    this.scale_space = 1e3;
                }

                this.ready = true;
                this.run();
            } );
        }

        update() {
            for ( let i = 0; i < this.scale_time; ++i ) {
                const state_r = this.bodies.map( ( body ) => {
                    return body.state.r.clone();
                } );
                this.bodies.forEach( ( body ) => {
                    // body.strongest = null;
                    // var g_max = 0;
                    this.bodies.forEach( ( other_body, ind ) => {
                        if ( other_body.id === body.id ) return;
                        const m = other_body.params.mass.length();
                        if ( !m ) return;
                        const dist = body.state.r.distanceTo( state_r[ ind ] );
                        /** @type {number} Acceleration in km/s per second. */
                        const g = dist ? KEPLER.constants.G.value * m / ( dist ** 2 ) : 0;
                        // if ( g > g_max ) {
                        //     body.strongest = other_body;
                        //     g_max = g;
                        // }
                        /** @type {number} Direction toward center of gravity. */
                        const dir = state_r[ ind ].clone().sub( body.state.r ).normalize();
                        dir.multiplyScalar( g );
                        body.state.v.add( dir );
                    } );
                    body.state.r.add( body.state.v );
                } );
                // this.rings.forEach( ( particle ) => {
                //     this.bodies.forEach( ( other_body, ind ) => {
                //         if ( other_body.id === particle.id ) return;
                //         const m = other_body.params.mass.length();
                //         if ( !m ) return;
                //         const dist = particle.state.r.distanceTo( state_r[ ind ] );
                //         /** @type {number} Acceleration in km/s per second. */
                //         const g = dist ? KEPLER.constants.G.value * m / ( dist ** 2 ) : 0;
                //         /** @type {number} Direction toward center of gravity. */
                //         const dir = state_r[ ind ].clone().sub( particle.state.r ).normalize();
                //         dir.multiplyScalar( g );
                //         particle.state.v.add( dir );
                //     } );
                //     particle.state.r.add( particle.state.v );
                // } );
            }
        }

        draw() {
            const cvs = this.ctx.canvas;
            const ctx = this.ctx;
            const width = cvs.width = window.innerWidth;
            const height = cvs.height = window.innerHeight;

            const focus = 1;

            ctx.fillStyle = 'black';
            ctx.fillRect( 0, 0, width, height );

            // this.draw = () => {
            this.bodies.forEach( ( body ) => {
                const x = body.state.r.x - this.bodies[ focus ].state.r.x;
                const y = body.state.r.y - this.bodies[ focus ].state.r.y;
                const draw_x = width / 2 + x / this.scale_space;
                const draw_y = height / 2 - y / this.scale_space;
                const r = Math.max( 1, body.params.radius.length() / this.scale_space );
                ctx.fillStyle = body.color;
                ctx.beginPath();
                ctx.arc( draw_x, draw_y, r, 0, AV.RADIAN );
                ctx.fill();
                ctx.fillText( body.name, draw_x + r + 1, draw_y + r + 7 );

                // if ( !body._prop.parent || !body.strongest ) return;
                // const a = body.state.r.distanceTo( body.strongest.state.r );
                // const hill = a * Math.pow( body.params.mass.length() / ( 3 * body.strongest.params.mass.length() ), 1 / 3 );
                // ctx.strokeWidth = 2;
                // ctx.strokeStyle = body.color;
                // ctx.setLineDash( [ 2, 2 ] );
                // ctx.beginPath();
                // ctx.arc( draw_x, draw_y, r + hill / this.scale_space, 0, AV.RADIAN );
                // ctx.stroke();
            } );
            // this.rings.forEach( ( body ) => {
            //     const x = body.state.r.x - this.bodies[ focus ].state.r.x;
            //     const y = body.state.r.y - this.bodies[ focus ].state.r.y;
            //     const draw_x = width / 2 + x / this.scale_space;
            //     const draw_y = height / 2 - y / this.scale_space;
            //     const r = 0.5;
            //     ctx.fillStyle = body.color;
            //     ctx.beginPath();
            //     ctx.arc( draw_x, draw_y, r, 0, AV.RADIAN );
            //     ctx.fill();
            // } );
            // };
        }

        /** Initialize step function. */
        run() {
            const step = () => {
                /// Step function.
                // this.animate();
                /// Render function.
                // this.render();
                this.update();
                this.draw();
                /// Update the framerate display.
                if ( this.stats ) this.stats.update();

                if ( this.ready ) window.requestAnimationFrame( step );
            };
            window.requestAnimationFrame( step );
        }
    }

    $( function () {
        const APP = new App();
        APP.load( './data/kidishi.json' );
    } );
} )();
