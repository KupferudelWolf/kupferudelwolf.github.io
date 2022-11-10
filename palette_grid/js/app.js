/*jshint esversion: 7*/

import Cookies from '/build/js.cookie.min.js';
import AV from '/build/av.module.js/av.module.js';

( function () {
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

            this.set( color || 0 );
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

        /** Attempts to automatically set the color.
         * @param {number|string} color - A numerical RGB value, RGB[A] hex color, RGB[A] code, or HSL[A] code.
         * @returns {boolean} Whether a color was successfully set.
         */
        set( color ) {
            const error_message = `"${ color }" could not be interpreted as a color.`;
            const type = typeof color;
            if ( type === 'undefined' ) {
                this.r = 0;
                this.g = 0;
                this.b = 0;
                this.a = 1;
                return false;
            }
            if ( type !== 'string' && type !== 'number' ) {
                console.warn( error_message );
                return false;
            }
            if ( type === 'number' ) {
                /// Numerical value.
                this.setValue( color );
                return true;
            }
            color = color.toLowerCase();
            if ( color[ 0 ] === '#' ) {
                /// Hex RGB or RGBA value.
                const args = [ 0, 0, 0, 1, false ];
                for ( let i = 0, l = ( color.length - 1 ) / 2; i < l; ++i ) {
                    const ind = i * 2 + 1;
                    const val = color.slice( ind, ind + 2 );
                    const num = Number( '0x' + val );
                    if ( isNaN( num ) ) {
                        console.warn( error_message );
                        return false;
                    }
                    args[ i ] = num / 255;
                }
                this.setRGBA( ...args );
                return true;
            }
            if ( color.includes( ',' ) ) {
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
                    return true;
                }
                if ( code === 'hsl' ) {
                    if ( colors.length < 4 ) {
                        colors[ 3 ] = 1;
                    }
                    this.setHSLA( ...args );
                    return true;
                }
            }
            console.warn( error_message );
            return false;
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
            this.draws = [];
        }

        /** Draw function. */
        draw() {
            this.draws.forEach( ( f ) => {
                f( this.ctx, this );
            } );
        }
    }

    /** Creates PaletteSquares.
     * @class
     */
    class PaletteSquareFactory {
        /** @type {number} Unique index for created connections. */
        id_c;
        /** @type {number} Unique index for created squares. */
        id_s;
        /** @type {PaletteSquare[]} An array of all PaletteSquare instances. */
        squares;

        /** Constructor.
         * @param {number} size - The size of the squares.
         */
        constructor( size ) {
            this.squares = [];
            this.connections = [];
            this.id_c = 0;
            this.id_s = 0;
            this.size = size;
        }

        /** Creates a new square.
         * @param {number} x - X position of square.
         * @param {number} y - Y position of square.
         * @param {string|number|Color} [color] - Square color.
         * @returns {PaletteSquare} The new square.
         */
        createSquare( x, y, color = 0 ) {
            if ( !( color instanceof Color ) ) {
                color = new Color( color );
            } else {
                color = color.clone();
            }
            const obj = new PaletteSquare( {
                color: color,
                x: x,
                y: y,
                w: this.size,
                h: this.size,
                index: this.id_s++
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
            this.forEachSquare( ( square ) => {
                if ( square.detect( x, y ) ) out.push( square );
            } );
            return out;
        }

        /** Iterates through all connections.
         * @param {forEachCallback} callback - Callback function.
         */
        forEachConnection( callback ) {
            this.connections.forEach( callback );
        }

        /** Iterates through all squares.
         * @param {forEachCallback} callback - Callback function.
         */
        forEachSquare( callback ) {
            this.squares.forEach( callback );
        }
    }

    /** An individual square of color.
     * @class
     */
    class PaletteSquare {
        _x;
        _y;
        /** @type {number} The depth value for draw order. */
        z;
        /** @type {number} The square's width */
        w;
        /** @type {number} The square's height */
        h;
        /** @type {Color} The color of the square. */
        color;
        /** @type {PaletteSquareConnection[]} Connected squares: top, right, bottom, left. */
        connections;
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
            this.w = prop.w;
            this.h = prop.h;
            this._x = Math.round( prop.x / this.w );
            this._y = Math.round( prop.y / this.h );
            this.z = prop.z || 0;
            this.id = prop.index;

            this.locked = prop.locked || false;

            this.connections = [ null, null, null, null ];

            this.gui_timer = Date.now();
        }

        /** @type {number} The X position of the upper left corner. */
        get x() {
            return this._x * this.w;
        }
        set x( x ) {
            this._x = x / this.w;
        }
        /** @type {number} The Y position of the upper left corner. */
        get y() {
            return this._y * this.h;
        }
        set y( y ) {
            this._y = y / this.h;
        }

        /** Check if this aligns with a specific square, and connects if so.
         * @param {PaletteSquare} target - The square to attempt to link.
         * @returns {PaletteSquareConnection|null} The square's connection, if any.
         */
        connect( target ) {
            const x = Math.sign( target.x - this.x );
            const y = Math.sign( target.y - this.y );
            /// Check if they are aligned.
            if ( Math.abs( x ) === Math.abs( y ) ) return null;
            /// Find which side to connect.
            // var side, invs;
            // if ( x === -1 ) side = 'left', invs = 'right';
            // if ( y === -1 ) side = 'top', invs = 'bottom';
            // if ( x === 1 ) side = 'right', invs = 'left';
            // if ( y === 1 ) side = 'bottom', invs = 'top';
            // if ( !side ) return null;
            // /// Ignore if a connection already exists.
            // if ( this.connections[ side ] ) return null;
            // if ( target.connections[ invs ] ) return null;
            // /// Connect the squares.
            // this.connections[ side ] = target;
            // target.connections[ invs ] = this;
            // return side;
            const connection = new PaletteSquareConnection( this, target );
            return connection;
        }

        /** Verify that all connections are still valid. */
        checkConnections() {
            // const detached = [];
            // [ 'left', 'top', 'bottom', 'right' ].forEach( ( key ) => {
            //     const target = this.connections[ key ];
            //     if ( !target ) return;
            //     const dir = ( key === 'left' || key === 'right' ) ? 'x' : 'y';
            //     const sgn = ( key === 'left' || key === 'top' ) ? -1 : 1;
            //     const dir_inv = ( key === 'left' || key === 'right' ) ? 'y' : 'x';
            //     if ( Math.sign( target[ dir ] - this[ dir ] ) !== sgn || target[ dir_inv ] - this[ dir_inv ] !== 0 ) {
            //         /// The squares are misaligned.
            //         switch ( key ) {
            //             case 'left': target.connections.right = null; break;
            //             case 'top': target.connections.bottom = null; break;
            //             case 'right': target.connections.left = null; break;
            //             case 'bottom': target.connections.top = null; break;
            //         }
            //         this.connections[ key ] = null;
            //         detached.push( target );
            //     }
            // } );
            // /// See if any of the formally connected squares can connect via another side.
            // detached.forEach( ( square ) => {
            //     this.connect( square );
            // } );
            this.connections.forEach( ( conn ) => {
                if ( conn ) conn.check();
            } );
        }

        /** Deletes this square. */
        delete() {
            const new_list = [];
            const id = this.id;
            /// Make a list of every other square.
            this.container.forEachSquare( ( target ) => {
                if ( target.id !== id ) {
                    new_list.push( target );
                }
            } );
            this.container.squares = [ ...new_list ];
            /// See what is currently connected to this square.
            /// Delete connections to the selected square.
            const old_conns = [];
            this.connections.forEach( ( conn ) => {
                if ( !conn ) return;
                conn.squares.forEach( ( sq ) => {
                    if ( sq && sq.id !== this.id ) old_conns.push( sq );
                } );
                conn.delete();
            } );
            // this.x = this.w / Math.PI;
            // this.y = this.h / Math.PI;
            // this.checkConnections();
            /// Connect squares that were connected to this one, if possible.
            old_conns.forEach( ( a ) => {
                old_conns.forEach( ( b ) => {
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
            if ( x < this.x || x > this.x + this.w - 1 ) return false;
            if ( y < this.y || y > this.y + this.h - 1 ) return false;
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
            /// Add a lil to help prevent gaps.
            const w = this.w + 0.49;
            const h = this.h + 0.49;
            const x1 = this.x + x_off;
            const y1 = this.y + y_off;
            // const x2 = x1 + w;
            // const y2 = y1 + h;
            ctx.fillStyle = this.color.hex;
            ctx.fillRect( x1, y1, w, h );

            if ( !gui ) return;

            /// Draw the node dot.
            const luma = this.color.getLuma();
            this.node_color = luma < 0.5 ? '#fff' : '#000';

            gui.fillStyle = this.color.hex;
            gui.strokeStyle = this.node_color;
            gui.lineWidth = 2;
            gui.beginPath();
            gui.arc( x1 + w / 2, y1 + h / 2, 8, 0, AV.RADIAN );
            gui.fill();
            gui.stroke();
        }
    }

    /** Connection between two squares.
     * @class
     */
    class PaletteSquareConnection {
        /** @type {Color} Cached Color object. */
        color_cache;

        /** Constructor.
         * @param {PaletteSquare} sq_a - A square to connect.
         * @param {PaletteSquare} sq_b - A square to connect.
         */
        constructor( sq_a, sq_b ) {
            this.color_cache = new Color();

            this.container = sq_a.container;
            this.container.connections.push( this );
            this.id = this.container.id_c++;
            this.squares = [ sq_a, sq_b ];
            this.check();
        }

        /** Checks whether the connection is valid; updates sides if so, removes self if not.
         * @returns {boolean}
         */
        check() {
            const pts = this.getPoints();
            const sq_a = pts[ 0 ];
            const sq_b = pts[ 1 ];
            const x_aligned = sq_a.x === sq_b.x;
            const y_aligned = sq_a.y === sq_b.y;
            if ( x_aligned === y_aligned ) {
                this.delete();
                return false;
            }
            this.disconnect();
            this.axis = pts[ 2 ].axis;
            this.axis_inverse = pts[ 2 ].inverse;
            /// 0: top, 1: right, 2: bottom, 3: left.
            const ind_a = this.axis === 'x' ? 1 : 2;
            const ind_b = this.axis === 'x' ? 0 : 3;
            if ( sq_a.connections[ ind_a ] || sq_b.connections[ ind_b ] ) {
                /// One or both of the squares has a connection that's in the way.
                this.delete();
                return false;
            }
            sq_a.connections[ ind_a ] = sq_b.connections[ ind_b ] = this;
            return true;
        }

        delete() {
            this.disconnect();
            this.squares = [];
            const new_conns = [];
            this.container.connections.forEach( ( conn, ind ) => {
                if ( conn && conn.id !== this.id ) {
                    new_conns.push( conn );
                }
            } );
            this.container.connections = [ ...new_conns ];
        };

        disconnect() {
            this.squares.forEach( ( square ) => {
                square.connections.forEach( ( conn, ind ) => {
                    if ( !conn || conn.id === this.id ) {
                        square.connections[ ind ] = null;
                    }
                } );
            } );
        }

        draw( ctx, gui, x_off = 0, y_off = 0 ) {
            // const x1 = this.x + x_off;
            // const y1 = this.y + y_off;
            const pts = this.getPoints();
            const sq_a = this.squares[ 0 ];
            const sq_b = this.squares[ 1 ];

            if ( !sq_a && !sq_b ) {
                this.delete();
                return;
            }

            this.axis = pts[ 2 ].axis;
            this.axis_inverse = pts[ 2 ].inverse;

            /// Draw the gradients.
            const diff_x = Math.abs( sq_b.x - sq_a.x );
            const diff_y = Math.abs( sq_b.y - sq_a.y );
            /// Only draw the gradient if the squares are roughly aligned.
            if ( diff_x > sq_a.w / 2 && diff_y > sq_a.h / 2 ) {
                // return;
            }
            const ang = Math.atan2( diff_y, diff_x );
            ctx.globalAlpha = Math.cos( ang * 2 ) ** 4;
            const dist = AV.dist( sq_a.x, sq_a.y, sq_b.x, sq_b.y );
            for ( let l = dist / sq_a.w, i = 1 - l % 1; i < l; ++i ) {
                const t = i / l;
                /// Draw the gradient.
                const x = AV.lerp( sq_a.x, sq_b.x, t ) + x_off;
                const y = AV.lerp( sq_a.y, sq_b.y, t ) + y_off;
                this.color_cache.lerpColors( sq_a.color, sq_b.color, t, true );
                ctx.fillStyle = this.color_cache.hex;
                ctx.fillRect( x, y, sq_a.w, sq_a.h );
            }
            ctx.globalAlpha = 1;

            if ( !gui ) return;

            /// Draw the node connections.
            gui.strokeStyle = sq_a.node_color || sq_b.node_color || this.node_color;
            gui.lineWidth = 2;
            const x0 = sq_a.x + x_off + sq_a.w / 2;
            const y0 = sq_a.y + y_off + sq_a.h / 2;
            const x1 = sq_b.x + x_off + sq_b.w / 2;
            const y1 = sq_b.y + y_off + sq_b.h / 2;
            if ( sq_a.node_color && sq_a.node_color !== sq_b.node_color ) {
                const grad = gui.createLinearGradient( x0, y0, x1, y1 );
                grad.addColorStop( 0, sq_a.node_color );
                grad.addColorStop( 1, sq_b.node_color );
                gui.strokeStyle = grad;
            }
            gui.beginPath()
            gui.moveTo( x0, y0 );
            gui.lineTo( x1, y1 );
            gui.stroke();
        }

        getPoints() {
            var sq_a = this.squares[ 0 ],
                sq_b = this.squares[ 1 ];
            const out = [ sq_a, sq_b, {
                axis: null,
                inverse: null,
                dist: null
            } ];
            if ( !sq_a || !sq_b ) {
                return out;
            }
            const dir = sq_a.x === sq_b.x ? 'y' : 'x';
            if ( sq_a[ dir ] > sq_b[ dir ] ) {
                out[ 0 ] = sq_b;
                out[ 1 ] = sq_a;
            }
            out[ 2 ].axis = dir;
            out[ 2 ].inverse = dir === 'x' ? 'y' : 'x';
            out[ 2 ].dist = out[ 1 ][ dir ] - out[ 0 ][ dir ];
            return out;
        }
    }

    /** Allows undoing and redoing things.
     * @class
     */
    class UndoHistory {
        /** UndoHandler function.
         * @callback UndoHandler
         * @param {any} from - Data of starting state.
         * @param {any} to - Data of ending state.
         */

        /** @type {UndoHandler|undefined} */
        func_redo;
        /** @type {UndoHandler} */
        func_undo;

        /** @type {any[]} Undo history. */
        history;
        /** @type {number} Index of current place in history. */
        index;
        /** @type {function} Runs on add, redo, and undo. */
        onChange;

        /** Constructor.
         * @param {UndoHandler} func_undo - What happens to a stored action when moving in history.
         * @param {UndoHandler} [func_redo] - What happens instead to a stored action specifically when moving forward in history.
         */
        constructor( func_undo, func_redo ) {
            this.index = -1;
            this.history = [];
            this.onChange = () => { };
            this.func_undo = func_undo;
            switch ( typeof func_redo ) {
                case 'undefined':
                    this.func_redo = func_undo;
                    break;
                case 'function':
                    this.func_redo = func_redo;
                    break
            }
        }

        /** Add something to the history.
         * @param {any} state - The history state to add.
         */
        add( state ) {
            if ( this.index !== this.history.length - 1 ) {
                /// Remove redo history.
                this.history = this.history.slice( 0, this.index + 1 );
            }
            this.history.push( state );
            this.index = this.history.length - 1;
            this.onChange();
        }

        /** Clears the history. */
        clear() {
            this.index = -1;
            this.history = [];
        }

        /** Travels forward in history.
         * @param {UndoHandler} [func_custom] - An alternative function to run.
         */
        redo( func_custom ) {
            if ( this.index === this.history.length - 1 ) {
                console.warn( 'Nothing left to redo.' );
                return;
            }
            const start = this.history[ this.index ];
            const end = this.history[ ++this.index ];
            if ( func_custom ) {
                func_custom( start, end );
                this.onChange();
            } else if ( this.func_redo ) {
                this.func_redo( start, end );
                this.onChange();
            }
        }

        /** Travels back in history.
         * @param {UndoHandler} [func_custom] - An alternative function to run.
         */
        undo( func_custom ) {
            if ( this.index === 0 ) {
                console.warn( 'Nothing left to undo.' );
                return;
            }
            const start = this.history[ this.index ];
            const end = this.history[ --this.index ];
            if ( func_custom ) {
                func_custom( start, end );
                this.onChange();
            } else if ( this.func_undo ) {
                this.func_undo( start, end );
                this.onChange();
            }
        }
    }

    /** Main function.
     * @class
     */
    class App {
        /** @type {string} The background color (in #rrggbb format). */
        background_color;
        /** @type {number} Negative X position for canvas space. */
        cam_x;
        /** @type {number} Negative Y position for canvas space. */
        cam_y;
        /** @type {number} Zoom amount for canvas space. */
        cam_z;
        /** @type {number} Timer for UI opacity. */
        gui_timer;
        /** @type {History} Undo history. */
        history;
        /** @type {CanvasObject} Output image. */
        output;
        /** @type {CanvasObject} UI image. */
        overlay;
        /** @type {number} The size of one square (in pixels). */
        size;
        /** @type {number} The maximum zoom multiplier. */
        zoom_max;
        /** @type {number} The minimum zoom multiplier. */
        zoom_min;
        /** @type {number} Step value for zoom multiplier. */
        zoom_precision;

        /** Activates the context menu.
         * @param {number} x - X position on screen.
         * @param {number} y - Y position on screen.
         * @param {PaletteSquare} [target] - Square that was right-clicked, if any.
         */
        activateMenu( x, y, target ) { /* see: App.initContextMenu() */ }

        /** Creates a square and attaches it to the mouse.
         * @param {string|number|Color} [color] - Square color.
         * @returns {PaletteSquare} The new square.
         */
        createNewSquareAtMouse( color ) { /* see: App.initInput() */ }

        /** Constructor. */
        constructor() {
            this.size = 64;
            this.zoom_precision = 0.25;
            this.zoom_min = 0.5;
            this.zoom_max = 2;

            this.initCanvas();
            this.cam_x = ( this.output.cvs.width - this.size ) / 2;
            this.cam_y = ( this.output.cvs.height - this.size ) / 2;
            this.cam_z = 1;
            this.container = new PaletteSquareFactory( this.size );
            this.history = new UndoHistory(
                /// Undo.
                ( a, b ) => {
                    this.load( b );
                    this.gui_timer = Date.now();
                }
            );
            this.history.onChange = () => {
                const l = this.history.history.length;
                $( '#btn-undo' ).toggleClass( 'disabled', l <= 1 || this.history.index === 0 );
                $( '#btn-redo' ).toggleClass( 'disabled', l <= 1 || this.history.index >= l - 1 );
                this.save( false, true );
            };
            this.initContextMenu();
            this.initButtonBar();
            this.initInput();

            /// Load from cookies.
            if ( !this.load() ) {
                /// Create an initial square if no data is available.
                this.container.createSquare( 0, 0 ).color.setValue( Math.random() * 0xffffff );
            }
            this.history.onChange();
            if ( !this.background_color ) {
                this.background_color = '#cccccc';
            }
            this.history.add( this.save( true ) );
        }

        /** Center the camera and all squares. */
        centerView() {
            this.cam_x = ( this.output.cvs.width - this.size ) / 2;
            this.cam_y = ( this.output.cvs.height - this.size ) / 2;
            this.cam_z = 1;
            var min_x = 0, min_y = 0, max_x = 0, max_y = 0;
            this.container.forEachSquare( ( square ) => {
                const x = square.x / this.size;
                const y = square.y / this.size;
                min_x = Math.min( min_x, Math.floor( x ) );
                max_x = Math.max( max_x, Math.floor( x ) + 1 );
                min_y = Math.min( min_y, Math.floor( y ) );
                max_y = Math.max( max_y, Math.floor( y ) + 1 );
            } );
            const width = max_x - min_x;
            const height = max_y - min_y;
            this.container.forEachSquare( ( square ) => {
                const x = AV.map( square.x / 64, min_x, max_x, -width / 2, width / 2 );
                const y = AV.map( square.y / 64, min_y, max_y, -height / 2, height / 2 );
                square.x = Math.round( x ) * 64;
                square.y = Math.round( y ) * 64;
            } );
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
            for ( let y = vy % this.size; y < vh; y += this.size ) {
                for ( let x = vx % this.size; x < vw; x += this.size ) {
                    ctx.beginPath();
                    ctx.moveTo( x, y - 4 );
                    ctx.lineTo( x, y + 4 );
                    ctx.moveTo( x - 4, y );
                    ctx.lineTo( x + 4, y );
                    ctx.stroke();
                }
            }
            /// Squares and GUI elements.
            this.container.forEachConnection( ( connection ) => {
                connection.draw( ctx, gui, vx, vy );
            } );
            this.container.forEachSquare( ( square ) => {
                square.draw( ctx, gui, vx, vy );
            } );
            this.output.draw();
            this.overlay.draw();
            const timer = Date.now() - this.gui_timer;
            const opacity = AV.clamp( 1 - ( timer - 3000 ) / 500 );
            this.overlay.$.css( 'opacity', opacity );
        }

        /** Initialize the button bar. */
        initButtonBar() {
            $( '.button-bar .button' ).on( 'contextmenu', ( event ) => {
                event.preventDefault();
            } )

            const menu_save = $( '.menu #ctrl-save' );

            const button_center = $( '.button-bar #btn-center' );
            const button_clear = $( '.button-bar #btn-clear' );
            const button_redo = $( '.button-bar #btn-redo' );
            const button_save = $( '.button-bar #btn-save' );
            const button_undo = $( '.button-bar #btn-undo' );

            button_center.on( 'click', () => {
                if ( button_center.hasClass( 'disabled' ) ) return;
                this.centerView();
            } );
            button_clear.on( 'click', () => {
                if ( button_clear.hasClass( 'disabled' ) ) return;
                /// Remove everything.
                this.reset();
                /// Save to undo history but not to cookies.
                this.history.add( this.save( true ) );
            } );
            button_redo.on( 'click', () => {
                if ( button_redo.hasClass( 'disabled' ) ) return;
                /// Redo.
                this.history.redo();
            } );
            button_save.on( 'click', () => {
                if ( button_save.hasClass( 'disabled' ) ) return;
                /// Save PNG.
                menu_save.trigger( 'click' );
            } );
            button_undo.on( 'click', () => {
                if ( button_undo.hasClass( 'disabled' ) ) return;
                /// Undo.
                this.history.undo();
            } );
        }

        /** Initialize the canvases. */
        initCanvas() {
            this.output = new CanvasObject( 'palette' );
            this.overlay = new CanvasObject( 'overlay' );

            const resize = () => {
                this.output.cvs.width = this.overlay.cvs.width = window.innerWidth;
                this.output.cvs.height = this.overlay.cvs.height = window.innerHeight;
            };

            $( window ).on( 'resize', resize );
            resize();
        }

        /** Initialize the context menu. */
        initContextMenu() {
            var target, mouse_x, mouse_y, color = new Color(), hex;
            const menu = $( '.menu' );
            menu.on( 'contextmenu', ( event ) => {
                event.preventDefault();
            } );
            menu.children().on( 'mouseover mousemove hover', () => {
                /// Make the GUI visible.
                this.gui_timer = Date.now();
            } );

            const menu_add = $( '.menu #ctrl-add' );
            const menu_bg = $( '.menu #ctrl-bg' );
            const menu_clone = $( '.menu #ctrl-clone' );
            const menu_color = $( '.menu #ctrl-color' );
            const menu_copyhex = $( '.menu #ctrl-copyhex' );
            const menu_copypng = $( '.menu #ctrl-copypng' );
            const menu_delall = $( '.menu #ctrl-delall' );
            const menu_delete = $( '.menu #ctrl-delete' );
            const menu_save = $( '.menu #ctrl-save' );

            this.activateMenu = ( x, y, t ) => {
                target = t || null;
                mouse_x = x;
                mouse_y = y;
                /// Get the pixel data.
                const point = this.output.ctx.getImageData( mouse_x, mouse_y, 1, 1 ).data;
                color.setRGB( point[ 0 ] / 255, point[ 1 ] / 255, point[ 2 ] / 255 );
                hex = color.hex.slice( 0, 7 );
                if ( hex === this.background_color ) {
                    hex = null;
                }
                /// Toggle menu options.
                menu_add.toggleClass( 'hidden', !!target );
                menu_bg.val( this.background_color ).parent().toggleClass( 'hidden', !!hex );
                menu_clone.toggleClass( 'hidden', !target );
                menu_color.parent().toggleClass( 'hidden', !target );
                menu_copyhex.toggleClass( 'disabled', !hex );
                menu_delete.toggleClass( 'hidden', !target );
                menu_delall.toggleClass( 'disabled', this.container.squares.length === 0 );
                menu_delall.toggleClass( 'hidden', !!target );
                if ( target ) {
                    menu_color.val( target.color.hex.slice( 0, 7 ) );
                }
                /// Make sure the menu does not go off the screen.
                const menu_width = menu.width();
                const menu_height = menu.height();
                const screen_width = window.innerWidth;
                const screen_height = window.innerHeight;// - bar.height();
                x = Math.min( x + 1, screen_width - menu_width );
                y = Math.min( y + 1, screen_height - menu_height );
                /// Bring up the context menu.
                menu.addClass( 'active' );
                menu.css( {
                    'left': x,
                    'top': y
                } );
            };

            menu_add.on( 'click', () => {
                /// Create a new square.
                if ( menu_add.hasClass( 'disabled' ) ) return;
                menu.removeClass( 'active' );
                /// Get the pixel data before adding the square.
                const point = this.output.ctx.getImageData( mouse_x, mouse_y, 1, 1 ).data;
                const x = Math.floor( ( mouse_x - this.cam_x ) / this.size ) * this.size;
                const y = Math.floor( ( mouse_y - this.cam_y ) / this.size ) * this.size;
                const square = this.container.createSquare( x, y );
                /// Set the color to that of any gradients beneath the point.
                square.color.setRGB( point[ 0 ] / 255, point[ 1 ] / 255, point[ 2 ] / 255 );
                if ( square.color.hex === this.background_color + 'ff' ) {
                    /// Make the color random instead.
                    square.color.setValue( Math.random() * 0xffffff );
                }
                this.save();
            } );

            menu_bg.on( 'input change', ( event ) => {
                this.background_color = menu_bg.val();
                if ( event.type === 'change' ) this.save();
            } );

            menu_clone.on( 'click', () => {
                /// Duplicate the selected square.
                if ( !target ) return;
                menu.removeClass( 'active' );
                this.createNewSquareAtMouse( target.color );
            } );

            menu_color.on( 'input change', ( event ) => {
                /// Change the color.
                if ( !target ) return;
                const hex = menu_color.val();
                const num = parseInt( hex.slice( 1 ), 16 );
                target.color.setValue( num );
                target.checkConnections();
                if ( event.type === 'change' ) this.save();
            } ).on( 'click', ( event ) => {
                /// This prevents an infinite loop.
                event.stopPropagation();
            } ).parent().on( 'click', () => {
                /// Clicking the text by the button should be valid.
                menu_color.trigger( 'click' );
            } );

            menu_copyhex.on( 'click', () => {
                /// Copy the hex value of the color beneath the cursor.
                if ( menu_copyhex.hasClass( 'disabled' ) || !hex ) return;
                menu.removeClass( 'active' );
                navigator.clipboard.writeText( hex );
            } );

            menu_copypng.on( 'click', () => {
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
                this.reset();
                /// Save to undo history but not to cookies.
                this.history.add( this.save( true ) );
            } );

            menu_delete.on( 'click', () => {
                /// Delete the selected square.
                if ( !target ) return;
                menu.removeClass( 'active' );
                target.delete();
                target = null;
                this.save();
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

        /** Initialize mouse and keyboard input. */
        initInput() {
            const overlay = this.overlay;
            const $cvs = overlay.$;
            const menu = $( '.menu' );
            const $bar = $( '.button-bar .button' );
            const color_cache = new Color();
            var button, clicked, long, spacebar, target, time,
                mouse_x, mouse_y, start_x, start_y,
                target_x, target_y,
                view_x = null, view_y = null,
                disable_undo;

            this.createNewSquareAtMouse = ( color ) => {
                $bar.addClass( 'ignored' );
                disable_undo = true;
                spacebar = false;
                long = false;
                clicked = true;
                button = 1;
                view_x = mouse_x - this.cam_x;
                view_y = mouse_y - this.cam_y;
                target_x = null;
                target_y = null;
                const nx = view_x - this.size / 2;
                const ny = view_y - this.size / 2;
                target = this.container.createSquare( nx, ny, color );
                return target;
            };

            /// Listen for keypresses.
            const menu_copypng = $( '.menu #ctrl-copypng' );
            document.body.onkeydown = ( event ) => {
                spacebar = event.code === 'Space';
                if ( spacebar ) {
                    $cvs.addClass( 'drag' );
                    view_x = mouse_x - this.cam_x;
                    view_y = mouse_y - this.cam_y;
                }
                if ( !event.ctrlKey ) return;
                /// Control + Key.
                switch ( event.code ) {
                    case 'KeyC':
                        /// Copy the entire image.
                        menu_copypng.trigger( 'click' );
                        break;
                    case 'KeyS':
                        /// Autosave.
                        this.save();
                        console.warn( 'Manually saved.' );
                        break;
                    case 'KeyV':
                        /// Paste.
                        navigator.clipboard.readText().then( ( text ) => {
                            if ( !isNaN( '0x' + text ) ) {
                                text = '#' + text;
                            }
                            if ( color_cache.set( text ) ) {
                                this.createNewSquareAtMouse( color_cache );
                            }
                        } );
                        break;
                    case 'KeyY':
                        if ( disable_undo ) break;
                        this.history.redo();
                        break;
                    case 'KeyZ':
                        if ( disable_undo ) break;
                        if ( event.shiftKey ) {
                            this.history.redo();
                        } else {
                            this.history.undo();
                        }
                        break;
                    default:
                        /// Do not preventDefault().
                        return;
                }
                event.preventDefault();
            };
            document.body.onkeyup = ( event ) => {
                if ( event.code === 'Space' ) {
                    $cvs.removeClass( 'drag' );
                }
                spacebar = false;
            };

            overlay.draws[ 0 ] = ( ctx ) => {
                if ( mouse_x === null || mouse_y === null ) return;
                const x = Math.floor( ( mouse_x - this.cam_x ) / this.size ) * this.size + this.cam_x;
                const y = Math.floor( ( mouse_y - this.cam_y ) / this.size ) * this.size + this.cam_y;
                ctx.strokeStyle = '#777';
                // ctx.globalAlpha = 0.25;
                ctx.lineWidth = 0.5;
                ctx.strokeRect( x, y, this.size, this.size );
                // ctx.globalAlpha = 1;
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
                /// Deactivate the context menu and buttons.
                menu.removeClass( 'active' );
                $bar.addClass( 'ignored' );
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
                            $cvs.addClass( 'drag' );
                            // target = false;
                            break;
                        }
                        long = true;
                        time = Date.now();
                        /// Long-click indicator and listener.
                        overlay.draws[ 1 ] = ( ctx ) => {
                            if ( !clicked ) return;
                            const t = ( Date.now() - time ) / 500;
                            ctx.strokeStyle = 'red';
                            ctx.beginPath();
                            ctx.arc( mouse_x, mouse_y, 16, 0, t * AV.RADIAN );
                            ctx.stroke();
                            if ( long && Date.now() - time > 500 ) {
                                /// Long-click is successful.
                                this.activateMenu( mouse_x, mouse_y, target );
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
                    case 4:
                        this.history.undo();
                        break
                    case 5:
                        this.history.redo();
                        break
                    default:
                        break;
                }
            } );
            $cvs.on( 'mouseover mousemove', ( event ) => {
                mouse_x = event.clientX;
                mouse_y = event.clientY;
                event.preventDefault();
                /// Make the GUI visible.
                this.gui_timer = Date.now();
                if ( !clicked ) return;
                switch ( button ) {
                    case 1:
                        /// Left click.
                        /// Spacebar forces drag.
                        if ( spacebar ) {
                            // target = false;
                            overlay.draws[ 1 ] = () => { };
                            long = false;
                        }
                        const dist = Math.sqrt( ( mouse_y - start_y ) ** 2 + ( mouse_x - start_x ) ** 2 );
                        if ( long && dist >= 2 ) {
                            /// Moved too far for a long-click.
                            overlay.draws[ 1 ] = () => { };
                            long = false;
                        }
                        if ( long ) break;
                        if ( target ) {
                            $cvs.addClass( 'grabbing' );
                            target.x = mouse_x - this.cam_x - this.size / 2;
                            target.y = mouse_y - this.cam_y - this.size / 2;
                        }
                        if ( !target || spacebar ) {
                            $cvs.addClass( 'drag' );
                            this.cam_x = mouse_x - view_x;
                            this.cam_y = mouse_y - view_y;
                            start_x = mouse_x
                            start_y = mouse_y
                        }
                        break;
                    case 2:
                        /// Middle click.
                        this.cam_x = mouse_x - view_x;
                        this.cam_y = mouse_y - view_y;
                        break;
                    default:
                        break;
                }
            } );
            $cvs.on( 'mouseup mouseleave', ( event, prop ) => {
                event.preventDefault();
                $cvs.removeClass( 'drag' );
                $cvs.removeClass( 'grabbing' );
                disable_undo = false;
                if ( !prop && event.which !== button ) {
                    if ( event.type === 'mouseleave' ) {
                        mouse_x = mouse_y = null;
                        $bar.removeClass( 'ignored' );
                    }
                    return;
                }
                $bar.removeClass( 'ignored' );
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
                                    if ( target_x !== null && target_y !== null ) {
                                        target.x = target_x;
                                        target.y = target_y;
                                    } else {
                                        target.delete();
                                    }
                                } else {
                                    /// Snap the square to the grid.
                                    const x = Math.round( target.x / this.size ) * this.size;
                                    const y = Math.round( target.y / this.size ) * this.size;
                                    /// Check if the square will collide with another.
                                    /// Make sure the target itself isn't detected.
                                    target.y += this.size;
                                    const detects = this.container.detectAll( x, y )[ 0 ];
                                    target.y -= this.size;
                                    if ( detects ) {
                                        /// Place the square back where it belongs.
                                        if ( target_x !== null && target_y !== null ) {
                                            target.x = target_x;
                                            target.y = target_y;
                                        } else {
                                            target.delete();
                                        }
                                        /// See if the squares can connect.
                                        target.connect( detects );
                                        /// Verify the current connections.
                                    } else {
                                        /// Place the square.
                                        target.x = x;
                                        target.y = y;
                                        if ( target_x !== x || target_y !== y ) {
                                            /// The square has been moved.
                                            target.checkConnections();
                                            this.save();
                                        }
                                    }
                                }
                            }
                        }
                        overlay.draws[ 1 ] = () => { };
                        target = null;
                        view_x = view_y = start_x = start_y = target_x = target_y = 0;
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
                if ( event.type === 'mouseleave' ) {
                    mouse_x = mouse_y = null;
                }
                button = null;
            } );
            $cvs.on( 'wheel', ( event ) => {
                if ( clicked ) return;
                menu.removeClass( 'active' );
                // const dx = Math.sign( event.originalEvent.deltaX );
                const dy = Math.sign( event.originalEvent.deltaY );
                this.setZoom( this.cam_z - dy * this.zoom_precision );
            } );

        }

        /** Loads data from cookies.
         * @param {string} [custom_cookie] - Stringified data to read instead of cookies.
         * @returns {boolean} Whether the load was successful.
         */
        load( custom_cookie ) {
            const cookie = custom_cookie || Cookies.get( 'autosave' );
            if ( !cookie ) return false;
            const data = JSON.parse( cookie );
            if ( data.length === 0 ) {
                Cookies.remove( 'data' );
                return false;
            }
            this.reset();
            const list_by_id = [];
            var max_id = -1;
            data.forEach( ( obj ) => {
                switch ( obj.type ) {
                    case 'square':
                        const square = this.container.createSquare( obj.x * this.size, obj.y * this.size, obj.color );
                        square.id = obj.id;
                        if ( typeof square.id === 'undefined' ) square.id = max_id + 1;
                        max_id = Math.max( max_id, square.id );
                        list_by_id[ square.id ] = square;
                        obj.square = square;
                        break;
                    case 'meta':
                        if ( !isNaN( +obj.x ) ) this.cam_x = +obj.x;
                        if ( !isNaN( +obj.y ) ) this.cam_y = +obj.y;
                        if ( !isNaN( +obj.z ) ) this.setZoom( +obj.z );
                        if ( typeof this.background_color !== 'undefined' ) this.background_color = obj.background;
                        break;
                }
            } );
            this.container.id_s = max_id + 1;
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

        /** Resets the app. */
        reset() {
            this.container.forEachSquare( ( square ) => {
                square.delete();
            } );
            this.container.forEachConnection( ( connection ) => {
                connection.delete();
            } );
            this.cam_x = ( this.output.cvs.width - this.size ) / 2;
            this.cam_y = ( this.output.cvs.height - this.size ) / 2;
            this.cam_z = 1;
        }

        /** Saves the current squares to cookies and to the undo history.
         * @param {boolean} [no_cookie] - Returns the stringified data instead of saving it to cookies.
         * @param {boolean} [no_history] - Skips adding the save to the undo history.
         * @returns {string|boolean}
         */
        save( no_cookie, no_history ) {
            const data = [ {
                type: 'meta',
                x: this.cam_x,
                y: this.cam_y,
                z: this.cam_z,
                background: this.background_color
            } ];
            this.container.forEachSquare( ( square ) => {
                const obj = {
                    type: 'square',
                    id: square.id,
                    color: square.color.getValue(),
                    x: square._x,
                    y: square._y,
                    links: []
                };
                square.connections.forEach( ( target ) => {
                    if ( !target ) return;
                    var id = target.squares[ 0 ].id;
                    if ( id === obj.id ) id = target.squares[ 1 ].id;
                    obj.links.push( id );
                } );
                data.push( obj );
            } );
            const cookie = JSON.stringify( data );
            if ( no_cookie ) {
                return cookie;
            }
            Cookies.set( 'autosave', cookie );
            if ( !no_history ) this.history.add( cookie );
            return true;
        }

        /** Sets the App.cam_z value.
         * @param {number} zoom - The desired zoom multiplier.
         */
        setZoom( zoom ) {
            this.cam_z = AV.clamp( zoom, this.zoom_min, this.zoom_max );
            this.size = 64 * this.cam_z;
            this.container.size = this.size;
            this.container.forEachSquare( ( square ) => {
                square.w = this.size;
                square.h = this.size;
            } );
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
