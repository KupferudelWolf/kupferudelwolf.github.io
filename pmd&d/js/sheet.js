/*jshint esversion: 7*/

import AV from '/build/av.module.js/av.module.js';
/** @module ./pkmn.module.js */
import Pokemon from './pkmn.module.js';

window.APP = ( function () {
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

    /** Main functions.
     * @class
     */
    class App {
        constructor() {
            $( window ).on( 'resize', this.onResize );
            this.onResize();

            this.$table_moves = $( '.table-moves' );
            this.handleTables();

            const xml = this.loadXML( './data/character-stellarity.xml' );
            this.character = new Pokemon().fromXML( xml );

            this.initForms();
        }

        loadXML( path ) {
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

            $( '.table-moves .table-info .bool-move-makes_contact' ).hide();
        }

        /** Function to run on resize. */
        onResize() {
            document.body.style.setProperty( '--scale', $( '.sheet-container' ).width() / 1000 );
        }

        initForms() {
            const char = this.character;
            /// Fill in the simple fields.
            char.onAttrChange( 'name', () => {
                $( '.value-name' ).html( char.name );
                $( '.value-species' ).html( char.species.name );
            } );
            char.onAttrChange( 'xp', () => {
                $( '.value-level' ).html( char.level );
                $( '.value-prof' ).html( char.prof );
            } );
            char.onAttrChange( 'nature', () => {
                $( '.value-nature' ).html( char.nature.name );//.attr( 'title', `+1 total ${ formatStatAbbr( char.nature.inc ) }, -1 total ${ formatStatAbbr( char.nature.dec ) }` );
            } );
            char.onAttrChange( 'role', () => {
                $( '.value-role' ).html( char.role.name );
            } );
            char.onAttrChange( 'size', () => {
                $( '.value-size' ).html( titleCase( char.size ) ).attr( 'title', char.height_m + ' m' );
            } );
            char.onAttrChange( 'weight', () => {
                $( '.value-weight' ).html( char.weight ).attr( 'title', char.weight_kg + ' kg' );
            } );

            /// Set the experience bar.
            char.onAttrChange( 'xp', () => {
                $( '.exp-container' ).each( ( ind, elem ) => {
                    const rate = char.species.exp_rate;
                    const a = rate[ char.level - 1 ];
                    const b = rate[ char.level ];
                    const x = char.xp;
                    elem.style.setProperty( '--value-exp-percent', `${ 100 * ( x - a ) / ( b - a ) }%` );
                    elem.title = `${ x } XP (${ b - x } XP to Level ${ char.level + 1 })`;
                } );
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
                char.onAttrChange( stat, () => {
                    const obj = char.stats[ stat ].getValue();
                    const $elem_mod = $( `.value-${ stat }` );
                    const $elem_total = $( `.value-${ stat }-total` );
                    if ( $elem_mod.length ) {
                        $elem_mod.html( Pokemon.formatNumber( char.stats[ stat ].modifier ) );
                    };
                    if ( $elem_total.length ) {
                        $elem_total.html( obj.value );
                        $elem_total.attr( 'title', obj.text );
                    };
                } );
            } );

            /// Fill in the skills.
            const skill_names = [ 'strength', 'endurance', 'guard', 'resistance', 'persuasion', 'talent', 'intuition', 'willpower', 'acrobatics', 'stealth', 'perception' ];
            skill_names.forEach( ( skill ) => {
                char.onAttrChange( skill, () => {
                    const $elem = $( `.value-skill-${ skill }` );
                    const obj = char.skills[ skill ].getValue();
                    $elem.html( Pokemon.formatNumber( obj.value ) );
                    $elem.attr( 'title', obj.text );
                    $( `.bool-prof-${ skill }` ).attr( 'checked', char.getProfSkill( skill ) );
                } );
                $( `.bool-prof-${ skill }` ).on( 'change', function () {
                    char.setProfSkill( skill, this.checked );
                } );
            } );

            /// OK now do it all.
            char.updateAll();
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
                    to_hit = `${ Pokemon.formatNumber( to_hit ) } To Hit`;
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

    // $( function () {
    const APP = new App();
    return APP;
    // } );
} )();
