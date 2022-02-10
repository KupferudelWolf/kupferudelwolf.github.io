import AV from '../../lib/av.module.js';
import GUI from '../../lib/lil-gui.esm.js';

import { Body2D } from '../build/av-astro.module.js';

$( function () {
    AV.createStats();

    const CVS = $( '#output' ).get(0);
    const CTX = CVS.getContext( '2d' );

    const DATA = {
        'Sun': {
            radius: 695700,
            mass: 1.9885e+30,
            satellites: {
                'Saturn': {
                    radius: 58232,
                    mass: 5.6834e+26,
                    semi: 1.433537e+9,
                    ecc: 0.0565,
                    arg: 339.392 * Math.PI / 180,
                    raan: 113.665  * Math.PI / 180,
                    ring_inner: 0,
                    ring_outer: 135000,
                    satellites: {
                        'Pan': {
                            radius: 14.1,
                            mass: 4.95e+15,
                            semi: 133584,
                            anomaly: 0
                        },
                        'Daphnis': {
                            radius: 3.8,
                            mass: 8.4e+13,
                            semi: 136505,
                            anomaly: 0
                        },
                        'Mimas': {
                            radius: 198.2,
                            mass: 3.7493e+19,
                            semi: 185539,
                            anomaly: 0
                        },
                        'Enceladus': {
                            radius: 252,
                            mass: 1.08022e+20,
                            semi: 237948,
                            anomaly: 0
                        },
                        'Tethys': {
                            radius: 531.1,
                            mass: 6.17449e+20,
                            semi: 294619,
                            anomaly: 0
                        },
                        'Dione': {
                            radius: 561.4,
                            mass: 1.095452e+21,
                            semi: 377396,
                            anomaly: 0
                        },
                        'Rhea': {
                            radius: 763.8,
                            mass: 2.306518e+21,
                            semi: 527108,
                            anomaly: 0
                        },
                        'Titan': {
                            radius: 2574.73,
                            mass: 1.3452e+23,
                            semi: 1221870,
                            ecc: 0.0288,
                            anomaly: 0,
                            scale_height_min: 15,
                            scale_height_max: 50,
                            obliquity: 0
                        },
                        'Iapetus': {
                            radius: 734.5,
                            mass: 1.805635e+21,
                            semi: 3560820,
                            anomaly: 0
                        },
                    }
                }
            }
        }
    };


    const PATTERN_CVS = $( '<canvas>' ).get(0);
    const PATTERN_CTX = PATTERN_CVS.getContext( '2d' );
    PATTERN_CVS.width = 8;
    PATTERN_CVS.height = 8;
    for ( let x = -PATTERN_CVS.width, w = PATTERN_CVS.width; x <= w * 2; x += w ) {
        PATTERN_CTX.moveTo( x, 0 );
        PATTERN_CTX.lineTo( x - w, w );
        PATTERN_CTX.stroke();
    }
    const PATTERN = CTX.createPattern( PATTERN_CVS, 'repeat' );


    class App {
        WORLD_SCALE = 5e-4;
        TIME_SCALE = 1 / 365.2524; /// yr/sec

        cam_x = 0;
        cam_y = 0;
        cam_t = 0;

        /// https://en.wikipedia.org/wiki/Kirkwood_gap
        RESONANCES = [
            1/5,
            1/4,
            1/3,
            2/5,
            3/7,
            1/2,
            2/3,
            3/4
        ];

        constructor() {
            this.initTime();
            this.initGUI();
            this.initControls();

            this.bodies = [];
            this.initBodies( DATA );

            this.focus = this.bodies[ 0 ];

            this.bodies.forEach( ( body ) => {
                body.onAddMoon = ( moon ) => {
                    this.bodies.push( moon );
                };
                body.onDelete = ( moon ) => {
                    this.bodies = this.bodies.filter( ( obj ) => {
                        return obj && obj.id !== moon.id;
                    });
                };
                body.setFocus = ( moon ) => {
                    if ( this.focus && this.focus.id === moon.id ) {
                        this.focus = null;
                    } else {
                        this.focus = moon;
                    }
                    console.log( this.focus );
                    this.cam_t = 0;
                };
            });
        }

        initBodies( data, parent ) {
            for ( const key in data ) {
                if ( !data.hasOwnProperty( key ) ) continue;
                const datum = data[ key ];
                const sats = datum.satellites;
                datum.name = key;
                datum.parent = parent;
                const body = new Body2D( datum, this.gui );
                this.bodies.push( body );
                this.initBodies( sats, body );
            }
        }

        initControls() {
            let scale_power = Math.floor( Math.log10( this.WORLD_SCALE ) );
            $( CVS ).on( 'mousewheel', ( e ) => {
                let delta = e.originalEvent.wheelDelta / 120;
                delta = AV.clamp( delta, -1, 1 );

                if ( delta > 0 ) {
                    scale_power /= 1.025;
                } else if ( delta < 0 ) {
                    scale_power *= 1.025;
                }
                scale_power = AV.clamp( scale_power, -9, -1 );

                this.WORLD_SCALE = 5 * 10 ** scale_power;
            });
        }

        initGUI() {
            const time_scale_base = 1 / 365.2524;
            const prop = {
                'time_scale': 1,
                'time_reverse': false
            };
            this.TIME_SCALE = time_scale_base * prop.time_scale / 24;
            this.gui = new GUI({
                width: 320
            });
            this.gui.add( prop, 'time_scale', 0, 8760, 0.1 ).onChange( () => {
                this.TIME_SCALE = time_scale_base * prop.time_scale / 24;
                if ( prop.time_reverse ) this.TIME_SCALE *= -1;
            }).name( 'Speed' );
            this.gui.add( prop, 'time_reverse' ).onChange( () => {
                this.TIME_SCALE *= -1;
            }).name( 'Reverse Time' );
        }

        initTime() {
            let start, prev, timer;
            start = prev = timer = Date.now();
            this.now = () => {
                const delta = Date.now() - prev;
                prev = Date.now();
                timer += this.TIME_SCALE * delta;
                return timer;
            };
            this.realtime = () => {
                return start + ( this.now() - start ) * 365.2425 * 86400;
            };
        }

        updateBodies() {
            const timer = this.now() / 1000;
            this.bodies.forEach( ( body ) => {
                if ( !body ) return;
                if ( !body.parent ) {
                    body.x = 0;
                    body.y = 0;
                    return;
                }

                const pos = body.getCartesian( timer );
                body.x = pos.x + body.parent.x;
                body.y = pos.y + body.parent.y;
            });
        }

        updateCamera() {
            this.cam_t = AV.clamp( this.cam_t + 0.01 );
            if ( !this.focus ) return;
            let x = this.focus.x,
                y = this.focus.y;
            this.cam_x = AV.lerp( this.cam_x, x, this.cam_t ) || 0;
            this.cam_y = AV.lerp( this.cam_y, y, this.cam_t ) || 0;
        }

        drawOrbit() {
            const body = this.focus;
            if ( !body || !body.parent ) return;
            const anom = -body.anomaly;
            const per_time = body.period * anom / AV.RADIAN;
            const apo_time = body.period * ( 0.5 + anom / AV.RADIAN );
            const perigee = body.getCartesian( per_time );
            const apogee = body.getCartesian( apo_time );
            const perigee_x = this.WORLD_SCALE * ( perigee.x + body.parent.x - this.cam_x ) + CVS.width / 2;
            const perigee_y = this.WORLD_SCALE * ( perigee.y + body.parent.y - this.cam_y ) + CVS.height / 2;
            const apogee_x = this.WORLD_SCALE * ( apogee.x + body.parent.x - this.cam_x ) + CVS.width / 2;
            const apogee_y = this.WORLD_SCALE * ( apogee.y + body.parent.y - this.cam_y ) + CVS.height / 2;
            const ellipse = [
                ( apogee_x + perigee_x ) / 2,
                ( apogee_y + perigee_y ) / 2,
                this.WORLD_SCALE * body.semi,
                this.WORLD_SCALE * body.semi * Math.sqrt( 1 - body.ecc ** 2 ),
                body.arg
            ];
            // const t = ( this.now() / 1000 / body.period ) % 1;
            // if ( body.isCounterClockwise ) {
            //     ellipse.push(
            //         ( -t + 0.99 ) * AV.RADIAN,
            //         ( -t ) * AV.RADIAN,
            //         true
            //     );
            // } else {
            //     ellipse.push(
            //         ( t ) * AV.RADIAN,
            //         ( t - 0.99 ) * AV.RADIAN,
            //         true
            //     );
            // }
            ellipse.push( 0, AV.RADIAN, false );
            CTX.lineWidth = 1;
            CTX.strokeStyle = 'red';
            CTX.beginPath();
            CTX.rect( perigee_x - 4, perigee_y - 4, 8, 8 );
            CTX.stroke();
            CTX.beginPath();
            CTX.arc( apogee_x, apogee_y, 4, 0, AV.RADIAN );
            CTX.stroke();
            CTX.beginPath();
            CTX.ellipse( ...ellipse );
            CTX.stroke();
        }

        drawBodies() {
            // CTX.setLineDash( [ 1, 1 ] );
            CTX.strokeStyle = 'black';
            this.bodies.forEach( ( body ) => {
                if ( !body || !body.hill ) return;

                let x = this.WORLD_SCALE * ( body.x - this.cam_x ) + CVS.width / 2,
                    y = this.WORLD_SCALE * ( body.y - this.cam_y ) + CVS.height / 2,
                    r = this.WORLD_SCALE * body.hill;

                CTX.fillStyle = `rgba( 211, 211, 211, 0.25 )`;
                if ( body.children.length > 0 ) {
                    CTX.fillStyle = `grey`;
                }
                CTX.beginPath();
                CTX.arc( x, y, r, 0, AV.RADIAN );
                CTX.fill();
                CTX.stroke();
            });

            // CTX.setLineDash([]);
            this.bodies.forEach( ( body ) => {
                if ( !body ) return;
                // if ( body.name === 'Sun' ) return;

                const x = this.WORLD_SCALE * ( body.x - this.cam_x ) + CVS.width / 2;
                const y = this.WORLD_SCALE * ( body.y - this.cam_y ) + CVS.height / 2;
                const r = Math.max( this.WORLD_SCALE * body.radius, 1 );
                const dist = Math.sqrt( r ** 2 / 2 ) + 1;
                const t_x = x + dist;
                const t_y = y - dist;
                const scale_height = this.WORLD_SCALE * body.scale_height;

                if ( body.has_rings ) {
                    const r_min = this.WORLD_SCALE * body.ring_inner;
                    const r_max = this.WORLD_SCALE * body.ring_outer;
                    const region = new Path2D();
                    region.arc( x, y, r_min, 0, AV.RADIAN );
                    region.arc( x, y, r_max, 0, AV.RADIAN );

                    CTX.fillStyle = 'white';
                    CTX.fill( region, 'evenodd' );

                    body.children.forEach( ( moon ) => {
                        if ( !moon ) return;
                        const semi = this.WORLD_SCALE * moon.semi;
                        const hill = this.WORLD_SCALE * moon.hill;
                        this.RESONANCES.forEach( ( ratio ) => {
                            const r_rat = semi * ratio;
                            if ( r_rat < r_min || r_rat > r_max ) return;
                            CTX.lineWidth = Math.sin( Math.PI * ratio );
                            CTX.beginPath();
                            CTX.arc( x, y, r_rat, 0, AV.RADIAN );
                            CTX.stroke();
                        });
                        if ( semi + hill > r_min && semi - hill < r_max ) {
                            CTX.lineWidth = 2 * hill;
                            CTX.beginPath();
                            CTX.arc( x, y, semi, 0, AV.RADIAN );
                            CTX.stroke();
                        }
                    });

                }

                // CTX.setLineDash( [ 1, 1 ] );
                // CTX.strokeStyle = 'red';

                // CTX.setLineDash([]);
                CTX.lineWidth = 1;
                CTX.fillStyle = 'darkgrey';
                // CTX.strokeStyle = 'black';
                CTX.beginPath();
                CTX.arc( x, y, r, 0, AV.RADIAN );
                CTX.fill();
                CTX.stroke();

                if ( scale_height ) {
                    CTX.fillStyle = 'rgba( 0, 151, 151, 0.25 )';
                    CTX.beginPath();
                    CTX.arc( x, y, r + scale_height, 0, AV.RADIAN );
                    CTX.fill();
                }

                const font_size = AV.map( body.radius, 100, 10000, 8, 20, true );
                CTX.font = `${ Math.round( font_size ) }px Arial`;
                CTX.fillStyle = 'black';
                CTX.fillText( body.name, t_x, t_y );
            });
        }

        drawTimestamp() {
            const date = new Date( this.realtime() ).toLocaleString( undefined, {
                year: 'numeric',
                month: 'short',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                timeZoneName: 'short'
            });
            CTX.font = '10px Arial';
            const dims = CTX.measureText( date );
            CTX.fillStyle = 'white';
            CTX.fillRect( 8, CVS.height - 20, dims.width + 4, 12 );
            CTX.fillStyle = 'black';
            CTX.fillText( date, 10, CVS.height - 10 );
        }

        loop() {
            CTX.fillStyle = 'darkgrey';
            CTX.fillRect( 0, 0, CVS.width, CVS.height );
            CTX.fillStyle = PATTERN;
            CTX.fillRect( 0, 0, CVS.width, CVS.height );

            this.updateBodies();
            this.updateCamera();
            this.drawBodies();
            this.drawOrbit();

            this.drawTimestamp();
        }

        run() {
            let start,
                rate = 1000 / 60,
                step = ( time ) => {
                    let delta = Math.floor( time - start );
                    if ( delta >= rate || !start ) {
                        start = time;
                        this.loop();
                    }
                    window.requestAnimationFrame( step );
                };
            window.requestAnimationFrame( step );
        }
    }

    const APP = new App();
    APP.run();
});
