(function () {
    const CVS = $('#output').get(0);
    const CTX = CVS.getContext('2d');

    const PAD = 80;

    const AU = 149597870.7;
    const SOLAR_MASS = 1.989e30;
    const EARTH_MASS = 5.972e24;
    const GC = 6.6743015e-11; //m3kg-1s-2

    const STAR_COLOR_LIST = [];
    const ICONS = {};

    const DEBUG_DRAW = true;

    const isClose = function ( a, b, perc = 0.01 ) {
        let c = Math.abs( a - b ),
            d = ( a + b ) / 2;
        return c / d < perc;
    };
    const extendCTX = ( ctx ) => {
        Object.getPrototypeOf( ctx ).circ = function ( x, y, r ) {
            this.arc( x, y, r, 0, 2 * Math.PI );
        };
        Object.getPrototypeOf( ctx ).fillCirc = function ( x, y, r ) {
            this.beginPath();
            this.arc( x, y, r, 0, 2 * Math.PI );
            this.closePath();
            this.fill();
        };
        Object.getPrototypeOf( ctx ).strokeCirc = function ( x, y, r ) {
            this.beginPath();
            this.arc( x, y, r, 0, 2 * Math.PI );
            this.closePath();
            this.stroke();
        };
        Object.getPrototypeOf( ctx ).line = function ( x1, y1, x2, y2 ) {
            this.beginPath();
            this.moveTo( x1, y1 );
            this.lineTo( x2, y2 );
            this.stroke();
        };
    };

    const COLOR = {
        liquid: {
            'ammonia': '#557353',
            'carbon':  '#47363c',
            'water':   '#507282'
        },
        ice: {
            'ammonia': '#cae8cb',
            'carbon':  '#bab6ba',
            'water':   '#e2e3e4'
        },
        planet: {
            'bright':  '#dad7c5',
            'rocky':   '#b0a690',
            'dim':     '#767769',
            'red':     '#b25538',
            'mud':     '#665026',
            'dry':     '#9c8156',
            'sand':    '#c7b570',
            'verdant': '#67923d',
            'forest':  '#406325',
            'clay':    '#bd8264',
            'carbon':  '#bab6ba',
            'mauve':   '#7e6b71',
            'pale':    '#7895a4'
        }
    };

    class Body {
        constructor( radius, mass, prop ) {
            this.radius = radius;
            this.mass = mass;
            this.children = [];

            prop = prop || {};

            this.name = prop.name || '';
            this.parent = prop.parent;
            this.temp = prop.temp;
            this.semi = prop.semi;

            if ( !this.name && this.parent ) {
                this.name = this.parent.name + ' ' + this.parent.children.length;
            }

            this.periodRotational = prop.day; // hours

            if ( !this.semi ) {
                this.period = prop.period; // years
            }

            if ( prop.life ) {
                this.life = {
                    unicellular: prop.life.unicellular || false,
                    // plant: prop.life.plant || false,
                    multicellular: prop.life.multicellular || false,
                    intelligent: prop.life.intelligent || false
                };
                // let hasLife = false;
                // for (var k in this.life) {
                //     if ( this.life[k] ) {
                //         hasLife = true;
                //         break;
                //     }
                // }
                // if ( !hasLife ) this.life = false;
            } else {
                this.life = false;
            }

            this.cvsBody = $('<canvas>').get(0);
            this.ctxBody = this.cvsBody.getContext('2d');
            extendCTX( this.ctxBody );
            this.ctxBody.textBaseline = 'bottom';
        }

        get parent() { return this._parent; }
        set parent( parent ) {
            if ( !( parent instanceof Body ) ) {
                this._parent = undefined;
                return;
            }
            parent.addChild(this);
            this._parent = parent;
        }

        get isStar() { return false; }
        set isStar(x) { console.error( 'Body.isStar is read-only.' ); }

        get volume() {
            return Math.PI * Math.pow( this.radius, 3 ) * 4 / 3;
        }
        set volume(v) {
            this.radius = Math.pow( 3 * v / ( 4 * Math.PI ), 1 / 3 );
        }

        get density() {
            return 1e-12 * this.mass / this.volume;
        }
        set density(d) {
            this.mass = 1e+12 * this.volume * d;
        }

        set class(x)   { console.error( 'Body.class is read-only.' ); }
        set isStar(x)  { console.error( 'Body.isStar is read-only.' ); }
        set volume(x)  { console.error( 'Body.volume is read-only.' ); }

        get period() {
            if ( !this.parent ) return undefined;
            // return Math.sqrt( Math.pow( this.semi / AU, 3 ) );
            let gm = GC * this.parent.mass,
                semi = this.semi * 1000,
                sec = 2 * Math.PI * Math.sqrt( (semi**3) / gm );
            return sec / 3.155814954e+7;
        }
        set period(p) {
            if ( !this.parent ) return undefined;
            // this.semi = Math.pow( Math.pow(p, 2), 1 / 3 ) * AU;
            let gm = GC * this.parent.mass,
                sec = p * 3.155814954e+7,
                semi = Math.pow( gm * (sec**2) / ( 4 * (Math.PI**2) ), 1/3 );
            return semi / 1000;
        }

        get periodOrbital() { return this.period; }
        set periodOrbital(p) { this.period = p; }

        get isTidallyLocked() {
            return this.resonance === '1:1';
        }
        set isTidallyLocked(x) {
            console.error( 'Object.isTidallyLocked is read-only.' );
        }

        get resonance() {
            let year = this.period,
                day = Math.abs( this.periodRotational ) / 8766.15265001;
            if ( !year || !day ) return '';
            for (let a = 1; a < 6; ++a ) {
                for (let b = 1; b < 6; ++b ) {
                    if ( isClose( day * a, year * b ) ) return `${a}:${b}`;
                }
            }
            return '';
        }
        set resonance(x) {
            //
        }

        getDrawRadius() {
            let rad = Math.round( Math.sqrt( this.radius * 2 ) / 32 ) * 8;
            rad = Math.max( rad, 8 );
            return rad;
        }

        addChild( obj ) {
            this.children.push( obj );
        }

        update( leftAlign ) {}
    }


    class Star extends Body {
        constructor( radius, mass, prop ) {
            prop = prop || {};
            super( radius, mass, prop );

            this.atmosphere = prop.atmo;
            this.land = prop.land;
            this.isCarbonStar = prop.isCarbonStar;
            this.isWolfRayet = prop.isWolfRayet;
        }

        get temp() {
            let cls, temps;
            if ( this._temp ) return this._temp;
            cls = this.class;
            if ( !cls ) return undefined;
            temps = [ 50000, 25000, 11000, 7500, 6000, 5000, 3500, 2400, 1300, 550, 0 ];
            switch ( cls.slice( 0, 1 ) ) {
                case 'O': this._temp = temps[1];  break;
                case 'B': this._temp = temps[2];  break;
                case 'A': this._temp = temps[3];  break;
                case 'F': this._temp = temps[4];  break;
                case 'G': this._temp = temps[5];  break;
                case 'K': this._temp = temps[6];  break;
                case 'M': this._temp = temps[7];  break;
                case 'L': this._temp = temps[8];  break;
                case 'T': this._temp = temps[9];  break;
                case 'Y': this._temp = temps[10]; break;
                default:  this._temp = undefined; break;
            }
            return this._temp;
        }
        set temp(x) { this._temp = x; }

        get isStar() { return true; }
        set isStar(x) { console.error( 'Star.isStar is read-only.' ); }

        get color() {
            let min = 550,
                max = 20000,
                temp = Math.min( Math.max( this.temp, min ), max ) - min,
                perc = temp / ( 1 + max - min ),
                ind = Math.floor( perc * STAR_COLOR_LIST.length );
            return STAR_COLOR_LIST[ind];
        }
        set color(x) { console.error( 'Star.color is read-only.' ); }

        get colorPlants() {
            //
        }
        set colorPlants(x) { console.error( 'Star.colorPlants is read-only.' ); }

        get class() {
            let temps = [ 50000, 25000, 11000, 7500, 6000, 5000, 3500, 2400, 1300, 550, 0 ],
                getSpectral = () => {
                    let temp;
                    if ( this.isWolfRayet ) return 'W';
                    if ( this.isCarbonStar ) return 'C';
                    if ( typeof( this._temp ) === 'undefined' ) {
                        if ( this._class ) return this._class;
                        console.error( `${this.name || 'Star'}.temp is undefined.` );
                        return undefined;
                    }
                    temp = this.temp;
                    for ( let i = 0, l = temps.length; i < l; ++i ) {
                        if ( temp >= temps[i] ) {
                            temp = temps[i];
                            break;
                        }
                    }
                    switch ( temp ) {
                        case temps[0]:  return 'O'; break;
                        case temps[1]:  return 'O'; break;
                        case temps[2]:  return 'B'; break;
                        case temps[3]:  return 'A'; break;
                        case temps[4]:  return 'F'; break;
                        case temps[5]:  return 'G'; break;
                        case temps[6]:  return 'K'; break;
                        case temps[7]:  return 'M'; break;
                        case temps[8]:  return 'L'; break;
                        case temps[9]:  return 'T'; break;
                        default:        return 'Y'; break;
                    }
                },
                getNumber = () => {
                    let temp = this.temp;
                    if ( temp >= 50000 ) return '9';
                    for ( let i = 1, l = temps.length; i < l; ++i ) {
                        if ( temp >= temps[i] ) {
                            let low = temps[i],
                                high = temps[i - 1],
                                perc = 1 - (temp - low) / (high - low);
                            return Math.floor(perc * 10);
                        }
                    }
                },
                spectral = getSpectral(),
                getYerkes = () => {
                    let temp = this.temp,
                        luma = this.luma,
                        mass = this.mass / SOLAR_MASS,
                        // zeroPoint = 78.3, // in solar luminosities
                        // mag = -2.5 * Math.log10( luma / zeroPoint );
                        seqA = Math.pow( mass, 3 ),
                        seqB = Math.pow( mass, 4 ),
                        seqLow = Math.min( seqA, seqB ),
                        seqHigh = Math.max( seqA, seqB ),
                        density = this.density;
                    if ( luma >= seqLow && luma <= seqHigh ) return 'V';
                    if ( luma < seqLow || luma < 1 ) {
                        if ( luma <= 0.03 && temp >= temps[6] ) {
                            // letter = 'D';
                            return 'VII';
                        }
                        return 'VI';
                    }
                    if ( luma >= Math.log10(13.355) ) return '0';
                    // if ( luma >= Math.log10(9.947) ) return 'Ia';
                    // if ( luma >= Math.log10(7.184) ) return 'Ib';
                    // II
                    // III
                    // if ( density <= 10e-7 ) return 'III';
                    // return 'IV';
                    return '';
                };
            this._class = spectral + getNumber() + getYerkes();
            return this._class;
        }
        // set class(x) {
        //
        // }

        update() {
            let cvs = this.cvsBody,
                ctx = this.ctxBody,
                rad = this.getDrawRadius(),
                x = PAD / 2,
                y = 0,
                diam = rad * 2,
                fontSize = [],
                textX = rad + x,
                textY,
                color = 'black',
                baseline = 'middle',
                textW, circX, circY;

            fontSize[0] = Math.max( Math.ceil( rad / 64 ) * 16, 48 );
            fontSize[1] = fontSize[0];
            textY = rad + 4 - fontSize[0] / 2;
            ctx.font = `400 ${fontSize[0]}px Dekar`;
            textW = ctx.measureText( this.name.toUpperCase() ).width;

            cvs.width = diam + x;
            cvs.height = diam + y;
            console.log(diam, textW);
            circX = rad + x;

            if ( rad > 80 * 3 ) {
                x = 0;
                circX = 0;
                textX = rad / 2;
                cvs.width = rad;
            } else if ( diam < textW + PAD ) {
                fontSize[1] = 24;
                y = fontSize[0] + fontSize[1] + 80;
                cvs.height = Math.ceil( ( y + rad ) / 80 ) * 80 + rad;
                // y = 160 - ( ( y - rad ) % 80 );
                y = cvs.height - diam;
                // textY = fontSize[1] + 32;
                textY = 92;
                cvs.width = Math.max( textW, diam ) + x;
                // cvs.height = diam + y;
                color = 'white';
                baseline = 'bottom';
            }
            circY = rad + y;

            if ( this.temp < 550 ) {
                ctx.fillStyle = COLOR.liquid.water;
                ctx.fillCirc( circX, circY, rad );
                ctx.fillStyle = 'black';
                ctx.fillCirc( circX, circY, rad - 8 );
                color = 'white';
            } else {
                ctx.fillStyle = this.color;
                ctx.fillCirc( circX, circY, rad );
            }

            ctx.fillStyle = color;
            ctx.textAlign = 'center';
            ctx.textBaseline = baseline;
            ctx.font = `400 ${fontSize[0]}px Dekar`;
            ctx.fillText( this.name.toUpperCase(), textX, textY );
            ctx.font = `300 ${fontSize[1]}px Dekar`;
            ctx.fillText( this.class.toUpperCase(), textX, textY + fontSize[1] );

            return {
                img: cvs,
                left: x, right: 0, top: y, bottom: 0,
                width: cvs.width,
                height: cvs.height,
                planetX: 0,
                planetY: 0,
                planetWidth: diam,
                planetHeight: diam,
                draw: ( ctx, x, y ) => {
                    ctx.drawImage( cvs, x, y );
                }
            };
        }
    }


    class Planet extends Body {
        constructor( radius, mass, prop ) {
            prop = prop || {};
            super( radius, mass, prop );

            this.isIceGiant = prop.isIceGiant || false;
            this.isGasGiant = prop.isGasGiant || this.isIceGiant;

            this.rings = prop.rings;

            if ( Array.isArray(prop.color) ) {
                prop.color1 = prop.color[0];
                prop.color2 = prop.color[1];
                prop.color3 = prop.color[2];
                prop.color = null;
            }
            this.land = prop.land || 1;
            this.iceCap = prop.iceCap;
            this.color = prop.color || prop.color1 || prop.colorLand;
            this._colorWater = prop.colorWater || prop.color2;
            this._colorIce = prop.colorIce || prop.color3;
            this._colorRings = prop.colorRings;
            this.atmosphere = prop.atmosphere;
            if ( this.atmosphere ) {
                this.liquid = prop.liquid;
                this._colorAtmosphere = prop.colorAtmosphere;
            }
        }

        get isStar() { return false; }
        set isStar(x) { console.error( 'Planet.isStar is read-only.' ); }

        get temp() { return this._temp; }
        set temp(x) { this._temp = x; }

        get colorLand() {
            if ( this.isGasGiant ) return this.color1;
            if ( this._colorLand ) return this._colorLand;
            if ( this.color ) return this.color;
            if ( !this.life ) return COLOR.planet.red;
            if ( parent instanceof Star ) return parent.colorPlants;
            return COLOR.planet.verdant;
        }
        get colorWater() {
            if ( this.isGasGiant ) return this.color2;
            if ( this._colorWater ) return this._colorWater;
            if ( !this.liquid ) return COLOR.liquid.water;
            let liq = COLOR.liquid[ this.liquid ];
            return liq || COLOR.liquid.water;
        }
        get colorIce() {
            if ( this.isGasGiant ) return this.color3;
            if ( this._colorIce ) return this._colorIce;
            if ( !this.liquid ) return COLOR.ice.water;
            return COLOR.ice[ this.liquid ];
        }
        get colorAtmosphere() {
            if ( this._colorAtmosphere ) return this._colorAtmosphere;
            if ( this.liquid && this.land < 0.8 ) return this.colorWater;
            return this.colorLand;
        }
        get colorRings() {
            if ( this._colorRings ) return this._colorRings;
            if ( !this.rings ) return undefined;
            if ( this.rings === 'rocky' ) return COLOR.planet.mud;
            if ( this.rings === 'icy' ) return COLOR.planet.bright;
            if ( this.isGasGiant && !this.isIceGiant ) return COLOR.planet.mud;
            return COLOR.planet.bright;
        }
        get color1() {
            if ( this.isGasGiant ) return this.color;
            return this.colorLand;
        }
        get color2() {
            if ( this.isGasGiant ) return this._colorWater;
            return this.colorWater;
        }
        get color3() {
            if ( this.isGasGiant ) return this._colorIce || COLOR.planet.bright;
            return this.colorIce;
        }

        set colorLand(x) { this._color = x; }
        set colorWater(x) { this._colorWater = x; }
        set colorIce(x) { this._colorIce = x; }
        set colorAtmosphere(x) { this._colorAtmosphere = x; }
        set colorRings(x) { this._colorRings = x; }
        set color1(x) { this._color = x; }
        set color2(x) { this._colorWater = x; }
        set color3(x) { this._colorIce = x; }

        get isDwarf() {
            /// https://en.wikipedia.org/wiki/Clearing_the_neighbourhood
            // let m = this.mass / 1e21,
            //     a = this.semi / AU,
            //     k = 0.0043,
            //     l = k * (m**2) / Math.pow( a, 3/2 );
            // console.log(l);
            // return l > 1;
            if ( !this.parent ) return true;
            let mP = this.mass / EARTH_MASS,
                mS = this.parent.mass / SOLAR_MASS,
                a = this.semi / AU,
                k = 807,
                p = k * mP / ( Math.pow( mS, 2.5 ) * Math.pow( a, 9/8 ) );
            return p <= 1;
        }
        set isDwarf(x) { console.error( 'Planet.isDwarf is read-only.' ); }

        get class() {
            let parentClass = '', pre = '';

            if ( this.isIceGiant ) return 'ice giant';
            if ( this.isGasGiant ) return 'gas giant';

            if ( this.isDwarf ) pre += 'dwarf ';

            if ( this.parent ) {
                parentClass = this.parent.class;
            } else {
                pre += 'rogue ';
            }
            if ( parentClass.includes('planet') ) return pre + 'moon';
            if ( parentClass.includes('giant') ) return pre + 'moon';
            if ( parentClass.includes('moon') ) return parentClass + 'moon';
            return pre + 'planet';
        }

        get subClass() {
            let land = this.land;
            if ( this.isIceGiant ) return 'ice giant';
            if ( this.isGasGiant ) return 'gas giant';
            if ( !this.atmosphere ) return 'selenic';
            if ( land === 1 ) return 'atmospheric';
            if ( land >= 0.8 ) return 'lacustrine';
            if ( land >= 0.15 ) return 'continental';
            // if ( land >= 0.1 ) return 'thalassic';
            if ( land > 0 ) return 'insular';
            return 'oceanic';
        }
        set subClass(x) {
            if ( x === 'selenic' ) {
                this.atmosphere = false;
            } else if ( !this.atmosphere ) {
                this.atmosphere = 1;
            }
            switch (x) {
                case 'selenic':
                    this.land = 1;
                    break;
                case 'atmospheric':
                    this.land = 1;
                    break;
                case 'lacustrine':
                    this.land = Math.max( this.land, 0.8 );
                    break;
                case 'continental':
                    this.land = Math.min( Math.max( this.land, 0.15 ), 0.8 );
                    break;
                case 'insular':
                    this.land = Math.min( Math.max( this.land, 0.0001 ), 0.15 );
                    break;
                case 'oceanic':
                    this.land = 0;
                    break;
                default:
                    this.land = 0;
                    break;
            }

        }

        determineIcons() {
            let out = [];
            if ( this.life ) {
                out.push( ICONS.life );
                /*if ( this.life.intelligent ) {
                    out.push( ICONS.intelligent );
                } else*/ if ( this.life.multicellular ) {
                    out.push( ICONS.multicellular );
                } else if ( this.life.unicellular ) {
                    out.push( ICONS.unicellular );
                }

            }
            switch ( this.liquid ) {
                case 'ammonia': out.push( ICONS.ammonia ); break;
                case 'carbon': out.push( ICONS.hydrocarbon ); break;
                case 'water': out.push( ICONS.water ); break;
            }
            // if ( this.tilt > 0.25 ) out.push( ICONS.sig_tilt );
            if ( this.parent instanceof Barycenter ) out.push( ICONS.multi_system );
            if ( this.periodRotational < 0 ) out.push( ICONS.retro_rot );
            if ( this.resonance ) {
                if ( this.resonance === '1:1' ) {
                    if ( this.parent && this.parent.isStar ) {
                        out.push( ICONS.res_1_1 );
                    }
                } else {
                    out.push( ICONS[ 'res_' + this.resonance.replace( /:/g, '_' ) ] );
                }
            }
            return out;
        }

        update( leftAlign ) {
            let cvs = this.cvsBody,
                ctx = this.ctxBody,
                rad = this.getDrawRadius(),
                top = 0, bottom = 0, left = 0, right = 0,
                nameTest, textEdge, textX, textY, fontSize,
                radAtm, diam, icons;

            radAtm = rad;
            if ( this.atmosphere ) {
                if ( this.atmosphere > 0.5 ) {
                    radAtm = Math.floor( rad * 1.25 );
                } else {
                    radAtm = Math.floor( rad * 1.125 );
                }
            }
            diam = radAtm * 2;

            if ( leftAlign ) {
                left = 68;
                right = 0*96;
                top = PAD / 4;
                if ( rad === 8 ) {
                    top = bottom = PAD / 8;
                }
                switch (rad) {
                    case 8:  fontSize = [ 12, 8 ];  break;
                    case 16: fontSize = [ 18, 12 ]; break;
                    case 24: fontSize = [ 18, 12 ]; break;
                    case 32: fontSize = [ 24, 14 ]; break;
                    default: fontSize = [ 32, 16 ]; break;
                }
            } else {
                top = 80 + 80 - ( radAtm % 80 );
                left = right = PAD / 2;
                if ( this.isGasGiant ) {
                    fontSize = [ 48, 24 ];
                } else {
                    fontSize = [ 32, 16 ];
                }
            }

            ctx.font = `400 ${fontSize[0]}px Dekar`;
            nameTest = this.name.length < 5 ? 'AAAAA' : this.name.toUpperCase();
            textEdge = Math.ceil( ctx.measureText( nameTest ).width ) - radAtm;
            if ( leftAlign ) {
                right = Math.max( right, textEdge * 2 + diam );
            } else {
                left = Math.max( left, textEdge / 2 );
                right = Math.max( right, textEdge / 2 );
            }


            cvs.width = diam + left + right;
            cvs.height = diam + top + bottom;
            ctx.lineCap = ctx.lineJoin = 'round';

            ctx.translate( left, top );

            ctx.save();
            if ( this.isGasGiant ) {
                ctx.beginPath();
                ctx.circ( radAtm, radAtm, rad );
                ctx.clip();

                ctx.fillStyle = this.color1;
                ctx.fillRect( 0, 0, diam, diam );

                ctx.lineWidth = Math.round( diam * 0.125 );

                if ( this.isIceGiant ) {
                    ctx.strokeStyle = this.color3;
                    ctx.line( diam * 0.54, diam * 0.33, diam, diam * 0.33 );
                    ctx.line( 0, diam * 0.86, diam * 0.4375, diam * 0.86 );
                    ctx.strokeStyle = this.color2;
                    ctx.line( diam * 0.74, diam * 0.42, diam, diam * 0.42 );
                } else {
                    ctx.strokeStyle = this.color3;
                    ctx.line( 0, diam * 0.3, diam * 0.55, diam * 0.3 );
                    ctx.line( diam * 0.563, diam * 0.47, diam, diam * 0.47 );
                    ctx.line( 0, diam * 0.58, diam * 0.26, diam * 0.58 );
                    ctx.line( diam * 0.234, diam * 0.77, diam * 0.77, diam * 0.77 );

                    ctx.strokeStyle = this.color2;
                    ctx.line( diam * 0.35, diam * 0.19, diam, diam * 0.19 );
                    ctx.line( 0, diam * 0.41, diam * 0.69, diam * 0.41 );
                    ctx.line( diam * 0.54, diam * 2/3, diam, diam * 2/3 );
                    ctx.line( 0, diam * 0.86, diam * 0.4375, diam * 0.86 );
                }

            } else if ( this.atmosphere ) {
                ctx.globalAlpha = 0.5;
                ctx.fillStyle = this.colorAtmosphere;
                ctx.fillCirc( radAtm, radAtm, radAtm );
                ctx.globalAlpha = 1;

                ctx.beginPath();
                ctx.circ( radAtm, radAtm, rad );
                ctx.clip();

                switch ( this.subClass ) {
                    case 'selenic':
                        ctx.fillStyle = this.colorLand;
                        ctx.fillRect( 0, 0, diam, diam );
                        break;
                    case 'atmospheric':
                        ctx.fillStyle = this.colorLand;
                        ctx.fillRect( 0, 0, diam, diam );
                        break;
                    case 'lacustrine':
                        ctx.fillStyle = this.colorLand;
                        ctx.fillRect( 0, 0, diam, diam );
                        ctx.lineWidth = Math.round( diam / 6 );
                        ctx.strokeStyle = this.colorWater;
                        ctx.line( 0, diam * 0.6, diam * 0.25, diam * 0.6 );
                        ctx.line( diam * 0.7, diam * 0.425, diam * 0.7, diam * 0.425 );
                        break;
                    case 'continental':
                        ctx.fillStyle = this.colorWater;
                        ctx.fillRect( 0, 0, diam, diam );
                        ctx.strokeStyle = this.colorLand;
                        ctx.lineWidth = Math.round( diam * 0.4 );
                        ctx.line( 0, diam * 0.3625, diam * 0.425, diam * 0.3625 );
                        ctx.lineWidth = Math.round( diam * 0.1 );
                        ctx.line( diam * 0.775, diam * 0.6125, diam, diam * 0.6125 );
                        ctx.line( diam * 0.475, diam * 0.7125, diam * 0.575, diam * 0.7125 );
                        break;
                    case 'insular':
                        ctx.fillStyle = this.colorWater;
                        ctx.fillRect( 0, 0, diam, diam );
                        ctx.lineWidth = Math.round( diam * 0.1 );
                        ctx.strokeStyle = this.colorLand;
                        ctx.line( 0, diam * 0.3, diam * 0.25, diam * 0.3 );
                        ctx.line( diam * 0.575, diam * 0.6, diam * 0.675, diam * 0.6 );
                        ctx.line( diam * 0.3125, diam * 0.475, diam * 0.3125, diam * 0.475 );
                        ctx.line( diam * 0.45, diam * 0.7, diam * 0.45, diam * 0.7 );
                        ctx.line( diam * 0.775, diam * 0.35, diam * 0.775, diam * 0.35 );
                        break;
                    case 'oceanic':
                        ctx.fillStyle = this.colorWater;
                        ctx.fillRect( 0, 0, diam, diam );
                        break;
                    default: break;
                }
            } else {
                ctx.fillStyle = this.colorLand;
                ctx.fillCirc( radAtm, radAtm, rad );
            }

            if ( this.iceCap ) {
                let ice = Math.sqrt( this.iceCap ),
                    diff = radAtm - rad;
                ctx.fillStyle = this.colorIce;
                ctx.fillRect( 0, 0, diam, diff + rad * ice );
                ctx.fillRect( 0, diam - diff - rad * ice, diam, diam );
            }
            ctx.restore();

            if ( this.rings ) {
                ctx.strokeStyle = this.colorRings;
                ctx.lineWidth = diam * 0.04;
                ctx.line( -left * 2/3, radAtm, diam + right * 2/3, radAtm );
            }

            icons = this.determineIcons();
            let icL = icons.length,
                icW = icL * 24 + ( icL - 1 ) * 8;

            if ( leftAlign ) {
                textX = diam + rad / 2;
                textY = radAtm;
                ctx.textAlign = 'left';
                ctx.fillStyle = 'white';
                ctx.font = `400 ${fontSize[0]}px Dekar`;
                ctx.fillText( this.name.toUpperCase(), textX, textY );
                ctx.font = `300 ${fontSize[1]}px Dekar`;
                textX += fontSize[1] / 2;
                textY += fontSize[0] * 2 / 3;
                ctx.fillText( this.subClass.toUpperCase(), textX, textY );
                let icX = -icW - 8,
                    icY = radAtm - 12;
                for ( let i = 0; i < icL; ++i ) {
                    ctx.drawImage( icons[i], icX, icY );
                    icX += 32;
                }
            } else {
                textX = radAtm;
                textY = 80 - top;
                ctx.textAlign = 'center';
                ctx.fillStyle = 'white';
                ctx.font = `400 ${fontSize[0]}px Dekar`;
                ctx.fillText( this.name.toUpperCase(), textX, textY );
                ctx.font = `300 ${fontSize[1]}px Dekar`;
                ctx.fillText( this.subClass.toUpperCase(), textX, textY + fontSize[1] );
                let icX = ( diam - icW ) / 2,
                    icY = textY - 60;
                for ( let i = 0; i < icL; ++i ) {
                    ctx.drawImage( icons[i], icX, icY );
                    icX += 32;
                }
            }

            return {
                img: cvs,
                left: left, top: top, bottom: bottom, right: right,
                width: cvs.width,
                height: cvs.height,
                planetX: left,
                planetY: top,
                planetWidth: diam,
                planetHeight: diam,
                self: this,
                parent: this.parent,
                draw: ( ctx, x, y ) => {
                    ctx.drawImage( cvs, x, y );
                }
            };
        }
    }


    class Barycenter extends Body {
        prop = prop || {};
        constructor( mass, prop ) {
            super( 0, mass, prop );
            this.class = 'barycenter';
        }

        get mass() { return this.children.reduce( (acc, cur) => acc + cur.mass ); }
        set mass(x) { console.error( 'Barycenter.mass is read-only.' ); }

        get isStar() { return false; }
        set isStar(x) { console.error( 'Barycenter.isStar is read-only.' ); }
    }


    class App {
        constructor() {
            CVS.width = $(window).width();
            CVS.height = 800;
            extendCTX( CTX );

            this.images = [];
            this.loadImages().then( () => {
                let sun,
                    mercury, venus, earth, mars,
                    jupiter, saturn, neptune, uranus,
                    ceres, eris, pluto;

                this.initGrad( 512 );

                sun = new Star( 696340, SOLAR_MASS, {
                    name: 'Sol',
                    temp: 5780,
                    luma: 1
                });
                mercury = new Planet( 2439.7, 3.3011e23, {
                    name: 'Mercury',
                    parent: sun,
                    semi: 57909.05,
                    day: 1407.5,
                    color: COLOR.planet.bright
                });
                venus = new Planet( 6051.8, 4.8675e+24, {
                    name: 'Venus',
                    parent: sun,
                    semi: 108208000,
                    atmosphere: 92,
                    day: -5832.5424,
                    color: COLOR.planet.sand
                });
                earth = new Planet( 6371, EARTH_MASS, {
                    name: 'Earth',
                    parent: sun,
                    semi: AU,
                    atmosphere: 1,
                    day: 23.94469722,
                    color: COLOR.planet.verdant,
                    land: 0.21,
                    liquid: 'water',
                    iceCap: 0.1,
                    life: {
                        unicellular: true,
                        multicellular: true,
                        intelligent: true
                    }
                });
                mars = new Planet( 3389.5, 6.4171e+23, {
                    name: 'Mars',
                    parent: sun,
                    semi: 227939200,
                    atmosphere: 0.00628,
                    day: 24.622968,
                    color: COLOR.planet.red,
                    iceCap: 0.1
                });
                jupiter = new Planet( 69911, 1.8982e+27, {
                    name: 'Jupiter',
                    parent: sun,
                    semi: 778570000,
                    isGasGiant: true,
                    color1: COLOR.planet.clay,
                    color2: COLOR.planet.red,
                    color3: COLOR.planet.bright,
                    rings: false
                });
                saturn = new Planet( 58232, 5.6834e+26, {
                    name: 'Saturn',
                    parent: sun,
                    semi: 1433530000,
                    isGasGiant: true,
                    color1: COLOR.planet.sand,
                    color2: COLOR.planet.clay,
                    color3: COLOR.planet.bright,
                    rings: true
                });
                uranus = new Planet( 25362, 8.6810e+25, {
                    name: 'Uranus',
                    parent: sun,
                    semi: 2875040000,
                    isIceGiant: true,
                    color1: COLOR.planet.pale,
                    color2: COLOR.liquid.water,
                    color3: COLOR.ice.water,
                    rings: 'icy'
                });
                neptune = new Planet( 24622, 1.02413e+26, {
                    name: 'Neptune',
                    parent: sun,
                    semi: 4500000000,
                    isIceGiant: true,
                    color1: COLOR.liquid.water,
                    color2: COLOR.liquid.carbon,
                    color3: COLOR.planet.pale,
                    rings: false
                });

                pluto = new Planet( 1188.3, 1.303e+22, {
                    name: 'Pluto',
                    parent: sun,
                    semi: 5.90638e+9,
                    color: COLOR.planet.mauve
                });
                eris = new Planet( 1163, 1.6466e+22, {
                    name: 'Eris',
                    parent: sun,
                    semi: 1.015231e+10,
                    color: COLOR.planet.bright
                });
                ceres = new Planet( 469.73, 9.3835e+20, {
                    name: 'Ceres',
                    parent: sun,
                    semi: 414261000,
                    color: COLOR.planet.rocky
                });

                this.planets = [
                    mercury, venus, earth, mars,
                    jupiter, saturn, neptune, uranus,
                    ceres, eris, pluto,
                    new Planet( 1737.4, 7.342e+22, {
                        name: 'Luna',
                        parent: earth,
                        semi: 384399,
                        day: 655.719864,
                        color: COLOR.planet.bright
                    }),
                    new Planet( 11.2667, 1.0659e+16, {
                        name: 'Phobos',
                        parent: mars,
                        semi: 9376,
                        day: 7.65384552,
                        color: COLOR.planet.bright
                    }),
                    new Planet( 6.2, 1.4762e+15, {
                        name: 'Deimos',
                        parent: mars,
                        semi: 23463.2,
                        day: 30.312,
                        color: COLOR.planet.bright
                    }),
                    new Planet( 2574.73, 1.3452e+23, {
                        name: 'Titan',
                        parent: saturn,
                        semi: 1221870,
                        day: 382.68,
                        color: COLOR.planet.dry,
                        liquid: 'carbon',
                        land: 0.9,
                        atmosphere: 1.45
                    }),
                    new Planet( 606, 1.586e+21, {
                        name: 'Charon',
                        parent: pluto,
                        semi: 17181.0, // from barycenter
                        day: 153.2935296,
                        color: COLOR.planet.rocky
                    })
                ];

                this.star = sun;

                this.updateAll();

                console.log(this.planets);
            });
        }

        loadImages() {
            let defers = [ $.Deferred() ],
                deferred = $.Deferred(),
                files = [
                    'icon_life.png',
                    'icon_unicellular.png',
                    'icon_multicellular.png',
                    // 'icon_carbon_source.png',
                    'icon_hydrocarbon.png',
                    'icon_ammonia.png',
                    'icon_water.png',
                    'icon_sig_tilt.png',
                    'icon_multi_system.png',
                    'icon_retro_rot.png',
                    'icon_res_1_1.png',
                    'icon_res_1_2.png',
                    'icon_res_1_3.png',
                    'icon_res_1_4.png',
                    'icon_res_1_5.png',
                    'icon_res_2_1.png',
                    'icon_res_2_3.png',
                    'icon_res_2_5.png',
                    'icon_res_3_1.png',
                    'icon_res_3_2.png',
                    'icon_res_3_4.png',
                    'icon_res_3_5.png',
                    'icon_res_4_1.png',
                    'icon_res_4_3.png',
                    'icon_res_4_5.png',
                    'icon_res_5_1.png',
                    'icon_res_5_2.png',
                    'icon_res_5_3.png',
                    'icon_res_5_4.png'
                ];

            files.forEach( (val, ind) => {
                let img = new Image(),
                    defer = $.Deferred();
                defers.push( defer );
                img.onload = defer.resolve;
                img.src = 'img/' + val;
                let name = val.slice( 5, -4 );
                ICONS[name] = img;
            });

            defers[0].resolve();

            $.when( ...defers ).done( () => {
                deferred.resolve();
            });

            return deferred;
        }

        initGrad( res ) {
            let cvsGrad = $('<canvas>').get(0),
                ctxGrad = cvsGrad.getContext('2d'),
                grad = [ '#8f7649', '#ffcc6f', '#f8f7ff', '#9bb0ff' ];
            cvsGrad.width = res;
            cvsGrad.height = 1;
            ctxGrad.fillStyle = ( function () {
                let gradGrad = ctxGrad.createLinearGradient( 0, 0, cvsGrad.width, 0 );
                gradGrad.addColorStop( 0,   grad[1] );
                gradGrad.addColorStop( 0.4, grad[2] );
                gradGrad.addColorStop( 1,   grad[3] );
                return gradGrad;
            })();
            ctxGrad.strokeStyle = grad[0];
            ctxGrad.lineWidth = 2;
            ctxGrad.fillRect( 0, 0, cvsGrad.width, cvsGrad.height );
            ctxGrad.beginPath();
            ctxGrad.moveTo( 0, 0 );
            ctxGrad.lineTo( 0, cvsGrad.height );
            ctxGrad.stroke();

            let data = ctxGrad.getImageData( 0, 0, cvsGrad.width, 1 ).data;
            for ( let i = 0, l = data.length; i < l; i += 4 ) {
                let col = data.slice( i, i + 3 ),
                    hex = col.reduce( ( acc, cur ) => {
                        return acc + ( '00' + cur.toString(16) ).slice(-2);
                    }, '#' );
                STAR_COLOR_LIST.push( hex );
            }
        }

        updateAll() {
            let canvasWidth = PAD;

            this.planets.sort( ( a, b ) => a.semi - b.semi );

            this.starDraw = this.star.update();
            canvasWidth += this.starDraw.width;

            this.planetDraws = [];
            for ( let i = 0, l = this.planets.length; i < l; ++i ) {
                if ( !this.planets[i] ) continue;
                let leftAlign = this.planets[i].parent.name !== 'Sol',
                    draw = this.planets[i].update( leftAlign );
                this.planetDraws.push( draw );
                if ( !leftAlign ) {
                    canvasWidth += draw.width;
                }
            }

            CVS.width = canvasWidth;
            this.drawAll();
        }

        drawAll() {
            let x = 0,
                y = 320,
                pos = {}, drawsTemp = [];

            CTX.fillStyle = '#1f1f24';
            CTX.fillRect( 0, 0, CVS.width, CVS.height );

            if ( DEBUG_DRAW ) {
                CTX.strokeStyle = 'red';
                for ( let i = 1; i < 5; ++i ) {
                    let y = 80 * i;
                    CTX.line( 0, y, CVS.width, y );
                }
            }

            this.starDraw.draw( CTX, x, y - this.starDraw.height + this.starDraw.planetHeight / 2 );
            if ( DEBUG_DRAW ) {
                CTX.strokeStyle = 'lime';
                CTX.strokeRect(
                    x, y - this.starDraw.height + this.starDraw.planetHeight / 2,
                    this.starDraw.width, this.starDraw.height );
            }
            x += this.starDraw.width;

            this.planetDraws.forEach( ( planet ) => {
                if ( !planet.parent || planet.parent.name !== 'Sol' ) {
                    if ( planet.parent ) drawsTemp.push( planet );
                    return;
                }
                let upd = planet,
                    pX = x,
                    pY = y + upd.planetHeight / 2 - upd.height;
                if ( DEBUG_DRAW ) {
                    CTX.strokeStyle = 'red';
                    CTX.line( pX + upd.width / 2, 0, pX + upd.width / 2, CVS.height );
                    CTX.strokeStyle = 'lime';
                    CTX.strokeRect( pX, pY, upd.width, upd.height );
                }
                upd.draw( CTX, pX, pY );
                pos[ planet.self.name ] = [ pX + upd.width / 2, pY + upd.height ];
                x += upd.width;
            });

            this.planetDraws = [ ...drawsTemp ];
            drawsTemp = [];

            while ( this.planetDraws.length > 0 ) {
                let cont = false;
                this.planetDraws.forEach( ( planet ) => {
                    let parent = planet.parent.name,
                        p = pos[ parent ],
                        pX, pY, upd;
                    if ( !p ) {
                        drawsTemp.push( p );
                        return;
                    }
                    cont = true;
                    upd = planet;
                    pX = p[0] - upd.planetWidth / 2 - upd.left;
                    pY = p[1];
                    upd.draw( CTX, pX, pY );
                    p[1] += upd.height;
                    if ( DEBUG_DRAW ) {
                        CTX.strokeStyle = 'lime';
                        CTX.strokeRect( pX, pY, upd.width, upd.height );
                    }
                });
                this.planetDraws = [ ...drawsTemp ];
                drawsTemp = [];
                if ( !cont ) break;
            }

            this.planetDraws = [];
        }
    }

    $(function () {
        let app = new App();
    });
})();
