/*jshint esversion: 7*/

import * as THREE from '/build/three.js/build/three.module.js';

export default ( function () {
    /// CONSTANTS

    const VERSION = '230105';
    const EXPORTS = {};

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


    const sigma = function ( func, min = 0, max = Infinity, precision = 0.001 ) {
        var count = 0;
        var sum = 0;
        for ( let i = min; i < max; ++i ) {
            const val = func( i );
            sum += val;
            if ( val < precision ) break;
            ++count;
            if ( count > 1000000 ) return Infinity * Math.sign( sum );
        }
        return sum;
    };
    const factorial = function ( x ) {
        x = Math.floor( x );
        if ( x <= 1 ) return 1;
        return x * factorial( x - 1 );
    };
    const calcBessel = function ( x, a ) {
        return sigma( ( n ) => {
            const s_a = ( -1 ) ** n;
            const s_b = factorial( n ) * factorial( n + a );
            const s_c = ( x / 2 ) ** ( 2 * n + a );
            return s_c * s_a / s_b;
        }, 0, Infinity );
    };

    const calcMeanAnomalyFromTrue = function ( true_anomaly, ecc ) {
        const sin_f = Math.sin( true_anomaly );
        const cos_f = Math.cos( true_anomaly );
        const x = -ecc - cos_f;
        const y = -Math.sqrt( 1 - ecc ** 2 ) * sin_f;
        const u = ( 1 + ecc ) * cos_f;
        const v = - ecc * -y / u;
        return ( Math.atan2( y, x ) + v + Math.PI ) % ( 2 * Math.PI );
    };

    const calcTrueAnomalyFromMean = function ( mean_anomaly, ecc ) {
        const B = ( 1 - Math.sqrt( 1 - ecc * 2 ) ) / ecc;
        const sb = sigma( ( k ) => {
            const sa_0 = sigma( ( n ) => {
                const a = calcBessel( -k * ecc, n );
                const b = B ** Math.abs( k + n );
                return a * b;
            }, 0, Infinity );
            const sa_1 = sigma( ( n ) => {
                const a = calcBessel( -k * ecc, -n );
                const b = B ** Math.abs( k - n );
                return a * b;
            }, 0, Infinity );
            const sa = sa_0 + sa_1;
            return Math.sin( k * mean_anomaly ) * sa / k;
        }, 1, Infinity );
        return mean_anomaly + 2 * sb;
    };


    // /** Describes an ellipse using Keplerian elements.
    //  * @class
    //  */
    // class KeplerEllipse {
    //     /** Creates a new orbital ellipse.
    //      * @param {number} [eccentricity=0] - The shape of the orbit, from circular (0) to linear (1). Values greater than 1 describe a hyperbolic trajectory.
    //      * @param {number} [semimajor=0] - The average distance (in kilometers) between the apses of the orbit.
    //      * @param {number} [inclination=0] - The angle (in radians) of the orbit past the reference plane.
    //      * @param {number} [ascendingnode=0] - The angle (in radians) from the parent body's direction to the point where the orbiting body crosses from beneath the reference plane to above it.
    //      * @param {number} [argumentperiapsis=0] - Angle (in radians) from the ascending node to where the periapsis is located in the orbit.
    //      * @param {number} [anomaly=0] - The true anomaly at epoch; the angle (in radians) between the argument of periapsis and the object itself at the reference time.
    //      */
    //     constructor( eccentricity, semimajor, inclination, ascendingnode, argumentperiapsis, anomaly ) {
    //         /** @type {object} Orbital elements. */
    //         this.kepler = {
    //             /** @type {number} Eccentricity; the shape of the orbit, from circular (0) to linear (1). Values greater than 1 describe a hyperbolic trajectory. */
    //             e: eccentricity || 0,
    //             /** @type {number} Semi-major axis; the average distance (in kilometers) between the apses of the orbit. */
    //             a: semimajor || 0,
    //             /** @type {number} Inclination; the angle (in radians) of the orbit past the reference plane. */
    //             i: inclination || 0,
    //             /** @type {number} Longitude of the ascending node; the angle (in radians) from the parent body's direction to the point where the orbiting body crosses from beneath the reference plane to above it. */
    //             raan: ascendingnode || 0,
    //             /** @type {number} Argument of periapsis; Angle (in radians) from the ascending node to where the periapsis is located in the orbit. */
    //             arg: argumentperiapsis || 0,
    //             /** @type {number} True Anomaly: the angle (in radians) between the argument of periapsis and the object itself at the reference time. */
    //             v: anomaly || 0,
    //         };
    //     }

    //     /** @prop {number} - Apoapsis: The distance of the orbiting body from the center of mass at its furthest point. */
    //     get apoapsis() {
    //         return this.a * ( 1 + this.e );
    //     }
    //     /** @prop {number} - Periapsis: The distance of the orbiting body from the center of mass at its closest point. */
    //     get periapsis() {
    //         return this.a * ( 1 - this.e );
    //     }

    //     /** Set the semi-major axis and the eccentricity from the periapsis and the apoapsis.
    //      * @param {number} periapsis - The periapsis.
    //      * @param {number} apoapsis - The apoapsis.
    //      */
    //     setApses( periapsis, apoapsis ) {
    //         this.kepler.a = ( periapsis + apoapsis ) / 2;
    //         this.kepler.e = apoapsis / this.kepler.semi - 1;
    //     }
    // }

    var body_id = 0;
    class Body {
        /** Creates a new physical body.
         * @param {object} prop - Data defining this body.
         * @param {THREE.Vector3} [prop.position] - State vector "r": the position compared to the parent body.
         * @param {THREE.Vector3} [prop.velocity] - State vector "v": the velocity compared to the parent body.
         * @param {number|THREE.Vector3} prop.mass - The mass.
         * @param {number|THREE.Vector3} prop.radius - The radius.
         * @param {string} [prop.color] - The HTML color.
         * @param {string} [prop.name] - The name of this body.
         */
        constructor( prop ) {
            /** @type {object} The state vectors of this body. */
            this.state = {
                /** @type {THREE.Vector3} The velocity state vector. */
                r: ( prop.position instanceof THREE.Vector3 ) ? prop.position.clone() : new THREE.Vector3().setScalar( 0 ),
                /** @type {THREE.Vector3} The position state vector. */
                v: ( prop.velocity instanceof THREE.Vector3 ) ? prop.velocity.clone() : new THREE.Vector3().setScalar( 0 )
            }
            /** @type {object} Physical of this body. */
            this.params = {
                mass: ( prop.mass instanceof THREE.Vector3 ) ? prop.mass.clone() : new THREE.Vector3( 1, 1, 1 ).setLength( prop.mass || 0 ),
                radius: ( prop.radius instanceof THREE.Vector3 ) ? prop.radius.clone() : new THREE.Vector3( 1, 1, 1 ).setLength( prop.radius || 0 ),
            };

            this.color = prop.color || 'lightgrey';
            this.name = prop.name || '';

            this.id = body_id++;
        }

        /** Sets position and velocity from Keplerian orbital elements.
         * Source: https://downloads.rene-schwarz.com/download/M001-Keplerian_Orbit_Elements_to_Cartesian_State_Vectors.pdf
         * @param {number} parent_mass - Mass of the reference object.
         * @param {object} elements - Orbital elements.
         * @param {number} [elements.e=0] - The shape of the orbit, from circular (0) to linear (1). Values greater than 1 describe a hyperbolic trajectory.
         * @param {number} [elements.a=0] - The average distance (in kilometers) between the apses of the orbit.
         * @param {number} [elements.i=0] - The angle (in radians) of the orbit past the reference plane.
         * @param {number} [elements.raan=0] - The angle (in radians) from the parent body's direction to the point where the orbiting body crosses from beneath the reference plane to above it.
         * @param {number} [elements.arg=0] - Angle (in radians) from the ascending node to where the periapsis is located in the orbit.
         * @param {number} [elements.v=0] - The true anomaly at epoch; the angle (in radians) between the argument of periapsis and the object itself at the reference time.
         * @param {number} time - (Currently always epoch.) The number of seconds since epoch.
         */
        setFromOrbitalElements( parent_mass, elements = {}, time = 0 ) {
            const M = parent_mass + this.params.mass.length();
            const e = elements.e || 0;
            const a = elements.a || 0;
            const i = elements.i || 0;
            const raan = elements.raan || 0;
            const w = elements.arg || 0;
            const v = elements.v || 0;
            const GM = CONST.G.value * M;

            // /** @type {number} Mean anomaly at epoch. */
            // const mean_epoch = calcMeanAnomalyFromTrue( v, e );
            // /** @type {number} Mean anomaly at given time. */
            // const mean_anom = mean_epoch + time * Math.sqrt( GM / ( a ** 3 ) ) % ( Math.PI * 2 );
            // /** @type {number} True anomaly at given time. */
            // const true_anom = calcTrueAnomalyFromMean( mean_anom, e );
            // console.log( 'True anomaly at v0:', v );
            // console.log( 'Mean anomaly at v0:', mean_epoch );
            // console.log( 'Mean anomaly at vt:', mean_anom );
            // console.log( 'True anomaly at vt:', true_anom );
            const true_anom = v;

            /** https://www.mathworks.com/matlabcentral/fileexchange/80632-kepler2carts */
            const sin_nu = Math.sin( true_anom );
            const cos_nu = Math.cos( true_anom );
            const p = a * ( 1 - e ** 2 );
            const r_0 = p / ( 1 + e * cos_nu );
            const px = r_0 * cos_nu;
            const py = r_0 * sin_nu;
            const vx = -Math.sqrt( GM / p ) * sin_nu;
            const vy = Math.sqrt( GM / p ) * ( e + cos_nu );
            const xx = Math.cos( raan ) * Math.cos( w ) - Math.sin( raan ) * Math.sin( w ) * Math.cos( i );
            const xy = -Math.cos( raan ) * Math.sin( w ) - Math.sin( raan ) * Math.cos( w ) * Math.cos( i );
            const yx = Math.sin( raan ) * Math.cos( w ) + Math.cos( raan ) * Math.sin( w ) * Math.cos( i );
            const yy = -Math.sin( raan ) * Math.sin( w ) + Math.cos( raan ) * Math.cos( w ) * Math.cos( i );
            const zx = Math.sin( w ) * Math.sin( i );
            const zy = Math.cos( w ) * Math.sin( i );
            this.state.r.set(
                px * xx + py * xy,
                px * yx + py * yy,
                px * zx + py * zy
            );
            this.state.v.set(
                vx * xx + vy * xy,
                vx * yx + vy * yy,
                vx * zx + vy * zy
            );
        }
    }

    /** Displays the current version. */
    EXPORTS.version = function () {
        return `av.kepler.module.js v.${ VERSION }`;
    };

    EXPORTS.Body = Body;
    EXPORTS.constants = CONST;

    return EXPORTS;
} )();
