/*jshint esversion: 7*/

export default ( function () {
    /** Returns a random key of an object.
     * @param {Object.<string, any>} obj The object.
     * @returns {any} A random key from the object.
     */
    const randomKey = function ( obj ) {
        const keys = Object.keys( obj );
        const rand = Math.random() * keys.length;
        return keys[ Math.floor( rand ) ];
    };
    /** @type {Object.<string, string>} Keywords and their display spelling. */
    const KEYWORDS = {
        'acc': 'ACC',
        'att': 'ATT',
        'def': 'DEF',
        'ev': 'EVs',
        'evs': 'EVs',
        'hlt': 'HLT',
        'iv': 'IVs',
        'ivs': 'IVs',
        'spa': 'SpA',
        'spd': 'SpD',
        'spe': 'SPE',
    };
    /** Formats a string for display.
     * @param {string} str The string to format.
     * @returns {string} The formatted string.
     */
    const formatKeyword = function ( str ) {
        const format = function ( x ) {
            return isNaN( x ) ? ( KEYWORDS[ x.toLowerCase() ] || x ) : formatNumber( x );
        };
        if ( str.match( /\s/g ) ) {
            const arr = str.split( /\s/g );
            arr.forEach( ( word, ind ) => {
                arr[ ind ] = format( word );
            } );
            return arr.join( ' ' );
        } else {
            return format( str );
        }
    };
    /** Adds a number's sign.
     * @param {number} x The number.
     * @returns {string} The number with its sign.
     */
    const formatNumber = function ( x ) {
        x = +x;
        if ( x < 0 ) {
            return '\u2212' + Math.abs( x );
        } else {
            return '+' + x;
        }
    };
    // /** Formats stat strings.
    //  * @param {string} stat The stat.
    //  * @returns {string} The formatted string.
    //  */
    // const formatStatAbbr = function ( stat ) {
    //     switch ( stat ) {
    //         case 'spa': return 'SpA';
    //         case 'spd': return 'SpD';
    //         default: return stat.toUpperCase();
    //     }
    // };
    /** @type {string[]} A list of the stats. */
    const STAT_NAMES = [ 'hlt', 'att', 'def', 'spa', 'spd', 'spe', 'acc' ];
    /** @type {string[]} A list of the skills. */
    const SKILL_NAMES = [ 'strength', 'endurance', 'guard', 'resistance', 'persuasion', 'talent', 'intuition', 'willpower', 'acrobatics', 'stealth', 'perception' ];
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

    /** @type {Object.<string, number[]>} Experience needed for each level in each experience rate category. */
    const EXP_RATES = {
        'erratic': [ 0, 10, 20, 40, 60, 150, 200, 300, 450, 600, 750, 950, 1200, 1600, 2100, 2700, 3400, 4200, 5100, 6000 ],
        'fast': [ 0, 10, 20, 30, 50, 70, 100, 200, 250, 350, 500, 700, 950, 1300, 1900, 2600, 3500, 4700, 6200, 8000 ],
        'fluctuating': [ 0, 10, 20, 30, 50, 70, 100, 150, 300, 450, 600, 850, 1200, 1800, 2700, 4000, 5600, 8000, 11000, 15000 ],
        'medfast': [ 0, 10, 20, 40, 60, 80, 150, 200, 350, 450, 650, 850, 1200, 1700, 2400, 3300, 4400, 5900, 7800, 10000 ],
        'medslow': [ 0, 10, 20, 30, 50, 70, 100, 150, 250, 400, 550, 750, 1000, 1500, 2200, 3100, 4200, 5800, 7700, 10000 ],
        'slow': [ 0, 10, 20, 40, 60, 100, 150, 250, 400, 600, 800, 1100, 1500, 2100, 3000, 4100, 5500, 7400, 9700, 12500 ]
    };
    /**
     * @typedef {Object} Nature
     * @prop {string} name - The displayed name of the nature.
     * @prop {number} [hlt] - How the nature affects Health.
     * @prop {number} [att] - How the nature affects Attack.
     * @prop {number} [def] - How the nature affects Defense.
     * @prop {number} [spa] - How the nature affects Special Attack.
     * @prop {number} [spd] - How the nature affects Special Defense.
     * @prop {number} [spe] - How the nature affects Speed.
     */
    /** @type {Object.<string, Nature>} Natures and their associated stats. */
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
     * @typedef {Object} Role
     * @prop {string} name - The displayed name of the role.
     * @prop {number} [hlt] - How the role affects Health.
     * @prop {number} [att] - How the role affects Attack.
     * @prop {number} [def] - How the role affects Defense.
     * @prop {number} [spa] - How the role affects Special Attack.
     * @prop {number} [spd] - How the role affects Special Defense.
     * @prop {number} [spe] - How the role affects Speed.
     */
    /** @type {Object.<string, Role>} Roles and their properties */
    const ROLES = {
        'artificer': {
            name: 'Artificer',
            spa: 2
        },
        'civilian': {
            name: 'Civilian'
        }
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


    /** Stores a single value and runs a function when updated.
     * @class
     */
    class DynamicVariable {
        /**
         * @param {any} value - The stored value.
         * @param {Function} onChange - A function to run.
         */
        constructor( value, onChange ) {
            this._value = value;
            /** @type {Value[]} Internal. Values that rely on this value. */
            this.links = [];
            /** @type {Function[]} Internal. Functions that runs when this value changes. */
            this.change_functions = [];
            if ( onChange ) this.onChange( onChange );
        }

        /** Sets a function to run when this value changes.
         * @param {Function} func - The function to run.
         * @param {boolean} [override] - Whether to remove all previously added functions.
         */
        onChange( func, override ) {
            if ( override ) {
                this.change_functions = [ func ];
            } else {
                this.change_functions.push( func );
            }
        }

        /** Links this Value to a parent Value that uses it in its calculation.
         * @param {Value} obj - The object to link.
         * @returns {Value} Itself.
         */
        reliesOn( obj ) {
            obj.links.push( this );
            return this;
        }

        /** Runs when changed. */
        update() {
            this.change_functions.forEach( ( func ) => { func(); } );
            this.links.forEach( ( val ) => {
                val.update();
            } );
        }

        get value() { return this._value; }
        set value( x ) {
            this._value = x;
            this.update();
        }
    }


    /** A sum of various modifiers.
     * @class
     */
    class Value {
        constructor() {
            /** @type {Object} Internal. Contains objects with a "value" key. */
            this._prop = {};
            /** @type {(Value|DynamicVariable)[]} Internal. Values that rely on this value. */
            this.links = [];
            /** @type {Function[]} Internal. Functions that runs when this value changes. */
            this.change_functions = [];
            /** Set a default value. */
            this.setProperty( 'base', 0 );
        }

        /** Sets a function to run when this value changes.
         * @param {Function} func - The function to run.
         * @param {boolean} [override] - Whether to remove all previously added functions.
         */
        onChange( func, override ) {
            if ( override ) {
                this.change_functions = [ func ];
            } else {
                this.change_functions.push( func );
            }
        }

        /** Links this Value to a parent Value that uses it in its calculation.
         * @param {Value|DynamicVariable} obj - The object to link.
         * @returns {Value} Itself.
         */
        reliesOn( obj ) {
            obj.links.push( this );
            return this;
        }

        /** Runs when changed. */
        update() {
            this.change_functions.forEach( ( func ) => { func(); } );
            this.links.forEach( ( val ) => {
                val.update();
            } );
        }

        /** Removes a property from this value.
         * @param {string} name The property to clear.
         * @returns {Value} Itself.
         */
        delProperty( name ) {
            this._prop[ name ] = null;
            return this;
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
         * @returns {Value} Itself.
         */
        setProperty( name, val ) {
            this._prop[ name ] = {
                name: name,
                value: val
            };
            this.update();
            return this;
        }

        /** Adds or sets a function to act as a property.
         * @param {string} name The unique name for this property.
         * @param {function} func A function that will return the value of this property.
         * @param {Value|DynamicVariable|Value[]|DynamicVariable[]} [link] Value(s) that this Value uses in its calculation.
         * @returns {Value} Itself.
         */
        setVariableProperty( name, func, link ) {
            const obj = {};
            Object.defineProperty( obj, 'value', {
                'get': func
            } );
            this._prop[ name ] = obj;
            if ( link ) {
                if ( link instanceof Value || link instanceof DynamicVariable ) {
                    this.reliesOn( link );
                } else if ( link.forEach ) {
                    link.forEach( ( obj ) => { this.reliesOn( obj ) } );
                }
            }
            this.update();
            return this;
        }

        /** Gets the value and its sources.
         * @returns {Object} The value, its sources, and a formatted string.
         */
        getValue() {
            /** @prop {Object} - The value. */
            const out = {
                /** @prop {number} - The value; the sum of this value's properties. */
                value: 0,
                /** @prop {string[]} - A list of properties. */
                sources: [],
                /** @prop {string} - A formatted string describing the sum. */
                text: ''
            };
            for ( let key in this._prop ) {
                if ( !this._prop[ key ] || !this._prop[ key ].value ) continue;
                const val = this._prop[ key ].value
                out.value += val;
                out.sources.push( `${ val } (${ formatKeyword( key ) })` );
            }
            out.text = out.sources.join( ' + ' ).replace( /(\+ )?-/g, '\u2212 ' ).replace( /^\u2212 /g, '\u2212' );
            return out;
        }

        /** @type {number} The value; the sum of this value's properties. */
        get value() {
            var total = 0;
            for ( let key in this._prop ) {
                if ( !this._prop[ key ] || !this._prop[ key ].value ) continue;
                total += this._prop[ key ].value;
            }
            return total;
        }
    }


    /** A stat.
     * @class
     * @extends Value
     */
    class Stat extends Value {
        /**
         * @param {string} name - The stat.
         * @param {Pokemon} pkmn - The pokemon with this stat.
         */
        constructor( stat, pkmn ) {
            super();
            this.name = stat;
            this.setVariableProperty( 'base', () => {
                return pkmn.species.base_stats[ stat ].value || 0;
            }, pkmn.species.base_stats[ stat ] );
            this.setProperty( 'iv', Math.ceil( Math.random() * 6 ) );
            this.setProperty( 'ev', 0 );
            this.setVariableProperty( 'nature', () => {
                return pkmn._.nature.value[ stat ] || 0;
            }, pkmn._.nature );
            this.setVariableProperty( 'role', () => {
                return pkmn._.role.value[ stat ] || 0;
            }, pkmn._.role );
            this.setProperty( 'boost', 0 ); /// Boost value: from stat changes.
        }

        /** @type {number} The stat's modifier. */
        get modifier() { return Math.floor( this.value / 2 ) - 5; }
    }


    /** A species of Pokémon.
     * @class
     */
    class Species {
        constructor() {
            /** @type {Object.<string, Value>} Stats and their associated base values. */
            this.base_stats = {};
            STAT_NAMES.forEach( ( stat ) => {
                this.base_stats[ stat ] = new Value();
            } );
            /** @type {number[]} Experience needed for each level. */
            this.exp_rate = EXP_RATES.medfast;
            /** @type {number} Height, in meters. */
            this.height_m = 0;
            /** @type {number} Length, in meters. */
            this.length_m = 0;
            /** @type {string} The name of the species. */
            this.name = '';
            /** @type {string[]} One or two types. */
            this.types = [];
            /** @type {number} Weight, in kilograms. */
            this.weight_kg = 0;
        }

        /** Sets the species from the XML.
         * @param {string} id - The ID of the species: usually the name in camel_case.
         * @returns {Species} Itself.
         */
        fromXML( id ) {
            const xml = XML_SPECIES.getElementsByTagName( id.toLowerCase() )[ 0 ];
            if ( !xml ) {
                console.error( `"${ id }" is not a valid Pokémon name ID.` );
                return;
            }
            /** @type {XMLDocument} Stat data. */
            const xml_stats = xml.getElementsByTagName( 'stats' )[ 0 ];

            STAT_NAMES.forEach( ( stat ) => {
                var val = getXMLValue( xml_stats, stat ) || 0;
                /// Translates range from 0-255 to 0-14, averaging around 7.
                /// I have no idea why 50 works.
                val = Math.floor( ( 1 - Math.pow( Math.exp( -val / 50 ), 0.5 ) ) * 16 );
                this.base_stats[ stat ] = new Value().setProperty( 'base', val );
            } );
            this.base_stats.acc.setProperty( 'base', 10 );

            this.exp_rate = EXP_RATES[ getXMLValue( xml, 'exp_rate' ) ];
            this.height_m = getXMLValue( xml, 'height_m' );
            this.length_m = getXMLValue( xml, 'length_m' );
            this.name = getXMLValue( xml, 'name' );
            this.types = getXMLValueArray( xml, 'type' );
            this.weight_kg = getXMLValue( xml, 'weight_kg' );

            return this;
        }
    }


    /** An attack.
     * @class
     */
    class Move {
        constructor() {
            /** @type {string} Whether the move is physical, special, or status. */
            this.category = '';
            /** @type {boolean} Whether the move makes contact. */
            this.contact = false;
            /** @type {string} The move's effect. */
            this.effect = '';
            /** @type {string} The move's name ID. */
            this.id = '';
            /** @type {string} The move's displayed name. */
            this.name = '';
            /** @type {string} The move pools containing this move. */
            this.pool = [];
            /** @type {number} The move's power. */
            this.power = 0;
            /** @type {string} The move's range. */
            this.range = '';
            /** @type {string} The skill required for a save against this move. */
            this.save = '';
            /** @type {number} The base stamina cost of this move. */
            this.sp = 0;
            /** @type {number} The base accuracy of this move. */
            this.to_hit = 0;
            /** @type {string} This move's type. */
            this.type = '';
        }

        /** Sets the species from the XML.
         * @param {string} id - The ID of the species: usually the name in camel_case.
         * @returns {Move} Itself.
         */
        fromXML( id ) {
            const xml = XML_SPECIES.getElementsByTagName( id.toLowerCase() )[ 0 ];
            if ( !xml ) {
                console.error( `"${ id }" is not a valid move name ID.` );
                return;
            }

            this.category = getXMLValue( xml, 'category' );
            this.contact = getXMLValue( xml, 'contact' );
            this.effect = getXMLValue( xml, 'effect' );
            this.id = getXMLValue( xml, 'id' );
            this.name = getXMLValue( xml, 'name' );
            this.pool.push( ...getXMLValueArray( xml, 'pool' ) );
            this.power = getXMLValue( xml, 'power' );
            this.range = getXMLValue( xml, 'range' );
            this.save = getXMLValue( xml, 'save' );
            this.sp = getXMLValue( xml, 'sp' );
            this.to_hit = getXMLValue( xml, 'to_hit' );
            this.type = getXMLValue( xml, 'type' );

            return this;
        }
    }


    /** A character.
     * @class
     */
    class Pokemon {
        /**
         * @param {string} species - Species ID, usually just the species name in camel_case.
         * @param {object} [prop] - Properties.
         * @param {Object.<string,number>} [prop.ev] - The character's EVs.
         * @param {Object.<string,number>} [prop.iv] - The character's IVs.
         * @param {string} [prop.name] - The character's name.
         * @param {string} [prop.nature] - The character's nature.
         * @param {Function} [prop.onUpdate] - Runs when character is entirely updated.
         * @param {string[]} [prop.proficiencies] - A list of what skills the character is proficient in.
         * @param {string} [prop.role] - The character's role.
         * @param {number} [prop.xp] - The character's experience points.
        */
        constructor( species, prop = {} ) {
            /** @prop {Object} - Internal values. */
            this._ = {
                /** @prop {Value} - Crit chance. */
                crit: new Value(),
                /** @prop {Value} - Evasion. */
                eva: new Value(),
                /** @prop {Value} - Current hit points. */
                hp: new Value(),
                /** @prop {Value} - Movement speed. */
                movement: new Value(),
                /** @prop {DynamicVariable} - The name. */
                name: new DynamicVariable(),
                /** @prop {DynamicVariable} - The nature. */
                nature: new DynamicVariable(),
                /** @prop {DynamicVariable} - Skill proficiencies. */
                proficiencies: new DynamicVariable( {} ),
                /** @prop {DynamicVariable} - The role. */
                role: new DynamicVariable(),
                /** @prop {Value} - Current stamina points. */
                sp: new Value(),
                /** @prop {Species} - The species. */
                species: new Species(),
                /** @prop {Value} - Experience points. */
                xp: new Value(),
                /** @prop {Value} - Height (m). */
                height_m: new DynamicVariable(),
                /** @prop {Value} - Length (m). */
                length_m: new DynamicVariable(),
                /** @prop {Value} - Size (game units). */
                size: new DynamicVariable(),
                /** @prop {Value} - Weight (game units). */
                weight: new DynamicVariable(),
                /** @prop {Value} - Weight (kg). */
                weight_kg: new DynamicVariable(),
            };
            /** @type {Object.<string, Function>} Internal. Attributes that have custom change functions. */
            this._attr_changes = {};

            // prop.proficiencies = prop.proficiencies || [];

            /** Runs when character is entirely updated. */
            this.onUpdate = function () { };

            // this.setSpecies( species );

            /** @type {Object.<string, Stat>} An object of Stat objects for each stat. */
            this.stats = {};
            /** @type {Object.<string, Value>} An object of Value objects for each skill. */
            this.skills = {};
            STAT_NAMES.forEach( ( stat ) => {
                this.stats[ stat ] = new Stat( stat, this );
            } );
            SKILL_NAMES.forEach( ( skill ) => {
                const stat = getStatForSkill( skill );
                const obj = new Value( skill );
                obj.setVariableProperty( stat, () => {
                    return this.stats[ stat ].modifier;
                }, this.stats[ stat ] );
                obj.setVariableProperty( 'proficiency', () => {
                    return this._.proficiencies.value[ skill ] ? this.prof : 0;
                }, [ this._.proficiencies, this._.xp ] );
                this.skills[ skill ] = obj;
            } );

            this._.crit.setProperty( 'base', 20 );

            this._.eva.setProperty( 'base', 10 );
            this._.eva.setVariableProperty( 'SPE', () => {
                return this.stats.spe.modifier;
            }, this.stats.spe );

            // /** @type {string} The character's name. */
            // this.name = prop.name;
            // if ( prop.role ) this.setRole( prop.role );
            // this.setNature( prop.nature || randomKey[ NATURES ] );

            // this.hp = this.hp_max;
            // this.rests = this.rests_max;
            // this.sp = this.sp_max;
            // this.xp = prop.xp || 0;

            // const lmao = () => {
            //     this.setNature( randomKey( NATURES ) );
            //     setTimeout( lmao, 1000 );
            // };
            // lmao();
        }

        /** Sets the character from an XML.
         * @param {XMLDocument} xml - The XML document to read.
         * @returns {Pokemon} Itself.
         */
        fromXML( xml ) {
            xml = xml.getElementsByTagName( 'character' )[ 0 ];
            if ( !xml ) {
                console.error( 'The input XML is invalid.' );
                return;
            }
            const xml_iv = xml.getElementsByTagName( 'iv' )[ 0 ];
            const xml_ev = xml.getElementsByTagName( 'ev' )[ 0 ];

            const moves = getXMLValueArray( xml, 'move' );
            const nature = getXMLValue( xml, 'nature' ) || ( this.nature.name && this.nature.name.toLowerCase() );
            const proficiencies = getXMLValueArray( xml, 'skill' );
            const role = getXMLValue( xml, 'role' );
            const species = getXMLValue( xml, 'species' );

            this.setSpecies( species );

            STAT_NAMES.forEach( ( stat ) => {
                const iv = getXMLValue( xml_iv, stat );
                const ev = getXMLValue( xml_ev, stat );
                if ( iv ) this.stats[ stat ].setProperty( 'iv', iv );
                if ( ev ) this.stats[ stat ].setProperty( 'ev', ev );
            } );
            SKILL_NAMES.forEach( ( skill ) => {
                this._.proficiencies.value[ skill ] = proficiencies.includes( skill );
            } );

            this.name = getXMLValue( xml, 'name' ) || '';
            if ( role ) this.setRole( role );
            this.setNature( nature || randomKey[ NATURES ] );

            this.hp = getXMLValue( xml, 'hp' ) || this.hp_max;
            this.rests = getXMLValue( xml, 'rests' ) || this.rests_max;
            this.sp = getXMLValue( xml, 'sp' ) || this.sp_max;
            this.xp = getXMLValue( xml, 'xp' ) || 0;

            return this;
        }

        /** Sets a function to run when a certain attribute changes.
         * @param {string} attr - The stat, skill, or other attribute.
         * @param {Function} func - The function to run when this attribute changes.
         */
        onAttrChange( attr, func ) {
            var obj;
            if ( STAT_NAMES.includes( attr ) ) {
                obj = this.stats[ attr ];
            } else if ( SKILL_NAMES.includes( attr ) ) {
                obj = this.skills[ attr ];
            } else {
                obj = this._[ attr ];
            }
            if ( obj instanceof Value || obj instanceof DynamicVariable ) {
                obj.onChange( func );
                this._attr_changes[ attr ] = func;
            } else {
                console.error( `"${ attr }" is not a DynamicVariable, Value, or Stat object.` );
            }
        }

        /** Updates everything. */
        updateAll() {
            // STAT_NAMES.forEach( (stat) => {
            //     this.stats[stat].update();
            // });
            if ( this.nature ) this.setNature( this.nature.name.toLowerCase() );
            if ( this.role ) this.setRole( this.role.name.toLowerCase() );
            this.name = this.name;
            this.xp = this.xp;
            this.weight_kg = this.weight_kg;
            this._updateSize();
            this.onUpdate();
        }

        equip() { }
        unequip() { }

        /** Checks for proficiency from a skill.
         * @param {string} - The skill.
         * @returns {boolean}
         */
        getProfSkill( skill ) {
            return this._.proficiencies.value[ skill ];
        }
        /** Gives proficiency to a skill.
         * @param {string} - The skill.
         * @param {boolean} - Whether this skill should have proficiency.
         */
        setProfSkill( skill, bool ) {
            this._.proficiencies.value[ skill ] = bool;
            this._.proficiencies.update();
        }

        _updateSize() {
            if ( this.length_m > this.height_m ) {
                // ???
            } else {
                if ( this.height_m > 4.8 ) return this._.size.value = 'huge';
                if ( this.height_m > 2.4 ) return this._.size.value = 'large';
                if ( this.height_m > 0.6 ) return this._.size.value = 'medium';
                if ( this.height_m > 0.3 ) return this._.size.value = 'small';
                return this._.size.value = 'tiny';
            }
        }

        /** @type {number} The character's height, in meters. */
        get height_m() { return this._.height_m.value; }
        set height_m( x ) { this._.height_m.value = x; this._updateSize(); }
        /** @type {number} The character's height, in meters. */
        get length_m() { return this._.length_m.value; }
        set length_m( x ) { this._.length_m.value = x; this._updateSize(); }
        /** @type {number} The character's height, in meters. */
        get weight_kg() { return this._.weight_kg.value; }
        set weight_kg( x ) {
            this._.weight_kg.value = x;
            this._.weight.value = Math.ceil( x * 10 / 1.6 ) / 10;
        }

        /** @type {number} The character's current hit points. */
        get hp() { return this._.hp.value; }
        set hp( x ) { this._.hp.setProperty( 'base', x ); }

        /** @type {string} The character's name. */
        get name() { return this._.name.value || this.species.name.replace( /\(.*\)/g, '' ); }
        set name( x ) { this._.name.value = x; }

        /** @type {Nature} The character's nature. @readonly */
        get nature() { return this._.nature.value; };
        /** @param {string} id - The name ID of the nature. */
        setNature( id ) { this._.nature.value = NATURES[ id ]; }

        /** @type {Role} The character's role. @readonly */
        get role() { return this._.role.value; }
        /** @param {string} id - The name ID of the role. */
        setRole( id ) { this._.role.value = ROLES[ id ]; }

        /** @type {number} The character's current stamina points. */
        get sp() { return this._.sp.value; }
        set sp( x ) { this._.sp.setProperty( 'base', x ); }

        /** @type {number} The character's current experience points. */
        get xp() { return this._.xp.value; }
        set xp( x ) { this._.xp.setProperty( 'base', x ); }

        /** @type {Species} The character's species. @readonly */
        get species() { return this._.species; }
        /** @param {string} id - The name ID of the new species. */
        setSpecies( id ) {
            /// Preserve changes in size as a percentage of the former size.
            var scale_s = 1, scale_w = 1;
            if ( +this.species.height_m > 0 ) {
                scale_s = this.height_m / this.species.height_m;
            } else if ( +this.species.length_m > 0 ) {
                scale_s = this.length_m / this.species.length_m;
            }
            if ( +this.species.weight_kg > 0 ) scale_w = this.weight_kg / this._.species.weight_kg;

            this.species.fromXML( id );

            this.height_m = this.species.height_m * scale_s;
            this.length_m = this.species.length_m * scale_s;
            this.weight_kg = this.species.weight_kg * scale_w;
            this.updateAll();
        }

        /** @type {number} The character's crit chance. @readonly */
        get crit() { return this._.crit.value; }
        /** @type {number} The character's evasion. @readonly */
        get eva() { return this._.eva.value; }
        /** @type {number} The character's maximum hit points value. @readonly */
        get hp_max() { return Math.max( this.level * this.recovery, 1 ); }
        /** @type {number} The character's level. @readonly */
        get level() {
            for ( let lvl = 1; lvl < 20; ++lvl ) {
                if ( this.xp < this.species.exp_rate[ lvl ] ) return lvl;
            }
            return 20;
        }
        /** @type {number} The character's proficiency bonus. @readonly */
        get prof() { return Math.ceil( this.level / 4 ) + 1; }
        /** @type {number} The character's recovery score. @readonly */
        get recovery() {
            return Math.ceil( ( this.stats.hlt.value + 1 ) / 4 ) * 2;
        }
        /** @type {number} The max number of recovers this character may use before a long rest. @readonly */
        get rests_max() { return this.level; }
        /** @type {string} The character's size category. @readonly */
        get size() { return this._.size.value; }
        /** @type {number} The character's maximum stamina points value. @readonly */
        get sp_max() { return this.level * 10; }
        /** @type {string[]} The character's types. @readonly */
        get types() { return this.species.types; }
        /** @type {number} The character's weight, in game units. @readonly */
        get weight() { return this._.weight.value; }
    }
    Pokemon.formatKeyword = formatKeyword;
    Pokemon.formatNumber = formatNumber;
    Pokemon.getStatForSkill = getStatForSkill;

    return Pokemon;
} )();