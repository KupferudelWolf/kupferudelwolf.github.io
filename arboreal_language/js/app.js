/*jshint esversion: 7*/

import AV from '/build/av.module.js/av.module.js';

( function () {
    const getArrayFromXML = ( xml, key ) => {
        return [ ...xml.getElementsByTagName( key ) ].map( ( obj ) => {
            return obj.innerHTML;
        } );
    };

    /** @class */
    const ALL_WORDS = [];
    class Dictionary {
        constructor( language, xml ) {
            this.name = [ language ];
            this.lexicon = [];
            this.color = 'white';
            this.ipa = [];

            if ( xml ) {
                this.name = getArrayFromXML( xml, 'name' );
                this.color = getArrayFromXML( xml, 'color' )[ 0 ];
                [ ...xml.getElementsByTagName( 'ipa' ) ].forEach( ( ipa ) => {
                    const value = ipa.getElementsByTagName( 'value' )[ 0 ];
                    const roma = ipa.getElementsByTagName( 'roma' )[ 0 ];
                    this.ipa.push( {
                        value: value.innerHTML,
                        roma: roma ? roma.innerHTML : null
                    } );
                } );
            }

            $( '<option>' )
                .val( this.name[ 0 ] )
                .text( this.name[ 0 ] )
                .appendTo( 'select#input-lang' );
        }

        get age() {
            if ( !this.lexicon.length ) return {
                min: null,
                max: null,
                average: null
            };
            var min = Infinity,
                max = -Infinity,
                ave = this.lexicon.reduce( ( a, b ) => {
                    min = Math.min( min, a, b );
                    max = Math.max( max, a, b );
                    return a + b.age;
                }, 0 ) / this.lexicon.length;
            return {
                min: min,
                max: max,
                average: ave
            };
        }

        newWord( xml ) {
            const $word = $( xml );
            const prop = {
                age: +$word.find( 'age' ).text(),
                etymology: getArrayFromXML( xml, 'etymology' ),
                id: $word[ 0 ].id,
                ipa: $word.find( 'ipa' ).text() || null,
                language: this,
                name: getArrayFromXML( xml, 'word' ),
                translations: getArrayFromXML( xml, 'translation' )
            };
            if ( isNaN( prop.id ) ) {
                console.error( `Cannot add ${ prop.name[ 0 ] }; ID is invalid.` );
                return;
            }
            if ( ALL_WORDS[ +prop.id ] instanceof Word ) {
                console.error( `Cannot add ${ prop.name[ 0 ] }; Word #${ +prop.id } is already defined as ${ existing.name }: ${ existing.translations.join( ', ' ) }` );
                return null;
            }
            const word = new Word( this, prop );
            this.lexicon.push( word );
            ALL_WORDS[ +prop.id ] = word;
            return word;
        }
    }
    /** @class */
    var word_id = 0;
    class Word {
        constructor( dictionary, prop ) {
            this.dictionary = dictionary;
            this.name = prop.name;
            this.id = Math.max( prop.id, word_id++ );
            // this.language = dictionary;

            this.age = prop.age;
            if ( isNaN( this.age ) ) {
                this.age = dictionary.age.average;
            }
            this.translations = prop.translations || [];
            this.children = [];
            this.ipa = prop.ipa;
            this.etymology = ( prop.etymology || [] ).map( ( ind ) => {
                const word = ALL_WORDS[ ind ];
                if ( !word ) return ind;
                word.children.push( this );
                return word;
            } );
        }
    }

    /** @class */
    class App {
        constructor() {
            this.language = {};
            this.index = 56;
            this.container = $( '.etymology-container' );
            this.svg = document.getElementById( 'arrows' );
            this.initControls();
        }

        initControls() {
            const input_tags = $( 'input[data-role="input-tags"]' );
            input_tags.wrap( '<div class="input-tags"></div>' );
            $( '<ul>' ).prependTo( '.input-tags' );

            const $win = $( 'body' );

            $( '.keyboard-container' ).each( ( ind, el ) => {
                const elem = $( el );
                const quer = elem.attr( 'data-target' );
                const targ = $( `input#${ quer }` );
                if ( !quer || !targ.length ) return;
                var cursor_start = null,
                    cursor_end = null;
                targ.on( 'focus', function () {
                    elem.addClass( 'active' );
                } );
                targ.on( 'blur', function () {
                    cursor_start = this.selectionStart;
                    cursor_end = this.selectionEnd;
                } );
                $win.on( 'click', function ( event ) {
                    const clicked = event.target;
                    if ( elem.find( clicked ).length ) {
                        targ.focus();
                        targ.get( 0 ).selectionStart = cursor_start;
                        targ.get( 0 ).selectionEnd = cursor_start;
                        return;
                    }
                    if ( !targ.is( ':active' ) && !targ.is( ':focus' ) ) {
                        elem.removeClass( 'active' );
                    } else {
                        targ.focus();
                    }
                } );
                elem.find( 'button' ).on( 'click', function () {
                    var val = this.innerHTML;
                    if ( cursor_start === null ) cursor_start = cursor_end = targ.val().length;
                    val = targ.val().slice( 0, cursor_start ) + val + targ.val().slice( cursor_end );
                    targ.val( val ).trigger( 'change' );
                    cursor_start += this.innerHTML.length;
                    cursor_end = cursor_start;
                } );
            } );

            const fake = $( '<div>' );
            fake.addClass( 'input-tags-fake' );
            fake.appendTo( $win );
            input_tags.parent().each( ( ind, el ) => {
                const elem = $( el );
                const list = elem.children( 'ul' );
                const input = elem.children( 'input' );

                elem.on( 'click', () => {
                    input.focus();
                } );

                var dragging, dragging_width, dragging_height;
                const makeTag = () => {
                    const text = input.val().trim();
                    if ( !text ) return;
                    const item = $( '<li>' ).appendTo( list );
                    const span = $( '<span>' ).appendTo( item );
                    const del = $( '<span>' ).appendTo( item );
                    span.text( text );
                    del.addClass( 'delete' );
                    del.html( '&times;' );
                    del.on( 'mousedown', ( event ) => {
                        event.preventDefault();
                        event.stopPropagation();
                        dragging = null;
                        item.remove();
                        input.trigger( 'tag:change' );
                    } );
                    item.on( 'mousedown', ( event ) => {
                        event.preventDefault();
                        if ( ( event.which || event.button || event.buttons ) !== 1 ) return;
                        if ( dragging ) return;
                        dragging = item;
                        item.css( 'opacity', '0' );
                        fake.addClass( 'active' );
                        fake.text( span.text() );
                        dragging_width = fake.width();
                        dragging_height = fake.height();
                        const x = event.clientX - dragging_width / 2;
                        const y = event.clientY - dragging_height / 2;
                        fake.css( { left: x, top: y } );
                    } );
                };
                $win.on( 'mousemove', ( event ) => {
                    if ( !dragging ) return;
                    const x = event.clientX - dragging_width / 2;
                    const y = event.clientY - dragging_height / 2;
                    fake.css( { left: x, top: y } );
                    dragging.insertBefore( dragging.siblings( ':first' ) );
                    dragging.siblings().each( ( ind, e ) => {
                        const elem = $( e );
                        const position = elem.position();
                        if ( event.clientY < position.top ) return;
                        if ( event.clientX < position.left ) return;
                        dragging.insertAfter( elem );
                    } );
                } );
                $win.on( 'mouseleave mouseup', ( event ) => {
                    if ( !dragging ) return;
                    dragging.css( 'opacity', '' );
                    fake.removeClass( 'active' );
                    input.trigger( 'tag:change' );
                    dragging = null;
                } );

                const onSubmit = ( event ) => {
                    if ( event ) event.preventDefault();
                    makeTag();
                    input.trigger( 'tag:change' );
                    input.val( '' );
                };

                input.on( 'keydown', ( event ) => {
                    if ( event.keyCode !== 13 ) return;
                    onSubmit( event );
                } );
                input.on( 'blur', ( event ) => {
                    onSubmit( event );
                } );

                input.on( 'tag:add', ( event, arg1 ) => {
                    if ( Array.isArray( arg1 ) ) {
                        arg1.forEach( ( val ) => {
                            input.val( val );
                            onSubmit( event );
                        } );
                    } else {
                        input.val( arg1 );
                        onSubmit( event );
                    }
                } );
            } );

            const getValue = ( input_element ) => {
                return $( input_element ).siblings( 'ul' ).find( 'li span:first-child' ).toArray().map( ( val ) => {
                    return val.innerHTML;
                } );
            };

            const input_word = $( '#input-word' )
            input_word.on( 'tag:change', ( event ) => {
                const word = ALL_WORDS[ this.index ];
                word.name = getValue( input_word );
                $( `#${ word.id } .name` ).text( word.name[ 0 ] );
            } );
            const input_translation = $( '#input-translation' )
            input_translation.on( 'tag:change', ( event ) => {
                const word = ALL_WORDS[ this.index ];
                word.translations = getValue( input_translation );
                $( `#${ word.id } .translations` ).text( word.translations.join( '; ' ) );
            } );

            const input_ipa = $( '#input-ipa' );
            input_ipa.on( 'input change', () => {
                const word = ALL_WORDS[ this.index ];
                const val = input_ipa.val();
                word.ipa = val;
                $( `#${ word.id } .ipa` ).text( word.ipa );
            } );
        }

        update() {
            this.container.find( 'polyline, .etymology, .word, .children' ).remove();
            $( '.input-tags ul' ).empty();
            var timeout;
            const active_word = ALL_WORDS[ this.index ];
            const makeElement = ( word ) => {
                const button = $( '<button>' );
                button.addClass( 'word' );
                button.attr( 'id', word.id );
                // button.addClass( `id-${ this.index }` );
                button.on( 'click', () => {
                    clearTimeout( timeout );
                    this.index = +word.id;
                    this.update();

                    // const original = {
                    //     left: this.container.css( 'left' ),
                    //     top: this.container.css( 'top' )
                    // };
                    // console.log( original );
                    // this.container.css( {
                    //     'transition': 'none',
                    //     'left': '0px',
                    //     'top': '0px'
                    // } );
                    // const elem = $( `#${ word.id }` );
                    // const offset = this.container.offset();
                    // // const offset = {
                    // //     left: parseFloat( this.container.css( 'left' ) ),
                    // //     top: parseFloat( this.container.css( 'top' ) )
                    // // };
                    // const position = elem.position();
                    // const left = ( this.container.outerWidth() - elem.outerWidth() ) / 2 - position.left - offset.left;
                    // const top = ( this.container.outerHeight() - elem.outerHeight() ) / 2 - position.top - offset.top;
                    // this.container.css( {
                    //     'left': original.left,
                    //     'top': original.top
                    // } );
                    // setTimeout( () => {
                    //     this.container.css( {
                    //         'transition': 'left 1s, top 1s',
                    //         'left': left + 'px',
                    //         'top': top + 'px'
                    //     } );
                    // }, 10 );
                } );
                const header = $( '<div>' )
                    .addClass( 'header' )
                    .appendTo( button );
                $( '<span>' )
                    .addClass( 'name' )
                    .text( word.name[ 0 ] )
                    .appendTo( header );
                $( '<div>' )
                    .addClass( 'translations' )
                    .text( word.translations.join( '; ' ) )
                    .appendTo( button );
                if ( word.ipa ) {
                    $( '<span>' )
                        .addClass( 'ipa' )
                        .text( word.ipa )
                        .appendTo( header );
                }
                button.css( 'background-color', word.dictionary.color );
                return button;
            };
            const makeDerives = ( word, element ) => {
                const elem_word = makeElement( word );
                const elem_ety = $( '<div>' );
                elem_ety.addClass( 'etymology' );
                word.etymology.forEach( ( parent ) => {
                    const container_parent = $( '<div>' );
                    container_parent.addClass( 'branch' );
                    container_parent.appendTo( elem_ety );
                    makeDerives( parent, container_parent );
                } );
                element.append( elem_ety, elem_word );
                return elem_word;
            };
            const makeChildren = ( word, element ) => {
                const elem_word = makeElement( word );
                const elem_children = $( '<div>' );
                elem_children.addClass( 'children' );
                word.children.forEach( ( child ) => {
                    const container_parent = $( '<div>' );
                    container_parent.addClass( 'branch' );
                    container_parent.appendTo( elem_children );
                    makeChildren( child, container_parent );
                } );
                element.append( elem_word, elem_children );
                return elem_word;
            };

            $( '#input-lang' ).val( active_word.dictionary.name );
            $( '#input-word' ).trigger( 'tag:add', [ active_word.name ] );
            $( '#input-ipa' ).val( active_word.ipa );
            $( '#input-translation' ).trigger( 'tag:add', [ active_word.translations ] );

            const inventory = active_word.dictionary.ipa.map( ( obj ) => {
                return obj.value;
            } );
            $( '.keyboard-ipa .used' ).removeClass( 'used' );
            $( '.keyboard-ipa button' ).each( ( ind, el ) => {
                const elem = $( el );
                if ( inventory.includes( elem.text() ) ) {
                    elem.addClass( 'used' );
                }
            } );

            makeDerives( active_word, this.container );
            makeChildren( active_word, this.container ).detach();

            $( `#${ active_word.id }` ).css( 'border-width', '3px' );

            this.drawSVG();
        }

        drawSVG() {
            const drawLine = ( x1, y1, x2, y2 ) => {
                const line = document.createElementNS( 'http://www.w3.org/2000/svg', 'polyline' );
                const points = [];
                points.push( [ x1, y1 ] );
                if ( x1 !== x2 ) {
                    points.push( [ x1, y1 + ( y2 - y1 ) / 2 ] );
                    points.push( [ x2, y1 + ( y2 - y1 ) / 2 ] );
                }
                points.push( [ x2, y2 ] );
                const attr = points.map( ( val ) => {
                    return val.join( ',' );
                }, '' ).join( ' ' );
                line.setAttribute( 'points', attr );
                line.setAttribute( 'fill', 'none' );
                line.setAttribute( 'stroke', 'black' );
                line.setAttribute( 'stroke-width', '2' );
                line.setAttribute( 'marker-end', 'url(#arrow)' );
                this.svg.appendChild( line );
            };
            this.drawSVG = function () {
                this.svg.setAttribute( 'width', this.container.width() + '' );
                this.svg.setAttribute( 'height', this.container.height() + '' );
                const rect_svg = this.svg.getBoundingClientRect();
                $( '.branch' ).each( ( ind, e ) => {
                    const elem_parent = $( e );
                    const container = elem_parent.parent();
                    const is_top = container.hasClass( 'etymology' );
                    const elem_child = is_top ? container.next() : container.prev();
                    const rect_top = ( is_top ? elem_parent : elem_child ).get( 0 ).getBoundingClientRect();
                    const rect_bottom = ( !is_top ? elem_parent : elem_child ).get( 0 ).getBoundingClientRect();
                    var x1 = rect_top.left + rect_top.width / 2 - rect_svg.left - 1;
                    var y1 = rect_top.top + rect_top.height - rect_svg.top - 1;
                    var x2 = rect_bottom.left + rect_bottom.width / 2 - rect_svg.left - 1;
                    var y2 = rect_bottom.top - rect_svg.top - 1;
                    drawLine( x1, y1, x2, y2 );
                } );
            };
            this.drawSVG();
        }

        draw_old() {
            $( '.container .word' ).detach();
            $( '.container .row' ).detach();
            var timeout;
            const container = $( '.container' );
            const makeElement = ( word ) => {
                const elem = $( '<button>' );
                elem.addClass( 'word' );
                elem.addClass( `id-${ this.index }` );
                elem.on( 'click', () => {
                    clearTimeout( timeout );
                    const width = window.innerWidth;
                    const height = window.innerHeight;
                    const offset = elem.offset();
                    const left = offset.left + ( elem.outerWidth() - width ) / 2;
                    const top = offset.top + ( elem.outerHeight() - height ) / 2;
                    container.css( {
                        'transition': 'none',
                        'left': left + 'px',
                        'top': top + 'px'
                    } );
                    timeout = setTimeout( () => {
                        container.css( {
                            'transition': 'left 1s, top 1s',
                            'left': '0px',
                            'top': '0px'
                        } );
                    }, 10 );
                    this.index = +word.id;
                    this.update();
                } );
                const header = $( '<div>' )
                    .addClass( 'name' )
                    .text( word.name[ 0 ] )
                    .appendTo( elem );
                $( '<div>' )
                    .addClass( 'translations' )
                    .text( word.translations.join( '; ' ) )
                    .appendTo( elem );
                if ( word.ipa ) {
                    $( '<span>' )
                        .addClass( 'ipa' )
                        .text( `/${ word.ipa }/` )
                        .appendTo( header );
                }
                var color = '';
                switch ( word.language ) {
                    case 'Ancient Glyphic':
                        color = '#bdbdbf';
                        break;
                    case 'Common Arboreal':
                        color = '#d0d1ef';
                        break;
                    case 'Proto-Yarla':
                        color = '#cee0f0';
                        break;
                    case 'Old Yarla':
                        color = '#cee0f0';
                        break;
                    case 'Yarla':
                        color = '#b7d4ef';
                        break;
                }
                elem.css( 'background-color', color );
                return elem;
            };

            const word = ALL_WORDS[ this.index ];
            const elem = makeElement( word );
            const row = $( '<div>' );
            row.addClass( 'row' );
            row.attr( 'data-order', 0 );
            row.appendTo( container );
            elem.appendTo( row );
            const parents = [];
            const children = [];
            word.etymology.forEach( ( parent ) => {
                const elem = makeElement( parent );
                var elem_row = $( `.row[data-order=-1]` );
                // const age = word.age - parent.age;
                // var elem_row = $( `.row[data-order=${ age }]` );
                if ( !elem_row.length ) {
                    elem_row = $( '<div>' );
                    elem_row.addClass( 'row' );
                    elem_row.attr( 'data-order', -1 );
                    elem_row.appendTo( container );
                    // elem_row.attr( 'data-order', age );
                    // if ( age < 0 ) {
                    parents.push( elem );
                    // } else if ( age > 0 ) {
                    //     children.push( elem );
                    // }
                }
                elem.appendTo( elem_row );
            } );
            word.children.forEach( ( child ) => {
                const elem = makeElement( child );
                var elem_row = $( `.row[data-order=1]` );
                // const age = word.age - child.age;
                // var elem_row = $( `.row[data-order=${ age }]` );
                if ( !elem_row.length ) {
                    elem_row = $( '<div>' );
                    elem_row.addClass( 'row' );
                    elem_row.attr( 'data-order', 1 );
                    // elem_row.attr( 'data-order', age );
                    elem_row.appendTo( container );
                    // if ( age < 0 ) {
                    //     parents.push( elem );
                    // } else if ( age > 0 ) {
                    children.push( elem );
                    // }
                }
                elem.appendTo( elem_row );
            } );

            const sorted = $( $( '.container .row' ).toArray().sort( function ( a, b ) {
                var aVal = parseInt( a.getAttribute( 'data-order' ) ),
                    bVal = parseInt( b.getAttribute( 'data-order' ) );
                return aVal - bVal;
            } ) );
            $( '.container' ).children().detach();
            $( '.container' ).append( sorted );

            if ( parents.length > children.length ) {
                for ( let i = 0, l = parents.length - children.length; i < l; ++i ) {
                    $( '<div>' )
                        .addClass( 'row' )
                        .addClass( 'a' )
                        .appendTo( container );
                }
            } else if ( parents.length < children.length ) {
                for ( let i = 0, l = children.length - parents.length; i < l; ++i ) {
                    $( '<div>' )
                        .addClass( 'row' )
                        .addClass( 'b' )
                        .prependTo( container );
                }
            }
        }

        load() {
            const deferred = $.Deferred();
            const defers = [ $.Deferred() ];

            const loadLanguages = () => {
                const defer = $.Deferred();
                defers.push( defer );
                $.ajax( {
                    type: 'GET',
                    url: './data/languages.xml',
                    dataType: 'xml',
                    success: ( xml ) => {
                        const langs = $( xml ).children().children( 'language' );
                        langs.each( ( ind, lang_xml ) => {
                            // const elem = $( lang_xml );
                            const name = lang_xml.getElementsByTagName( 'name' )[ 0 ].innerHTML;
                            this.language[ name ] = new Dictionary( name, lang_xml );
                        } );
                        defer.resolve();
                    }
                } );
                return defer;
            };

            const loadLexicon = () => {
                const defer = $.Deferred();
                defers.push( defer );
                $.ajax( {
                    type: 'GET',
                    url: './data/lexicon.xml',
                    dataType: 'xml',
                    success: ( xml ) => {
                        const lexicon = $( xml ).children( 'lexicon' );
                        const words = lexicon.children( 'word' );
                        words.each( ( index, word ) => {
                            const lang = word.getElementsByTagName( 'language' )[ 0 ].innerHTML;
                            var dictionary = this.language[ lang ];
                            if ( !dictionary ) {
                                console.warning( `Language "${ lang }" was not found in languages.xml.` );
                                dictionary = this.language[ lang ] = new Dictionary( lang );
                            }
                            dictionary.newWord( word );
                        } );
                        defer.resolve();
                    }
                } );
                return defer;
            };

            const linkEtymology = () => {
                for ( const key in this.language ) {
                    const dict = this.language[ key ];
                    dict.lexicon.forEach( ( word ) => {
                        word.etymology.forEach( ( val, ind, arr ) => {
                            if ( val instanceof Word ) return;
                            const parent = ALL_WORDS[ +val ];
                            arr[ ind ] = parent;
                            parent.children.push( word );
                        } );
                    } );
                }
            };

            loadLanguages()
                .then( loadLexicon )
                .then( linkEtymology )
                .then( deferred.resolve );


            // defers[ 0 ].resolve();
            // $.when( ...defers ).then( () => {
            //     deferred.resolve();
            // } );
            return deferred;
        }
    }

    $( function () {
        const APP = new App();
        APP.load().then( () => {
            console.log( APP.language );
            // for ( const ind in APP.language ) {
            //     const dict = APP.language[ ind ];
            //     console.log( dict.language, dict.age );
            // }
            APP.update();
        } );
    } );
} )();
