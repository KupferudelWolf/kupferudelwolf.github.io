/*jshint esversion: 7*/

import AV from '/build/av.module.js/av.module.js';

( function () {
    /** @class */
    class Word {
        constructor() {
            this.translations = [ ...arguments ];
            this.strokes = [];
        }

        draw( ctx ) {
            const width = ctx.canvas.width;
            const height = ctx.canvas.height;
            ctx.clearRect( 0, 0, width, height );
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
            this.lexicon[ 0 ].strokes = [ [ { "x": 0.33984375, "y": 0.515625 }, { "x": 0.671875, "y": 0.51171875 } ], [ { "x": 0.19140625, "y": 0.234375 }, { "x": 0.81640625, "y": 0.23046875 } ], [ { "x": 0.1953125, "y": 0.25390625 }, { "x": 0.3359375, "y": 0.50390625 } ], [ { "x": 0.68359375, "y": 0.51953125 }, { "x": 0.56640625, "y": 0.7734375 } ] ];

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
            const brush = ( x, y ) => {
                ctx.beginPath();
                ctx.arc( x, y, stroke / 2, 0, AV.RADIAN );
                ctx.fill();
            };
            const draw = () => {
                snap_radius = Math.max( 20, stroke );
                ctx.fillStyle = 'black';
                ctx.strokeStyle = 'black';
                ctx.lineWidth = stroke;
                this.active_word.draw( ctx );
                if ( mode !== 'edit' ) return;
                ctx.lineWidth = Math.max( 20, ctx.lineWidth );
                ctx.strokeStyle = 'red';
                this.active_word.iterate( ( point ) => {
                    ctx.beginPath();
                    ctx.arc( point.x * width, point.y * height, 1, 0, AV.RADIAN );
                    ctx.closePath();
                    ctx.stroke();
                } );
            };
            const modes = [ 'draw', 'edit' ];

            var stroke = 20,
                snap_radius = 20,
                reduction = 0.02,
                index = 0,
                mode = modes[ 0 ],
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
                        if ( dist <= snap_radius ) {
                            dragging = point;
                        }
                    } );
                }
            } ).on( 'mousemove mouseover', ( event ) => {
                let x = event.offsetX,
                    y = event.offsetY;
                if ( mode === 'draw' ) {
                    if ( !drawing ) return;
                    brush( x, y );
                    points.push( { x: x / width, y: y / height } );
                } else if ( mode === 'edit' ) {
                    if ( !dragging ) return;
                    dragging.x = x / width;
                    dragging.y = y / height;
                    draw();
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
                mode = modes[ val ];
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
