(function () {

    class App {
        constructor( cvs ) {
            this.cvs = cvs;
            this.ctx = this.cvs.getContext('2d');
        }

        data = {
            fill: false,
            image: null
        }

        get image()  { return this.data.image; }
        set image(x) { this.data.image = x; this.update(); }

        update() {
            this.ctx.clearRect( 0, 0, this.cvs.width, this.cvs.height );

            /// Draw the PFP.
            if ( this.image ) {
                let img = this.image,
                    inW = img.width,
                    inH = img.height,
                    aspect = inW / inH,
                    outX = 0,
                    outY = 0,
                    outW = this.cvs.width,
                    outH = this.cvs.height;
                if ( this.data.fill ) {
                    let temp = inW;
                    inW = inH;
                    inH = temp;
                }
                if ( inH > inW ) {
                    outW *= aspect;
                    outX = Math.ceil((this.cvs.width - outW) / 2);
                } else if ( inW > inH ) {
                    outH *= 1 / aspect;
                    outY = Math.ceil((this.cvs.height - outH) / 2);
                }
                this.ctx.drawImage( img, outX, outY, outW, outH );
            }

            /// Draw the ring.
        }
    }

    $(function () {
        const APP = new App(  $('canvas#output').get(0) );

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

        $('#input-img').on( 'change', function () {
            if( ! this.files ) return;
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
    });
})();
