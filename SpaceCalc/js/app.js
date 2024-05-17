/*jshint esversion: 7*/

( function () {
    const CONST = {
        AU: {
            value: 149597870.7,
            unit: 'km'
        },
        G: {
            value: 6.6743015e-20,
            unit: 'km3/kg/s2'
        },
    };

    class App {
        constructor () {
            this.units = {
                acceleration: {
                    'm/s2': {
                        unit: 'm/s<sup>2</sup>',
                        name: 'meter per second squared',
                        name_plural: 'meters per second squared',
                        func: x => x
                    },
                    'km/h/s': {
                        name: 'kilometer per hour per second',
                        name_plural: 'kilometers per hour per second',
                        func: x => x * 3.6
                    },
                    'km/h2': {
                        unit: 'km/h<sup>2</sup>',
                        name: 'kilometer per hour squared',
                        name_plural: 'kilometers per hour squared',
                        func: x => x * 12960
                    },
                    'ft/s2': {
                        unit: 'ft/s<sup>2</sup>',
                        name: 'foot per second squared',
                        name_plural: 'feet per second squared',
                        func: x => x * 3.280839895
                    },
                    'g': {
                        name: 'standard acceleration of gravity',
                        name_plural: 'standard acceleration of gravity',
                        func: x => x / 9.80665
                    }
                },
                angle: {
                    'rad': {
                        name: 'radian',
                        func: x => x
                    },
                    'deg': {
                        unit: '&deg;',
                        name: 'degree',
                        func: x => x * 180 / Math.PI
                    },
                    // 'arc': {
                    //     unit: '&deg; \' "',
                    //     name: 'degree, minute, second',
                    //     func: ( x ) => {
                    //         const deg = x * 180 / Math.PI;
                    //         const a = Math.floor( deg );
                    //         const b = Math.floor( deg * 60 ) % 60;
                    //         const c = Math.floor( deg * 3600 ) % 60;
                    //         return `${ a }&deg; ${ b }&apos; ${ c }&quot;`;
                    //     }
                    // },
                    'tau': {
                        func: x => x / ( 2 * Math.PI )
                    }
                },
                density: {
                    'g/cm3': {
                        unit: 'g/cm<sup>3</sup>',
                        name: 'gram per cubic centimeter',
                        name_plural: 'grams per cubic centimeter',
                        func: x => x
                    },
                    'kg/cm3': {
                        unit: 'kg/cm<sup>3</sup>',
                        name: 'kilogram per cubic centimeter',
                        name_plural: 'kilograms per cubic centimeter',
                        func: x => x * 1000
                    },
                    'g/L': {
                        name: 'gram per liter',
                        name_plural: 'grams per liter',
                        func: x => x * 1000
                    },
                    'lb/in3': {
                        unit: 'lb/in<sup>3</sup>',
                        name: 'pound per cubic inch',
                        name_plural: 'pounds per cubic inch',
                        func: x => x / 27.67990471
                    }
                },
                distance: {
                    'mm': {
                        name: 'millimeter',
                        func: x => x * 1e6
                    },
                    'cm': {
                        name: 'centimeter',
                        func: x => x * 1e5
                    },
                    'm': {
                        name: 'meter',
                        func: x => x * 1e3
                    },
                    'km': {
                        name: 'kilometer',
                        func: x => x
                    },
                    'au': {
                        name: 'astronomical unit',
                        func: x => x / 1.495978707e8
                    },
                    'ly': {
                        name: 'lightyear',
                        func: x => x / 9.460730473e12
                    },
                    'pc': {
                        name: 'parsec',
                        func: x => x / 3.085677581e13
                    },
                    'in': {
                        name: 'inch',
                        name_plural: 'inches',
                        func: x => x * 39370.07874
                    },
                    'ft': {
                        name: 'foot',
                        name_plural: 'feet',
                        func: x => x * 3280.839895
                    },
                    'yd': {
                        name: 'yard',
                        func: x => x * 1093.613298
                    },
                    'mi': {
                        name: 'mile',
                        func: x => x * 0.6213711922
                    },
                    'D_l': {
                        unit: '&#x394;<sub>&#x2295;L</sub>',
                        name: 'lunar distance',
                        func: x => x / 384399
                    },
                    'R_l': {
                        unit: 'R<sub>&#x263E;</sub>',
                        name: 'lunar radius',
                        name_plural: 'lunar radii',
                        func: x => x / 1737.4
                    },
                    'R_e': {
                        unit: 'R<sub>&#x2D32;</sub>',
                        name: 'Earth radius',
                        name_plural: 'Earth radii',
                        func: x => x / 6378.1
                    },
                    'R_j': {
                        unit: 'R<sub>&#x2643;</sub>',
                        name: 'Jupiter radius',
                        name_plural: 'Jupiter radii',
                        func: x => x / 71492
                    },
                    'R_s': {
                        unit: 'R<sub>&#x2609;</sub>',
                        name: 'solar radius',
                        name_plural: 'solar radii',
                        func: x => x / 695700
                    }
                },
                force: {
                    'N': {
                        name: 'newton',
                        func: x => x
                    },
                    'gf': {
                        name: 'gram-force',
                        name_plural: 'grams-force',
                        func: x => x * 101.9716213
                    },
                    'lbf': {
                        name: 'pound-force',
                        name_plural: 'pounds-force',
                        func: x => x / 4.448221615
                    }
                },
                luminosity: {
                    'L_s': {
                        unit: 'L<sub>&#x2609;</sub>',
                        name: 'solar luminosity',
                        name_plural: 'solar luminosities',
                        func: x => x
                    },
                    'W': {
                        name: 'watt',
                        func: x => x * 3.848e26
                    }
                },
                mass: {
                    'mg': {
                        name: 'milligram',
                        func: x => x * 1e6
                    },
                    'g': {
                        name: 'gram',
                        func: x => x * 1e3
                    },
                    'kg': {
                        name: 'kilogram',
                        func: x => x
                    },
                    'oz': {
                        name: 'ounce',
                        func: x => x * 35.27396194958041292
                    },
                    'lb': {
                        name: 'pound',
                        func: x => x * 2.204622621848775807
                    },
                    'sh tn': {
                        name: 'US ton',
                        func: x => x / 907.18474
                    },
                    'lg tn': {
                        name: 'UK ton',
                        func: x => x / 1016.046909
                    },
                    'M_l': {
                        unit: 'M<sub>&#x263E;</sub>',
                        name: 'lunar mass',
                        name_plural: 'lunar masses',
                        func: x => x / 7.346e22
                    },
                    'M_e': {
                        unit: 'M<sub>&#x2D32;</sub>',
                        name: 'Earth mass',
                        name_plural: 'Earth masses',
                        func: x => x / 5.9742e24
                    },
                    'M_j': {
                        unit: 'M<sub>&#x2643;</sub>',
                        name: 'Jupiter mass',
                        name_plural: 'Jupiter masses',
                        func: x => x / 1.899e27
                    },
                    'M_s': {
                        unit: 'M<sub>&#x2609;</sub>',
                        name: 'solar mass',
                        name_plural: 'solar masses',
                        func: x => x / 1.98892e30
                    }
                },
                pressure: {
                    'atm': {
                        name: 'atmosphere',
                        func: x => x
                    },
                    'Pa': {
                        name: 'pascal',
                        func: x => x * 101325
                    },
                    'kPa': {
                        name: 'kilopascal',
                        func: x => x * 101.325
                    },
                    'mmHg': {
                        name: 'millimeter of mercury',
                        name_plural: 'millimeters of mercury',
                        func: x => x * 760
                    },
                    'psi': {
                        name: 'pound-force per square inch',
                        name_plural: 'pounds-force per square inch',
                        func: x => x * 14.69594878
                    }
                },
                speed: {
                    'm/s': {
                        name: 'meter per second',
                        name_plural: 'meters per second',
                        func: x => x
                    },
                    'km/h': {
                        name: 'kilometer per hour',
                        name_plural: 'kilometers per hour',
                        func: x => x * 3.6
                    },
                    'ft/s': {
                        name: 'foot per second',
                        name_plural: 'feet per second',
                        func: x => x * 3.280839895
                    },
                    'mph': {
                        name: 'mile per hour',
                        name_plural: 'miles per hour',
                        func: x => x * 2.236936292
                    },
                    'Mach': {
                        name: 'times the speed of sound',
                        name_plural: 'times the speed of sound',
                        func: x => x / 340.27
                    }
                },
                temperature: {
                    'C': {
                        unit: '&deg;C',
                        name: 'degree Celcius',
                        name_plural: 'degrees Celcius',
                        func: x => x,
                    },
                    'F': {
                        unit: '&deg;F',
                        name: 'degree Fahrenheit',
                        name_plural: 'degrees Fahrenheit',
                        func: x => 1.8 * x + 32,
                    },
                    'K': {
                        name: 'Kelvin',
                        func: x => x + 273.15
                    }
                },
                time: {
                    'ms': {
                        name: 'millisecond',
                        func: x => x * 0.001,
                    },
                    's': {
                        name: 'second',
                        func: x => x,
                    },
                    'm': {
                        name: 'minute',
                        func: x => x * 60,
                    },
                    'hr': {
                        name: 'hour',
                        func: x => x * 3600,
                    },
                    'd': {
                        name: 'day',
                        func: x => x * 86400,
                    },
                    'wk': {
                        name: 'week',
                        func: x => x * 604800,
                    },
                    'yr': {
                        name: 'year',
                        func: x => x * 31557600
                    },
                    'Myr': {
                        name: 'million year',
                        func: x => x * 3.1556926e13
                    },
                },
                volume: {
                    'cm3': {
                        unit: 'cm<sup>3</sup>',
                        name: 'cubic centimeter',
                        func: x => x * 1000
                    },
                    'm3': {
                        unit: 'm<sup>3</sup>',
                        name: 'cubic meter',
                        func: x => x / 1000
                    },
                    'mL': {
                        name: 'milliliter',
                        func: x => x * 1000
                    },
                    'L': {
                        name: 'liter',
                        func: x => x
                    },
                    'fl oz': {
                        name: 'fluid ounce',
                        func: x => x * 33.8140227
                    },
                    'in3': {
                        unit: 'in<sup>3</sup>',
                        name: 'cubic inch',
                        name_plural: 'cubic inches',
                        func: x => x * 61.02374409
                    },
                    'c': {
                        name: 'cup',
                        func: x => x * 4.226752838
                    },
                    'pt': {
                        name: 'pint',
                        func: x => x * 2.113376419
                    },
                    'qt': {
                        name: 'quart',
                        func: x => x * 1.056688209
                    },
                    'gal': {
                        name: 'gallon',
                        func: x => x * 0.2641720524
                    }
                }
            };

            Object.keys( this.units ).forEach( ( key ) => {
                const obj = this.units[ key ];
                if ( !obj.unit ) obj.unit = key;
                if ( !obj.name ) obj.name = obj.unit;
                if ( !obj.name_plural ) obj.name_plural = obj.name + 's';
                if ( !obj.func ) obj.func = x => x;
            } );
        }

        convert( val, cat, from, to ) {
            const unit = this.units[ cat ];
            if ( !unit || !unit[ from ] && !unit[ to ] ) return null;
            const from_func = unit[ from ].func;
            const to_func = unit[ to ].func;
            return to_func( 1 / from_func( val ) );
        }
    }

    $( function () {
        const APP = new App();
    } );
} )();
