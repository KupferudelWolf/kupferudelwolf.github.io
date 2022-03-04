<head>
    <link rel="stylesheet" type="text/css" href="css/style.css">
    <title>owo</title>
    <style>
        body, body * {
            font-size: x-small;
            text-align: center;
        }
        body {
            display: flex;
            align-items: center;
            justify-content: center;
        }
    </style>
</head>
<body>
    <div class="container">
        <p>owo what's this?</p>
        <div>
            <?php
                $sep = '&#x2022;';
                $match = array( 'index.html', 'index.php' );
                $dirs = array_filter( glob( '*' ), 'is_dir' );
                echo $sep;
                foreach ( $dirs as $d ) {
                    if ( $d == '_template' ) continue;
                    $contents = scandir( $d );
                    if ( empty( array_intersect( $match, $contents ) ) ) continue;
                    $name = strtolower( str_replace( '_', ' ', $d ) );
                    echo ' <a href="./' . $d . '">' . $name . '</a> ' . $sep;
                }
            ?>
        </div>
    </div>
</body>
