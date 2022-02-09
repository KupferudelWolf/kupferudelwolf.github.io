export default ( function () {
    /// CONSTANTS

    const VERSION = '220128';
    const EXPORTS = {};


    /// MATH

    EXPORTS.RADIAN = Math.PI * 2;

    /** Keeps a value between two values.
     *
     * @param {number} val Value to compute.
     * @param {number} [min=0] The minimum value.
     * @param {number} [max=1] The maximum value.
     *
     * @returns {number}
     */
    EXPORTS.clamp = function ( val, min = 0, max = 1 ) {
        return Math.min( Math.max( val, min ), max );
    };

    /** Calculates slopes with one Cartesian pair, or distance with two.
     * @summary Quadratic formula.
     *
     * @param {number} x1 X value.
     * @param {number} y1 Y value.
     * @param {number} [x2=0] Second X value if calculating distance.
     * @param {number} [y2=0] Second Y value if calculating distance.
     *
     * @returns {number}
     */
    EXPORTS.dist = function ( x1, y1, x2 = 0, y2 = 0 ) {
        return Math.sqrt( ( x1 - x2 ) ** 2 + ( y1 - y2 ) ** 2 );
    };

    /** Linear interpolation.
     *
     * @param {number} a Starting value.
     * @param {number} b Ending value.
     * @param {number} t Interpolation parameter (0-1).
     *
     * @returns {number}
     */
    EXPORTS.lerp = function ( a, b, t ) {
        return t * ( b - a ) + a;
    };

    /** Linear interpolation between angles.
     *
     * @param {number} a Starting value (in radians).
     * @param {number} b Ending value (in radians).
     * @param {number} t Interpolation parameter (0-1).
     *
     * @returns {number} Value in radians.
     */
    EXPORTS.lerpAngle = function ( a, b, t ) {
        let da = ( b - a ) % RADIAN,
            dist = 2 * da % RADIAN - da;
        return t * dist + a;
    };

    /** Translates a value from one range to another range, and optionally clamps.
     *
     * @param {number} val Value to compute.
     * @param {number} in_min Minimum value of current range.
     * @param {number} in_max Maximum value of current range.
     * @param {number} out_min Minimum value of target range.
     * @param {number} out_max Maximum value of target range.
     * @param {boolean} [do_clamp] Prevent the value from exceeding the target range.
     *
     * @returns {number}
     */
    EXPORTS.map = function ( val, in_min, in_max, out_min, out_max, do_clamp ) {
        let out = ( val - in_min ) * ( out_max - out_min ) / ( in_max - in_min ) + out_min;
        if ( do_clamp ) out = clamp( out, out_min, out_max );
        return out;
    };

    /** Linear congruential pseudorandom number generator.
     * @param {number} seed
     *
     * @returns {number}
     */
    EXPORTS.random = function ( seed ) {
        let m = 2**32,
            a = 22695477,
            c = 1;
        return ( ( seed * a + c ) % m ) / m;
    };


    /// MISC

    /** Initializes and runs stats.js. */
    EXPORTS.createStats = function () {
        const script = document.createElement( 'script' );
        script.onload = function () {
            const stats = new Stats();
            stats.dom.id = 'stats';
            document.body.appendChild( stats.dom );
            requestAnimationFrame( function loop() {
                stats.update();
                requestAnimationFrame( loop );
            });
        };
        script.src = '//mrdoob.github.io/stats.js/build/stats.min.js';
        document.head.appendChild( script );
    };

    /** Displays the current version. */
    EXPORTS.version = function () {
        console.info( `AV.module.js v.${VERSION}` );
    };


    /// Export.

    return EXPORTS;
})();
