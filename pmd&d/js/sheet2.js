/*jshint esversion: 7*/

( function () {
    /** Returns a random key of an object.
     * @param {object} obj The object.
     * @returns {any} A random key from the object.
     */
    const randomKey = function ( obj ) {
        const keys = Object.keys( obj );
        const rand = Math.random() * keys.length;
        return keys[ Math.floor( rand ) ];
    };
    /** Capitalizes the first letter of each word in a string.
     * @param {string} str The string.
     * @returns {string} The string in title case.
     */
    const titleCase = function ( str ) {
        const arr = str.split( ' ' );
        arr.forEach( ( val, ind ) => {
            arr[ ind ] = val[ 0 ].toUpperCase() + val.slice( 1 );
        } );
        return arr.join( ' ' );
    };
    /** Adds a number's sign.
     * @param {number} x The number.
     * @returns {string} The number with its sign.
     */
    const formatNumber = function ( x ) {
        if ( x < 0 ) {
            return '\u2212' + Math.abs( x );
        } else {
            return '+' + x;
        }
    };
    /** Formats stat strings.
     * @param {string} stat The stat.
     * @returns {string} The formatted string.
     */
    const formatStatAbbr = function ( stat ) {
        switch ( stat ) {
            case 'spa': return 'SpA';
            case 'spd': return 'SpD';
            default: return stat.toUpperCase();
        }
    };
    /** Gets the stat associated with a skill.
     * @param {string} skill The skill.
     * @returns {string} The stat.
     */
    const getStatForSkill = function ( skill ) {
        switch ( skill ) {
            case 'strength': return 'att';
            case 'endurance': return 'att';
            case 'guard': return 'def';
            case 'resistance': return 'def';
            case 'persuasion': return 'spa';
            case 'talent': return 'spa';
            case 'intuition': return 'spd';
            case 'willpower': return 'spd';
            case 'acrobatics': return 'spe';
            case 'stealth': return 'spe';
            case 'perception': return 'acc';
        }
        return '';
    };

    /** Loads an XML document.
     * @param {string} path The path or URL to the XML document.
     * @returns {XMLDocument} The XML document.
     */
    const loadXML = function ( path ) {
        if ( typeof ( window.DOMParser ) !== 'undefined' ) {
            const req = new XMLHttpRequest();
            req.open( 'GET', path, false );
            if ( req.overrideMimeType ) {
                req.overrideMimeType( 'text/xml' );
            }
            req.send();
            return req.responseXML;
        } else {
            const xml = new ActiveXObject( 'Microsoft.XMLDOM' );
            xml.async = 'false';
            xml.load( path );
            return xml;
        }
    };
    /** Returns the value of a tag.
     * @param {XMLDocument} xml The XML document to search.
     * @param {string} tag The tag to search.
     * @returns {string|undefined} The value of the first tag found.
     */
    const getXMLValue = function ( xml, tag ) {
        const elem = xml.getElementsByTagName( tag )[ 0 ];
        if ( !elem ) return undefined;
        if ( !isNaN( elem.innerHTML ) ) return +elem.innerHTML;
        return elem.innerHTML;
    };
    /** Returns an array of every value of a tag.
     * @param {XMLDocument} xml The XML document to search.
     * @param {string} tag The tag to search.
     * @returns {string[]} The value of each tag found.
     */
    const getXMLValueArray = function ( xml, tag ) {
        const out = [];
        const tags = xml.getElementsByTagName( tag );
        if ( tags ) {
            for ( let i = 0, l = tags.length; i < l; ++i ) {
                var val = tags[ i ].innerHTML;
                if ( !isNaN( val ) ) val = +val;
                out.push( val );
            }
        }
        return out;
    };

    /** @type {XMLDocument} Ability data. */
    const XML_ABILITIES = loadXML( 'data/abilities.xml' );
    console.log( 'abilities', XML_ABILITIES );
    /** @type {XMLDocument} Status condition data. */
    const XML_CONDITIONS = loadXML( 'data/conditions.xml' );
    console.log( 'conditions', XML_CONDITIONS );
    /** @type {XMLDocument} Item data. */
    const XML_ITEMS = loadXML( 'data/items.xml' );
    console.log( 'items', XML_ITEMS );
    /** @type {XMLDocument} Move data. */
    const XML_MOVES = loadXML( 'data/moves.xml' );
    console.log( 'moves', XML_MOVES );
    /** @type {XMLDocument} Species data. */
    const XML_SPECIES = loadXML( 'data/species.xml' );
    console.log( 'species', XML_SPECIES );

    /** @type {object} Experience needed for each level in each experience rate category. */
    const EXP_RATES = {
        'erratic': [ 0, 10, 20, 40, 60, 150, 200, 300, 450, 600, 750, 950, 1200, 1600, 2100, 2700, 3400, 4200, 5100, 6000 ],
        'fast': [ 0, 10, 20, 30, 50, 70, 100, 200, 250, 350, 500, 700, 950, 1300, 1900, 2600, 3500, 4700, 6200, 8000 ],
        'fluctuating': [ 0, 10, 20, 30, 50, 70, 100, 150, 300, 450, 600, 850, 1200, 1800, 2700, 4000, 5600, 8000, 11000, 15000 ],
        'medfast': [ 0, 10, 20, 40, 60, 80, 150, 200, 350, 450, 650, 850, 1200, 1700, 2400, 3300, 4400, 5900, 7800, 10000 ],
        'medslow': [ 0, 10, 20, 30, 50, 70, 100, 150, 250, 400, 550, 750, 1000, 1500, 2200, 3100, 4200, 5800, 7700, 10000 ],
        'slow': [ 0, 10, 20, 40, 60, 100, 150, 250, 400, 600, 800, 1100, 1500, 2100, 3000, 4100, 5500, 7400, 9700, 12500 ]
    };
    /**
     * @typedef {object} Nature
     * @param {string} name - The displayed name of the nature.
     */
    /** @type {object} Natures and their associated stats. */
    const NATURES = {
        'hardy': {
            name: 'Hardy'
        },
        'lonely': {
            name: 'Lonely',
            att: 1,
            def: -1
        },
        'brave': {
            name: 'Brave',
            att: 1,
            spe: -1
        },
        'adamant': {
            name: 'Adamant',
            att: 1,
            spa: -1
        },
        'naughty': {
            name: 'Naughty',
            att: 1,
            spd: -1
        },
        'bold': {
            name: 'Bold',
            def: 1,
            att: -1
        },
        'docile': {
            name: 'Docile'
        },
        'relaxed': {
            name: 'Relaxed',
            def: 1,
            spe: -1
        },
        'impish': {
            name: 'Impish',
            def: 1,
            spa: -1
        },
        'lax': {
            name: 'Lax',
            def: 1,
            spd: -1
        },
        'timid': {
            name: 'Timid',
            spe: 1,
            att: -1
        },
        'hasty': {
            name: 'Hasty',
            spe: 1,
            def: -1
        },
        'serious': {
            name: 'Serious'
        },
        'jolly': {
            name: 'Jolly',
            spe: 1,
            spa: -1
        },
        'naive': {
            name: 'Naive',
            spe: 1,
            spd: -1
        },
        'modest': {
            name: 'Modest',
            spa: 1,
            att: -1
        },
        'mild': {
            name: 'Mild',
            spa: 1,
            def: -1
        },
        'quiet': {
            name: 'Quiet',
            spa: 1,
            spe: -1
        },
        'bashful': {
            name: 'Bashful'
        },
        'rash': {
            name: 'Rash',
            spa: 1,
            spd: -1
        },
        'calm': {
            name: 'Calm',
            spd: 1,
            att: -1
        },
        'gentle': {
            name: 'Gentle',
            spd: 1,
            def: -1
        },
        'sassy': {
            name: 'Sassy',
            spd: 1,
            spe: -1
        },
        'careful': {
            name: 'Careful',
            spd: 1,
            spa: -1
        },
        'quirky': {
            name: 'Quirky'
        }
    };
    /**
     * @typedef {object} Role
     * @param {string} name - The displayed name of the role.
     * @param {object} stats - The stats this role modifies.
     */
    /** @type {object} Roles and their properties */
    const ROLES = {
        'barker': {
            name: 'Barker',
            stats: {
                hlt: 0,
                att: 0,
                def: 0,
                spa: 2,
                spd: 0,
                spe: 0,
                acc: 0
            }
        },
        'civilian': {
            name: 'Civilian',
            stats: { hlt: 0, att: 0, def: 0, spa: 0, spd: 0, spe: 0, acc: 0 }
        }
    };

    /** A sum of various modifiers.
     * @class
     */
    class Value {
        constructor() {
            /** @type {object} Internal. Contains objects with a "value" key. */
            this._prop = {};
            // this._mods = [];
            // this._ind = 0;
        }

        // addMod( value ) {
        //     const i = this._ind;
        //     this._ind++;
        //     this._mods[ i ] = {
        //         value: value
        //     };
        //     return i;
        // }

        // delMod( ind ) {
        //     this._mods[ ind ] = 0;
        // }

        // getMod( ind ) {
        //     return this._mods[ ind ];
        // }

        /** Removes a property from this value.
         * @param {string} name The property to clear.
         */
        delProperty( name ) {
            this._prop[ name ] = null;
        }

        /** Gets or calculates a property's value.
         * @returns {number} The value of this property.
         */
        getProperty( name ) {
            return this._prop[ name ].value;
        }

        /** Adds or sets a property.
         * @param {string} name The unique name for this property.
         * @param {number} val The value of this property.
         */
        setProperty( name, val ) {
            this._prop[ name ] = {
                value: val
            };
        }

        /** Adds or sets a function to act as a property.
         * @param {string} name The unique name for this property.
         * @param {function} func A function that will return the value of this property.
         */
        setVariableProperty( name, func ) {
            const obj = {};
            Object.defineProperty( obj, 'value', {
                'get': func
            } );
            this._prop[ name ] = obj;
        }

        /** @type {number} The value; the sum of this value's properties. */
        get value() {
            var total = 0;
            // total += this._mods.reduce( ( a, b ) => a + b, 0 );
            for ( let key in this._prop ) {
                if ( !this._prop[ key ] || !this._prop[ key ].value ) continue;
                total += this._prop[ key ].value;
            }
            return total;
        }
    }

    /** The character.
     * @class
     */
    class Character {
        /**
         * @param {object} prop - Properties.
         * @param {string} prop.species - Species ID, usually just the species name in camel_case.
         * @param {string[]} [prop.proficiencies] - A list of what skills the character is proficient in.
         * @param {number} [prop.height_m]
         * @param {number} [prop.hp]
         * @param {number} [prop.length_m]
         * @param {string} [prop.name] - The character's name.
         * @param {string} [prop.nature] - The character's nature.
         * @param {string} [prop.role]
         * @param {number} [prop.sp]
         * @param {number} [prop.weight_kg]
         * @param {number} [prop.xp]
        */
        constructor( prop = {} ) {
            /** @type {object} Internal static values. */
            this._ = {};
            /// Set the species.
            this.setSpecies( prop.species );

            /** @type {Move[]} The character's learned moves. */
            this.moves = [];

            /** @type {string} The character's name. */
            this.name = prop.name || this.species.name;
            /** @type {number} The character's height, in meters. */
            this.height_m = prop.height_m || this.species.height_m;
            /** @type {number} The character's length, in meters. */
            this.length_m = prop.length_m || this.species.length_m;
            /** @type {Role} The character's role. */
            this.role = ROLES[ prop.role || 'civilian' ];
            /** @type {number} The character's weight, in kilograms. */
            this.weight_kg = prop.weight_kg || this.species.weight_kg;
            /** @type {number} The amount of experience this character has. */
            this.xp = prop.xp || 0;

            this.onUpdateMoves = prop.onUpdateMoves || function () { };

            /** @type {boolean} Whether the character is tall or long; affects size. */
            this.is_long = this.length_m > this.height_m;

            /** @type {Nature} The character's nature. */
            this.nature = prop.nature || randomKey( NATURES );

            /** @type {object} The character's stat values. */
            this.stats = {};
            [ 'hlt', 'att', 'def', 'spa', 'spd', 'spe', 'acc' ].forEach( ( stat ) => {
                const obj = new Value();
                obj.setVariableProperty( 'species', () => {
                    return this.species.stats[ stat ];
                } );
                obj.setProperty( 'ev', prop.ev && prop.ev[ stat ] || 0 );
                obj.setProperty( 'iv', prop.iv && prop.iv[ stat ] || ( stat === 'acc' ? 0 : Math.ceil( Math.random() * 6 ) ) );
                obj.setVariableProperty( 'nature', () => {
                    return this.nature[ stat ];
                } );
                obj.setVariableProperty( 'role', () => {
                    return this.role.stats[ stat ];
                } );

                Object.defineProperty( obj, 'modifier', {
                    'get': function () {
                        return Math.floor( obj.value / 2 ) - 5;
                    }
                } );
                this.stats[ stat ] = obj;
            } );

            /** @type {object} The character's skill values. */
            this.skills = {};
            if ( !prop.proficiencies ) prop.proficiencies = [];
            const skill_names = [ 'strength', 'endurance', 'guard', 'resistance', 'persuasion', 'talent', 'intuition', 'willpower', 'acrobatics', 'stealth', 'perception' ];
            skill_names.forEach( ( skill ) => {
                const stat = getStatForSkill( skill );
                const obj = new Value();
                obj.setVariableProperty( 'stat', () => {
                    return this.stats[ stat ].modifier;
                } );
                obj.setProperty( 'points', 0 );
                obj.setVariableProperty( 'proficiency', () => {
                    return obj.proficient ? this.prof : 0;
                } );
                obj.proficient = prop.proficiencies.includes( skill );
                this.skills[ skill ] = obj;
            } );

            /** @type {number} Temp HP. */
            this.hp_temp = 0;
            /** @type {number} Current HP. */
            this.hp = ( typeof ( prop.hp ) !== 'undefined' ) ? prop.hp : this.hp_max;
            /** @type {number} Current SP. */
            this.sp = ( typeof ( prop.sp ) !== 'undefined' ) ? prop.sp : this.sp_max;

            this.learnMove( 'default', true );
            if ( prop.moves ) {
                prop.moves.forEach( ( name ) => {
                    this.learnMove( name );
                } );
            }
        }

        /** @type {Nature} The character's nature. */
        get nature() { return this._.nature; }
        set nature( str ) { this._.nature = NATURES[ str ]; }

        /** A species of Pokémon.
         * @typedef {object} Species
         * @prop {number[]} exp_rate - The species's experience rate category.
         * @prop {string} name - The displayed name of the species.
         * @prop {object} stats - The species's base stats.
         * @prop {string[]} types - The type or types associated with the species.
         * @prop {number} weight_kg - The species's weight, in kilograms.
         * @prop {number} [height_m] - The species's height, in meters.
         * @prop {number} [length_m] - The species's length, in meters.
         */
        /** @type {Species} The character's species. */
        get species() { return this._.species; }
        /** Changes the character's species.
         * @param {string} species - The ID of the new species.
         */
        setSpecies( species ) {
            this.xml_species = XML_SPECIES.getElementsByTagName( species )[ 0 ];
            const xml_stats = this.xml_species.getElementsByTagName( 'stats' )[ 0 ];
            /** @type {Species} */
            this._.species = {
                stats: { acc: 10 },
                types: getXMLValueArray( this.xml_species, 'type' )
            };
            [ 'hlt', 'att', 'def', 'spa', 'spd', 'spe' ].forEach( ( stat ) => {
                var val = getXMLValue( xml_stats, stat );
                /// Translates range from 0-255 to 0-14, averaging around 7.
                /// I have no idea why 50 works.
                val = Math.floor( ( 1 - Math.pow( Math.exp( -val / 50 ), 0.5 ) ) * 16 );
                this._.species.stats[ stat ] = val;
            } );
            [ 'exp_rate', 'height_m', 'length_m', 'name', 'weight_kg' ].forEach( ( tag ) => {
                this._.species[ tag ] = getXMLValue( this.xml_species, tag );
            } );

            this._.species.exp_rate = EXP_RATES[ this._.species.exp_rate ];
        }

        /**
         * @type {number} The character's maximum hit points value.
         * @readonly
         */
        get hp_max() {
            return Math.max( this.level * this.recovery, 1 );
        }
        /**
         * @type {number} The character's level.
         * @readonly
         */
        get level() {
            for ( let lvl = 1; lvl < 20; ++lvl ) {
                if ( this.xp < this.species.exp_rate[ lvl ] ) return lvl;
            }
            return 20;
        }
        /**
         * @type {number} The character's proficiency bonus.
         * @readonly
         */
        get prof() {
            return Math.ceil( this.level / 4 ) + 1;
        }
        /**
         * @type {number} The character's recovery score.
         * @readonly
         */
        get recovery() {
            return Math.ceil( ( this.stats.hlt.value + 1 ) / 4 ) * 2;
        }
        /**
         * @type {string} The character's size category.
         * @readonly
         */
        get size() {
            if ( this.is_long ) {
                // ???
            } else {
                if ( this.height_m > 4.8 ) return 'huge';
                if ( this.height_m > 2.4 ) return 'large';
                if ( this.height_m > 0.6 ) return 'medium';
                if ( this.height_m > 0.3 ) return 'small';
                return 'tiny';
            }
            return 'tiny'
        }
        /**
         * @type {number} The character's maximum stamina points value.
         * @readonly
         */
        get sp_max() {
            return this.level * 10;
        }
        /**
         * @type {string[]} The character's types.
         * @readonly
         */
        get types() {
            return this.species.types;
        }
        /**
         * @type {number} The character's weight, in game units.
         * @readonly
         */
        get weight() {
            return Math.ceil( this.weight_kg * 10 / 1.6 ) / 10;
        }

        /** Adds a move to this character's move pool.
         * @param {string} name - The name ID of the move.
         * @param {boolean} force - Whether to ignore move pools.
         */
        learnMove( name, force ) {
            const xml_move = XML_MOVES.getElementsByTagName( name )[ 0 ];
            if ( !xml_move ) {
                console.error( `"${ name }" is not a valid move ID.` );
                return;
            }
            const new_move = {
                contact: getXMLValue( xml_move, 'contact' ),
                id: name,
                name: getXMLValue( xml_move, 'name' ),
                category: getXMLValue( xml_move, 'category' ),
                effect: getXMLValue( xml_move, 'effect' ),
                pools: getXMLValueArray( xml_move, 'pool' ),
                power: getXMLValue( xml_move, 'power' ),
                prepared: this.moves.length <= 4,
                range: getXMLValue( xml_move, 'range' ),
                sp: getXMLValue( xml_move, 'sp' ),
                to_hit: getXMLValue( xml_move, 'to_hit' ),
                save: getXMLValue( xml_move, 'save' ),
                type: getXMLValue( xml_move, 'type' )
            };

            this.moves.push( new_move );

            this.sortMoves();
            this.onUpdateMoves();
        }

        selectMove( name ) {
            var selected;
            this.moves.forEach( ( move ) => {
                move.selected = move.id === name;
                if ( move.selected ) selected = move;
            } );
            return selected;
        }

        /** Sorts the character's learned moves. */
        sortMoves() {
            /// Sort with prepared moves on the top, Normal Attack beneath the other prepared moves.
            const prepared = [];
            const basic = [];
            const unprepared = [];
            this.moves.forEach( ( move ) => {
                if ( move.id === 'default' ) {
                    basic.push( move );
                } else if ( move.prepared ) {
                    prepared.push( move );
                } else {
                    unprepared.push( move );
                }
            } );
            this.moves = [ ...prepared, basic[ 0 ], ...unprepared ];
        }
    }

    /** Main functions.
     * @class
     */
    class App {
        constructor() {
            $( window ).on( 'resize', this.onResize );
            this.onResize();

            this.$table_moves = $( '.table-moves' );

            const app = this;
            this.character = new Character( {
                name: 'Stellarity',
                species: 'poochyena',
                xp: 25,
                role: 'barker',
                nature: 'rash',
                iv: {
                    hlt: 3,
                    att: 1,
                    def: 3,
                    spa: 6,
                    spd: 6,
                    spe: 6
                },
                ev: {
                    spa: 3,
                    spd: 1,
                    spe: 1
                },
                moves: [ 'bite', 'mirror_shot', 'thunder_fang', 'odor_sleuth', 'tackle', 'howl' ],
                proficiencies: [ 'guard', 'intuition', 'stealth', 'perception' ],

                onUpdateMoves: function () {
                    var selected = this.moves.reduce( ( a, b ) => {
                        return b.selected ? b : a;
                    } );
                    if ( !selected ) {
                        selected = this.moves.reduce( ( a, b ) => {
                            return b.id === 'default' ? b : a;
                        }, this.moves[ 0 ] );
                        this.selectMove( selected.id );
                    }
                    app.$table_moves.find( '.table-scroll' ).empty();
                    this.moves.forEach( ( move ) => {
                        const $row = $( '<div>' );
                        const $name = $( '<div>' );
                        const $damage = $( '<div>' );
                        const prof = this.prof;
                        var power = 0;
                        const title_power = [];
                        $row.addClass( 'row' );
                        if ( !move.prepared ) $row.addClass( 'unprepared' );
                        if ( move.id === selected.id ) $row.addClass( 'selected' );
                        $row.attr( 'id', `move-${ move.id }` );
                        [ 'a', 'c', 'e' ].forEach( ( letter ) => {
                            $row.css( `--color-${ letter }`, `var(--color-type-${ move.type }-${ letter })` );
                        } );
                        app.$table_moves.find( '.table-scroll' ).append( $row );
                        $name.addClass( 'value-move-name' );
                        $name.html( move.name );
                        $name.appendTo( $row );
                        $damage.addClass( 'value-move-damage' );
                        if ( move.category === 'status' ) {
                            $damage.html( 'Status' );
                        } else {
                            power += move.power;
                            title_power.push( `${ move.power } (base)` );
                            if ( move.category === 'physical' ) {
                                power += this.stats.att.modifier;
                                title_power.push( `${ this.stats.att.modifier } (ATT)` );
                            } else {
                                power += this.stats.spa.modifier;
                                title_power.push( `${ this.stats.spa.modifier } (SpA)` );
                            }
                            if ( this.types.includes( move.type ) ) {
                                power += prof;
                                title_power.push( `${ prof } (STAB)` );
                            }
                            if ( move.power ) power = Math.max( power, 1 );
                            $damage.html( `${ power } ${ titleCase( move.category ) } ${ titleCase( move.type ) }` );
                            $row.attr( 'title', title_power.join( ' + ' ).replace( /(\+ )?-/g, '\u2212 ' ).replace( /^\u2212 /g, '\u2212' ) );
                        }
                        $damage.appendTo( $row );
                    } );
                    app.updateMoveInfobox( this, selected );
                }
            } );

            console.log( this.character );

            this.handleTables();

            this.populate();
        }

        handleTables() {
            const dist = ( x1, y1, x2, y2 ) => {
                return Math.sqrt( ( x2 - x1 ) ** 2 + ( y2 - y1 ) ** 2 );
            };
            const $body = $( 'body' );
            const $ghost = $( '.table .table-ghost' );
            var $active, mdx, mdy;
            $body.on( 'mousedown', ( event ) => {
                if ( event.button === 0 ) {
                    if ( event.target.matches( '.table .row' ) ) {
                        mdx = event.clientX;
                        mdy = event.clientY;
                        $active = $( event.target );
                    }
                }
            } );
            $body.on( 'mouseover mousemove', ( event ) => {
                if ( !$active ) return;
                const mox = event.clientX;
                const moy = event.clientY;
                if ( dist( mdx, mdy, mox, moy ) < 4 ) return;
                if ( $active.is( ':empty' ) ) return;
                if ( !$ghost.hasClass( 'active' ) ) {
                    $ghost.empty().html( $active.html() ).attr( 'style', $active.attr( 'style' ) );
                    $ghost.addClass( 'active' );
                }
                $ghost.css( {
                    'top': moy - 10,
                    'left': mox - 10
                } );
            } );
            $body.on( 'mouseup mouseleave', () => {
                if ( !$active ) return;
                if ( $ghost.hasClass( 'active' ) ) {
                    //
                } else if ( !$active.is( ':empty' ) ) {
                    $active.siblings().removeClass( 'selected' );
                    $active.addClass( 'selected' );
                    $active.parents( '.table' ).trigger( 'change' );
                }
                $ghost.removeClass( 'active' );
                $active = mdx = mdy = false;
            } );

            // $( '.table' ).find( '.row:first-child' ).addClass( 'selected' );

            $( '.table-moves' ).on( 'change', () => {
                const move = this.character.selectMove( $active.attr( 'id' ).replace( /move-/g, '' ) );
                this.updateMoveInfobox( this.character, move );
            } );
        }

        /** Function to run on resize. */
        onResize() {
            document.body.style.setProperty( '--scale', $( '.sheet-container' ).width() / 1000 );
        }

        populate() {
            const char = this.character;
            /// Fill in the simple fields.
            $( '.value-name' ).html( char.name );
            $( '.value-level' ).html( char.level );
            $( '.value-nature' ).html( char.nature.name );//.attr( 'title', `+1 total ${ formatStatAbbr( char.nature.inc ) }, -1 total ${ formatStatAbbr( char.nature.dec ) }` );
            $( '.value-prof' ).html( char.prof );
            $( '.value-role' ).html( char.role.name );
            $( '.value-size' ).html( titleCase( char.size ) ).attr( 'title', char.height_m + ' m' );
            $( '.value-species' ).html( char.species.name );
            $( '.value-weight' ).html( char.weight ).attr( 'title', char.weight_kg + ' kg' );

            /// Set the experience bar.
            $( '.exp-container' ).each( ( ind, elem ) => {
                const rate = char.species.exp_rate;
                const a = rate[ char.level - 1 ];
                const b = rate[ char.level ];
                const x = char.xp;
                elem.style.setProperty( '--value-exp-percent', `${ 100 * ( x - a ) / ( b - a ) }%` );
                elem.title = `${ x } XP (${ b - x } XP to Level ${ char.level + 1 })`;
            } );

            /// Add the character's type(s).
            const $name_cont = $( '.name-container' );
            const $type_cont = $( '.types-container' );
            $name_cont.css( '--color-top-c', `var(--color-type-${ char.types[ 0 ] }-c)` );
            $name_cont.css( '--color-bottom-c', `var(--color-type-${ char.types[ 1 ] || char.types[ 0 ] }-c)` );
            char.types.forEach( ( type ) => {
                const $elem = $( '<span>' );
                $elem.addClass( `type type-${ type } border bold` );
                $elem.css( {
                    'background-color': `var(--color-type-${ type }-c)`,
                    'color': `var(--color-type-${ type }-e)`
                } );
                $elem.html( type.toUpperCase() );
                $type_cont.append( $elem );
            } );

            /// Fill in the stats and stat modifiers.
            [ 'hlt', 'att', 'def', 'spa', 'spd', 'spe', 'acc' ].forEach( ( stat ) => {
                const obj = char.stats[ stat ];
                const $elem_mod = $( `.value-${ stat }` );
                const $elem_total = $( `.value-${ stat }-total` );
                if ( $elem_mod.length ) {
                    $elem_mod.html( formatNumber( obj.modifier ) );
                };
                if ( $elem_total.length ) {
                    $elem_total.html( obj.value );
                    const title = [];
                    for ( let key in obj._prop ) {
                        const val = obj.getProperty( key );
                        if ( !val ) continue;
                        switch ( key ) {
                            case 'ev': key = 'EVs'; break;
                            case 'iv': key = 'IVs'; break;
                        }
                        title.push( `${ val } (${ key })` )
                    }
                    $elem_total.attr( 'title', title.join( ' + ' ).replace( /(\+ )?-/g, '\u2212 ' ).replace( /^\u2212 /g, '\u2212' ) );
                };
            } );

            /// Fill in the skills.
            const skill_names = [ 'strength', 'endurance', 'guard', 'resistance', 'persuasion', 'talent', 'intuition', 'willpower', 'acrobatics', 'stealth', 'perception' ];
            skill_names.forEach( ( skill ) => {
                const $elem = $( `.value-skill-${ skill }` );
                const obj = char.skills[ skill ];
                const stat = getStatForSkill( skill );
                $elem.html( formatNumber( obj.value ) );
                const title = [];
                for ( let key in obj._prop ) {
                    var val = obj.getProperty( key );
                    if ( !val && key !== 'stat' ) continue;
                    switch ( key ) {
                        case 'stat':
                            key = formatStatAbbr( stat );
                            val = formatNumber( val );
                            break;
                    }
                    title.push( `${ val } (${ key })` )
                }
                $elem.attr( 'title', title.join( ' + ' ).replace( /(\+ )?-/g, '\u2212 ' ).replace( /^\u2212 /g, '\u2212' ) );
                $( `.bool-prof-${ skill }` ).attr( 'checked', obj.proficient );
            } );
        }

        updateMoveInfobox( char, move ) {
            const prof = char.prof;
            const att = char.stats.att.modifier;
            const spa = char.stats.spa.modifier;
            const is_prof = char.types.includes( move.type );
            const $selected = $( '.table-moves .row.selected' );
            const $infobox = $( '.table-moves .table-info' );
            [ 'a', 'c', 'e' ].forEach( ( letter ) => {
                $infobox.css( `--color-${ letter }`, `var(--color-type-${ move.type }-${ letter })` );
            } );
            [ 'name', 'damage' ].forEach( ( tag ) => {
                const $copy = $selected.find( `.value-move-${ tag }` );
                $infobox.children( `.value-move-${ tag }` ).text( $copy.text() );
            } );
            $infobox.children( '.value-move-damage' ).attr( 'title', $selected.attr( 'title' ) );

            $infobox.find( '.value-move-sp' ).text( `${ move.sp } SP` );
            $infobox.find( '.value-move-range' ).text( move.range );

            if ( typeof ( move.to_hit ) === 'undefined' ) {
                $infobox.find( '.value-move-to_hit' ).html( ' ' );
            } else {
                var to_hit = move.to_hit;
                const title_to_hit = [ `${ move.to_hit } (base)` ];
                if ( move.save ) {
                    if ( is_prof ) {
                        to_hit += prof;
                        title_to_hit.push( `${ prof } (type)` );
                    }
                    to_hit = `Target ${ titleCase( move.save ) } DC ${ Math.max( to_hit, 0 ) }`;
                } else {
                    const acc = char.stats.acc.modifier;
                    if ( acc ) {
                        to_hit += acc;
                        title_to_hit.push( `${ acc } (ACC)` );
                    }
                    to_hit = `${ formatNumber( to_hit ) } To Hit`;
                }
                $infobox.find( '.value-move-to_hit' ).html( `${ to_hit }` ).attr( 'title', title_to_hit.join( ' + ' ).replace( /(\+ )?-/g, '\u2212 ' ).replace( /^\u2212 /g, '\u2212' ) );
            }
            $infobox.find( '.bool-move-makes_contact' ).css( 'display', move.contact ? 'inherit' : 'none' );
            var effect = move.effect || '';
            if ( effect.match( /{.*}/g ) ) {
                const effect_parts = effect.split( /[{}]/g );
                effect_parts.forEach( ( part, ind ) => {
                    const dc = part.replace( /[0-9]+$/g, '' );
                    var val = +part.replace( /^[^0-9]+([0-9]+)/g, '$1' );
                    if ( isNaN( val ) ) return;
                    const span = document.createElement( 'SPAN' );
                    const title = [ `${ val } (base)` ];
                    if ( move.category === 'physical' || ( move.category === 'special' && att > spa ) ) {
                        val += att;
                        title.push( `${ att } (ATT)` );
                    } else {
                        val += spa;
                        title.push( `${ spa } (SpA)` );
                    }
                    if ( is_prof ) {
                        val += prof;
                        title.push( `${ prof } (type)` );
                    }
                    span.classList = 'semibold';
                    span.innerHTML = dc + val;
                    span.title = title.join( ' + ' ).replace( /(\+ )?-/g, '\u2212 ' ).replace( /^\u2212 /g, '\u2212' );
                    effect_parts[ ind ] = span.outerHTML;
                } );
                effect = effect_parts.join( '' );
            }
            $infobox.find( '.value-move-effect' ).html( effect );
        }
    }

    $( function () {
        const APP = new App();
    } );
} )();
