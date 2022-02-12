import * as THREE from '/build/three.js/build/three.module.js';
import { OrbitControls } from '/build/three.js/examples/jsm/controls/OrbitControls.js';
import AV from '../../lib/av.module.js';

const CVS = document.getElementById( '#output' );
const CTX = CVS.getContext( '2d' );

( function () {

    class App {
        geo = {};
        shaders = {};
        radius = 100;

        dir_glsl = [
            'ground.fragment.glsl',
            'ground.vertex.glsl',
            'sky.fragment.glsl',
            'sky.vertex.glsl'
        ];

        constructor() {
            AV.createStats();

            this.loadGLSL().then( () => {
                this.initCanvas( CVS );
                this.initRenderer();
                this.initCamera();
                this.initScene();
                this.initControls();
                $( window ).resize();
                this.ready = true;
            });
        }

        loadGLSL() {
            const defers = [ $.Deferred() ];
            const deferred = $.Deferred();

            this.dir_glsl.forEach( ( file ) => {
                const defer = $.Deferred();
                defers.push( defer );
                $.ajax({
                    url: `./shaders/${ file }`,
                    dataType: 'text',
                    success: ( data ) => {
                        const split = file.split('.');
                        const group = split[0];
                        const key = split[1];
                        if ( !this.shaders[ group ] ) {
                            this.shaders[ group ] = {};
                        }
                        this.shaders[ group ][ key ] = data;
                        defer.resolve();
                    }
                });
            });
            defers[0].resolve();

            $.when( ...defers ).done( deferred.resolve );

            return deferred;
        }

        /** WebGL camera. */
        initCamera() {
            this.camera = new THREE.PerspectiveCamera(
                45,
                CVS.width / CVS.height,
                1, 2000
            );

            this.camera.position.z = -4;
        }

        initCanvas( cvs ) {
            $( window ).on( 'resize', () => {
                cvs.width = window.innerWidth;
                cvs.height = window.innerHeight;
                if ( !this.camera ) return;
                this.camera.aspect = CVS.width / CVS.height;
                this.camera.updateProjectionMatrix();
                if ( !this.renderer ) return;
                this.renderer.setSize( CVS.width, CVS.height );
            });
        }

        initControls() {
            this.controls = new OrbitControls( this.camera, CVS );
            this.controls.enableDamping = true;
            this.controls.dampingFactor = 0.1;
            this.controls.rotateSpeed = 0.44;
            this.controls.enablePan = false;
            this.controls.enableZoom = true;
            this.controls.enabled = true;
            this.controls.minPolarAngle = 0;
            this.controls.maxPolarAngle = Math.PI;
            this.controls.minDistance = this.radius * 2;
            this.controls.maxDistance = this.camera.far - this.radius;
        }

        /** WebGL renderer. */
        initRenderer() {
            this.renderer = new THREE.WebGLRenderer({
                alpha: false,
                antialias: true
            });
            this.renderer.setPixelRatio( window.devicePixelRatio );
            this.renderer.setSize( CVS.width, CVS.height );
        }

        /** WebGL objects. */
        initScene() {
            this.scene = new THREE.Scene();
            this.scene.add( this.camera );

            this.scene.background = 0x000000;


            const ambient = new THREE.AmbientLight( 0x1f1f1f );
            this.scene.add( ambient );

            this.light = new THREE.DirectionalLight( 0xfff5f2, 0.9 );
            this.light.position.set( 0.5, 0, -1 );
            this.scene.add( this.light );

            // const globe_geo = new THREE.IcosahedronGeometry( 1, 20 );
            // const globe_mat = new THREE.MeshStandardMaterial({
            //     color: 0x16316f,
            //     roughness: 1/3,
            //     metalness: 0,
            // });
            // this.geo.globe = new THREE.Mesh( globe_geo, globe_mat );
            // this.scene.add( this.geo.globe );

            // const atmo_geo = new THREE.IcosahedronGeometry( 1.05, 20 );
            // this.geo.atmo = new THREE.Mesh( atmo_geo, atmo_mat );
            // this.scene.add( this.geo.atmo );

            ( () => {
                const atmosphere_parameters = {
                    Kr: 0.0025,
                    Km: 0.0010,
                    ESun: 20.0,
                    g: -0.950,
                    innerRadius: this.radius,
                    outerRadius: this.radius * 1.025,
                    wavelength: [ 0.650, 0.570, 0.475 ],
                    scaleDepth: 0.25,
                    mieScaleDepth: 0.1
                };

                const maxAnisotropy = this.renderer.capabilities.getMaxAnisotropy();
                const diffuse = THREE.ImageUtils.loadTexture( '/map-small.jpg' );
                const diffuseNight = THREE.ImageUtils.loadTexture( '/map-lights.jpg' );
                diffuse.anisotropy = maxAnisotropy;
                diffuseNight.anisotropy = maxAnisotropy;

                const uniforms = {
                    v3LightPosition: {
                        type: 'v3',
                        value: new THREE.Vector3( 1e8, 0, 1e8 ).normalize()
                    },
                    v3InvWavelength: {
                        type: 'v3',
                        value: new THREE.Vector3( 1 / Math.pow( atmosphere_parameters.wavelength[0], 4 ), 1 / Math.pow( atmosphere_parameters.wavelength[1], 4 ), 1 / Math.pow( atmosphere_parameters.wavelength[2], 4 ) )
                    },
                    fCameraHeight: {
                        type: 'f',
                        value: 0
                    },
                    fCameraHeight2: {
                        type: 'f',
                        value: 0
                    },
                    fInnerRadius: {
                        type: 'f',
                        value: atmosphere_parameters.innerRadius
                    },
                    fInnerRadius2: {
                        type: 'f',
                        value: atmosphere_parameters.innerRadius * atmosphere_parameters.innerRadius
                    },
                    fOuterRadius: {
                        type: 'f',
                        value: atmosphere_parameters.outerRadius
                    },
                    fOuterRadius2: {
                        type: 'f',
                        value: atmosphere_parameters.outerRadius * atmosphere_parameters.outerRadius
                    },
                    fKrESun: {
                        type: 'f',
                        value: atmosphere_parameters.Kr * atmosphere_parameters.ESun
                    },
                    fKmESun: {
                        type: 'f',
                        value: atmosphere_parameters.Km * atmosphere_parameters.ESun
                    },
                    fKr4PI: {
                        type: 'f',
                        value: atmosphere_parameters.Kr * 4.0 * Math.PI
                    },
                    fKm4PI: {
                        type: 'f',
                        value: atmosphere_parameters.Km * 4.0 * Math.PI
                    },
                    fScale: {
                        type: 'f',
                        value: 1 / ( atmosphere_parameters.outerRadius - atmosphere_parameters.innerRadius )
                    },
                    fScaleDepth: {
                        type: 'f',
                        value: atmosphere_parameters.scaleDepth
                    },
                    fScaleOverScaleDepth: {
                        type: 'f',
                        value: 1 / ( atmosphere_parameters.outerRadius - atmosphere_parameters.innerRadius ) / atmosphere_parameters.scaleDepth
                    },
                    g: {
                        type: 'f',
                        value: atmosphere_parameters.g
                    },
                    g2: {
                        type: 'f',
                        value: atmosphere_parameters.g * atmosphere_parameters.g
                    },
                    nSamples: {
                        type: 'i',
                        value: 3
                    },
                    fSamples: {
                        type: 'f',
                        value: 3.0
                    },
                    tDiffuse: {
                        type: 't',
                        value: diffuse
                    },
                    tDiffuseNight: {
                        type: 't',
                        value: diffuseNight
                    },
                    tDisplacement: {
                        type: 't',
                        value: 0
                    },
                    tSkyboxDiffuse: {
                        type: 't',
                        value: 0
                    },
                    fNightScale: {
                        type: 'f',
                        value: 1
                    }
                };

                const ground = {
                    geometry: new THREE.IcosahedronGeometry( atmosphere_parameters.innerRadius, 20 ),
                    material: new THREE.ShaderMaterial({
                        uniforms: uniforms,
                        vertexShader: this.shaders.ground.vertex,
                        fragmentShader: this.shaders.ground.fragment
                    })
                };

                ground.mesh = new THREE.Mesh( ground.geometry, ground.material );

                const sky = {
                    geometry: new THREE.IcosahedronGeometry( atmosphere_parameters.outerRadius, 20 ),
                    material: new THREE.ShaderMaterial({
                        uniforms: uniforms,
                        vertexShader: this.shaders.sky.vertex,
                        fragmentShader: this.shaders.sky.fragment
                    })
                };

                sky.mesh = new THREE.Mesh(sky.geometry, sky.material);

                sky.material.side = THREE.BackSide;

                sky.material.transparent = true;


                this.geo.globe = ground.mesh;
                this.geo.atmo = sky.mesh;
                this.scene.add( ground.mesh );
                this.scene.add( sky.mesh );

                this.camera.position.set( this.radius * 4, 0, 0 );
            })();
        }

        updateAtmosphere() {
            this.camera.lookAt( 0, 0, 0 );
            const light = this.light.position.clone();
            const cameraHeight = this.camera.position.length();

            this.geo.atmo.material.uniforms.v3LightPosition.value = light;
            this.geo.atmo.material.uniforms.fCameraHeight.value = cameraHeight;
            this.geo.atmo.material.uniforms.fCameraHeight2.value = cameraHeight ** 2;
            this.geo.globe.material.uniforms.v3LightPosition.value = light;
            this.geo.globe.material.uniforms.fCameraHeight.value = cameraHeight;
            this.geo.globe.material.uniforms.fCameraHeight2.value = cameraHeight ** 2;
        }

        /** Renders a frame of the WebGL scene. */
        render() {
            this.renderer.render( this.scene, this.camera );
            CTX.drawImage( this.renderer.domElement, 0, 0 );
        }

        loop() {
            if ( !this.ready ) return;
            this.updateAtmosphere();
            this.render();
        }

        run() {
            let start;
            const rate = 1000 / 60;
            const step = ( time ) => {
                let delta = Math.floor( time - start );
                if ( delta >= rate || !start ) {
                    start = time;
                    this.loop();
                }
                window.requestAnimationFrame( step );
            };
            window.requestAnimationFrame( step );
        }
    }

    $( function () {
        const app = new App();

        app.run();
    });

})();
