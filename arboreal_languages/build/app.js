/*jshint esversion: 7*/

import * as W2UI from './w2ui.es6.min.js'
import YAML from '/build/js-yaml.js';
// import AV from '/build/av.module.js/av.module.js';

( function () {
    /** Returns an array regardless of the input.
     * @param {*} val
     * @return {any[]} An array containing the input, or the input if it was an array.
     */
    function getArray( val ) {
        if ( Array.isArray( val ) ) return val;
        if ( typeof ( val ) !== 'undefined' ) return [ val ];
        return [];
    }

    /** Returns a search-friendly string.
     * @param {string} text - The string to format.
     * @return {string} The formatted string.
     */
    function getLoose( text ) {
        return text
            /// Lower case.
            .toLowerCase()
            /// Normalize
            .normalize( 'NFD' )
            /// Remove accents.
            .replace( /[\u0300-\u036f]/g, '' )
            /// Remove spaces.
            .replace( /[^\S]/g, '' )
            /// Replace common ligatures and symbols.
            .replace( /\u00e6/g, 'ae' )
            .replace( /\u0153/g, 'oe' )
            .replace( /\u00f0/g, 'th' )
            .replace( /\u00df/g, 'ss' )
            /// Replace slashed O.
            .replace( /\u00f8/g, 'o' )
            /// Keep only alphanumeric characters.
            .replace( /[^a-z0-9]/g, '' );
    }


    /**
     * @typedef {Object} DictionaryParameters
     * @prop {string|string[]} name - The name of the language.
     * @prop {Dictionary} [parent] - The language that this language descends from.
     */
    /**
     * @typedef {Object} WordParameters
     * @prop {string|string[]} def - The definitions of the word.
     * @prop {Word|Word[]} parents - The language that this language descends from.
     * @prop {string|string[]} roma - The word, as well as its alternate spellings.
     */

    /** Contains all words within one language.
     * @class
     */
    class Dictionary {
        /**
         * @param {DictionaryParameters} prop - Properties.
         */
        constructor( prop ) {
            /** @type {Word} A list of all words in this dictionary. */
            this.lexicon = [];
            /** @type {string[]} The names of this language. */
            this.name = getArray( prop.name );
            /** @type {Dictionary|null} The language that this language descends from. */
            this.parent = prop.parent || null;
            /** @type {Array.<{regex: RegExp, replace: string}>} A list of changes from {@link Dictionary.parent} to this language. */
            this.transformations = [];
        }

        /** Adds a new word to the dictionary.
         * @param {WordParameters} prop - Properties.
         */
        addWord( prop ) {
            if ( !this.lexicon ) this.lexicon = [];
            const word = new Word( prop );
            word.language = this;
            this.lexicon.push( word );
            return word;
        }
    }

    /** An individual word.
     * @class
     */
    class Word {
        /**
         * @param {WordParameters} [prop] - Properties.
         */
        constructor( prop ) {
            /** @type {Word[]} The words that derive from this word. */
            this.children = [];
            /** @type {string[]} English definitions of this word. */
            this.def = [];
            /** @type {number} The recid for the row representing this word. */
            this.grid_id = null;
            /** @type {Word[]} The words this word derives from. */
            this.parents = [];
            /** @type {string[]} The word, as well as its alternate spellings. */
            this.roma = [];

            if ( prop ) this.set( prop );
        }

        // linkEty() {
        //     if ( !this.parents ) return;
        //     if ( !this.parents.children ) this.parents.children = [];
        //     this.parents.children.push( this );
        // }

        /** Sets and handles the properties of this word.
         * @param {WordParameters} prop - Properties.
         *
         */
        set( prop ) {
            this.def = getArray( prop.def );
            this.parents = getArray( prop.parents ) || null;
            this.roma = getArray( prop.roma );

            this.roma.forEach( ( val, ind, arr ) => {
                arr[ ind ] = val.normalize( 'NFD' );
            } );

            // this.linkEty();
        }
    }

    class App {
        constructor() {
            /** @type {Dictionary[]} A list of every language. */
            this.dicts = {};
            /** @type {Word[]} A list of all words, from all languages. */
            this.words = [];
            // this._word = null;

            this.initUI();

            fetch( './data/lexicon.yaml' ).then( res => res.text() ).then( ( data ) => {
                /// Get data from YAML document.
                this.deserialize( data );
            } ).then( () => {
                // this.word = Math.floor( Math.random() * this.words.length );
                this.updateList();
                this.runTest();
            } );
        }

        // set word( x ) {
        //     const typo = typeof x;
        //     if ( typo === 'number' ) {
        //         this._word = this.words[ x ];
        //     } else if ( typo === 'string' ) {
        //         this._word = this.words.find( w => w.roma.includes( x ) );
        //     }
        //     if ( !this._word ) this._word = null;
        // }
        // get word() {
        //     return this._word;
        // }

        /** Various tests and stuff. */
        runTest() {
            // const star_ag = this.dicts[ 'Ancient Glyphics' ].addWord( {
            //     roma: 'hidho',
            //     def: [ 'star', 'soul' ]
            // } );
            // const star_ac = this.dicts[ 'Arboreal Common' ].addWord( {
            //     roma: 'dhihor',
            //     def: [ 'star', 'soul' ],
            //     ety: star_ag
            // } );
            // const star_py = this.dicts[ 'Proto-Yarla' ].addWord( {
            //     roma: 'dihyor',
            //     def: [ 'star', 'soul' ],
            //     ety: star_ac
            // } );
            // const star_oy = this.dicts[ 'Old Yarla' ].addWord( {
            //     roma: 'tor',
            //     def: [ 'star', 'soul' ],
            //     ety: star_py
            // } );
            // const star_my = this.dicts[ 'Modern Yarla' ].addWord( {
            //     roma: 'tsor',
            //     def: [ 'star', 'soul' ],
            //     ety: star_oy
            // } );
            // const star_cl = this.dicts[ 'Classic Ludi' ].addWord( {
            //     roma: 'tihor',
            //     def: [ 'star', 'soul' ],
            //     ety: star_ac
            // } );
            // const star_rt = this.dicts[ 'Ruti' ].addWord( {
            //     roma: 'dhor',
            //     def: [ 'star', 'soul' ],
            //     ety: star_cl
            // } );

            console.log( 'Data:', this.dicts );
            const dump = this.serialize();
            // console.log( dump );
            const interp = this.deserialize( dump );
            console.log( 'Read:', interp );
            // interp[ 'Ancient Glyphics' ].addWord( { roma: 'test' } );
            // console.log( this.dicts[ 'Ancient Glyphics' ] );
            // console.log( this.word );
        }

        /** Converts this object's dictionaries into a YAML document.
         * @return {string} The YAML document.
         */
        serialize() {
            return YAML.dump( this.dicts );
        }
        /** Sets this object's dictionaries from a YAML document.
         * @param {string} yaml - The YAML document.
         * @return {Object} The object interpretted from the YAML document.
         */
        deserialize( yaml ) {
            this.dicts = {};
            this.words = [];
            const data = YAML.load( yaml );
            for ( const key in data ) {
                if ( !data.hasOwnProperty( key ) ) return;
                const dict = data[ key ];
                Object.setPrototypeOf( dict, Dictionary.prototype );
                this.dicts[ dict.name[ 0 ] ] = dict;
                if ( dict.lexicon ) {
                    dict.lexicon.forEach( ( word ) => {
                        Object.setPrototypeOf( word, Word.prototype );
                        word.set( word );
                        this.words.push( word );
                    } );
                }
            }
            return data;
        }

        /** Creates a new dictionary.
         * @param {DictionaryParameters} prop - Properties.
         */
        createDictionary( prop ) {
            const dict = new Dictionary( prop );
            this.dicts[ dict.name[ 0 ] ] = dict;
            return dict;
        }

        /** Handles the table and editting capabilites. */
        initUI() {
            /** @type {boolean} Whether to show dead languages. */
            var show_all = false;
            /** @type {Array.<{recid: number}>} A list of hidden rows. */
            var hidden_rows = [];
            /** @type {?Word} The word currently shown in the details sidebar. */
            var editting;
            /** @type {boolean} For unknown reasons, the first save on a pre-existing word fails. */
            var fixed_first_save = false;
            /** Adds or removes dead language rows. */
            const filterDeadLangs = () => {
                if ( show_all ) {
                    grid_lexicon.add( hidden_rows );
                    // grid_lexicon.sort( 'roma', 'asc', true );
                    // grid_lexicon.sort( 'lang', 'asc', false );
                    hidden_rows = [];
                } else {
                    const hides = [];
                    const searches = [];
                    hidden_rows = [];
                    for ( const key in this.dicts ) {
                        if ( !this.dicts.hasOwnProperty( key ) ) continue;
                        const dict = this.dicts[ key ];
                        if ( !dict.dead ) continue;
                        searches.push( grid_lexicon.find( { 'lang': dict.name[ 0 ] } ) );
                    }
                    searches.forEach( ( arr ) => {
                        /// I can't Array.map this. :c
                        hides.push( ...arr );
                    } );
                    hides.forEach( ( recid ) => {
                        const row = grid_lexicon.get( recid );
                        hidden_rows.push( row );
                    } );
                    grid_lexicon.remove( ...hides );
                }
                grid_lexicon.refresh();
            };

            const grid_lexicon = new W2UI.w2grid( {
                name: 'table-lexicon',
                header: 'Lexicon',
                show: {
                    // header: true,
                    // footer: true,
                    toolbar: true,
                    toolbarReload: false,
                    // toolbarAdd: true,
                    // toolbarDelete: true,
                    // toolbarSave: true
                },
                columns: [
                    { field: 'lang', text: 'Language', size: '30%', sortable: true },
                    { field: 'roma', text: 'Romanized', size: '30%', sortable: true },
                    // { field: 'ety', text: 'Etymology', size: '30%', sortable: true },
                    { field: 'def', text: 'Definition', size: '40%', sortable: true }
                ],
                liveSearch: true,
                searches: [
                    { field: 'roma', label: 'Romanized', type: 'text', operator: 'contains' },
                    { field: 'def', label: 'Definition', type: 'text', operator: 'contains' },
                ],
                toolbar: {
                    items: [
                        { type: 'break' },
                        { type: 'button', id: 'add', icon: 'w2ui-icon-plus' },
                        { type: 'button', id: 'delete', icon: 'w2ui-icon-cross' },
                        { type: 'button', id: 'save', icon: 'w2ui-icon-check', disabled: true },
                        { type: 'break' },
                        { type: 'check', id: 'show_all', text: 'Show All', checked: show_all },
                    ],
                    onClick: ( target, data ) => {
                        switch ( target ) {
                            case 'add':
                                break;
                            case 'delete':
                                grid_lexicon.delete();
                                break;
                            case 'save':
                                break;
                            case 'show_all':
                                show_all = !show_all;
                                filterDeadLangs();
                                break;
                        }
                    }
                },
                /** Select the clicked row. */
                onClick: ( event ) => {
                    // grid_details.clear();
                    if ( !event.detail ) return;
                    const recid = event.detail.recid;
                    if ( typeof ( recid ) === 'undefined' ) {
                        updateDetails();
                        return;
                    }
                    const rec = grid_lexicon.get( recid );
                    if ( !rec ) {
                        grid_lexicon.selectNone();
                        updateDetails();
                        return;
                    }
                    const word = rec.data;
                    updateDetails( word );
                }
            } );
            const form_details = new W2UI.w2form( {
                name: 'form-details',
                header: 'Details',
                show: {
                    header: true
                },
                record: {
                    roma: '',
                    lang: '',
                    phon: '',
                    ety: '',
                    links: [],
                    def: ''
                },
                fields: [
                    { field: 'roma', type: 'text', html: { label: 'Word' } },
                    { field: 'lang', type: 'list', html: { label: 'Language' }, options: { items: [] } },
                    { field: 'phon', type: 'text', html: { label: 'Phonetic', text: ' @phon-auto' } },
                    // { field: 'phon-auto', type: 'button', html: { label: 'Auto' } },
                    { field: 'ety', type: 'enum', html: { label: 'Etymology' }, options: { openOnFocus: true, match: 'contains', showAll: true, items: [] } },
                    { field: 'links', type: 'enum', html: { label: 'Descendants' }, options: { openOnFocus: true, match: 'contains', showAll: true, items: [] } },
                    { field: 'def', type: 'textarea', html: { label: 'Definition' } },
                ],
                actions: {
                    'Reset': () => {
                        updateDetails( editting );
                    },
                    'Save': () => {
                        /** @type {Object}  */
                        const record = form_details.record;
                        // console.log( record );
                        /** @type {string} Input roma. */
                        const roma = ( record.roma || '' ).normalize( 'NFD' ).trim();
                        // if ( !roma ) {
                        //     W2UI.w2popup.open( {
                        //         title: 'Error: Missing Data',
                        //         text: 'The word must have a spelling.',
                        //         actions: {
                        //             'OK': () => {
                        //                 W2UI.w2popup.close();
                        //             }
                        //         }
                        //     } );
                        //     return;
                        // }
                        if ( !record.lang || !this.dicts.hasOwnProperty( record.lang.id ) ) {
                            /// The language is required.
                            W2UI.w2popup.open( {
                                title: 'Error: Missing Data',
                                text: 'The language is invalid.',
                                actions: {
                                    'OK': () => {
                                        W2UI.w2popup.close();
                                    }
                                }
                            } );
                            return;
                        }
                        /** @type {WordParameters} The data to pass to the Word object. */
                        const prop = {
                            roma: roma.split( '; ' ),
                            def: ( record.def || '' ).split( '; ' )
                        };
                        if ( editting ) {
                            /// For some reason, row.data doesn't link properly until after saving, then selecting another row.
                            /// Setting the word from the row itself rather than the editting word remedies the second part, but not the first.
                            // editting.set( prop );
                            // grid_lexicon.select( editting.grid_id );
                            grid_lexicon.get( editting.grid_id ).data.set( prop );
                        } else {
                            /// Add a new word.
                            const word = this.dicts[ record.lang.id ].addWord( prop );
                            editting = word;
                            this.words.push( word );
                        }
                        /// Update the entire chart.
                        this.updateList();
                        /// Select the appropriate row.
                        grid_lexicon.selectNone();
                        grid_lexicon.select( editting.grid_id );
                        /// Bug fix.
                        if ( !fixed_first_save ) {
                            fixed_first_save = true;
                            form_details.actions[ 'Save' ]();
                        }
                    },
                    'Save New': () => {
                        editting = null;
                        form_details.actions[ 'Save' ]();
                    }
                }
            } );

            form_details.clear();

            /** Updates the detail panel.
             * @param {Word} [word] - The word to select, if any.
             */
            const updateDetails = ( word ) => {
                if ( editting ) form_details.clear();
                editting = word;
                if ( !word ) return;
                form_details.setValue( 'roma', word.roma.join( '; ' ) );
                form_details.get( 'lang' ).w2field.set( { id: word.language.name[ 0 ], text: word.language.name[ 0 ] } );
                form_details.setValue( 'phon', '' );
                // form_details.setValue( 'ety', '' );
                // form_details.setValue( 'links', '' );
                form_details.setValue( 'def', word.def.join( '; ' ) );
                form_details.refresh();
            };

            /// Initialize the overall layout.
            /** @type {W2UI.w2layout} The main panel. */
            const layout = new W2UI.w2layout( {
                name: 'layout',
                panels: [
                    { type: 'left', size: 200, resizable: false, minSize: 120 },
                    { type: 'main', minSize: 550, overflow: 'hidden' }
                ]
            } );
            /** @type {W2UI.w2sidebar} The sidebar, which allows changing tabs. */
            const sidebar = new W2UI.w2sidebar( {
                name: 'sidebar',
                nodes: [
                    { id: 'tab-1', text: 'Lexicon', selected: true },
                    { id: 'tab-2', text: '???' }
                ],
                onClick( event ) {
                    /// Change the tab.
                    sidebar.nodes.forEach( ( obj, ind ) => {
                        if ( event.target === obj.id ) {
                            layout.html( 'main', tabs[ ind ] );
                            return;
                        }
                    } );
                }
            } );
            /** @type {W2UI.w2layout[]} The separate tabs. */
            const tabs = [
                new W2UI.w2layout( {
                    name: 'tab-1',
                    panels: [
                        { type: 'main', size: 'auto' },
                        { type: 'right', size: '40%' }
                    ]
                } ),
                new W2UI.w2layout( {
                    name: 'tab-2',
                    panels: [
                        { type: 'main', size: 'auto' },
                        { type: 'right', size: '50%' }
                    ]
                } )
            ];
            /// Add the lexicon tables to the first tab.
            tabs[ 0 ].html( 'main', grid_lexicon );
            tabs[ 0 ].html( 'right', form_details );

            /// Add the layouts to the DOM.
            layout.html( 'left', sidebar );
            layout.html( 'main', tabs[ 0 ] );
            layout.render( '#main' );

            this.updateList = function () {
                const list_words = this.words.map( ( word, ind ) => {
                    word.grid_id = ind;
                    return {
                        recid: word.grid_id,
                        roma: word.roma.join( '; ' ),
                        // ety: word.parents ? word.parents[ 0 ] : '',
                        def: word.def.join( '; ' ),
                        /** @type {string} */
                        lang: word.language.name[ 0 ],
                        data: word
                    };
                } );
                grid_lexicon.records = list_words;
                // this.words = list_words.map( word => word.data );
                filterDeadLangs();
                // grid_lexicon.refresh();
                grid_lexicon.sort( 'roma', 'asc', true );
                grid_lexicon.sort( 'lang', 'asc', false );

                const dd_langs = form_details.get( 'lang' ).w2field;
                const dd_links = form_details.get( 'links' ).w2field;
                dd_langs.options.items = [];
                dd_links.options.items = [];
                for ( const name in this.dicts ) {
                    if ( !this.dicts.hasOwnProperty( name ) ) continue;
                    dd_langs.options.items.push( name );
                }
            };
        }

        /** Updates the list of words displayed in the grid. */
        updateList() {
            console.warn( 'List could not be updated; it has not yet been initialized.' );
        }
    }

    $( function () {
        const APP = new App();
    } );
} )();
