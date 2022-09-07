/*jshint esversion: 7*/

import AV from '../../build/av.module.js/av.module.js';

(function () {
    const $_CVS = $('#output');
    const CVS = $_CVS.get( 0 );
    const CTX = CVS.getContext( '2d' );

    const BLOCKS = [];
    var blocks_id = 0;

    class Block {
        constructor( points = [], prop = {} ) {
            this.points = [ ...points ];
            this.id = blocks_id++;
            this.updateBounds();
            BLOCKS.push( this );
        }

        updateBounds() {
            this.x0 = this.points.reduce( function ( a, b ) {
                return Math.min( a, b.x );
            }, Infinity );
            this.y0 = this.points.reduce( function ( a, b ) {
                return Math.min( a, b.y );
            }, Infinity );
            this.x1 = this.points.reduce( function ( a, b ) {
                return Math.max( a, b.x );
            }, -Infinity );
            this.y1 = this.points.reduce( function ( a, b ) {
                return Math.max( a, b.y );
            }, -Infinity );
            this.width = this.x1 - this.x0;
            this.height = this.y1 - this.y0;
        }

        intersect( targ = BLOCKS ) {
            if ( Array.isArray( targ ) ) {
                var out = [];
                for ( let i = 0, l = targ.length; i < l; ++i ) {
                    if ( this.intersect( targ[ i ] ) ) out.push( targ[ i ] );
                }
                return out.length ? out : false;
            }
            if ( typeof( targ ) === 'object' ) {
                if ( this.id === targ.id ) return false;
                const is_undefined = [ 'x0', 'y0', 'x1', 'y1' ].reduce( ( acc, cur ) => {
                    return acc || AV.isUndefined( targ[ cur ] );
                }, false) === true;
                if ( !is_undefined ) {
                    if ( this.x1 < targ.x0 ) return false;
                    if ( this.y1 < targ.y0 ) return false;
                    if ( this.x0 > targ.x1 ) return false;
                    if ( this.y0 > targ.y1 ) return false;
                    return targ;
                }
            }

            console.error( 'Block.intersect() must input a Block object, an array of Block objects, or an object structured {x0, x1, y0, y1}.' );
            return null;
        }

        draw( ctx ) {
            ctx.strokeStyle = 'red';
            ctx.lineWidth = 2;
            if ( this.intersect() ) ctx.strokeStyle = 'blue';
            ctx.beginPath()
            ctx.moveTo( this.points[0].x, this.points[0].y );
            for ( let i = 1, l = this.points.length; i < l; ++i ) {
                const p = this.points[ i ];
                ctx.lineTo( p.x, p.y );
            }
            ctx.closePath();
            ctx.stroke();
        }
    }

    class App {
        constructor() {
            this.initCanvas();
            this.initBlocks();
            this.controlMouse();
        }

        cvs = {};
        cvs_order = [];

        blocks = [];

        initBlocks() {
            const cvs_obj = this.newCanvas( 'blocks', 0 );
            cvs_obj.draw = () => {
                cvs_obj.clear();
                BLOCKS.forEach( ( block ) => {
                    block.draw( cvs_obj.ctx );
                });
            };
        }

        initCanvas() {
            $( window ).on( 'resize', () => {
                CVS.width = window.innerWidth;
                CVS.height = window.innerHeight;
            }).trigger( 'resize' );
        }

        newCanvas( name, z_index ) {
            if ( this.cvs[ name ] ) {
                console.error( `Canvas ${ name } is already defined.` );
                return this.cvs[ name ];
            }
            if ( typeof( z_index ) === 'undefined' ) {
                if ( this.cvs_order ) {
                    z_index = 1 + this.cvs_order.reduce( ( a, b ) => {
                        return Math.max( a, b );
                    });
                } else {
                    z_index = 0;
                }
            }
            const cvs = $_CVS.clone( true ).get( 0 );
            const ctx = cvs.getContext( '2d' );
            const obj = {
                cvs: cvs,
                ctx: ctx,
                z: z_index,
                clear: () => {
                    ctx.clearRect( 0, 0, cvs.width, cvs.height );
                },
                draw: () => {}
            };
            obj.clear();
            this.cvs[ name ] = obj;
            this.cvs_order.push( obj );
            this.cvs_order.sort( ( a, b ) => {
                return b.z - a.z;
            });
            return obj;
        }

        controlMouse() {
            const cvs_obj = this.newCanvas( 'mouse', 1 );
            const cvs = cvs_obj.cvs;
            const ctx = cvs_obj.ctx;
            var active = false,
                pos = {};

            $_CVS.on( 'mousedown', ( event ) => {
                event.preventDefault();
                if ( event.which === 1 ) {
                    active = true;
                    pos.x0 = pos.x1 = event.pageX;
                    pos.y0 = pos.y1 = event.pageY;
                    $_CVS.addClass( 'no-cursor' );
                }
            }).on( 'mouseup', ( event ) => {
                event.preventDefault();
                if ( active ) {
                    const block = new Block([
                        { x: pos.x0, y: pos.y0 },
                        { x: pos.x1, y: pos.y0 },
                        { x: pos.x1, y: pos.y1 },
                        { x: pos.x0, y: pos.y1 }
                    ]);
                    console.log( block.x0, block.y0, block.x1, block.y1 );
                    this.blocks.push( block );
                }
                $_CVS.removeClass( 'no-cursor' );
                active = false;
            }).on( 'hover mousemove', ( event ) => {
                event.preventDefault();
                if ( !active ) return;
                if ( event.which === 0 ) {
                    active = false;
                    $_CVS.trigger( 'mouseup' );
                    return;
                }
                pos.x1 = event.pageX;
                pos.y1 = event.pageY;
            }).on( 'contextmenu', ( event ) => {
                event.preventDefault();
            });

            cvs_obj.draw = () => {
                ctx.clearRect( 0, 0, cvs.width, cvs.height );
                if ( !active ) return;
                // ctx.fillStyle = '#ffffff';
                ctx.strokeStyle = '#000000';
                ctx.lineWidth = 2;
                ctx.strokeRect( pos.x0, pos.y0, pos.x1 - pos.x0, pos.y1 - pos.y0 );
                // ctx.fillRect( pos.x1 - 14, pos.y1 - 14, 28, 28 );
            };
        }

        render() {
            CTX.clearRect( 0, 0, CVS.width, CVS.height );

            this.cvs_order.forEach( ( obj ) => {
                obj.draw();
                CTX.drawImage( obj.cvs, 0, 0 );
            });

        }

        /** Runs every frame. */
        run() {
            const step = ( time ) => {
                this.render();
                window.requestAnimationFrame( step );
            };
            window.requestAnimationFrame( step );
        }
    }

    $( function () {
        const APP = new App();
        APP.run();
    });
})();
