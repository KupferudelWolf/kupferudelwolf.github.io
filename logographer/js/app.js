/*jshint esversion: 7*/

import AV from '/build/av.module.js/av.module.js';

( function () {
    /** @class */
    class Word {
        constructor() {
            this.translations = [ ...arguments ];
            this.strokes = [];
        }

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

        iterate( perPoint, perStroke = () => { } ) {
            this.strokes.forEach( ( stroke ) => {
                perStroke( stroke );
                stroke.forEach( ( point ) => {
                    perPoint( point, stroke );
                } );
            } );
        }
    }

    /** @class */
    class App {
        constructor() {
            this.key = '';
            this.lexicon = [
                new Word( 'moon', 'soul' )
            ];
            this.lexicon[ 0 ].strokes = [ [ { "x": 0.3125, "y": 0.5 }, { "x": 0.6875, "y": 0.5 } ], [ { "x": 0.125, "y": 0.125 }, { "x": 0.875, "y": 0.125 } ], [ { "x": 0.125, "y": 0.125 }, { "x": 0.3125, "y": 0.5 } ], [ { "x": 0.6875, "y": 0.5 }, { "x": 0.5, "y": 0.875 } ] ];

            this.active_word = new Word();

            this.cvs = $( 'canvas#canvas' ).get( 0 );
            this.ctx = this.cvs.getContext( '2d' );

            this.cvs_saved = $( 'canvas#saved' ).get( 0 );
            this.ctx_saved = this.cvs_saved.getContext( '2d' );

            this.history = [];

            this.initControls();
        }

        copy( obj ) {
            return JSON.parse( JSON.stringify( obj ) );
        }

        /** Initializes canvases and controls. */
        initControls() {
            const cvs = this.cvs;
            const ctx = this.ctx;
            const width = cvs.width;
            const height = cvs.height;
            const mode_names = [ 'draw', 'edit' ];
            const brush = ( x, y ) => {
                ctx.beginPath();
                ctx.arc( x, y, stroke / 2, 0, AV.RADIAN );
                ctx.fill();
            };
            const draw = () => {
                click_radius = Math.max( 20, stroke );

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
                        ctx.fillRect( 32, 32, width - 64, height - 64 );

                        if ( snapping ) {
                            ctx.strokeStyle = 'lightgrey';
                            ctx.lineWidth = 1;
                            const dx = ( width - 64 ) / ( snap_rows - 1 );
                            const dy = ( height - 64 ) / ( snap_cols - 1 );
                            for ( let y = 0; y < snap_cols - 1; ++y ) {
                                ctx.beginPath();
                                ctx.moveTo( 32, y * dy + 32 );
                                ctx.lineTo( width - 32, y * dy + 32 );
                                ctx.closePath();
                                ctx.stroke();
                            }
                            for ( let x = 0; x < snap_rows - 1; ++x ) {
                                ctx.beginPath();
                                ctx.moveTo( x * dx + 32, 0 );
                                ctx.lineTo( x * dx + 32, height - 32 );
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

            var stroke = 20,
                click_radius = 20,
                reduction = 0.02,
                index = 0,
                snapping = true,
                snap_cols = 3,
                snap_rows = 3,
                mode = mode_names[ 0 ],
                drawing, dragging, start_x, start_y,
                points = [];

            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            this.ctx_saved.strokeStyle = 'black';
            this.ctx_saved.lineCap = 'round';
            this.ctx_saved.lineJoin = 'round';
            this.ctx_saved.lineWidth = 2;
            this.active_word.strokes = this.copy( this.lexicon[ index ].strokes );
            this.lexicon[ index ].draw( this.ctx_saved, index );

            $( cvs ).on( 'mousedown', ( event ) => {
                points = [];
                let x = start_x = event.offsetX,
                    y = start_y = event.offsetY;
                if ( mode === 'draw' ) {
                    drawing = true;
                    brush( x, y );
                    points.push( { x: x / width, y: y / height } );
                } else if ( mode === 'edit' ) {
                    this.active_word.iterate( ( point, stroke ) => {
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
                                const px = AV.map( ix, 0, snap_cols - 1, 32, width - 32 );
                                const dx = Math.abs( x - px );
                                if ( dx < diff ) {
                                    diff = dx;
                                    dragging.x = px / width;
                                }
                            }
                            diff = Infinity;
                            for ( let iy = 0; iy < snap_rows; ++iy ) {
                                const py = AV.map( iy, 0, snap_rows - 1, 32, height - 32 );
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
                this.history = [];
                draw();
                this.lexicon[ index ].draw( this.ctx_saved );
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
