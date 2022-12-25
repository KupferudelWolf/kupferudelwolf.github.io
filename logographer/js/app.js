/*jshint esversion: 7*/

import AV from '/build/av.module.js/av.module.js';

( function () {
    /** A normalized 2D point.
     * @typedef {object} Point
     * @prop {number} x - The horizontal position.
     * @prop {number} y - The vertical position.
     */
    /** A list of points that create a stroke.
     * @typedef {Point[]} Stroke
     */

    /** @class */
    class Symbol {
        /** Creates a new symbol object.
         * @param {...string} args - Words this symbol should represent.
         */
        constructor() {
            this.translations = [ ...arguments ];
            /** @prop {Stroke[]} - The symbol's strokes. */
            this.strokes = [];
            /** @prop {object} - Various data about this symbol. */
            this.params = {
                /** @prop {number} - How much wider the symbol should be than long. */
                aspect: 1
            };
        }

        /** Draw this stroke.
         * @param {CanvasRenderingContext2D} ctx - The context to draw onto.
         * @param {boolean} [preserve_drawing] - If true, then the canvas will not be cleared first.
         */
        draw( ctx, preserve_drawing ) {
            const width = ctx.canvas.width;
            const height = ctx.canvas.height;
            if ( !preserve_drawing ) ctx.clearRect( 0, 0, width, height );
            this.strokes.forEach( ( stroke ) => {
                ctx.beginPath();
                let lineTo = 'moveTo';
                stroke.forEach( ( point ) => {
                    ctx[ lineTo ]( point.x * width, point.y * height );
                    lineTo = 'lineTo';
                } );
                ctx.stroke();
            } );
        }

        /** Run a function for each point in this shape.
         * @param {function(Point, number, Stroke):void} perPoint - Function to run for every point.
         * @param {function(Stroke, number):void} [perStroke] - Function to run for every stroke.
         */
        iterate( perPoint, perStroke = () => { } ) {
            this.strokes.forEach( ( stroke, index ) => {
                perStroke( stroke, index );
                stroke.forEach( ( point, index ) => {
                    perPoint( point, index, stroke );
                } );
            } );
        }
    }

    /** @class */
    class App {
        constructor() {
            /** @prop {string} - Symbol container. */
            this.key = '';
            /** @prop {Symbol[]} - Symbol container. */
            this.lexicon = [
                new Symbol( 'moon', 'soul' )
            ];
            this.lexicon[ 0 ].strokes = [ [ { "x": 0.3125, "y": 0.5 }, { "x": 0.6875, "y": 0.5 } ], [ { "x": 0.125, "y": 0.125 }, { "x": 0.875, "y": 0.125 } ], [ { "x": 0.125, "y": 0.125 }, { "x": 0.3125, "y": 0.5 } ], [ { "x": 0.6875, "y": 0.5 }, { "x": 0.5, "y": 0.875 } ] ];

            /** @prop {Symbol} - The word that the user is editting. */
            this.active_word = new Symbol();

            /** @prop {HTMLCanvasElement} - The editing canvas. */
            this.cvs = $( 'canvas#canvas' ).get( 0 );
            /** @prop {CanvasRenderingContext2D} - The context for the editing canvas. */
            this.ctx = this.cvs.getContext( '2d' );

            /** @prop {HTMLCanvasElement} - Displays the saved symbol as text. */
            this.cvs_saved = $( 'canvas#saved' ).get( 0 );
            /** @prop {CanvasRenderingContext2D} - Context for the saved symbol. */
            this.ctx_saved = this.cvs_saved.getContext( '2d' );

            /** @prop {Point[]} - Undo history. */
            this.history = [];

            this.initControls();
        }

        /** Returns a deep copy of a given object.
         * @param {*} obj - The variable to copy, such as an array or an object.
         * @returns {*} The copied variable.
         */
        copy( obj ) {
            return JSON.parse( JSON.stringify( obj ) );
        }

        /** Initializes canvases and controls. */
        initControls() {
            const cvs = this.cvs;
            const ctx = this.ctx;
            const mode_names = [ 'draw', 'edit' ];
            const brush = ( x, y ) => {
                ctx.beginPath();
                ctx.arc( x, y, stroke / 2, 0, AV.RADIAN );
                ctx.fill();
            };
            const drawIcon = () => {
                const $cvs = $( this.cvs_saved );
                $cvs.css( {
                    'height': $cvs.height(),
                    'width': $cvs.height() * aspect
                } );
                this.cvs_saved.width = $cvs.width();
                this.cvs_saved.height = $cvs.height();
                this.ctx_saved.strokeStyle = 'black';
                this.ctx_saved.lineCap = 'round';
                this.ctx_saved.lineJoin = 'round';
                this.ctx_saved.lineWidth = 1;
                this.lexicon[ index ].draw( this.ctx_saved );
            };
            const draw = () => {
                click_radius = Math.max( 20, stroke );

                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                switch ( mode ) {
                    case 'draw':
                        ctx.fillStyle = 'black';
                        ctx.strokeStyle = 'black';
                        ctx.lineWidth = stroke;
                        this.active_word.draw( ctx );
                        break;
                    case 'edit':
                        ctx.fillStyle = 'lightgrey';
                        ctx.fillRect( 0, 0, width, height );
                        ctx.fillStyle = 'white';
                        ctx.fillRect( 0.125 * width, 0.125 * height, 0.75 * width, 0.75 * height );

                        if ( snapping ) {
                            ctx.strokeStyle = 'lightgrey';
                            ctx.lineWidth = 1;
                            const dx = 0.75 * width / ( snap_rows - 1 );
                            const dy = 0.75 * height / ( snap_cols - 1 );
                            for ( let y = 0; y < snap_cols - 1; ++y ) {
                                ctx.beginPath();
                                ctx.moveTo( 0.125 * width, y * dy + 0.125 * height );
                                ctx.lineTo( 0.875 * width, y * dy + 0.125 * height );
                                ctx.closePath();
                                ctx.stroke();
                            }
                            for ( let x = 0; x < snap_rows - 1; ++x ) {
                                ctx.beginPath();
                                ctx.moveTo( x * dx + 0.125 * width, 0.125 * height );
                                ctx.lineTo( x * dx + 0.125 * width, 0.875 * height );
                                ctx.closePath();
                                ctx.stroke();
                            }
                        }

                        ctx.strokeStyle = 'black';
                        ctx.lineWidth = stroke;
                        this.active_word.draw( ctx, true );

                        ctx.lineWidth = click_radius;
                        ctx.strokeStyle = 'red';
                        this.active_word.iterate( ( point ) => {
                            ctx.beginPath();
                            ctx.arc( point.x * width, point.y * height, 1, 0, AV.RADIAN );
                            ctx.closePath();
                            ctx.stroke();
                        } );
                        break;
                }
            };

            var width = cvs.width,
                height = cvs.height,
                stroke = 20,
                click_radius = 20,
                reduction = 0.02,
                index = 0,
                snapping = true,
                snap_cols = 3,
                snap_rows = 3,
                aspect = 1,
                mode = mode_names[ 0 ],
                drawing, dragging, start_x, start_y,
                points = [];

            this.active_word.strokes = this.copy( this.lexicon[ index ].strokes );
            drawIcon();

            $( cvs ).on( 'mousedown', ( event ) => {
                points = [];
                let x = start_x = event.offsetX,
                    y = start_y = event.offsetY;
                if ( mode === 'draw' ) {
                    drawing = true;
                    brush( x, y );
                    points.push( { x: x / width, y: y / height } );
                } else if ( mode === 'edit' ) {
                    this.active_word.iterate( ( point, index, stroke ) => {
                        if ( dragging ) return;
                        const dist = AV.dist( x, y, point.x * width, point.y * height );
                        if ( dist <= click_radius ) {
                            dragging = point;
                        }
                    } );
                }
            } ).on( 'mousemove mouseover', ( event ) => {
                let x = event.offsetX,
                    y = event.offsetY;
                switch ( mode ) {
                    case 'draw':
                        if ( !drawing ) return;
                        brush( x, y );
                        points.push( { x: x / width, y: y / height } );
                        break;
                    case 'edit':
                        if ( !dragging ) return;
                        dragging.x = x / width;
                        dragging.y = y / height;
                        if ( snapping ) {
                            var diff;
                            diff = Infinity;
                            for ( let ix = 0; ix < snap_cols; ++ix ) {
                                const px = AV.map( ix, 0, snap_cols - 1, width * 0.125, width * 0.875 );
                                const dx = Math.abs( x - px );
                                if ( dx < diff ) {
                                    diff = dx;
                                    dragging.x = px / width;
                                }
                            }
                            diff = Infinity;
                            for ( let iy = 0; iy < snap_rows; ++iy ) {
                                const py = AV.map( iy, 0, snap_rows - 1, height * 0.125, height * 0.875 );
                                const dy = Math.abs( y - py );
                                if ( dy < diff ) {
                                    diff = dy;
                                    dragging.y = py / height;
                                }
                            }
                        }
                        draw();
                        break;
                }
            } ).on( 'mouseup mouseleave', () => {
                if ( !drawing && !dragging ) return;
                drawing = dragging = false;
                if ( mode === 'draw' ) {
                    this.active_word.strokes.push( window.simplify( points, reduction, true ) );
                    draw();
                }
            } );

            $( 'input#mode' ).on( 'input change', ( event ) => {
                const val = $( event.target ).val();
                mode = mode_names[ val ];
                drawing = false;
                draw();
            } );

            $( 'input#undo' ).on( 'click', () => {
                if ( !this.active_word.strokes.length ) return;
                this.history.push( this.active_word.strokes.pop() );
                draw();
                points = [];
            } );
            $( 'input#redo' ).on( 'click', () => {
                if ( !this.history.length ) return;
                this.active_word.strokes.push( this.history.pop() );
                draw();
                points = [];
            } );
            $( 'input#clear' ).on( 'click', () => {
                this.active_word.strokes = [];
                ctx.clearRect( 0, 0, width, height );
                points = [];
            } );
            $( 'input#restore' ).on( 'click', () => {
                this.active_word.strokes = this.copy( this.lexicon[ index ].strokes );
                this.history = [];
                draw();
            } ).click();
            $( 'input#save' ).on( 'click', () => {
                console.log( JSON.stringify( this.active_word.strokes ) );
                this.lexicon[ index ].strokes = this.copy( this.active_word.strokes );
                this.lexicon[ index ].params.aspect = aspect;
                this.history = [];
                draw();
                drawIcon();
            } );

            $( 'input#aspect' ).val( aspect ).on( 'input change', ( event ) => {
                aspect = $( event.target ).val();
                if ( aspect < 0.5 ) {
                    aspect = 0.5;
                    $( event.target ).val( 0.5 );
                }
                if ( Math.abs( 1 - aspect ) <= 0.1 ) {
                    aspect = 1;
                    $( event.target ).val( 1 );
                }
                if ( aspect >= 1 ) {
                    cvs.width = width = 256;
                    cvs.height = height = width / aspect;
                } else {
                    cvs.height = height = 256;
                    cvs.width = width = height * aspect;
                }
                draw();
            } );
            $( 'input#snapping' ).attr( 'checked', snapping ).on( 'change', ( event ) => {
                snapping = $( event.target ).is( ':checked' );
                draw();
            } );
            $( 'input#snap-cols' ).val( snap_cols ).on( 'input change', ( event ) => {
                snap_cols = $( event.target ).val();
                draw();
            } );
            $( 'input#snap-rows' ).val( snap_rows ).on( 'input change', ( event ) => {
                snap_rows = $( event.target ).val();
                draw();
            } );
            $( 'input#stroke-redux' ).val( reduction ).on( 'input change', ( event ) => {
                reduction = $( event.target ).val();
                if ( !this.active_word.strokes.length || !points.length ) return;
                this.active_word.strokes[ this.active_word.strokes.length - 1 ] = window.simplify( points, reduction, true );
                draw();
            } );
            $( 'input#stroke-width' ).val( stroke ).on( 'input change', ( event ) => {
                stroke = $( event.target ).val();
                draw();
            } );

            document.body.onkeydown = ( event ) => {
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
                        $( 'input#redo' ).click();
                        break;
                    case 'KeyZ':
                        if ( event.shiftKey ) {
                            $( 'input#redo' ).click();
                        } else {
                            $( 'input#undo' ).click();
                        }
                        break;
                    default:
                        /// Do not preventDefault().
                        return;
                }
                event.preventDefault();
            };
        }

        /** Loads API keys.
         * @return {$.Deferred}
         */
        loadKeys() {
            const deferred = $.Deferred();
            $.getJSON( './js/key.json', ( data ) => {
                this.key = data.key;
                deferred.resolve();
            } );
            return deferred;
        }

        /** GETs synonyms from https://thesaurus.altervista.org/.
         * @param {string} word - The word to search.
         * @return {$.Deferred}
         */
        getSynonyms( word ) {
            const deferred = $.Deferred();
            const uri = 'https://thesaurus.altervista.org/thesaurus/v1';
            const opts = [
                `word=${ word }`,
                `language=en_US`,
                `output=json`,
                `key=${ this.key }`
            ];
            const url = `${ uri }?${ opts.join( '&' ) }`;
            $.ajax( {
                url: url,
                success: function ( data ) {
                    if ( data.length != 0 ) {
                        let output = '';
                        for ( let key in data.response ) {
                            output += data.response[ key ].list.synonyms + '<br>';
                        }
                        $( 'body' ).html( output );
                    } else $( 'body' ).html( 'empty data' );
                    deferred.resolve();
                },
                error: function ( xhr, status, error ) {
                    $( 'body' ).html( `An error occured: ${ status } ${ error }` );
                    deferred.fail();
                }
            } );
            return deferred;
        }
    }

    $( function () {
        const APP = new App();
        APP.loadKeys().then( () => {
            // APP.getSynonyms( 'success' );
        } );
    } );
} )();
