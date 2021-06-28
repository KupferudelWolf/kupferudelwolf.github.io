(function () {
    const CVS = $('#output').get(0);
    const CTX = CVS.getContext('2d');

    const AU = 149597870.7;
    const SOLAR_MASS = 1.989e30;
    const GC = 6.6743015e-11; //m3kg-1s-2

    const STAR_COLOR_LIST = [];

    const isClose = function ( a, b, perc = 0.01 ) {
        let c = Math.abs( a - b ),
            d = ( a + b ) / 2;
        return c / d < perc;
    };

    const COLOR = {
        aquatic: {
            'ammonia': '#557353',
            'carbon':  '#47363c',
            'water':   '#507282'
        },
        ice: {
            'ammonia': '#e2e3e4',
            'carbon':  '#bab6ba',
            'water':   '#cae8cb'
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
            'mauve':   '#7e6b71'
        },
        ring: {
            'icy':     '#dad7c5',
            'rocky':   '#665026'
        }
    };

    class Body {
        constructor( radius, mass, prop ) {
            this.radius = radius;
            this.mass = mass;
            this.children = [];

            prop = prop || {};

            this.name = prop.name;
            this.parent = prop.parent;
            this.temp = prop.temp;
            this.semi = prop.semi;

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
            Object.getPrototypeOf(this.ctxBody).circ = function ( x, y, r ) {
                this.arc( x, y, r, 0, 2 * Math.PI );
            }
            Object.getPrototypeOf(this.ctxBody).fillCirc = function ( x, y, r ) {
                this.beginPath();
                this.arc( x, y, r, 0, 2 * Math.PI );
                this.closePath();
                this.fill();
            }
            Object.getPrototypeOf(this.ctxBody).strokeCirc = function ( x, y, r ) {
                this.beginPath();
                this.arc( x, y, r, 0, 2 * Math.PI );
                this.closePath();
                this.stroke();
            }
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

        get rotationIsRetrograde() {
            return this.periodRotational < 0;
        }
        set rotationIsRetrograde(x) {
            this.periodRotational = Math.abs(this.periodRotational) * x ? -1 : 1;
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

        addChild( obj ) {
            this.children.push( obj );
        }

        draw( x, y, centerX, centerY ) {}
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
            let min = 2399,
                max = 25000,
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

        draw( x, y, centerX = false, centerY = true ) {
            let cvs = this.cvsBody,
                ctx = this.ctxBody,
                rad = Math.floor( Math.pow( this.radius * 2, 0.4 ) / 2 ),
                dX = x, dY = y;
            cvs.width = cvs.height = rad * 2;

            if ( this.temp < 550 ) {
                ctx.fillStyle = COLOR.aquatic.water;
                ctx.fillCirc( rad, rad, rad );
                ctx.fillStyle = 'black';
                ctx.fillCirc( rad, rad, rad - 8 );
            } else {
                ctx.fillStyle = this.color;
                ctx.fillCirc( rad, rad, rad );
            }

            let textX = rad,
                textY = rad;
            ctx.fillStyle = 'black';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.font = '400 48px Dekar';
            ctx.fillText( this.name.toUpperCase(), textX, textY - 48/2 );
            ctx.fillText( this.class.toUpperCase(), textX, textY + 48/2 );

            if ( centerX ) dX -= rad;
            if ( centerY ) dY -= rad;
            CTX.drawImage( cvs, dX, dY );

            return x + rad * 2;
        }
    }


    class Planet extends Body {
        constructor( radius, mass, prop ) {
            prop = prop || {};
            super( radius, mass, prop );

            this.isIceGiant = prop.isIceGiant || false;
            this.isGasGiant = prop.isGasGiant || this.isIceGiant;

            this.hasRings = prop.hasRings;

            if ( this.isGasGiant ) {
                if ( !prop.color || !Array.isArray(prop.color) ) {
                    if ( this.isIceGiant ) {
                        prop.color = [  ];
                    } else {
                        prop.color = [  ];
                    }
                }
            } else {
                this.land = prop.land || 1;
                this.iceCap = prop.iceCap;
                this.color = prop.color;
                this.atmosphere = prop.atmosphere;
                if ( this.atmosphere ) {
                    this.liquid = prop.liquid;
                }
            }
        }

        get isStar() { return false; }
        set isStar(x) { console.error( 'Planet.isStar is read-only.' ); }

        get temp() { return this._temp; }
        set temp(x) { this._temp = x; }

        get colorLand() {
            if ( this.color ) return this.color;
            if ( !this.life ) return COLOR.planet.red;
            if ( parent instanceof Star ) return parent.colorPlants;
            return COLOR.planet.verdant;
        }
        get colorWater() {
            if ( this.isGasGiant ) {
                return;
            }
            if ( !this.liquid ) return COLOR.aquatic.water;
            return COLOR.aquatic[ this.liquid ];
        }
        get colorIce() {
            if ( this.isGasGiant ) {
                return;
            }
            if ( !this.liquid ) return COLOR.ice.water;
            return COLOR.ice[ this.liquid ];
        }

        get class() {
            let parentClass;
            if ( this.isIceGiant ) return 'ice giant';
            if ( this.isGasGiant ) return 'gas giant';

            if ( !this.parent ) return 'rogue planet';
            parentClass = this.parent.class;
            if ( parentClass.includes('planet') ) return 'moon';
            if ( parentClass.includes('moon') ) return parentClass + 'moon';
            return 'planet';
        }

        get subClass() {
            let land = this.land;
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

        draw( x, y, centerX = false, centerY = true ) {
            let cvs = this.cvsBody,
                ctx = this.ctxBody,
                rad = Math.floor( Math.sqrt( this.radius * 2 ) / 2 ),
                dX = x, dY = y,
                radOut, diam;
            // rad = Math.max( rad, 8 );
            if ( rad < 12 ) {
                rad = 8;
            } else if ( rad < 24 ) {
                rad = 16;
            } else if ( rad < 48 ) {
                rad = 32;
            }
            radOut = rad;
            if ( this.atmosphere ) {
                if ( this.atmosphere > 0.5 ) {
                    radOut = Math.floor( rad * 1.25 );
                } else {
                    radOut = Math.floor( rad * 1.125 );
                }
            }
            diam = radOut * 2;
            cvs.width = cvs.height = diam;
            ctx.lineCap = ctx.lineJoin = 'round';

            if ( this.atmosphere ) {
                ctx.globalAlpha = 0.5;
                if ( this.liquid ) {
                    ctx.fillStyle = this.colorWater;
                } else {
                    ctx.fillStyle = this.colorLand;
                }
                ctx.fillCirc( radOut, radOut, radOut );
                ctx.globalAlpha = 1;

                ctx.save();
                ctx.beginPath();
                ctx.circ( radOut, radOut, rad );
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
                        ctx.beginPath();
                        ctx.moveTo( 0, 0.6 * diam );
                        ctx.lineTo( 0.25 * diam, 0.6 * diam );
                        ctx.stroke();
                        ctx.beginPath();
                        ctx.moveTo( 0.7 * diam, 0.425 * diam );
                        ctx.lineTo( 0.7 * diam, 0.425 * diam );
                        ctx.stroke();
                        break;
                    case 'continental':
                        ctx.fillStyle = this.colorWater;
                        ctx.fillRect( 0, 0, diam, diam );
                        ctx.strokeStyle = this.colorLand;
                        ctx.lineWidth = Math.round( diam * 0.4 );
                        ctx.beginPath();
                        ctx.moveTo( 0, 0.3625 * diam );
                        ctx.lineTo( 0.425 * diam, 0.3625 * diam );
                        ctx.stroke();
                        ctx.lineWidth = Math.round( diam * 0.1 );
                        ctx.beginPath();
                        ctx.moveTo( 0.775 * diam, 0.6125 * diam );
                        ctx.lineTo( diam, 0.6125 * diam );
                        ctx.stroke();
                        ctx.beginPath();
                        ctx.moveTo( 0.475 * diam, 0.7125 * diam );
                        ctx.lineTo( 0.575 * diam, 0.7125 * diam );
                        ctx.stroke();
                        break;
                    case 'insular':
                        ctx.fillStyle = this.colorWater;
                        ctx.fillRect( 0, 0, diam, diam );
                        ctx.lineWidth = Math.round( diam * 0.1 );
                        ctx.strokeStyle = this.colorLand;
                        ctx.beginPath();
                        ctx.moveTo( 0, 0.3 * diam );
                        ctx.lineTo( 0.25 * diam, 0.3 * diam );
                        ctx.stroke();
                        ctx.beginPath();
                        ctx.moveTo( 0.575 * diam, 0.6 * diam );
                        ctx.lineTo( 0.675 * diam, 0.6 * diam );
                        ctx.stroke();
                        ctx.beginPath();
                        ctx.moveTo( 0.3125 * diam, 0.475 * diam );
                        ctx.lineTo( 0.3125 * diam, 0.475 * diam );
                        ctx.stroke();
                        ctx.beginPath();
                        ctx.moveTo( 0.45 * diam, 0.7 * diam );
                        ctx.lineTo( 0.45 * diam, 0.7 * diam );
                        ctx.stroke();
                        ctx.beginPath();
                        ctx.moveTo( 0.775 * diam, 0.35 * diam );
                        ctx.lineTo( 0.775 * diam, 0.35 * diam );
                        ctx.stroke();
                        break;
                    case 'oceanic':
                        ctx.fillStyle = this.colorWater;
                        ctx.fillRect( 0, 0, diam, diam );
                        break;
                    default: break;
                }

                if ( this.iceCap ) {
                    let ice = Math.sqrt( this.iceCap ),
                        diff = radOut - rad;
                    ctx.fillStyle = this.colorIce;
                    ctx.fillRect( 0, 0, diam, diff + rad * ice );
                    ctx.fillRect( 0, diam - diff - rad * ice, diam, diam );
                }

                ctx.restore();
            } else {
                ctx.fillStyle = this.colorLand;
                ctx.fillCirc( radOut, radOut, rad );
            }

            if ( centerX ) dX -= radOut;
            if ( centerY ) dY -= radOut;
            CTX.drawImage( cvs, dX, dY );

            let textX, textY;

            if ( centerY ) {
                textX = x + radOut;
                textY = 92;
                if ( this.isGasGiant ) textY = 128;
                textY = y - textY;
                CTX.textAlign = 'center';
                CTX.fillStyle = 'white';
                CTX.font = '400 32px Dekar';
                console.log(this.name.toUpperCase());
                console.log(this.subClass.toUpperCase());
                CTX.fillText( this.name.toUpperCase(), textX, textY );
                CTX.font = '300 16px Dekar';
                CTX.fillText( this.subClass.toUpperCase(), textX, textY + 16 );
            } else if ( centerX ) {
                let fontSize;
                switch (rad) {
                    case 8:  fontSize = [ 12, 8 ];  break;
                    case 16: fontSize = [ 18, 12 ]; break;
                    case 32: fontSize = [ 24, 14 ]; break;
                    default: fontSize = [ 32, 16 ]; break;
                }
                textX = x + radOut * 1.5;
                textY = y + radOut;
                CTX.textAlign = 'left';
                CTX.fillStyle = 'white';
                CTX.font = `400 ${fontSize[0]}px Dekar`;
                console.log(this.name.toUpperCase());
                console.log(this.subClass.toUpperCase());
                CTX.fillText( this.name.toUpperCase(), textX, textY );
                CTX.font = `300 ${fontSize[1]}px Dekar`;
                textX += fontSize[1] / 2;
                textY += fontSize[0] * 2/3;
                CTX.fillText( this.subClass.toUpperCase(), textX, textY );
            }

            return x + diam;
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
            CVS.height = $(window).height() / 2;

            this.images = [];
            this.loadImages().then( () => {
                let sun, earth, mars;

                this.initGrad( 256 );

                CTX.fillStyle = '#1f1f24';
                CTX.fillRect( 0, 0, CVS.width, CVS.height );

                sun = new Star( 696340, SOLAR_MASS, {
                    name: 'Sol',
                    temp: 5780,
                    luma: 1
                });
                earth = new Planet( 6371, 5.972e24, {
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

                let planets = [
                    /// Mercury
                    new Planet( 2439.7, 3.3011e23, {
                        name: 'Mercury',
                        parent: sun,
                        semi: 57909.05,
                        day: 1407.5,
                        color: COLOR.planet.bright
                    }),
                    /// Venus
                    new Planet( 6051.8, 4.8675e+24, {
                        name: 'Venus',
                        parent: sun,
                        semi: 108208000,
                        atmosphere: 92,
                        day: -5832.5424,
                        color: COLOR.planet.sand
                    }),
                    earth,
                    mars,
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
                    })
                ];

                planets.sort( function ( a, b ) {
                    return a.semi - b.semi
                });

                let pad = 40,
                    x = pad,
                    pos = {};

                x = sun.draw( x, CVS.height/2 ) + pad;
                planets.forEach( ( planet ) => {
                    if ( !planet.parent || planet.parent.name !== 'Sol' ) return;
                    let pX = planet.draw( x, CVS.height / 2 ),
                        w = pX - x;
                    pos[ planet.name ] = [ x + w / 2, ( CVS.height + w + pad ) / 2 ];
                    x = pX + pad;
                });
                planets.forEach( ( planet ) => {
                    if ( !planet.parent ) return;
                    let name = planet.parent.name;
                    let p = pos[ name ];
                    if ( !p ) return;
                    let x = p[0],
                        y = p[1],
                        pX = planet.draw( x, y, true, false ),
                        w = pX - x;
                    p[1] += w + pad / 2;
                });

                console.log(planets);
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
    }

    $(function () {
        let app = new App();
    });
})();
