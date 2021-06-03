(function () {
    const FLAGS = {
            'Pride Flags': {
                'Pride': {
                    'bars': [ '#E40303', '#FF8C00', '#FFED00', '#008026', '#004DFF', '#750787' ]
                },
                'Pride + POC': {
                    'bars': [ '#000000', '#784F17', '#E40303', '#FF8C00', '#FFED00', '#008026', '#004DFF', '#750787' ]
                },
                'Pride (Progress)': {
                    'bars': [ '#E40303', '#FF8C00', '#FFED00', '#008026', '#004DFF', '#750787' ],
                    'chevron': [ '#000000', '#784F17', '#5BCEFA', '#F5A8B8', '#FFFFFF' ]
                }
            },
            'Sexuality': {
                'Aroace': {
                    'bars': [ '#E28C00', '#ECCD00', '#FFFFFF', '#62AEDC', '#203856' ]
                },
                'Aromantic': {
                    'bars': [ '#3DA542', '#A7D479', '#FFFFFF', '#A3A3A3', '#000000' ]
                },
                'Asexual': {
                    'bars': [ '#000000', '#7f7f7f', '#FFFFFF', '#660066' ]
                },
                'Bisexual': {
                    'bars': [ '#D60270', '#D60270', '#9B4F97', '#0038A7', '#0038A7' ]
                },
                'Demisexual': {
                    'bars': [ '#FFFFFF', '#FFFFFF', '#FFFFFF', '#FFFFFF', '#FFFFFF', '#FFFFFF', '#760789', '#760789', '#B2B2B2', '#B2B2B2', '#B2B2B2', '#B2B2B2', '#B2B2B2', '#B2B2B2' ],
                    'chevron': [ '#000000' ]
                },
                'Graysexual': {
                    'bars': [ '#740195', '#AEB2AA', '#FFFFFF', '#AEB2AA', '#740195' ]
                },
                'Lesbian (5 stripes)': {
                    'bars': [ '#D52D00', '#FF9A56', '#FFFFFF', '#D362A4', '#A30262' ]
                },
                'Lesbian (7 stripes)': {
                    'bars': [ '#D52D00', '#EF7627', '#FF9A56', '#FFFFFF', '#D362A4', '#B55690', '#A30262' ]
                },
                'Pansexual': {
                    'bars': [ '#FF228C', '#FFD800', '#22B1FF' ]
                },
                'Polyamorous': {
                    'bars': [ '#0000FF', '#FF0000', '#000000' ]
                },
                'Polyamorous (new)': {
                    'bars': [ '#FF4141', '#FF4141', '#FF4141', '#FF4141', '#FF4141', '#FF4141', '#FFEC69', '#FFEC69', '#00B3F2', '#00B3F2', '#00B3F2', '#00B3F2', '#00B3F2', '#00B3F2' ],
                    'chevron': [ '#191A1B' ]
                },
                'Polysexual': {
                    'bars': [ '#F61CB9', '#07D569', '#1C92F6' ]
                }
            },
            'Gender Identity': {
                'Agender': {
                    'bars': [ '#000000', '#B9B9B9', '#FFFFFF', '#B8F483', '#FFFFFF', '#B9B9B9', '#000000' ]
                },
                'Androgyne': {
                    'bars': [ '#FE007F', '#9833FF', '#00B7E8' ],
                    'vertical': true
                },
                'Bigender': {
                    'bars': [ '#C479A0', '#ECA6CB', '#D5C7E8', '#FFFFFF', '#D5C7E8', '#9AC7E8', '#6C83CF' ]
                },
                'Demiboy': {
                    'bars': [ '#7F7F7F', '#C3C3C3', '#9AD9EA', '#FFFFFF', '#9AD9EA', '#C3C3C3', '#7F7F7F' ]
                },
                'Demifluid': {
                    'bars': [ '#FEAEC9', '#FEAEC9', '#FEAEC9', '#B1B1B1', '#FBFF74', '#FBFF74', '#FBFF74', '#B1B1B1', '#9AD9EA', '#9AD9EA', '#9AD9EA' ]
                },
                'Demiflux': {
                    'bars': [ '#7F7F7F', '#C3C3C3', '#FEAEC9', '#FBFF74', '#9AD9EA', '#C3C3C3', '#7F7F7F' ]
                },
                'Demigender': {
                    'bars': [ '#7F7F7F', '#C3C3C3', '#FBFF74', '#FFFFFF', '#FBFF74', '#C3C3C3', '#7F7F7F' ]
                },
                'Demigirl': {
                    'bars': [ '#7F7F7F', '#C3C3C3', '#FEAEC9', '#FFFFFF', '#FEAEC9', '#C3C3C3', '#7F7F7F' ]
                },
                'Genderfluid': {
                    'bars': [ '#FE75A1', '#FFFFFF', '#BE17D6', '#000000', '#333EBC' ]
                },
                'Genderflux': {
                    'bars': [ '#F47694', '#F2A2B9', '#CECECE', '#7CE0F7', '#3ECDF9', '#FFF48D' ]
                },
                'Genderqueer': {
                    'bars': [ '#B57EDC', '#FFFFFF', '#4A8123' ]
                },
                'Intersex': {
                    'bars': [ '#FFD800' ],
                    'circle': [ '#7902A9', 80 ]
                },
                'Nonbinary': {
                    'bars': [ '#fdf435', '#FFFFFF', '#9C5CD4', '#000000' ]
                },
                'Transgender': {
                    'bars': [ '#5BCEFA', '#F5A8B8', '#FFFFFF', '#F5A8B8', '#5BCEFA' ]
                },
                'Trigender': {
                    'bars': [ '#FF95C5', '#9580FF', '#67D967', '#9580FF', '#FF95C5' ]
                }
            },
            'Miscellaneous': {
                'Custom': {
                    'custom': true
                }
            }
        },
        FLAGDATA = (function () {
            let out = {};
            for ( let obj of Object.values(FLAGS) ) {
                for ( let [key, val] of Object.entries(obj) ) {
                    out[key] = val;
                }
            }
            return out;
        })();

    class App {
        constructor( cvs ) {
            this.cvs = cvs;
            this.ctx = this.cvs.getContext('2d');

            this.cvsDummy = $('<canvas>')
                .attr( 'width', this.cvs.width )
                .attr( 'height', this.cvs.height )
                .get(0);
            this.ctxDummy = this.cvsDummy.getContext('2d');

            for ( let key of Object.keys(this.data) ) {
                this.__defineGetter__( key, () => this.data[key]);
                this.__defineSetter__( key, (val) => {
                    this.data[key] = val;
                    this.update();
                });
            }
        }

        data = {
            custom: [
                '#E40303',
                '#FF8C00',
                '#FFED00',
                '#008026',
                '#004DFF',
                '#750787'
            ],
            imageFill: true,
            gradient: false,
            image: null,
            imageX: 0,
            imageY: 0,
            imageZ: 1,
            mode: 'Ring',
            splitFlag: false,
            flag1: FLAGDATA['Pride'],
            flag2: FLAGDATA['Pride'],
            width: 80
        }

        update() {
            let w = this.cvs.width,
                h = this.cvs.height;

            this.ctx.globalCompositeOperation = 'source-over';
            this.ctx.clearRect( 0, 0, w, h );

            /// Draw the flag.
            // this.ctx.save();
            if ( this.mode === 'Overlay' ) {
                this.ctx.globalAlpha = 1/3;
            }
            if ( this.splitFlag ) {
                this.drawFlag( this.flag1 );
                this.ctx.drawImage( this.cvsDummy,
                    0, 0, this.cvs.width/2, this.cvs.height,
                    0, 0, this.cvs.width/2, this.cvs.height
                );
                // this.ctx.beginPath();
                // this.ctx.rect( w/2, 0, w/2, h );
                // this.ctx.clip();
                this.drawFlag( this.flag2 );
                this.ctx.drawImage( this.cvsDummy,
                    this.cvs.width/2, 0, this.cvs.width/2, this.cvs.height,
                    this.cvs.width/2, 0, this.cvs.width/2, this.cvs.height
                );
            } else {
                this.drawFlag( this.flag1 );
                this.ctx.drawImage( this.cvsDummy, 0, 0 );
            }
            this.ctx.globalAlpha = 1;
            // this.ctx.restore();

            /// Mask the flag.
            if ( this.mode !== 'Overlay' ) {
                this.ctx.fillStyle = 'black';
                if ( this.mode === 'Ring' ) {
                    this.ctx.globalCompositeOperation = 'destination-in';
                    this.ctx.beginPath();
                    this.ctx.arc( w/2, h/2, w/2, 0, 2 * Math.PI );
                    this.ctx.fill();
                }
                this.ctx.globalCompositeOperation = 'destination-out';
                this.ctx.beginPath();
                this.ctx.arc( w/2, h/2, w/2 - this.width, 0, 2 * Math.PI );
                this.ctx.fill();
            }

            if ( !this.image ) return;

            /// Draw the PFP.
            this.ctx.globalCompositeOperation = 'destination-over';
            let img = this.image,
                inW = img.width,
                inH = img.height,
                aspect = inW / inH,
                outX = 0,
                outY = 0,
                outW = w,
                outH = h;
            if ( this.imageFill ) {
                let temp = inW;
                inW = inH;
                inH = temp;
            }
            if ( inH > inW ) {
                outW *= aspect;
                outX = Math.ceil((this.cvs.width - outW) / 2);
            } else if ( inW > inH ) {
                outH /= aspect;
                outY = Math.ceil((this.cvs.height - outH) / 2);
            }
            this.ctx.save();
            this.ctx.translate( w/2, h/2 );
            this.ctx.scale( this.imageZ, this.imageZ );
            this.ctx.translate( -w/2, -h/2 );
            this.ctx.drawImage(
                img,
                outX + this.imageX, outY + this.imageY,
                outW, outH
            );
            this.ctx.restore();
        }

        drawFlag( prop ) {
            let w = this.cvs.width,
                h = this.cvs.height;

            this.ctxDummy.save();
            if ( prop.vertical ) {
                this.ctxDummy.translate( w/2, h/2 );
                this.ctxDummy.rotate( Math.PI / 2 );
                this.ctxDummy.translate( -w/2, -h/2 );
            }

            if ( prop.custom ) {
                prop.bars = this.data.custom;
            }

            if ( prop.bars ) {
                if ( this.gradient ) {
                    let grad = this.ctxDummy.createLinearGradient( 0, 0, 0, h );
                    grad.addColorStop( 0, prop.bars[0] );
                    for ( let i = 0, l = prop.bars.length; i < l; ++i ) {
                        grad.addColorStop( (i + 0.5) / l, prop.bars[i] );
                    }
                    grad.addColorStop( 1, prop.bars[ prop.bars.length - 1 ] );
                    this.ctxDummy.fillStyle = grad;
                    this.ctxDummy.fillRect( 0, 0, w, h );
                } else {
                    let x = 0,
                        y = 0,
                        hs = Math.ceil(h / prop.bars.length);
                    prop.bars.forEach( ( col ) => {
                        this.ctxDummy.fillStyle = col;
                        this.ctxDummy.fillRect( x, y, w, hs );
                        y += hs;
                    });
                }
            }

            // if ( prop.vertical ) {
            //     this.ctxDummy.translate( w/2, h/2 );
            //     this.ctxDummy.rotate( -Math.PI / 2 );
            //     this.ctxDummy.translate( -w/2, -h/2 );
            // }
            this.ctxDummy.restore();

            // if ( this.gradient ) return;

            if ( prop.chevron ) {
                let x = 0,
                    ws = w / 2,
                    off = ws / 6,
                    max = prop.chevron.length;
                for (let i = 0; i < max; ++i) {
                    let ind = Math.min( i, max ),
                        col = prop.chevron[ind];
                    this.ctxDummy.fillStyle = col;
                    this.ctxDummy.beginPath();
                    this.ctxDummy.moveTo( x - off, 0 );
                    this.ctxDummy.lineTo( x + ws, h / 2 );
                    this.ctxDummy.lineTo( x - off, h );
                    this.ctxDummy.closePath();
                    this.ctxDummy.fill();
                    x -= off;
                }
            }
            if ( prop.circle ) {
                this.ctxDummy.lineWidth = prop.circle[1];
                this.ctxDummy.beginPath();
                if ( this.mode === 'Overlay' ) {
                    this.ctxDummy.strokeStyle = prop.circle[0];
                    this.ctxDummy.arc( w/2, h/2, w/3 - prop.circle[1], 0, 2 * Math.PI );
                    this.ctxDummy.stroke();
                } else {
                    this.ctxDummy.fillStyle = prop.circle[0];
                    this.ctxDummy.arc( w/2, h/2, w/2 - this.width/2, 0, 2 * Math.PI );
                    this.ctxDummy.fill();
                }
            }
        }
    }

    $(function () {
        const APP = new App(  $('canvas#output').get(0) );

        /// Construct select options.
        for ( let [group, opts] of Object.entries(FLAGS) ) {
            let optgroup = $('<optgroup>').attr('label', group).appendTo('#flag1, #flag2');
            for ( let [name, value] of Object.entries(opts) ) {
                $('<option>')
                    .attr('value', name)
                    .text(name)
                    .appendTo(optgroup);
            }
        }

        $('#flag2').html( $('#flag1').html() );

        $('.tab-container').each( function () {
            let cont = $(this);
            cont.children('.tab').children('.tab-links')
                .on( 'click', function () {
                    let self = $(this),
                        targ = $( `.tab-content#${ self.data('target') }` );
                    if (!targ.length || !cont.length) return;

                    cont.children('.tab-content').removeClass('active');
                    cont.children('.tab').children('.tab-links').removeClass('active');

                    self.addClass('active');
                    targ.addClass('active');
                } )
                .first()
                .addClass( 'active' );
            cont.children('.tab-content')
                .first()
                .addClass( 'active' );
        });

        $('canvas#output')
            .on( 'mousewheel', function (e) {
                e.preventDefault();
                let dz = e.originalEvent.wheelDelta / 120;
                $('#offset-z').val($('#offset-z').val() * 1 + dz * 0.1).trigger('input');
            })
            .on( 'mousedown', function (e) {
                e.preventDefault();
                let self = $(this);
                self.data('x', e.pageX)
                    .data('y', e.pageY)
                    .addClass('active');
            })
            .on( 'mousemove', function (e) {
                e.preventDefault();
                let self = $(this);
                if ( !self.is('.active') ) return;
                let dx = e.pageX - self.data('x') * 1,
                    dy = e.pageY - self.data('y') * 1;
                $('#offset-x').val($('#offset-x').val() * 1 + dx * 2).trigger('input');
                $('#offset-y').val($('#offset-y').val() * 1 + dy * 2).trigger('input');
                self.data('x', e.pageX)
                    .data('y', e.pageY);
            })
            .on( 'mouseup mouseleave', function (e) {
                e.preventDefault();
                $(this).removeClass('active');
            });

        $('#input-img').on( 'change', function () {
            if ( !this.files ) return;
            let imageFile = this.files[0],
                reader = new FileReader();
            reader.readAsDataURL(imageFile);
            reader.onloadend = function (e) {
                let img = new Image();
                img.src = this.result;
                img.onload = function () {
                    APP.image = img;
                }
            }
        });

        $('#input-url').on( 'change input', function () {
            let img = new Image(),
                val = $(this).val();
            img.onerror = function () {
                let url = new URL(val),
                    host = url.hostname.split('.').slice(-2, -1)[0],
                    user = url.pathname.split('/').pop();
                img.src = `https://unavatar.vercel.app/${host}/${user}`;
                img.onerror = function () {
                    console.error(`Failed to find an image at ${val}.`);
                    img.src = 'https://abs.twimg.com/sticky/default_profile_images/default_profile_normal.png';
                }
            }
            img.onload = function () {
                APP.image = img;
            }
            img.src = val;
        });

        $('#include-flag2').on( 'change', function () {
            $('#flag2').prop( 'disabled', !$(this).attr('checked') );
            APP.splitFlag = $(this).is(':checked');
        });

        $('input[name="is-fill"]').on( 'change', function () {
            APP.imageFill = $(this).val() === 'Fill';
            // APP.data.imageFill = $(this).val() === 'Fill';
            // APP.data.imageX = 0;
            // APP.data.imageY = 0;
            // APP.data.imageZ = 1;
            // $('#offset-x, #offset-y, #offset-z').val(0);
            // APP.update();
        });

        $('#flag1, #flag2').on( 'change', function () {
            let id = $(this).attr('id'),
                val = $(this).val();
            APP[id] = FLAGDATA[ val ];
            if ( val === 'Custom' ) {
                $('#color-pickers').show();
            } else {
                $('#color-pickers').hide();
            }
        });

        $('#gradient').on( 'change', function () {
            APP.gradient = $(this).is(':checked');
        });

        $('input[name="mode"]').on( 'change', function () {
            APP.mode = $(this).val();
        });

        $('#width').on( 'change input', function () {
            APP.width = $(this).val();
        });

        $('#offset-x, #offset-y, #offset-z').on( 'change input', function () {
            let id = 'image' + $(this).attr('id').slice(-1).toUpperCase();
            APP[id] = $(this).val() * 1;
        });

        $('#color-pickers input[type="color"]').on( 'change input', function () {
            let ind = $(this).attr('id').split('-').pop() * 1;
            APP.data.custom[ind] = $(this).val();
            APP.update();
        });

        $('#num-bars').on( 'change input', function () {
            $('#color-pickers input[type="color"]').hide();
            APP.data.custom = [];
            for ( let i = 0, l = $(this).val(); i < l; ++i ) {
                APP.data.custom[i] = $(`#color-${i}`).show().val();
            }
            APP.update();
        });

        $('#reset').on( 'click', function () {
            APP.data.splitFlag = false;
            $('#include-flag2').prop('checked', false);
            APP.data.flag1 = FLAGDATA['Pride'];
            APP.data.flag2 = FLAGDATA['Pride'];
            $('#flag1, #flag2').val('Pride');
            APP.data.imageFill = true;
            $('#is-fill-fill').prop('checked', true);
            $('#is-fill-fit').prop('checked', false);
            APP.data.gradient = false;
            $('#gradient').prop('checked', false);
            APP.data.mode = 'Ring';
            $('#mode-ring').prop('checked', true);
            $('#mode-hole').prop('checked', false);
            $('#mode-overlay').prop('checked', false);
            APP.data.width = 80;
            $('#width').val(80);
            APP.data.imageX = 0;
            APP.data.imageY = 0;
            APP.data.imageZ = 1;
            $('#offset-x, #offset-y').val(0);
            $('#offset-z').val(1);

            APP.update();
        });

        $('#input-url').trigger('change');
        $('#num-bars').trigger('change');
        $('#color-pickers').hide();
    });
})();
