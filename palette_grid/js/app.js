/*jshint esversion: 7*/

import Cookies from '/build/js.cookie.min.js';
import AV from '/build/av.module.js/av.module.js';

( function () {
    const SIZE = 64;
    /**
     * @callback forEachCallback
     * @param {any} value
     * @param {number} index
     * @param {any[]} array
     */

    /** Class representing a color.
     * @class
     */
    class Color {
        /** @type {object} The internal data.*/
        data;
        /** @type {string} The hex value. */
        hex;

        /** Constructor.
         * @param {number|string} [color] - A numerical RGB value, RGB[A] hex color, RGB[A] code, or HSL[A] code.
         */
        constructor( color ) {
            this.data = {
                _r: 0,
                _g: 0,
                _b: 0,
                _a: 1
            };
            this.hex = '#000000ff';

            const type = typeof color;
            if ( type === 'undefined' ) return;
            if ( type === 'number' ) {
                /// Numerical value.
                this.setValue( color );
                return;
            }
            if ( type === 'string' ) {
                color = color.toLowerCase();
            } else {
                return;
            }
            if ( color[ 0 ] === '#' ) {
                /// Hex RGB or RGBA value.
                const args = [ 0, 0, 0, 1, false ];
                for ( let i = 0, l = ( color.length - 1 ) / 2; i < l; ++i ) {
                    const ind = i * 2 + 1;
                    const val = color.slice( ind, ind + 2 );
                    const num = Number( '0x' + val ) / 255;
                    args[ i ] = num;
                }
                this.setRGBA( ...args );
            }
            if ( !color.includes( ',' ) ) return;
            const code = color.slice( 0, 3 );
            const args = color.replace( /((rgba?)|(hsla?))\(|\)/g, '' ).split( ',' );
            const colors = [ 0, 0, 0 ];
            args.forEach( ( v, i ) => {
                colors[ i ] = Number( v.trim().replace( /[^0-9]/g, '' ) || 0 );
            } );
            if ( code === 'rgb' ) {
                /// RGB() or RGBA() value.
                if ( colors.length < 4 ) {
                    colors[ 3 ] = 1;
                }
                this.setRGBA( ...args );
            }
            if ( code === 'hsl' ) {
                if ( colors.length < 4 ) {
                    colors[ 3 ] = 1;
                }
                this.setHSLA( ...args );
            }
            return;
        }

        /** @type {number} The red value, from 0 to 1. */
        get r() { return this.data._r; }
        /** @type {number} The green value, from 0 to 1. */
        get g() { return this.data._g; }
        /** @type {number} The blue value, from 0 to 1. */
        get b() { return this.data._b; }
        /** @type {number} The alpha value, from 0 to 1. */
        get a() { return this.data._a; }
        set r( r ) {
            const s = Math.floor( r * 255 ).toString( 16 ).padStart( 2, '0' );
            this.hex = this.hex.slice( 0, 1 ) + s + this.hex.slice( 3 );
            this.data._r = r;
        }
        set g( g ) {
            const s = Math.floor( g * 255 ).toString( 16 ).padStart( 2, '0' );
            this.hex = this.hex.slice( 0, 3 ) + s + this.hex.slice( 53 );
            this.data._g = g;
        }
        set b( b ) {
            const s = Math.floor( b * 255 ).toString( 16 ).padStart( 2, '0' );
            this.hex = this.hex.slice( 0, 5 ) + s + this.hex.slice( 7 );
            this.data._b = b;
        }
        set a( a ) {
            const s = Math.floor( a * 255 ).toString( 16 ).padStart( 2, '0' );
            this.hex = this.hex.slice( 0, 7 ) + s;
            this.data._a = a;
        }

        /** Internal helper. */
        _hslHelper( p, q, t ) {
            if ( t < 0 ) t += 1;
            if ( t > 1 ) t -= 1;
            if ( t < 1 / 6 ) return p + ( q - p ) * 6 * t;
            if ( t < 1 / 2 ) return q;
            if ( t < 2 / 3 ) return p + ( q - p ) * ( 2 / 3 - t ) * 6;
            return p;
        }

        /** Calculates hue, saturation, and lightness.
         * @returns {{h: number, s: number, l: number, a: number}} The calculated HSLA, ranged 0 to 1.
         */
        calcHSL() {
            const r = this.r;
            const g = this.g;
            const b = this.b;
            const max = Math.max( r, g, b );
            const min = Math.min( r, g, b );
            var h, s, l = ( max + min ) / 2;

            if ( max === min ) {
                h = s = 0;
            } else {
                var d = max - min;
                s = l > 0.5 ? d / ( 2 - max - min ) : d / ( max + min );
                switch ( max ) {
                    case r: h = ( g - b ) / d + ( g < b ? 6 : 0 ); break;
                    case g: h = ( b - r ) / d + 2; break;
                    case b: h = ( r - g ) / d + 4; break;
                }
                h /= 6;
            }

            return {
                h: h,
                s: s,
                l: l,
                a: this.a
            };
        }

        /** Set this color to match another.
         * @param {Color} color - The color to match.
         * @returns {this}
         */
        copy( color ) {
            this.r = color.r;
            this.g = color.g;
            this.b = color.b;
            this.a = color.a;
            return this;
        }

        /** Creates a new Color object that matches this one.
         * @returns {Color} The new color.
         */
        clone() {
            return new Color( this.getValue() );
        }

        /** Creates a CSS-compatible hex string in the format #rrggbb[aa].
         * @param {boolean} [includeAlpha] - Include the alpha.
         * @returns {string} The hex code.
        */
        getHex( includeAlpha ) {
            // if ( typeof includeAlpha === 'undefined' ) {
            //     includeAlpha = this.a < 1;
            // }
            // var out = '#';
            // out += ( this.r * 255 ).toString( 16 ).padStart( 2, '0' );
            // out += ( this.g * 255 ).toString( 16 ).padStart( 2, '0' );
            // out += ( this.b * 255 ).toString( 16 ).padStart( 2, '0' );
            // if ( includeAlpha ) {
            //     out += ( this.a * 255 ).toString( 16 ).padStart( 2, '0' );
            // }
            // return out;
            if ( includeAlpha ) return this.hex.slice( 0, -2 );
            return this.hex;
        }

        /** Creates a CSS-compatible HSL string in the format hsl(h, s%, l%).
         * @param {('deg'|'turn')} [mode] - Changes the hue's type.
         * @returns {string} The hsl code.
        */
        getHSL( mode ) {
            const hsl = this.calcHSL();
            var h = hsl.h * 60,
                s = hsl.s * 100,
                l = hsl.l * 100;
            switch ( mode ) {
                case 'deg':
                    h += 'deg';
                    break;
                case 'turn':
                    h /= 360;
                    h += 'turn';
                    break;
            }
            return `hsl(${ h }, ${ s }%, ${ l }%)`;
        }

        /** Creates a CSS-compatible HSLA string in the format hsla(h, s%, l%, a%).
         * @param {('deg'|'turn')} [mode] - Changes the hue's type.
         * @returns {string} The hsla code.
        */
        getHSLA( mode ) {
            const hsl = this.getHSL( mode ).slice( 0, -1 );
            return hsl + ' ' + this.a * 100 + '%)';
        }

        /** Calculates the luminosity. Note that this may not equal HSL lightness.
         * @returns {number} The luminosity, from 0 to 1.
         */
        getLuma() {
            return 0.2126 * this.r + 0.7152 * this.g + 0.0722 * this.b;
        }

        /** Creates a CSS-compatible RGB string in the format rgb(r, g, b).
         * @param {boolean} [percent] - Changes the values to be percentages rather than 0 - 255.
         * @returns {string} The rgb code.
        */
        getRGB( percent ) {
            if ( percent ) {
                return `rgb(${ this.r * 100 }%, ${ this.g * 100 }%, ${ this.b * 100 }%)`;
            }
            return `rgb(${ this.r * 255 }, ${ this.g * 255 }, ${ this.b * 255 })`;
        }

        /** Creates a CSS-compatible RGBA string in the format rgba(r, g, b, a).
         * @param {boolean} [percent] - Changes the values to be percentages rather than 0 - 255.
         * @returns {string} The rgba code.
        */
        getRGBA( percent ) {
            const rgb = this.getRGB( percent ).slice( 0, -1 );
            if ( percent ) {
                return rgb + this.a * 100 + '%)';
            }
            return rgb + ' ' + this.a + ')';
        }

        /** Calculates the numerical value of this color (ignoring alpha).
         * @returns {number} The value, from 0 to 16777215.
         */
        getValue() {
            const r = ( this.r * 0xff & 255 ) << 16;
            const g = ( this.g * 0xff & 255 ) << 8;
            const b = ( this.b * 0xff & 255 );
            return r + g + b;
        }

        /** Interpolates this color toward another.
         * @param {Color} color - The color to interpolate toward.
         * @param {number} t - The interpolation factor, from 0 to 1.
         * @param {boolean} hsl - Whether to interpolate HSL values rather than RGB values.
         * @returns {this}
         */
        lerp( color, t, hsl ) {
            if ( hsl ) {
                return this.lerpHSL( color, t );
            } else {
                return this.lerpRGB( color, t );
            }
        }

        /** Sets this color to one between two other colors.
         * @param {Color} color_a - The color to interpolate from.
         * @param {Color} color_b - The color to interpolate toward.
         * @param {number} t - The interpolation factor, from 0 to 1.
         * @param {boolean} hsl - Whether to interpolate HSL values rather than RGB values.
         * @returns {this}
         */
        lerpColors( color_a, color_b, t, hsl ) {
            return this.copy( color_a ).lerp( color_b, t, hsl );
        }

        /** Interpolates this color's HSL values toward another's.
         * @param {Color} color - The color to interpolate toward.
         * @param {number} t - The interpolation factor, from 0 to 1.
         * @returns {this}
         */
        lerpHSL( color, t ) {
            const color_a = this.calcHSL();
            const color_b = color.calcHSL();
            // const h = AV.lerp( color_a.h, color_b.h, t );
            const da = ( color_b.h - color_a.h ) % 1;
            const dist = 2 * da % 1 - da;
            const h = t * dist + color_a.h;
            const s = AV.lerp( color_a.s, color_b.s, t );
            const l = AV.lerp( color_a.l, color_b.l, t );
            const a = AV.lerp( color_a.a, color_b.a, t );
            return this.setHSLA( h, s, l, a );
        }

        /** Interpolates this color's RGB values toward another's.
         * @param {Color} color - The color to interpolate toward.
         * @param {number} t - The interpolation factor, from 0 to 1.
         * @returns {this}
         */
        lerpRGB( color, t ) {
            this.r = AV.lerp( this.r, color.r, t );
            this.g = AV.lerp( this.g, color.g, t );
            this.b = AV.lerp( this.b, color.b, t );
            this.a = AV.lerp( this.a, color.a, t );
            return this;
        }

        /** Sets this color's HSL values.
         * @param {number} h - The hue, from 0 to 1.
         * @param {number} s - The saturation, from 0 to 1.
         * @param {number} l - The lightness, from 0 to 1.
         * @returns {this}
         */
        setHSL( h, s, l ) {
            return this.setHSLA( h, s, l, this.a );
        }

        /** Sets this color's HSLA values.
         * @param {number} h - The hue, from 0 to 1.
         * @param {number} s - The saturation, from 0 to 1.
         * @param {number} l - The lightness, from 0 to 1.
         * @param {number} a - The alpha, from 0 to 1.
         * @returns {this}
         */
        setHSLA( h, s, l, a ) {
            this.a = a;
            if ( l === 0 || l === 1 || s === 0 ) {
                this.r = l;
                this.g = l;
                this.b = l;
                return;
            }
            const q = l < 0.5 ? l * ( 1 + s ) : l + s - l * s;
            const p = 2 * l - q;
            this.r = this._hslHelper( p, q, h + 1 / 3 );
            this.g = this._hslHelper( p, q, h );
            this.b = this._hslHelper( p, q, h - 1 / 3 );
            return this;
        }

        /** Sets this color's RGB values.
         * @param {number} r - The red, from 0 to 1.
         * @param {number} g - The green, from 0 to 1.
         * @param {number} b - The blue, from 0 to 1.
         * @returns {this}
         */
        setRGB( r, g, b ) {
            return this.setRGBA( r, g, b, this.a );
        }

        /** Sets this color's RGBA values.
         * @param {number} r - The red, from 0 to 1.
         * @param {number} g - The green, from 0 to 1.
         * @param {number} b - The blue, from 0 to 1.
         * @param {number} a - The alpha, from 0 to 1.
         * @returns {this}
         */
        setRGBA( r, g, b, a ) {
            this.r = r;
            this.g = g;
            this.b = b;
            this.a = a;
            return this;
        }

        /** Set the numerical value of this color. Note that the alpha will not change.
         * @param {number} vaLue - The value, from 0 to 16777215.
         * @returns {this}
         */
        setValue( value ) {
            this.r = ( ( value >> 16 ) & 255 ) / 255;
            this.g = ( ( value >> 8 ) & 255 ) / 255;
            this.b = ( value & 255 ) / 255;
            return this;
        }
    }

    /** Class representing a canvas's components.
     * @class
     */
    class CanvasObject {
        /** @type {jQuery} Object containing the canvas. */
        $;
        /** @type {CanvasRenderingContext2D} The target canvas's context. */
        ctx;
        /** @type {HTMLCanvasElement} The target canvas. */
        cvs;

        /** Constructor.
         * @param {string} [id] - The element ID to search for; if not found, a canvas will be created.
         * @param {string} [context] - Whether to create a 2D or WebGL context.
         */
        constructor( id, context ) {
            const cvs = document.getElementById( id ) || document.createElement( 'canvas' );
            const ctx = cvs.getContext( context || '2d' );
            cvs.id = id;
            this.cvs = cvs;
            this.ctx = ctx;
            this.$ = $( cvs );
            this.draw = () => { };
        }
    }

    /** Creates PaletteSquares.
     * @class
     */
    class PaletteSquareFactory {
        /** @type {number} Unique index for created squares. */
        index;
        /** @type {PaletteSquare[]} An array of all PaletteSquare instances. */
        squares;

        /** Constructor. */
        constructor() {
            this.squares = [];
            this.index = 0;
        }

        /** Creates a new square.
         * @returns {PaletteSquare} The new square.
         */
        createSquare( x, y ) {
            const obj = new PaletteSquare( {
                color: new Color(),
                x: x,
                y: y,
                w: SIZE,
                h: SIZE,
                index: this.index++
            } );
            obj.container = this;
            this.squares.push( obj );
            this.squares.sort( ( a, b ) => {
                return a.z - b.z;
            } );
            return obj;
        }

        /** Finds all squares beneath a given point.
         * @param {number} x - The x value to test.
         * @param {number} y - The y value to test.
         * @returns {PaletteSquare[]} The detected squares.
         */
        detectAll( x, y ) {
            const out = [];
            this.forEach( ( square ) => {
                if ( square.detect( x, y ) ) out.push( square );
            } );
            return out;
        }

        /** Iterates through all squares.
         * @param {forEachCallback} callback - Callback function.
         */
        forEach( callback ) {
            this.squares.forEach( callback );
        }
    }

    /** An individual square of color.
     * @class
     */
    class PaletteSquare {
        /** @type {number} The X position of the upper left corner. */
        x;
        /** @type {number} The Y position of the upper left corner. */
        y;
        /** @type {number} The depth value for draw order. */
        z;
        /** @type {number} The square's width */
        w;
        /** @type {number} The square's height */
        h;
        /** @type {Color} The color of the square. */
        color;
        /** @type {Color} Cached Color object. */
        color_cache;
        /** @type {object} Connected squares. */
        connections;
        /** @type {number} Timer for UI opacity. */
        gui_timer;
        /** @type {number} Unique index. */
        id;
        /** @type {boolean} Whether the square adjusts when moved. */
        locked;

        /** Constructor.
         * @param {object} prop - Properties.
         * @param {Color} color - The color of the square.
         * @param {number} prop.x - The X position of the upper left corner.
         * @param {number} prop.y - The Y position of the upper left corner.
         * @param {number} [prop.z] - The depth value for draw order.
         * @param {number} prop.w - The square's width.
         * @param {number} prop.h - The square's height.
         * @param {boolean} [prop.locked] - Whether the square adjusts when moved.
         * @param {boolean} prop.index - Unique index.
         */
        constructor( prop ) {
            this.color = prop.color;
            this.x = prop.x;
            this.y = prop.y;
            this.z = prop.z || 0;
            this.w = prop.w;
            this.h = prop.h;
            this.id = prop.index;

            this.locked = prop.locked || false;

            this.connections = {
                'left': null,
                'top': null,
                'right': null,
                'bottom': null
            };
            this.color_cache = new Color();

            this.gui_timer = Date.now();
        }

        /** Check if this aligns with a specific square, and connects if so.
         * @param {PaletteSquare} target - The square to attempt to link.
         * @returns {string|null} The side this square attached to, if any.
         */
        connect( target ) {
            const x = Math.sign( target.x - this.x );
            const y = Math.sign( target.y - this.y );
            /// Check if they are aligned.
            if ( Math.abs( x ) === Math.abs( y ) ) return null;
            /// Find which side to connect.
            var side, invs;
            if ( x === -1 ) side = 'left', invs = 'right';
            if ( y === -1 ) side = 'top', invs = 'bottom';
            if ( x === 1 ) side = 'right', invs = 'left';
            if ( y === 1 ) side = 'bottom', invs = 'top';
            if ( !side ) return null;
            /// Ignore if a connection already exists.
            if ( this.connections[ side ] ) return null;
            if ( target.connections[ invs ] ) return null;
            /// Connect the squares.
            this.connections[ side ] = target;
            target.connections[ invs ] = this;
            return side;
        }

        /** Verify that all connections are still valid. */
        checkConnections() {
            const detached = [];
            [ 'left', 'top', 'bottom', 'right' ].forEach( ( key ) => {
                const target = this.connections[ key ];
                if ( !target ) return;
                const dir = ( key === 'left' || key === 'right' ) ? 'x' : 'y';
                const sgn = ( key === 'left' || key === 'top' ) ? -1 : 1;
                const dir_inv = ( key === 'left' || key === 'right' ) ? 'y' : 'x';
                if ( Math.sign( target[ dir ] - this[ dir ] ) !== sgn || target[ dir_inv ] - this[ dir_inv ] !== 0 ) {
                    /// The squares are misaligned.
                    switch ( key ) {
                        case 'left': target.connections.right = null; break;
                        case 'top': target.connections.bottom = null; break;
                        case 'right': target.connections.left = null; break;
                        case 'bottom': target.connections.top = null; break;
                    }
                    this.connections[ key ] = null;
                    detached.push( target );
                }
            } );
            /// See if any of the formally connected squares can connect via another side.
            detached.forEach( ( square ) => {
                this.connect( square );
            } )
        }

        /** Deletes this square. */
        delete() {
            const new_list = [];
            const id = this.id;
            /// Make a list of every other square.
            this.container.forEach( ( target ) => {
                if ( target.id !== id ) {
                    new_list.push( target );
                }
            } );
            this.container.squares = [ ...new_list ];
            /// See what is currently connected to this square.
            const connections = [];
            [ 'left', 'top', 'right', 'down' ].forEach( ( side ) => {
                const target = this.connections[ side ];
                if ( target ) connections.push( target );
            } );
            /// Break connections to the selected square.
            this.x = this.y = SIZE / Math.PI;
            this.checkConnections();
            /// Connect squares that were connected to this one, if possible.
            connections.forEach( ( a ) => {
                connections.forEach( ( b ) => {
                    a.connect( b );
                } );
            } );
        }

        /** Determines whether a point is within this square.
         * @param {number} x - The x value to test.
         * @param {number} y - The y value to test.
         * @returns {boolean} Whether the point is within this square.
         */
        detect( x, y ) {
            if ( y < this.y || y > this.y + this.h - 1 ) return false;
            if ( x < this.x || x > this.x + this.w - 1 ) return false;
            return true;
        }

        /** Get the distance between this square and another.
         * @param {PaletteSquare} target - The other square.
         * @returns {number} The distance.
         */
        distanceTo( target ) {
            return Math.sqrt( ( this.y - target.y ) ** 2 + ( this.x - target.x ) ** 2 );
        }

        /** Draws the square.
         * @param {CanvasRenderingContext2D} ctx - The canvas context to draw the square on.
         * @param {CanvasRenderingContext2D} [gui] - The canvas context to draw GUI elements on.
         * @param {number} [x_off=0] - Shifts the X position.
         * @param {number} [y_off=0] - Shifts the Y position.
         */
        draw( ctx, gui, x_off = 0, y_off = 0 ) {
            const w = this.w;
            const h = this.h;
            const x1 = this.x + x_off;
            const y1 = this.y + y_off;
            // const x2 = x1 + w;
            // const y2 = y1 + h;
            ctx.fillStyle = this.color.hex;
            ctx.fillRect( x1, y1, w, h );
            /// Draw the gradients.
            [ 'left', 'top', 'bottom', 'right' ].forEach( ( key ) => {
                const targ = this.connections[ key ];
                if ( !targ || this.id > targ.id ) return;
                const a = [ this.x, this.y ];
                const b = [ targ.x, targ.y ];
                if ( Math.abs( a[ 0 ] - b[ 0 ] ) > SIZE / 2 && Math.abs( a[ 1 ] - b[ 1 ] ) > SIZE / 2 ) {
                    /// Only draw the gradient if the squares are roughly aligned.
                    return;
                }
                const l = Math.max( Math.abs( a[ 0 ] - b[ 0 ] ), Math.abs( a[ 1 ] - b[ 1 ] ) ) / SIZE;
                for ( let i = 1; i < l; ++i ) {
                    var t = i / l;
                    // if ( targ.x < this.x || targ.y < this.y ) t = 1 - t;
                    const x = AV.lerp( a[ 0 ], b[ 0 ], t ) + x_off;
                    const y = AV.lerp( a[ 1 ], b[ 1 ], t ) + y_off;
                    this.color_cache.lerpColors( this.color, targ.color, t, true );
                    ctx.fillStyle = this.color_cache.hex;
                    ctx.fillRect( x, y, SIZE, SIZE );
                }
            } );
            if ( !gui ) return;
            /// Draw the node dot.
            const luma = this.color.getLuma();
            gui.strokeStyle = luma < 0.5 ? 'white' : 'black';
            gui.fillStyle = 'red';
            gui.beginPath();
            gui.arc( x1 + w / 2, y1 + h / 2, 8, 0, AV.RADIAN );
            gui.fill();

            /// Draw the node connections.
            gui.fillStyle = 'red';
            gui.strokeStyle = 'red';
            gui.lineWidth = 2;
            [ 'left', 'top', 'bottom', 'right' ].forEach( ( key ) => {
                const targ = this.connections[ key ];
                if ( targ && this.id < targ.id ) {
                    gui.beginPath()
                    gui.moveTo( this.x + x_off + SIZE / 2, this.y + y_off + SIZE / 2 );
                    gui.lineTo( targ.x + x_off + SIZE / 2, targ.y + y_off + SIZE / 2 );
                    gui.stroke();
                }
            } );
        }
    }

    /** Main function. */
    class App {
        /** @type {string} The background color (in #rrggbb format). */
        background_color;
        /** @type Negative X position for canvas space. */
        cam_x;
        /** @type Negative Y position for canvas space. */
        cam_y;
        /** @type {CanvasObject} Output image. */
        output;
        /** @type {CanvasObject} UI image. */
        overlay;

        /** Constructor. */
        constructor() {
            this.background_color = '#cccccc';

            this.initCanvas();
            this.cam_x = ( this.output.cvs.width - SIZE ) / 2;
            this.cam_y = ( this.output.cvs.height - SIZE ) / 2;
            this.container = new PaletteSquareFactory();
            this.initContextMenu();
            this.initMouse();

            /// Load from cookies.
            if ( !this.load() ) {
                /// Create an initial square if no data is available.
                this.container.createSquare( 0, 0 ).color.setValue( Math.random() * 0xffffff );
            }
        }

        /** Updates the canvases. */
        drawCanvas() {
            const vw = this.output.cvs.width;
            const vh = this.output.cvs.height;
            const vx = this.cam_x;
            const vy = this.cam_y;
            const ctx = this.output.ctx;
            const gui = this.overlay.ctx;
            ctx.fillStyle = this.background_color;
            ctx.fillRect( 0, 0, vw, vh );
            gui.clearRect( 0, 0, vw, vh );
            /// Background pattern.
            ctx.strokeStyle = '#aaa';
            for ( let y = vy % SIZE; y < vh; y += SIZE ) {
                for ( let x = vx % SIZE; x < vw; x += SIZE ) {
                    ctx.beginPath();
                    ctx.moveTo( x, y - 4 );
                    ctx.lineTo( x, y + 4 );
                    ctx.moveTo( x - 4, y );
                    ctx.lineTo( x + 4, y );
                    ctx.stroke();
                }
            }
            /// Squares and GUI elements.
            this.container.forEach( ( square ) => {
                square.draw( ctx, gui, vx, vy );
            } );
            this.output.draw( ctx );
            this.overlay.draw( gui );
            const timer = Date.now() - this.gui_timer;
            const opacity = AV.clamp( 1 - ( timer - 3000 ) / 500 );
            this.overlay.$.css( 'opacity', opacity );
        }

        /** Initialize the canvases. */
        initCanvas() {
            this.output = new CanvasObject( 'palette' );
            this.overlay = new CanvasObject( 'overlay' );

            this.output.ctx.willReadFrequently = true;

            const resize = () => {
                this.output.cvs.width = this.overlay.cvs.width = window.innerWidth;
                this.output.cvs.height = this.overlay.cvs.height = window.innerHeight;
            };

            $( window ).on( 'resize', resize );
            resize();
        }

        /** Initialize the context menu. */
        initContextMenu() {
            var target, mouse_x, mouse_y;

            const menu = $( '.menu' );
            menu.on( 'contextmenu', ( event ) => {
                event.preventDefault();
            } );
            menu.children().on( 'mouseover mousemove hover', () => {
                /// Make the GUI visible.
                this.gui_timer = Date.now();
            } );

            const menu_add = $( '.menu #ctrl-add' );
            const menu_color = $( '.menu #ctrl-color' );
            const menu_copy = $( '.menu #ctrl-copy' );
            const menu_delall = $( '.menu #ctrl-delall' );
            const menu_delete = $( '.menu #ctrl-delete' );
            const menu_save = $( '.menu #ctrl-save' );

            this.activateMenu = ( x, y, t ) => {
                target = t || null;
                mouse_x = x;
                mouse_y = y;
                /// Bring up the context menu.
                menu.addClass( 'active' );
                menu.css( {
                    'left': x,
                    'top': y
                } );
                menu_add.toggleClass( 'hidden', !!target );
                menu_color.parent().toggleClass( 'hidden', !target );
                menu_delete.toggleClass( 'hidden', !target );
                menu_delall.toggleClass( 'disabled', this.container.squares.length === 0 );
                menu_delall.toggleClass( 'hidden', !!target );
            };

            menu_add.on( 'click', () => {
                /// Create a new square.
                if ( menu_add.hasClass( 'disabled' ) ) return;
                menu.removeClass( 'active' );
                /// Get the pixel data before adding the square.
                const point = this.output.ctx.getImageData( mouse_x, mouse_y, 1, 1 ).data;
                const x = Math.floor( ( mouse_x - this.cam_x ) / SIZE ) * SIZE;
                const y = Math.floor( ( mouse_y - this.cam_y ) / SIZE ) * SIZE;
                const square = this.container.createSquare( x, y );
                /// Set the color to that of any gradients beneath the point.
                square.color.setRGB( point[ 0 ] / 255, point[ 1 ] / 255, point[ 2 ] / 255 );
                if ( square.color.hex === this.background_color + 'ff' ) {
                    /// Make the color random instead.
                    square.color.setValue( Math.random() * 0xffffff );
                }
                this.save();
            } );

            menu_color.on( 'input change', () => {
                /// Change the color.
                if ( !target ) return;
                const hex = menu_color.val();
                const num = parseInt( hex.slice( 1 ), 16 );
                target.color.setValue( num );
                target.checkConnections();
                this.save();
            } ).on( 'click', ( event ) => {
                /// This prevents an infinite loop.
                event.stopPropagation();
            } ).parent().on( 'click', () => {
                /// Clicking the text by the button should be valid.
                menu_color.trigger( 'click' );
            } );

            menu_copy.on( 'click', () => {
                /// Copy the output onto the clipboard.
                menu.removeClass( 'active' );
                this.output.cvs.toBlob( function ( blob ) {
                    navigator.clipboard.write( [
                        new ClipboardItem( { "image/png": blob } )
                    ] );
                } );
            } );

            menu_delall.on( 'click', () => {
                if ( menu_delall.hasClass( 'disabled' ) ) return;
                menu.removeClass( 'active' );
                this.container.squares = [];
                this.cam_x = ( this.output.cvs.width - SIZE ) / 2;
                this.cam_y = ( this.output.cvs.height - SIZE ) / 2;
            } );

            menu_delete.on( 'click', () => {
                /// Delete the selected square.
                if ( !target ) return;
                menu.removeClass( 'active' );
                target.delete();
                target = null;
            } );

            const export_link = $( '<a>' ).get( 0 );
            menu_save.on( 'click', () => {
                /// Save the output.
                menu.removeClass( 'active' );
                export_link.setAttribute( 'href', this.output.cvs.toDataURL( 'image/png' ) );
                export_link.setAttribute( 'download', `My Pixel Palette` );
                export_link.click();
            } );
        }

        /** Initialize mouse input. */
        initMouse() {
            const obj = this.overlay;
            const $cvs = obj.$;
            const menu = $( '.menu' );
            var button, clicked, long, spacebar, target, time,
                mouse_x, mouse_y, start_x, start_y,
                target_x, target_y, view_x, view_y;

            /// Listen for the spacebar.
            document.body.onkeydown = ( event ) => {
                spacebar = event.code === 'Space';
            };
            document.body.onkeyup = () => {
                spacebar = false;
            };

            $cvs.on( 'contextmenu', ( event ) => {
                event.preventDefault();
            } );
            $cvs.on( 'mousedown', ( event ) => {
                event.preventDefault();
                /// Make the GUI visible.
                this.gui_timer = Date.now();
                /// Ignore if another mouse button is currently pressed.
                if ( button ) return;
                /// Deactivate the context menu.
                menu.removeClass( 'active' );
                /// Keep track of which mouse button is being pressed.
                button = event.which;
                /// Record the current mouse position.
                start_x = mouse_x = event.clientX;
                start_y = mouse_y = event.clientY;
                /// Translate the mouse position to canvas space.
                view_x = mouse_x - this.cam_x;
                view_y = mouse_y - this.cam_y;
                /// Check whether any squares are beneath the pointer.
                target = null;
                const squares = this.container.detectAll( view_x, view_y );
                if ( squares.length > 0 ) {
                    target = squares[ squares.length - 1 ];
                    target_x = target.x;
                    target_y = target.y;
                }
                switch ( button ) {
                    case 1:
                        /// Left click.
                        clicked = true;
                        /// Spacebar forces drag.
                        if ( spacebar ) {
                            target = false;
                            break;
                        }
                        long = true;
                        time = Date.now();
                        /// Long-click indicator and listener.
                        obj.draw = ( ctx ) => {
                            if ( !clicked ) return;
                            const t = ( Date.now() - time ) / 500;
                            ctx.strokeStyle = 'red';
                            ctx.beginPath();
                            ctx.arc( mouse_x, mouse_y, 16, 0, t * AV.RADIAN );
                            ctx.stroke();
                            if ( long && Date.now() - time > 500 ) {
                                /// Long-click is successful.
                                $cvs.trigger( 'mouseup', [ 1 ] );
                            }
                        };
                        break;
                    case 2:
                        /// Middle click.
                        clicked = true;
                        break;
                    case 3:
                        /// Right click.
                        this.activateMenu( mouse_x, mouse_y, target );
                        $cvs.trigger( 'mouseup', [ 3 ] );
                        break;
                    default:
                        break;
                }
            } );
            $cvs.on( 'mouseover mousemove', ( event ) => {
                event.preventDefault();
                /// Make the GUI visible.
                this.gui_timer = Date.now();
                if ( !clicked ) return;
                mouse_x = event.clientX;
                mouse_y = event.clientY;
                switch ( button ) {
                    case 1:
                        /// Left click.
                        /// Spacebar forces drag.
                        if ( spacebar ) {
                            target = false;
                            obj.draw = () => { };
                            long = false;
                        }
                        const dist = Math.sqrt( ( mouse_y - start_y ) ** 2 + ( mouse_x - start_x ) ** 2 );
                        if ( long && dist >= 2 ) {
                            /// Moved too far for a long-click.
                            obj.draw = () => { };
                            long = false;
                        }
                        if ( long ) break;
                        if ( target ) {
                            target.x = mouse_x - this.cam_x - SIZE / 2;
                            target.y = mouse_y - this.cam_y - SIZE / 2;
                        } else {
                            this.cam_x = mouse_x - view_x;
                            this.cam_y = mouse_y - view_y;
                            this.save();
                        }
                        break;
                    case 2:
                        /// Middle click.
                        this.cam_x = mouse_x - view_x;
                        this.cam_y = mouse_y - view_y;
                        this.save();
                        break;
                    default:
                        break;
                }
            } );
            $cvs.on( 'mouseup mouseleave', ( event, prop ) => {
                event.preventDefault();
                if ( !prop && event.which !== button ) return;
                switch ( ( prop && prop[ 0 ] ) || button ) {
                    case 1:
                        /// Left click.
                        if ( clicked ) {
                            if ( long && Date.now() - time > 500 ) {
                                /// Long-click was successful.
                                if ( target ) {
                                    // target.locked = !target.locked;
                                } else {
                                    //
                                }
                            }
                            if ( target ) {
                                if ( event.type === 'mouseleave' ) {
                                    /// The mouse moved off the screen. Oops!
                                    target.x = target_x;
                                    target.y = target_y;
                                } else {
                                    /// Snap the square to the grid.
                                    const x = Math.round( target.x / SIZE ) * SIZE;
                                    const y = Math.round( target.y / SIZE ) * SIZE;
                                    /// Check if the square will collide with another.
                                    /// Make sure the target itself isn't detected.
                                    target.y += SIZE;
                                    const detects = this.container.detectAll( x, y )[ 0 ];
                                    target.y -= SIZE;
                                    if ( detects ) {
                                        /// Place the square back where it belongs.
                                        target.x = target_x;
                                        target.y = target_y;
                                        /// See if the squares can connect.
                                        target.connect( detects );
                                    } else {
                                        /// Place the square.
                                        target.x = x;
                                        target.y = y;
                                    }
                                    /// Verify the current gradients.
                                    target.checkConnections();
                                    this.save();
                                }
                            }
                        }
                        obj.draw = () => { };
                        target = null;
                        view_x = view_y = mouse_x = mouse_y = start_x = start_y = target_x = target_y = 0;
                        clicked = long = false;
                        break;
                    case 2:
                        /// Middle click.
                        view_x = view_y = mouse_x = mouse_y = start_x = start_y = target_x = target_y = 0;
                        clicked = long = false;
                        break;
                    default:
                        break;
                }
                button = null;
            } );
        }

        /** Loads data from cookies. */
        load() {
            const cookie = Cookies.get( 'data' );
            if ( !cookie ) return;
            const data = JSON.parse( cookie );
            if ( data.length === 0 ) {
                Cookies.remove( 'data' );
                return;
            }
            const list_by_id = [];
            var max_id = 0;
            data.forEach( ( obj ) => {
                switch ( obj.type ) {
                    case 'square':
                        const square = this.container.createSquare( obj.x, obj.y );
                        square.color.setValue( obj.color );
                        square.id = obj.id;
                        max_id = Math.max( max_id, square.id );
                        list_by_id[ obj.id ] = square;
                        obj.square = square;
                        break;
                    case 'meta':
                        this.cam_x = obj.x;
                        this.cam_y = obj.y;
                        break;
                }
            } );
            this.container.index = max_id + 1;
            /// Load saved connections.
            data.forEach( ( obj ) => {
                if ( obj.type !== 'square' || !obj.links ) return;
                obj.links.forEach( ( id ) => {
                    const target = list_by_id[ id ];
                    if ( !target ) return;
                    obj.square.connect( target );
                } );
            } );
            return true;
        }

        /** Saves the current squares to cookies. */
        save() {
            const data = [ {
                type: 'meta',
                x: this.cam_x,
                y: this.cam_y
            } ];
            this.container.forEach( ( square ) => {
                const obj = {
                    type: 'square',
                    id: square.id,
                    color: square.color.getValue(),
                    x: square.x,
                    y: square.y,
                    links: []
                };
                [ 'left', 'top', 'right', 'down' ].forEach( ( side ) => {
                    const target = square.connections[ side ];
                    if ( target ) obj.links.push( target.id );
                } );
                data.push( obj );
            } );
            const cookie = JSON.stringify( data );
            Cookies.set( 'data', cookie );
        }

        /** Runs every frame. */
        run() {
            const step = () => {
                this.drawCanvas();
                window.requestAnimationFrame( step );
            };
            window.requestAnimationFrame( step );
        }
    }

    $( function () {
        const APP = new App();
        APP.run();
    } );
} )();
