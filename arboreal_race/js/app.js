(function () {
    const extendCTX = ( ctx ) => {
        let proto = Object.getPrototypeOf( ctx );
        proto.clear = function () {
            this.clearRect( 0, 0, this.canvas.width, this.canvas.height );
        };
        proto.circ = function ( x, y, r ) {
            this.arc( x, y, r, 0, 2 * Math.PI );
        };
        proto.fillCirc = function ( x, y, r ) {
            this.beginPath();
            this.arc( x, y, r, 0, 2 * Math.PI );
            this.closePath();
            this.fill();
        };
        proto.strokeCirc = function ( x, y, r ) {
            this.beginPath();
            this.arc( x, y, r, 0, 2 * Math.PI );
            this.closePath();
            this.stroke();
        };
        proto.line = function ( x1, y1, x2, y2 ) {
            this.beginPath();
            this.moveTo( x1, y1 );
            this.lineTo( x2, y2 );
            this.stroke();
        };
    };
    const lerp = function ( a, b, t ) {
        return a + ( b - a ) * t;
    };
    const lerp2D = function ( a, b, t ) {
        let c = [];
        for ( let i = 0; i < 2; ++i ) {
            c[i] = lerp( a[i], b[i], t );
        }
        return c;
    };
    const polarToCart = function ( rad, ang, origin ) {
        origin = origin || [ 0, 0 ];
        return [
            origin[0] + rad * Math.cos( -ang ),
            origin[1] + rad * Math.sin( -ang )
        ];
    };

    var CVS = $('#output').get(0);
    var CTX = CVS.getContext('2d');


    class Character {
        constructor( prop ) {
            this.x = prop.position[0] || 0;
            this.y = prop.position[1] || 0;
            this.vec = {};
            this.poly = {};

            this.initVecs();
            this.initPolys();

            this.initControls();
        }

        initVecs() {
            this.addVec( 'ankle',     127, 120 );
            this.addVec( 'butt',      136,  34 );
            this.addVec( 'chest',     -28,  80 );
            this.addVec( 'cranium',   -82, -33 );
            this.addVec( 'crest',     -14,   0 );
            this.addVec( 'ear_back',  -64, -37 );
            this.addVec( 'ear_front', -82, -47 );
            this.addVec( 'ear_tip',   -78, -53 );
            this.addVec( 'elbow',      10,  86 );
            this.addVec( 'brow',     -104, -17 );
            this.addVec( 'groin',      87,  75 );
            this.addVec( 'heel_fore',   2, 161 );
            this.addVec( 'heel_hind', 135, 161 );
            this.addVec( 'hock',      144, 111 );
            this.addVec( 'knee',       94,  92 );
            this.addVec( 'leg',       -15,  82 );
            this.addVec( 'mouth',    -115,  17 );
            this.addVec( 'nail_fore', -20, 161 );
            this.addVec( 'nail_hind', 114, 161 );
            this.addVec( 'nape',      -62, -28 );
            this.addVec( 'neck',      -68,  54 );
            this.addVec( 'nose',     -125,   4 );
            this.addVec( 'pastern',     8, 132 );
            this.addVec( 'paw_fore',   -5, 149 );
            this.addVec( 'paw_hind',  127, 151 );
            this.addVec( 'root',        0,   0 );
            this.addVec( 'rump',      105,   4 );
            this.addVec( 'set',       123,   9 );
            this.addVec( 'stop',     -103, -12 );
            this.addVec( 'tail_a',    149,  21 );
            this.addVec( 'tail_b',    169,  63 );
            this.addVec( 'tail_c',    169, 114 );
            this.addVec( 'tail_d',    148, 122 );
            this.addVec( 'tail_e',    130,  75 );
            this.addVec( 'thigh',     130,  75 );
            this.addVec( 'throat',    -84,  13 );
            this.addVec( 'toe_fore',  -20, 154 );
            this.addVec( 'toe_hind',  114, 155 );
            this.addVec( 'wrist',      -5, 132 );
        }

        initPolys() {
            this.addPoly( 'body', [ 'root', 'elbow', 'groin', 'rump' ] );
            this.addPoly( 'ear', [ 'cranium', 'ear_front', 'ear_tip', 'ear_back', 'nape' ] );
            this.addPoly( 'head', [ 'stop', 'throat', 'nape', 'cranium', 'brow' ] );
            this.addPoly( 'leg_fore', [ 'leg', 'elbow', 'pastern', 'wrist' ] );
            this.addPoly( 'leg_hind', [ 'ankle', 'hock', 'heel_hind', 'paw_hind' ] );
            this.addPoly( 'muzzle', [ 'stop', 'nose', 'mouth', 'throat' ] );
            this.addPoly( 'neck', [ 'neck', 'throat', 'nape', 'crest', 'chest' ] );
            this.addPoly( 'paw_fore', [ 'paw_fore', 'toe_fore', 'nail_fore', 'heel_fore' ] );
            this.addPoly( 'paw_hind', [ 'paw_hind', 'toe_hind', 'nail_hind', 'heel_hind' ] );
            this.addPoly( 'shoulder', [ 'root', 'elbow', 'chest', 'crest' ] );
            this.addPoly( 'tail', [ 'set', 'tail_a', 'tail_b', 'tail_c', 'tail_d', 'tail_e' ] );
            this.addPoly( 'thigh_lower', [ 'thigh', 'hock', 'ankle', 'knee', 'butt' ] );
            this.addPoly( 'thigh_upper', [ 'rump', 'set', 'butt', 'knee', 'groin' ] );
            this.addPoly( 'wrist', [ 'wrist', 'pastern', 'heel_fore', 'paw_fore' ] );
        }

        initControls() {
            var attr = {},
                update = () => {
                    var heft = +attr.heft,
                        armWidth = +attr.arm_width,
                        headShape = +attr.muzzle_shape,
                        earShape = +attr.ear_shape,
                        tailSize = +attr.tail_size;

                    let headVal = ( 2 * headShape ** 0.5 + 1 - heft ) / 3,
                        earVal = ( 2 * earShape + headShape ** 0.5 ) / 3,
                        bulkVal = ( armWidth + 2 * heft ** 2 ) / 3,
                        crestAng, thighPos;

                    /// Head
                    this.vec.nape.pos = lerp2D(
                        [ -51, -11 ],
                        [ -57, -33 ],
                        headVal
                    );
                    this.vec.throat.pos = lerp2D(
                        [ -85, 36 ],
                        [ -79, 0 ],
                        headVal
                    );
                    this.vec.stop.pos = [
                        -104,
                        lerp( 6, -15, headVal )
                    ];
                    this.vec.brow.pos = [
                        this.vec.stop.pos[0],
                        this.vec.stop.pos[1] - 5
                    ];
                    this.vec.nose.pos = polarToCart(
                        lerp( 22, 30, headShape ),
                        ( lerp( 40, 35, headShape ) + 180 ) * Math.PI / 180,
                        this.vec.stop.pos
                    );
                    this.vec.mouth.pos = polarToCart(
                        lerp( 26, 34, headShape ),
                        lerp( -182, -170, headShape ) * Math.PI / 180,
                        this.vec.throat.pos
                    );
                    this.vec.cranium.pos = polarToCart(
                        27,
                        36 * Math.PI / 180,
                        this.vec.brow.pos
                    );

                    /// Ear
                    this.vec.ear_front.pos = polarToCart(
                        15,
                        lerp( 80, 90, headShape ) * Math.PI / 180,
                        this.vec.cranium.pos
                    );
                    this.vec.ear_tip.pos = polarToCart(
                        lerp( 22, 28, earVal ),
                        lerp( 62, 73, earVal ) * Math.PI / 180,
                        this.vec.cranium.pos
                    );
                    this.vec.ear_back.pos = polarToCart(
                        22,
                        lerp( 316, 300, earShape ) * Math.PI / 180,
                        this.vec.ear_tip.pos
                    );

                    /// Neck
                    this.vec.chest.pos = [
                        lerp( -29, -40, armWidth ),
                        lerp( 66, 77, heft )
                    ];
                    this.vec.neck.pos[1] = lerp(
                        this.vec.chest.pos[1],
                        this.vec.throat.pos[1],
                        0.5
                    );
                    crestAng = Math.atan2(
                        this.vec.root.pos[0] - this.vec.nape.pos[0],
                        this.vec.root.pos[1] - this.vec.nape.pos[1]
                    ) + 90 * Math.PI / 180;
                    this.vec.crest.pos = polarToCart(
                        15,
                        lerp( Math.PI, crestAng, 1 - heft ** 0.5 ),
                        this.vec.root.pos
                    );

                    /// Body
                    this.vec.groin.pos = lerp2D(
                        [ 72, 62 ],
                        [ 89, 78 ],
                        bulkVal
                    );

                    /// Legs
                    this.vec.elbow.pos = [
                        lerp( -2, 12, armWidth ),
                        lerp( 75, 90, heft )
                    ];
                    this.vec.leg.pos = lerp2D(
                        this.vec.chest.pos,
                        this.vec.elbow.pos,
                        lerp( 0.333, 0, armWidth )
                    );
                    this.vec.wrist.pos = [
                        lerp( -16, -18, armWidth ),
                        132 - 14 * armWidth
                    ];
                    this.vec.pastern.pos = [
                        lerp( -2, 8, armWidth ),
                        this.vec.wrist.pos[1]
                    ];
                    this.vec.knee.pos = [
                        lerp( 87, 93, armWidth ),
                        lerp( 88, 97, heft )
                    ];
                    thighPos = [
                        lerp( 111, 139, bulkVal ),
                        lerp( 92, 67, bulkVal )
                    ];
                    this.vec.thigh.pos = lerp2D(
                        thighPos,
                        lerp2D(
                            this.vec.butt.pos,
                            this.vec.hock.pos,
                            0.5
                        ),
                        armWidth * 0.75
                    );
                    this.vec.butt.pos = [
                        lerp( 118, 152, bulkVal ),
                        lerp( 28, 41, bulkVal )
                    ];
                    this.vec.set.pos = [
                        lerp( 104, 130, bulkVal ),
                        lerp( 5, 15, bulkVal )
                    ];
                    this.vec.rump.pos = [
                        lerp( 82, 95, heft ),
                        0
                    ];
                    this.vec.hock.pos = [
                        lerp( 131, 135, armWidth ),
                        lerp( 116, 107, armWidth )
                    ];
                    this.vec.ankle.pos = [
                        lerp( 119, 102, armWidth ),
                        lerp( 125, 113, armWidth )
                    ];
                    this.vec.heel_hind.pos = [
                        lerp( 125, 120, armWidth ),
                        this.vec.heel_fore.pos[1]
                    ];
                    this.vec.paw_fore.pos[0] = lerp( -22, -18, armWidth );
                    this.vec.heel_fore.pos[0] = lerp( -14, 0, armWidth );
                    this.vec.toe_fore.pos[0] = lerp( -28, -34, armWidth );
                    this.vec.nail_fore.pos[0] = this.vec.toe_fore.pos[0];
                    this.vec.paw_hind.pos = [
                        this.vec.ankle.pos[0],
                        this.vec.paw_fore.pos[1] + 2
                    ];
                    this.vec.toe_hind.pos = [
                        this.vec.paw_hind.pos[0] - lerp( 5, 16, armWidth ),
                        this.vec.paw_hind.pos[1] + 4
                    ];
                    this.vec.nail_hind.pos = [
                        this.vec.toe_hind.pos[0],
                        this.vec.heel_hind.pos[1]
                    ];

                    /// Tail
                    this.vec.tail_e.pos = lerp2D(
                        this.vec.butt.pos,
                        this.vec.thigh.pos,
                        Math.min( 2 * tailSize ** 0.5, 1 )
                    );
                    this.vec.tail_a.pos = polarToCart(
                        lerp( 14, 30, tailSize ),
                        335 * Math.PI / 180,
                        this.vec.set.pos
                    );
                    this.vec.tail_d.pos = lerp2D(
                        [ this.vec.tail_e.pos[0] + 8, this.vec.tail_e.pos[1] ],
                        [ ( this.vec.set.pos[0] + this.vec.tail_a.pos[0] ) / 2, 128 ],
                        tailSize ** 0.5
                    );
                    this.vec.tail_c.pos = polarToCart(
                        lerp( 10, 22, Math.sin( tailSize * Math.PI * 0.85 ) ),
                        lerp( 9, 28, tailSize ) * Math.PI / 180,
                        this.vec.tail_d.pos
                    );
                    this.vec.tail_b.pos = [
                        this.vec.tail_c.pos[0] + lerp( 0, 8, tailSize ),
                        lerp(
                            this.vec.tail_a.pos[1],
                            this.vec.tail_c.pos[1],
                            lerp( 2/3, 0.5, tailSize )
                        )
                    ];

                };

            $( `.control-input` ).on( 'change input', function () {
                let self = $( this ),
                    id = self.attr( 'id' ).slice( 5 );
                attr[ id ] = self.val();
                update();
            }).change();
        }

        addVec( name, x, y ) {
            this.vec[ name ] = {
                pos: [ x, y ]
            };
        }

        addPoly( name, vecNames ) {
            let poly = [];
            vecNames.forEach( ( val ) => {
                poly.push( this.vec[ val ] );
            });
            this.poly[ name ] = poly;
        }

        drawSilhouette() {
            CTX.translate( this.x, this.y );
            for ( let polyName in this.poly ) {
                let poly = this.poly[ polyName ];
                CTX.beginPath();
                CTX.moveTo( ...poly[0].pos );
                for ( let i = 1, l = poly.length; i < l; ++i ) {
                    CTX.lineTo( ...poly[i].pos );
                }
                CTX.closePath();
                CTX.stroke();
            }
            CTX.translate( -this.x, -this.y );
        }
    }


    class App {
        constructor() {
            this.loops = [];

            this.initCVS();
            this.initCollapsible();

            this.char = new Character({
                position: [ CVS.width / 2, CVS.height / 2 ]
            });

            this.loops.push( () => {
                CTX.clear();
                this.char.drawSilhouette();
            });

            CTX.lineWidth = 1;
            CTX.strokeStyle = '#000000';

            this.startAnims();
        }

        initCVS() {
            CVS.width = $( CVS ).attr( 'width' );
            CVS.height = $( CVS ).attr( 'height' );
            extendCTX( CTX );
            CTX.textBaseline = 'bottom';
        }

        initCollapsible() {
            $('.collapsible').click( function () {
                let self = $( this );
                self.toggleClass( 'active' );
                if ( self.is( '.active' ) ) {
                    self.parent()
                        .siblings( '.menu' )
                        .find( '.collapsible' )
                        .removeClass( 'active' );
                }
            });

            $( '.options-content' ).find( '.control-input' ).after( function () {
                let self = $( this ),
                    txt = $('<input>');
                txt
                    .addClass( '.control-text' )
                    .attr({
                        type: 'text',
                        size: 10,
                        value: self.val()
                    });
                self.on( 'input change', function () {
                    txt.val( self.val() );
                });
                txt.on( 'change', function () {
                    self.val( txt.val() );
                    self.change();
                });
                return txt;
            });
        }

        startAnims() {
            let newLoops = [],
                step = ( t ) => {
                    window.requestAnimationFrame( step );
                    this.loops.forEach( f => {
                        /// Loops should return true to be removed.
                        if ( !f( t ) ) newLoops.push( f );
                    });
                    this.loops = newLoops;
                    newLoops = [];
                };

            window.requestAnimationFrame( step );
        }
    }

    const app = new App();
})();
