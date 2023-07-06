/*jshint esversion: 7*/

import AV from '/build/av.module.js/av.module.js';

( function () {
    /** Searches for a certain tag and returns each tag's contents.
     * @param {XMLDocument} xml - XML object.
     * @param {string} key - Tag name to query.
     * @return {string[]} The contents of each tag found.
     */
    const getArrayFromXML = ( xml, key ) => {
        return [ ...xml.getElementsByTagName( key ) ].map( ( obj ) => {
            return obj.innerHTML;
        } );
    };

    /** Returns the value of an input-tag input.
     * @param {HTMLInputElement} input_element
     * @return {string[]}
     */
    const getInputTagValue = ( input_element ) => {
        return $( input_element ).siblings( 'ul' ).find( 'li span:first-child' ).toArray().map( ( val ) => {
            return val.innerHTML;
        } );
    };

    /** Draws an elbowed line from one point to another.
     * @param {SVGElement} svg - The SVG.
     * @param {number} x1 - The starting point's X value.
     * @param {number} y1 - The starting point's Y value.
     * @param {number} x2 - The ending point's X value.
     * @param {number} y2 - The ending point's Y value.
     */
    const drawElbowConnector = ( svg, x1, y1, x2, y2 ) => {
        /** @type {SVGPolylineElement} The line. */
        const line = document.createElementNS( 'http://www.w3.org/2000/svg', 'polyline' );
        /** @type {number[][]} The points of the polyline. */
        const points = [];
        points.push( [ x1, y1 ] );
        if ( x1 !== x2 ) {
            /** Elbow. */
            points.push( [ x1, y1 + ( y2 - y1 ) / 2 ] );
            points.push( [ x2, y1 + ( y2 - y1 ) / 2 ] );
        }
        points.push( [ x2, y2 ] );
        /** @type {string} Points formated for points attribute. */
        const attr = points.map( ( val ) => {
            return val.join( ',' );
        }, '' ).join( ' ' );
        line.setAttribute( 'points', attr );
        line.setAttribute( 'fill', 'none' );
        line.setAttribute( 'stroke', 'black' );
        line.setAttribute( 'stroke-width', '2' );
        line.setAttribute( 'marker-end', 'url(#arrow)' );
        /** Add the line to the SVG. */
        svg.appendChild( line );
    };

    /** @type {Dictionary[]} Languages indexed by ID. */
    const ALL_LANGS = [];
    /** @type {Word[]} Words indexed by ID. */
    const ALL_WORDS = [];

    /** Contains all words within one language.
     * @class
     */
    class Dictionary {
        /**
         * @param {XMLDocument} xml - XML object containing language data.
         */
        constructor( xml ) {
            /** @type {Word[]} All words in this dictionary. */
            this.lexicon = [];

            /** @type {string[]} Names for this language. */
            this.name = getArrayFromXML( xml, 'name' );
            /** @type {string} Color to associate with this language. */
            this.color = getArrayFromXML( xml, 'color' )[ 0 ] || 'white';
            /** @type {number} Internal ID. */
            this.id = +xml.id;
            /**
             * @typedef {object} IPAObject
             * @param {string} value - The IPA symbol.
             * @param {string} [roma] - Romanized form.
             */
            /** @type {IPAObject[]} IPA inventory. */
            this.ipa = [];

            ALL_LANGS[ this.id ] = this;

            /** Populate {@link Dictionary.ipa}. */
            [ ...xml.getElementsByTagName( 'ipa' ) ].forEach( ( ipa ) => {
                const value = ipa.getElementsByTagName( 'value' )[ 0 ];
                const roma = ipa.getElementsByTagName( 'roma' )[ 0 ];
                this.ipa.push( {
                    value: value.innerHTML,
                    roma: roma ? roma.innerHTML : null
                } );
            } );

            /** Add an option to the language menu. */
            $( '<option>' )
                .val( this.id )
                .text( this.name.join( ' / ' ) )
                .appendTo( 'select#input-lang' );
        }

        /** @type {object} */
        get age() {
            if ( !this.lexicon.length ) return {
                min: null,
                max: null,
                average: null
            };
            var min = Infinity,
                max = -Infinity,
                ave = this.lexicon.reduce( ( a, b ) => {
                    min = Math.min( min, a, b.age );
                    max = Math.max( max, a, b.age );
                    return a + b.age;
                }, 0 ) / this.lexicon.length;
            return {
                min: min,
                max: max,
                average: ave
            };
        }

        /** Creates a new word.
         * @param {XMLDocument} xml - XML object containing word data.
         * @return {(Word|null)} The new word.
         */
        newWord( xml ) {
            /** @type {jQuery} Parsed XML object. */
            const $word = $( xml );
            /** @prop {object} Passes data onto the {@link Word} constructor. */
            const prop = {
                age: +$word.find( 'age' ).text(),
                etymology: getArrayFromXML( xml, 'etymology' ),
                id: +$word[ 0 ].id,
                translations: getArrayFromXML( xml, 'translation' ),
                words: []
            };
            [ ...xml.getElementsByTagName( 'roma' ) ].forEach( ( elem ) => {
                const ipa = elem.attributes.ipa;
                prop.words.push( {
                    value: elem.innerHTML,
                    ipa: ipa ? ipa.value : ''
                } );
            } );
            /** Verify internal ID. */
            if ( isNaN( prop.id ) ) {
                console.error( `Cannot add ${ prop.name }; ID is invalid.` );
                return null;
            }
            if ( ALL_WORDS[ +prop.id ] instanceof Word ) {
                console.error( `Cannot add ${ prop.name }; Word #${ +prop.id } is already defined as ${ ALL_WORDS[ +prop.id ].name }: ${ ALL_WORDS[ +prop.id ].translations.join( ', ' ) }` );
                return null;
            }
            const word = new Word( this, prop );
            // this.lexicon.push( word );
            this.lexicon[ word.id ] = word;
            ALL_WORDS[ word.id ] = word;
            return word;
        }
    }

    /** A single word.
     * @class
     */
    class Word {
        /**
         * @typedef {object} WordObject
         * @param {string} value - The IPA symbol.
         * @param {string} [ipa] - Romanized form.
         */
        /**
         * @param {Dictionary} dictionary - This word's language and dictionary.
         * @param {object} prop - Properties.
         * @param {number} prop.id - Internal ID.
         * @param {WordObject[]} prop.words - The word's (romanized) spellings.
         * @param {number} [prop.age] - Age.
         * @param {number[]} [prop.etymology] - IDs of word that this word derived from.
         * @param {string[]} [prop.translations] - What this word means.
        */
        constructor( dictionary, prop ) {
            /** @type {WordObject[]} The word's (romanized) spellings. */
            this.words = prop.words;
            /** @type {Dictionary} The language this word belongs to. */
            this.dictionary = dictionary;
            /** @type {number} Internal ID. */
            this.id = Math.max( prop.id );
            /** @type {number} */
            this.age = prop.age;
            if ( isNaN( this.age ) ) {
                this.age = dictionary.age.average;
            }
            /** @type {string[]} This word's meaning. */
            this.translations = prop.translations || [];
            /** @type {Word[]} Words derived from this word. */
            this.children = [];

            /** @type {$.Deferred} Await etymology connections. */
            this.defer_etymology = $.Deferred();
            const defers = [ $.Deferred() ];
            /** @type {Word[]} Words from which this word derived. */
            this.etymology = [];
            ( prop.etymology || [] ).forEach( ( val ) => {
                defers.push( this.linkEtymology( val ) );
            } );
            $.when( ...defers ).then( () => {
                this.defer_etymology.resolve();
            } );
            defers[ 0 ].resolve();
            // this.etymology = ( prop.etymology || [] ).map( ( val ) => {
            //     /** See if this word has been created. */
            //     /** @type {(Word|undefined)} The word. */
            //     const word = ALL_WORDS[ ind ];
            //     /** Keep the number for now if the word hasn't been made yet. */
            //     if ( !word ) return ind;
            //     /** Add this word to its parent's {@link Word.children}. */
            //     word.children.push( this );
            //     return word;
            // } );
        }

        /** @type {string} The first translation of this word. */
        get name() {
            return this.words[ 0 ].value;
        }

        /** Moves this word to a different dictionary.
         * @param {Dictionary} dictionary - The new dictionary.
         */
        changeLanguage( dictionary ) {
            // /** @type {Word[]} The old dictionary's lexicon without this word. */
            // const lexicon = [];
            // this.dictionary.lexicon.forEach( ( word ) => {
            //     if ( word.id !== this.id ) lexicon.push( word );
            // } );
            // this.dictionary.lexicon = lexicon;
            this.dictionary.lexicon[ this.id ] = null;
            this.dictionary = dictionary;
            this.dictionary.lexicon[ this.id ] = this;
        }

        /** Generates an XML document containing this word's data.
         * @return {XMLDocument}
         */
        generateXML() {
            /** @type {jQuery} The new word. */
            const $cont = $( '<word>' );
            $cont.attr( 'id', this.id );
            this.words.forEach( ( word ) => {
                $( '<word>' )
                    .text( word )
                    .attr( 'ipa', word.ipa )
                    .appendTo( $cont );
            } );
            $( '<language>' )
                .text( this.dictionary.id )
                .appendTo( $cont );
            this.translations.forEach( ( word ) => {
                $( '<translation>' )
                    .text( word )
                    .appendTo( $cont );
            } );
            this.etymology.forEach( ( word ) => {
                $( '<etymology>' )
                    .text( word.id )
                    .appendTo( $cont );
            } );
            $( '<age>' )
                .text( this.age )
                .appendTo( $cont );
            return $cont.get( 0 );
        }

        /** Connects the etymology of this word and another.
         * @param {(Word|number)} word_or_id - The word, or the word's ID.
         * @returns {$.Deferred} Deferred object awaiting the connection to be made.
         */
        linkEtymology( word_or_id ) {
            const deferred = $.Deferred();
            var word, id;
            if ( typeof this._etymology_tries === 'undefined' ) {
                this._etymology_tries = 1000;
            }
            if ( word_or_id instanceof Word ) {
                word = word_or_id;
                id = +word.id;
            } else {
                id = +word_or_id;
                word = ALL_WORDS[ id ];
            }
            if ( word ) {
                const isRelated = ( test_word, key ) => {
                    var out = test_word.id === id;
                    test_word[ key ].forEach( ( word ) => {
                        out |= isRelated( word, key );
                    } );
                    return out;
                };
                if ( !isRelated( this, 'etymology' ) && !isRelated( this, 'children' ) ) {
                    this.etymology.push( word );
                    word.children.push( this );
                }
                deferred.resolve();
            } else {
                if ( this._etymology_tries-- <= 0 ) {
                    console.error( `${ this.name } cannot link to word #${ id }.` );
                    deferred.resolve();
                } else {
                    setTimeout( () => {
                        this.linkEtymology( id );
                    }, 50 * Math.random() );
                }
            }
            return deferred;
        }

        /** Disconnects the etymology of this word from another.
         * @param {(Word|number)} word_or_id - The word, or the word's ID.
         */
        unlinkEtymology( word_or_id ) {
            var word, id;
            if ( word_or_id instanceof Word ) {
                word = word_or_id;
                id = word.id;
            } else {
                id = +word_or_id;
                word = ALL_WORDS[ id ];
            }
            if ( !word ) return;
            const new_etymology = [];
            this.etymology.forEach( ( word ) => {
                if ( word.id === id ) return;
                new_etymology.push( word );
            } );
            this.etymology = new_etymology;
            const new_parent_children = [];
            word.children.forEach( ( word ) => {
                if ( word.id === this.id ) return;
                new_parent_children.push( word );
            } );
            word.children = new_parent_children;
        }
    }

    /** @class */
    class App {
        constructor() {
            /** @type {number} The ID of the currently active {@link Word}. */
            this.index = 56;
            /** @type {jQuery} Where to create the etymology graph. */
            this.$tree_container = $( '.etymology-container' );
            /** @type {SVGElement} Where to draw arrows for the etymology graph. */
            this.tree_svg = document.getElementById( 'arrows' );
            /** Initialize the control panel. */
            this.initControls();
            /** Redraw the tree's SVG after resizing the window. */
            $( window ).on( 'resize', () => {
                this.drawTreeSVG();
            } );
        }

        /** Update the controls.
         * @param {Word} word - The word to select.
         */
        select( word ) {
            /** @type {Word} The currently selected word. */
            const active_word = word;
            this.index = active_word.id;

            /** Set values of control panel. */
            $( '#input-lang' ).val( active_word.dictionary.id );
            /** Empty and populate the table. */
            $( '.word-table .row' ).remove();
            active_word.words.forEach( ( obj ) => {
                $( '.word-table' ).trigger( 'tag:add', [ obj.value, obj.ipa, obj.notes ] );
            } );
            /** Populate the translations input. */
            $( '#input-translation' ).trigger( 'tag:add', [ active_word.translations ] );

            /** @type {string[]} The IPA inventory of this word's language. */
            const inventory = active_word.dictionary.ipa.map( ( obj ) => {
                return obj.value;
            } );
            /** Highlight keys on the IPA keyboard. */
            $( '.keyboard-ipa .used' ).removeClass( 'used' );
            $( '.keyboard-ipa button' ).each( ( ind, elem ) => {
                const $elem = $( elem );
                if ( inventory.includes( $elem.text() ) ) {
                    $elem.addClass( 'used' );
                }
            } );

            /** Populate the dropdown menu. */
            $( '.all-words' ).each( ( ind, elem ) => {
                /** @type {jQuery} The dropdown menu. */
                const $select = $( elem );
                const id = $select.parent().attr( 'id' );
                /** @type {jQuery} The text input. */
                const $input = $select.siblings( 'input' );
                if ( id === 'active-word' ) {
                    $input.val( active_word.name );
                    $input.attr( 'data-id', active_word.id );
                }
                $select.empty();
                ALL_LANGS.sort( ( a, b ) => {
                    return a.name > b.name ? 1 : -1;
                } ).forEach( ( dictionary ) => {
                    /** @type {jQuery} Category of languages for the dropdown menu. */
                    const $optgroup = $( '<optgroup>' );
                    $optgroup.attr( 'label', dictionary.name[ 0 ] );
                    $optgroup.appendTo( $select );
                    /** @type {object[]} Data for each word's option element. */
                    const lexicon = [];
                    dictionary.lexicon.forEach( ( words ) => {
                        words.words.forEach( ( word ) => {
                            lexicon.push( {
                                text: word.value,
                                value: words.id,
                                trans: words.translations.join( '; ' )
                            } );
                        } );
                    } );
                    lexicon.sort( ( a, b ) => {
                        return a.text > b.text ? 1 : -1;
                    } );
                    lexicon.forEach( ( obj ) => {
                        /** @type {jQuery} The option element for each word. */
                        const $option = $( '<option>' );
                        $option.attr( 'value', obj.value );
                        $option.text( obj.text );
                        $option.appendTo( $optgroup );
                        $option.attr( 'title', obj.trans );
                        var func = () => { };
                        switch ( id ) {
                            case 'active-word':
                                func = () => {
                                    this.select( ALL_WORDS[ obj.value ] );
                                };
                                break;
                        }
                        $option.on( 'click', () => {
                            $input.val( obj.text );
                            $input.attr( 'data-id', obj.value );
                            $select.attr( 'data-id', obj.value );
                            func();
                            $select.removeClass( 'active' );
                            $input.trigger( 'change' );
                        } );
                    } );
                } )
            } );

            $( '#list-derives' ).find( 'select.all-words' ).val( -1 ).trigger( 'change' );

            this.updateTree();
        }

        /** Initializes the control panel. */
        initControls() {
            /** Initialize special inputs. */
            this.initCtrl_InputDropdown();
            this.initCtrl_InputList();
            this.initCtrl_InputTable();
            this.initCtrl_InputTags();
            this.initCtrl_Keyboard();

            /** Word language selection. */
            const input_lang = $( '#input-lang' );
            input_lang.on( 'input change', () => {
                const word = ALL_WORDS[ this.index ];
                word.changeLanguage( ALL_LANGS[ input_lang.val() - 1 ] );
                /** Change the etymology node background superficially. */
                $( `#${ word.id }` ).css( 'background-color', word.dictionary.color );
            } );

            /** Changes the words and their pronunciation. */
            /** @type {jQuery} The input. */
            const $input_words = $( '.word-table' );
            $input_words.on( 'tag:change', () => {
                /** @type {Word} The currently selected word. */
                const word = ALL_WORDS[ this.index ];
                const $rows = $input_words.find( 'tr.row' );
                const first_word = word.words[ 0 ];
                word.words = [];
                $rows.each( ( ind, elem ) => {
                    const $elem = $( elem );
                    const obj = {
                        value: $elem.find( 'input.word' ).val().trim(),
                        ipa: $elem.find( 'input.ipa' ).val().trim(),
                        notes: $elem.find( 'input.notes' ).val().trim()
                    };
                    if ( !obj.value ) return;
                    word.words.push( obj );
                } );
                /** Make sure that there's always a minimum of one word. */
                if ( !word.words.length ) {
                    word.words.push( first_word );
                    $( '.word-table' ).trigger( 'tag:add', [ first_word.value, first_word.ipa, first_word.notes ] );
                }
                /** Update the etymology node. */
                $( `#${ word.id } .name` ).text( word.name );
                $( `#${ word.id } .ipa` ).text( word.words[ 0 ].ipa );

                // word.words = getInputTagValue( $input_words ).map( ( val ) => {
                //     return {
                //         value: val,
                //         ipa: ''
                //     };
                // } );
                /** Update the etymology node. */
                // $( `#${ word.id } .name` ).text( word.name );
            } );

            // /** Changes the word. */
            // /** @type {jQuery} The input. */
            // const $input_word = $( '#input-word' );
            // $input_word.on( 'tag:change', () => {
            //     /** @type {Word} The currently selected word. */
            //     const word = ALL_WORDS[ this.index ];
            //     word.words = getInputTagValue( $input_word ).map( ( val ) => {
            //         return {
            //             value: val,
            //             ipa: ''
            //         };
            //     } );
            //     /** Update the etymology node. */
            //     $( `#${ word.id } .name` ).text( word.name );
            // } );

            /** Changes the word's translation. */
            /** @type {jQuery} The input. */
            const $input_translation = $( '#input-translation' );
            $input_translation.on( 'tag:change', ( event ) => {
                /** @type {Word} The currently selected word. */
                const word = ALL_WORDS[ this.index ];
                word.translations = getInputTagValue( $input_translation );
                /** Update the etymology node. */
                $( `#${ word.id } .translations` ).text( word.translations.join( '; ' ) );
            } );

            /** Changes the word's etymology. */
            /** @type {jQuery} */
            const $ctrl_ety_container = $( '#list-derives' );
            const $ctrl_ety_input = $ctrl_ety_container.find( 'input#etymology-word-input' );
            // const $ctrl_ety_menu = $ctrl_ety_container.find( 'div#etymology-word-select' );
            const $ctrl_ety_menu = $ctrl_ety_container.find( 'select.all-words' );
            const $ctrl_ety_list = $ctrl_ety_container.find( 'div.input-list' );
            const sortList = ( new_word ) => {
                const active_word = ALL_WORDS[ this.index ];
                if ( new_word ) {
                    active_word.linkEtymology( new_word );
                }
                $ctrl_ety_list.empty();
                const etymology = active_word.etymology.sort( ( a, b ) => {
                    return a.name > b.name ? 1 : -1;
                } );
                etymology.forEach( ( word ) => {
                    $ctrl_ety_container.trigger( 'tag:add', word.name );
                    const $row = $ctrl_ety_list.children( '.row' ).last();
                    $row.wrapInner( '<span class="word"></span>' );
                    const $desc = $( '<span>' );
                    $desc.addClass( 'definition' );
                    var text = word.dictionary.name[ 0 ];
                    if ( word.translations.length ) {
                        text = `${ text }: ${ word.translations.join( ', ' ) }`;
                    }
                    $desc.text( text );
                    $desc.appendTo( $row );
                    // $row.attr( 'data-id', word.id );
                    $ctrl_ety_list.children( '.delete' ).last().on( 'click', () => {
                        active_word.unlinkEtymology( word.id );
                        // $ctrl_ety_input.attr( 'data-id', '' );
                        this.updateTree();
                    } );
                } );
                this.updateTree();
            };
            $ctrl_ety_input.on( 'change', () => {
                queueMicrotask( () => {
                    const new_id = $ctrl_ety_input.attr( 'data-id' );
                    console.log( new_id );
                    // $ctrl_ety_input.val( '' );
                    sortList( new_id );
                    //     $ctrl_ety_input.attr( 'data-id', '' );
                    $ctrl_ety_menu.find( 'option' ).show();
                    // $ctrl_ety_menu.blur();
                } );
            } );
            $ctrl_ety_menu.on( 'change', () => {
                sortList( $ctrl_ety_menu.val() );
            } );

            // /** Changes the word's pronunciation. */
            // /** @type {jQuery} The input. */
            // const $input_ipa = $( '#input-ipa' );
            // $input_ipa.on( 'input change', () => {
            //     /** @type {Word} The currently selected word. */
            //     const word = ALL_WORDS[ this.index ];
            //     word.ipa = $input_ipa.val();
            //     /** Update the etymology node. */
            //     $( `#${ word.id } .ipa` ).text( word.ipa );
            // } );
        }

        /** Initializes "data-role:input-dropdown" divs. */
        initCtrl_InputDropdown() {
            const getLoose = ( text ) => {
                return text
                    .toLowerCase()
                    .normalize( 'NFD' )
                    .replace( /[\u0300-\u036f]/g, '' )
                    .replace( /[^\S]/g, '' )
                    .replace( /\u00e6/g, 'ae' )
                    .replace( /\u0153/g, 'oe' )
                    .replace( /\u00f0/g, 'th' )
                    .replace( /\u00f8/g, 'o' )
                    .replace( /\u00df/g, 'ss' )
                    .replace( /[^a-z0-9]/g, '' );
            };
            // /** @type {jQuery} The body. */
            // const $body = $( 'body' );
            $( 'div[data-role="input-dropdown"]' ).each( ( ind, elem ) => {
                /** @type {jQuery} All input-dropdown divs. */
                const $container = $( elem );
                const $input = $container.children( 'input' );
                const $select = $container.children( '.menu' );

                $input.on( 'focus', () => {
                    $select.addClass( 'active' );
                } );
                $input.on( 'blur', () => {
                    if ( $select.is( ':hover' ) ) return;
                    $select.removeClass( 'active' );
                    $select.find( 'option' ).show();
                } );
                $input.on( 'input change', () => {
                    const val = $input.val().trim();
                    const val_loose = getLoose( val );
                    const $options = $select.find( 'option' );
                    if ( !val ) {
                        $options.show();
                        return;
                    }
                    $options.hide();
                    $options.each( ( ind, opt ) => {
                        const $opt = $( opt );
                        const opt_val = $opt.text().trim();
                        if ( opt_val.includes( val ) ) {
                            $opt.show();
                            return;
                        }
                        var opt_val_loose = getLoose( opt_val );
                        if ( opt_val_loose.includes( val_loose ) ) {
                            $opt.show();
                            return;
                        }
                    } );
                } );
            } );
        }

        /** Initializes "data-role:input-list" divs. */
        initCtrl_InputList() {
            $( 'div[data-role="input-list"]' ).each( ( ind, elem ) => {
                /** @type {jQuery} All input-list divs. */
                const $container = $( elem );
                // const $input = $container.find( 'input' );
                const $list = $( '<div>' );
                $list.addClass( 'input-list' );
                $list.appendTo( $container );

                // $input.on( 'change', () => {
                //     $container.trigger( 'tag:add', [ $input.val() ] );
                //     $input.val( '' );
                //     // const $input_dropdown_menu = $input.siblings( '.menu' );
                //     // if ( $input_dropdown_menu.length && $input_dropdown_menu.attr( 'data-id' ) ) {
                //     //
                //     // }
                // } );

                /** Custom event to add new rows. */
                $container.on( 'tag:add', ( event, ...row_data ) => {
                    if ( !row_data.length ) return;
                    row_data.forEach( ( text ) => {
                        const $row = $( '<div>' );
                        $row.addClass( 'row' );
                        $row.html( text );
                        $row.appendTo( $list );
                        const $delete = $( '<div>' );
                        $delete.addClass( 'delete' );
                        $delete.html( '&times;' );
                        $delete.appendTo( $list );

                        $delete.on( 'click', ( event ) => {
                            event.preventDefault();
                            $row.remove();
                            $delete.remove();
                            $container.trigger( 'tag:change' );
                        } );
                    } );

                    $container.trigger( 'tag:change' );
                } );
            } );
        }

        /** Initializes "data-role:input-table" tables. */
        initCtrl_InputTable() {
            /** @type {jQuery} The body. */
            const $body = $( 'body' );
            /** @type {jQuery} All input-table tables. */
            const $input_tables = $( 'table[data-role="input-table"]' );

            /** @type {jQuery} The tag that appears while dragging. */
            const $fake = $( '<div>' );
            $fake.addClass( 'input-table-fake' );
            $fake.appendTo( $body );

            /** @type {jQuery} The tag being dragged. */
            var dragging;
            /** @type {number} The height of {@link $fake}. */
            var dragging_height;
            $input_tables.each( ( ind, table ) => {
                const $table = $( table );
                const $tbody = $table.children( 'tbody' );
                const $template = $tbody.children( 'tr.template' );
                $template.addClass( 'row' );
                $template.removeClass( 'template' );
                $template.detach();
                $template.children().first().remove();
                $template.children().last().remove();

                const $footer = $( '<tr>' );
                $footer.addClass( 'footer' );
                $footer.appendTo( $table )
                const $btn_add = $( '<button>' );
                $btn_add.addClass( '_add' );
                $btn_add.html( '&plus;' );
                $btn_add.appendTo( $footer );
                $btn_add.wrap( '<td></td>' );
                $btn_add.on( 'click', ( event ) => {
                    /** Add a new row. */
                    event.preventDefault();
                    if ( ( event.which || event.button || event.buttons ) !== 1 ) {
                        /** Only listen to left-clicks. */
                        return;
                    }
                    $table.trigger( 'tag:add' );
                } );

                const $btn_move = $( '<div>' );
                $btn_move.addClass( '_move' );
                $btn_move.html( '&#x2261;' );
                $btn_move.prependTo( $template );
                $btn_move.wrap( '<td></td>' );
                $btn_move.on( 'mousedown', function ( event ) {
                    /** Start dragging this row. */
                    event.preventDefault();
                    if ( ( event.which || event.button || event.buttons ) !== 1 ) {
                        /** Only listen to left-clicks. */
                        return;
                    }
                    if ( dragging ) return;
                    const $row = $( this ).parent().parent();
                    dragging = $row;
                    /** Hide this row and activate the fake. */
                    dragging.css( 'opacity', '0' );
                    $fake.addClass( 'active' );
                    $fake.css( 'width', `${ dragging.outerWidth() }px` );
                    $fake.html( dragging.html() );
                    $fake.find( 'input' ).each( ( ind, elem ) => {
                        const query = 'input' + [ ...elem.classList ].map( ( val ) => { return '.' + val; } ).join();
                        $( elem ).val( dragging.find( query ).val() );
                    } );
                    dragging_width = $fake.width();
                    dragging_height = $fake.height();
                    $fake.css( {
                        left: event.clientX - dragging_height / 2,
                        top: event.clientY - dragging_height / 2
                    } );
                } );

                const $btn_del = $( '<button>' );
                $btn_del.addClass( '_delete' );
                $btn_del.html( '&times;' );
                $btn_del.appendTo( $template );
                $btn_del.wrap( '<td></td>' );
                $btn_del.on( 'click', function ( event ) {
                    /** Delete the row. */
                    event.preventDefault();
                    if ( ( event.which || event.button || event.buttons ) !== 1 ) {
                        /** Only listen to left-clicks. */
                        return;
                    }
                    const $row = $( this ).parent().parent();
                    if ( $row.prev().hasClass( 'header' ) && $row.next().hasClass( 'footer' ) ) {
                        /** Do not delete the only row. */
                        return;
                    }
                    $row.detach();
                    $table.trigger( 'tag:change' );
                } );

                /** Custom event to add new rows. */
                $table.on( 'tag:add', ( event, ...row_data ) => {
                    const $row = $template.clone( true );
                    $row.appendTo( $table );

                    const $cells = $row.children( 'td' );
                    $cells.each( ( ind, elem ) => {
                        if ( !ind || ind === $cells.length - 1 ) return;
                        const value = row_data[ ind - 1 ];
                        if ( typeof value === 'undefined' || value === null ) return;
                        const $elem = $( elem ).children();
                        if ( $elem.val ) {
                            $elem.val( value );
                            $elem.on( 'input change', () => {
                                $table.trigger( 'tag:change' );
                            } );
                        } else {
                            $elem.html( value );
                        }
                    } );

                    $footer.insertAfter( $row );
                    $table.trigger( 'tag:change' );
                } );
            } );
            $body.on( 'mousemove', ( event ) => {
                if ( !dragging ) return;
                /** Keep the fake on the mouse. */
                $fake.css( {
                    left: event.clientX - dragging_height / 2,
                    top: event.clientY - dragging_height / 2
                } );
                /** Show where the row would go if it were dropped at its current position. */
                dragging.insertBefore( dragging.siblings( ':nth-child(2)' ) );
                dragging.siblings().each( ( ind, elem ) => {
                    /** @type {jQuery} */
                    const $elem = $( elem );
                    if ( $elem.is( ':last-child' ) ) return;
                    /** @type {object} */
                    const position = $elem.offset();
                    if ( event.clientY < position.top ) return;
                    dragging.insertAfter( $elem );
                } );
            } );
            $body.on( 'mouseleave mouseup', ( event ) => {
                if ( !dragging ) return;
                /** Hide the fake and reveal the real row. */
                dragging.css( 'opacity', '' );
                $fake.removeClass( 'active' );
                dragging.parent().parent().trigger( 'tag:change' );
                dragging = null;
            } );
        }

        /** Initializes "data-role: input-tags" inputs. */
        initCtrl_InputTags() {
            /** @type {jQuery} The body. */
            const $body = $( 'body' );
            /** @type {jQuery} All input-tags inputs */
            const $input_tags = $( 'input[data-role="input-tags"]' );

            /** Format. */
            $input_tags.wrap( '<div class="input-tags"></div>' );
            $( '<ul>' ).prependTo( '.input-tags' );

            /** @type {jQuery} The tag that appears while dragging. */
            const $fake = $( '<div>' );
            $fake.addClass( 'input-tags-fake' );
            $fake.appendTo( $body );

            $input_tags.parent().each( ( ind, elem ) => {
                /** @type {jQuery} The container. */
                const $elem = $( elem );
                /** @type {jQuery} The tags. */
                const $list = $elem.children( 'ul' );
                /** @type {jQuery} The input. */
                const $input = $elem.children( 'input' );

                $elem.on( 'click', () => {
                    $input.focus();
                } );

                /** @type {jQuery} The tag being dragged. */
                var dragging;
                /** @type {number} The width of {@link $fake}. */
                var dragging_width;
                /** @type {number} The height of {@link $fake}. */
                var dragging_height;
                /** Creates a new tag from the input's value. */
                const makeTag = () => {
                    /** @type {string} The input's value. */
                    const text = $input.val().trim();
                    if ( !text ) return;
                    /** @type {jQuery} The new tag. */
                    const $item = $( '<li>' ).appendTo( $list );
                    /** @type {jQuery} The text in the tag. */
                    const $span = $( '<span>' ).appendTo( $item );
                    $span.text( text );
                    /** @type {jQuery} The tag deletion button. */
                    const $del = $( '<span>' ).appendTo( $item );
                    $del.addClass( 'delete' );
                    $del.html( '&times;' );
                    $del.on( 'mousedown', ( event ) => {
                        /** Delete the tag. */
                        event.preventDefault();
                        if ( ( event.which || event.button || event.buttons ) !== 1 ) {
                            /** Only listen to left-clicks. */
                            return;
                        }
                        event.stopPropagation();
                        dragging = null;
                        $item.remove();
                        $input.trigger( 'tag:change' );
                    } );
                    $item.on( 'mousedown', ( event ) => {
                        /** Start dragging this tag. */
                        event.preventDefault();
                        if ( ( event.which || event.button || event.buttons ) !== 1 ) {
                            /** Only listen to left-clicks. */
                            return;
                        }
                        if ( dragging ) return;
                        dragging = $item;
                        /** Hide this tag and activate the fake. */
                        $item.css( 'opacity', '0' );
                        $fake.addClass( 'active' );
                        $fake.text( $span.text() );
                        dragging_width = $fake.width();
                        dragging_height = $fake.height();
                        $fake.css( {
                            left: event.clientX - dragging_width / 2,
                            top: event.clientY - dragging_height / 2
                        } );
                    } );
                };

                $body.on( 'mousemove', ( event ) => {
                    if ( !dragging ) return;
                    /** Keep the fake on the mouse. */
                    $fake.css( {
                        left: event.clientX - dragging_width / 2,
                        top: event.clientY - dragging_height / 2
                    } );
                    /** Show where the tag would go if it were dropped at its current position. */
                    dragging.insertBefore( dragging.siblings( ':first' ) );
                    dragging.siblings().each( ( ind, elem ) => {
                        /** @type {jQuery} */
                        const $elem = $( elem );
                        /** @type {object} */
                        const position = $elem.position();
                        if ( event.clientY < position.top ) return;
                        if ( event.clientX < position.left ) return;
                        dragging.insertAfter( $elem );
                    } );
                } );
                $body.on( 'mouseleave mouseup', ( event ) => {
                    if ( !dragging ) return;
                    /** Hide the fake and reveal the real tag. */
                    dragging.css( 'opacity', '' );
                    $fake.removeClass( 'active' );
                    $input.trigger( 'tag:change' );
                    dragging = null;
                } );

                /** Adds a new tag.
                 * @param {Event} event
                 */
                const onSubmit = ( event ) => {
                    if ( event ) event.preventDefault();
                    makeTag();
                    $input.trigger( 'tag:change' );
                    /** Clear the input. */
                    $input.val( '' );
                };

                $input.on( 'keydown', ( event ) => {
                    if ( event.keyCode !== 13 ) return;
                    /** Enter on the keyboard. */
                    onSubmit( event );
                } );
                $input.on( 'blur', ( event ) => {
                    /** Input becomes inactive with text inside. */
                    onSubmit( event );
                } );

                /** Custom event to add new tags. */
                $input.on( 'tag:add', ( event, arg1 ) => {
                    if ( Array.isArray( arg1 ) ) {
                        arg1.forEach( ( val ) => {
                            $input.val( val );
                            onSubmit( event );
                        } );
                    } else {
                        $input.val( arg1 );
                        onSubmit( event );
                    }
                } );
            } );
        }

        /** Initializes custom on-screen keyboards. */
        initCtrl_Keyboard() {
            /** @type {jQuery} The body. */
            const $body = $( 'body' );
            $( '.keyboard-container' ).each( ( ind, elem ) => {
                /** @type {jQuery} The keyboard container. */
                const $elem = $( elem );
                /** @type {string} */
                const target_id = $elem.attr( 'data-target' );
                if ( !target_id ) return;
                /** @type {jQuery} The input where the keyboard will place letters. */
                const $target = $( `input#${ target_id }` );
                if ( !$target.length ) return;
                /** @type {number} Selection starting position in {@link $target}. */
                var cursor_start = null;
                /** @type {number} Selection ending position in {@link $target}. */
                var cursor_end = null;

                /** Keyboard key function. */
                $elem.find( 'button' ).on( 'click', function () {
                    /** @type {string} The character associated with the key. */
                    const key = this.innerHTML;
                    if ( cursor_start === null ) {
                        cursor_start = cursor_end = $target.val().length;
                    }
                    /** @type {string} The text to place within the input. */
                    const val = $target.val().slice( 0, cursor_start ) + key + $target.val().slice( cursor_end );
                    $target.val( val ).trigger( 'change' );
                    /** Move the cursor to the end of the new text. */
                    cursor_start += key.length;
                    cursor_end = cursor_start;
                } );

                /** Read the cursor position when the input becomes inactive. */
                $target.on( 'blur', function () {
                    cursor_start = this.selectionStart;
                    cursor_end = this.selectionEnd;
                } );
                /** Activate the keyboard if the input is in focus. */
                $target.on( 'focus', function () {
                    $elem.addClass( 'active' );
                } );
                /** Keep the focus on the input if it or the keyboard is clicked. */
                $body.on( 'click', function ( event ) {
                    if ( $elem.find( event.target ).length ) {
                        /** The keyboard was clicked. */
                        $target.focus();
                        $target.get( 0 ).selectionStart = cursor_start;
                        $target.get( 0 ).selectionEnd = cursor_start;
                        return;
                    } else if ( !$target.is( ':focus' ) ) {
                        $elem.removeClass( 'active' );
                    }
                } );
            } );
        }

        /** Empties and populates the etymology tree. */
        updateTree() {
            /** Creates a node for the tree.
             * @param {Word} word The word.
             * @return {jQuery} The node.
             */
            const createTreeNode = ( word ) => {
                /** @type {jQuery} The node. */
                const $btn = $( '<button>' );
                $btn.addClass( 'word' );
                $btn.attr( 'id', word.id );

                /** Select the clicked word. */
                $btn.on( 'click', () => {
                    this.select( word );

                    /** Position the tree with the selected node in the center. */
                    // clearTimeout( timeout );
                    // const original = {
                    //     left: this.$tree_container.css( 'left' ),
                    //     top: this.$tree_container.css( 'top' )
                    // };
                    // console.log( original );
                    // this.$tree_container.css( {
                    //     'transition': 'none',
                    //     'left': '0px',
                    //     'top': '0px'
                    // } );
                    // const elem = $( `#${ word.id }` );
                    // const offset = this.$tree_container.offset();
                    // // const offset = {
                    // //     left: parseFloat( this.$tree_container.css( 'left' ) ),
                    // //     top: parseFloat( this.$tree_container.css( 'top' ) )
                    // // };
                    // const position = elem.position();
                    // const left = ( this.$tree_container.outerWidth() - elem.outerWidth() ) / 2 - position.left - offset.left;
                    // const top = ( this.$tree_container.outerHeight() - elem.outerHeight() ) / 2 - position.top - offset.top;
                    // this.$tree_container.css( {
                    //     'left': original.left,
                    //     'top': original.top
                    // } );
                    // setTimeout( () => {
                    //     this.$tree_container.css( {
                    //         'transition': 'left 1s, top 1s',
                    //         'left': left + 'px',
                    //         'top': top + 'px'
                    //     } );
                    // }, 10 );
                } );
                /** @type {jQuery} The node's header. */
                const $header = $( '<div>' )
                    .addClass( 'header' )
                    .appendTo( $btn );
                /** Word. */
                $( '<span>' )
                    .addClass( 'name' )
                    .text( word.name )
                    .appendTo( $header );
                /** IPA. */
                $( '<span>' )
                    .addClass( 'ipa' )
                    .text( word.words[ 0 ].ipa )
                    .appendTo( $header );
                /** Translations. */
                $( '<div>' )
                    .addClass( 'translations' )
                    .text( word.translations.join( '; ' ) )
                    .appendTo( $btn );
                /** Color. */
                $btn.css( 'background-color', word.dictionary.color );
                return $btn;
            };

            /** Override with createTreeNode() in scope. */
            this.updateTree = function () {
                const $frame = this.$tree_container.parent();
                /** Remove the current etymmology tree. */
                this.$tree_container.find( '.etymology, .word, .children' ).remove();
                /** Remove the current input tags. */
                $( '.input-tags ul' ).empty();
                // /** @type {number} Timeout ID. */
                // var timeout;
                /** @type {Word} The currently selected word. */
                const active_word = ALL_WORDS[ this.index ];

                /**
                 * @param {Word} word - The word.
                 * @param {jQuery} $container - The container that holds everything.
                 * @param {("up"|"down")} [side] - Which side to do, if not both.
                */
                const createEtymology = ( word, $container, side ) => {
                    /** @type {jQuery} The new node. */
                    const $elem_word = createTreeNode( word );

                    if ( side !== 'down' ) {
                        /** @type {jQuery} The nodes from which the word derives. */
                        const $div_parents = $( '<div>' );
                        $div_parents.addClass( 'etymology' );
                        /** Create nested nodes for the parents. */
                        word.etymology.forEach( ( next_word ) => {
                            /** @type {jQuery} */
                            const $div = $( '<div>' );
                            $div.addClass( 'branch' );
                            $div.appendTo( $div_parents );
                            /** Create nodes of the parents' parents. */
                            createEtymology( next_word, $div, 'up' );
                        } );
                        $container.append( $div_parents );
                    }

                    $container.append( $elem_word );

                    if ( side !== 'up' ) {
                        /** @type {jQuery} The nodes which are derived from the word. */
                        const $div_children = $( '<div>' );
                        $div_children.addClass( 'children' );
                        /** Create nested nodes for the children. */
                        word.children.forEach( ( next_word ) => {
                            /** @type {jQuery} */
                            const $div = $( '<div>' );
                            $div.addClass( 'branch' );
                            $div.appendTo( $div_children );
                            /** Create nodes of the children's children. */
                            createEtymology( next_word, $div, 'down' );
                        } );
                        $container.append( $div_children );
                    }
                };
                /** Create the node tree. */
                createEtymology( active_word, this.$tree_container );

                /** @type {jQuery} The node containing the active word. */
                const $active_node = $( `#${ active_word.id }` );
                /** Highlight the selected word's node. */
                $active_node.css( 'border-width', '3px' );

                /** Draw arrows connecting the nodes. */
                this.drawTreeSVG();

                /** @type {object} Left and top values of the node within its container. */
                const node_pos = $active_node.position();
                /** @type {number} Horizontal position of the center of the node. */
                const node_x = node_pos.left + $active_node.width() / 2;
                /** @type {number} Vertical position of the center of the node. */
                const node_y = node_pos.top + $active_node.height() / 2;
                /** @type {number} Width of the node's container. */
                const frame_width = this.$tree_container.innerWidth();
                /** @type {number} Height of the node's container. */
                const frame_height = this.$tree_container.innerHeight();
                /** @type {number} Max horizontal scroll value. */
                const scr_x_max = $frame[ 0 ].scrollWidth - $frame[ 0 ].clientWidth;
                /** @type {number} Max vertical scroll value. */
                const scr_y_max = $frame[ 0 ].scrollHeight - $frame[ 0 ].clientHeight;
                /** Center the scroll position on the selected node. */
                $frame.scrollLeft( scr_x_max * node_x / frame_width );
                $frame.scrollTop( scr_y_max * node_y / frame_height );
            };
            this.updateTree();
        }

        /** Draws the arrows for the etymology tree. */
        drawTreeSVG() {
            [ ...this.tree_svg.getElementsByTagName( 'polyline' ) ].forEach( ( elem ) => {
                elem.remove();
            } );
            this.tree_svg.setAttribute( 'width', this.$tree_container.width() + '' );
            this.tree_svg.setAttribute( 'height', this.$tree_container.height() + '' );
            const rect_svg = this.tree_svg.getBoundingClientRect();
            $( '.branch' ).each( ( ind, elem ) => {
                /** @type {jQuery} The starting element. */
                const $parent = $( elem );
                /** @type {jQuery} The parent's container. */
                const $container = $parent.parent();
                /** @type {boolean} Whether the parent is before or after the child. */
                const is_top = $container.hasClass( 'etymology' );
                /** @type {jQuery} The ending element. */
                const $child = is_top ? $container.next() : $container.prev();
                /** @type {object} Starting element's bounding box. */
                const rect_top = ( is_top ? $parent : $child ).get( 0 ).getBoundingClientRect();
                /** @type {object} Ending element's bounding box. */
                const rect_bottom = ( !is_top ? $parent : $child ).get( 0 ).getBoundingClientRect();
                /** @type { number } The starting point's X value. */
                const x1 = rect_top.left + rect_top.width / 2 - rect_svg.left - 1;
                /** @type { number } The starting point's Y value. */
                const y1 = rect_top.top + rect_top.height - rect_svg.top - 1;
                /** @type { number } The ending point's X value. */
                const x2 = rect_bottom.left + rect_bottom.width / 2 - rect_svg.left - 1;
                /** @type { number } The ending point's Y value. */
                const y2 = rect_bottom.top - rect_svg.top - 1;
                /** Draw the polyline. */
                drawElbowConnector( this.tree_svg, x1, y1, x2, y2 );
            } );
        }

        /** Loads XML data.
         * @return {jQuery.Deferred}
         */
        load() {
            /** @type {jQuery.Deferred} Primary callback. */
            const deferred = $.Deferred();

            /** Loads languages.xml.
             * @return {jQuery.Deferred}
            */
            const loadLanguages = () => {
                /** @type {jQuery.Deferred} */
                const deferred = $.Deferred();
                $.ajax( {
                    type: 'GET',
                    url: './data/languages.xml?t=' + Date.now(),
                    dataType: 'xml',
                    success: ( xml ) => {
                        /** @type {jQuery} */
                        const $langs = $( xml ).children().children( 'language' );
                        $langs.each( ( ind, lang_xml ) => {
                            // const elem = $( lang_xml );
                            // const name = lang_xml.getElementsByTagName( 'name' )[ 0 ].innerHTML;
                            // this.language[ name ] = new Dictionary( name, lang_xml );
                            new Dictionary( lang_xml );
                        } );
                        deferred.resolve();
                    }
                } );
                return deferred;
            };

            /** Loads lexicon.xml.
             * @return {jQuery.Deferred}
            */
            const loadLexicon = () => {
                /** @type {jQuery.Deferred} */
                const deferred = $.Deferred();
                /** @type {jQuery.Deferred[]} Deferred objects that must be resolved. */
                const defers = [ $.Deferred() ];
                $.ajax( {
                    type: 'GET',
                    url: './data/lexicon.xml?t=' + Date.now(),
                    dataType: 'xml',
                    success: ( xml ) => {
                        const lexicon = $( xml ).children( 'lexicon' );
                        const words = lexicon.children( 'word' );
                        words.each( ( index, word ) => {
                            /** @type {number} Identifier. */
                            const lang_id = +word.getElementsByTagName( 'language' )[ 0 ].innerHTML;
                            /** @type {Dictionary} The dictionary this word belongs in. */
                            const dictionary = ALL_LANGS[ +lang_id ];
                            if ( !dictionary ) {
                                /** Invalid language. */
                                console.error( `Language with ID #${ lang_id } was not found in languages.xml.` );
                                return;
                            }
                            /** Create the word. */
                            dictionary.newWord( word );
                            /** Defer the etymology connection. */
                            defers.push( word.defer_etymology );
                        } );
                        $.when( ...defers ).then( deferred.resolve );
                        defers[ 0 ].resolve();
                    }
                } );
                return deferred;
            };

            /** Actually, just run these in order. */
            loadLanguages()
                .then( loadLexicon )
                .then( deferred.resolve );

            return deferred;
        }
    }

    $( function () {
        const APP = new App();
        APP.load().then( () => {
            APP.select( ALL_WORDS[ APP.index ] );
            /** Print the dictionaries. */
            /** @type {object} */
            const obj = {};
            ALL_LANGS.forEach( ( lang ) => {
                obj[ lang.name[ 0 ] ] = lang;
            } );
            console.log( obj );
        } );
    } );
} )();
