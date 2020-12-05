// CURSOR_SMOOTHNESS :: Float
const CURSOR_SMOOTHNESS = 0.1;

// CURSOR_SMOOTHNESS :: Num a => a
const CURSOR_SIZE = 2.5;

// CURSOR_SMOOTHNESS :: Num a => a
const CLOSING_VECTOR_LENGTH = 15;

// UPDATE_RATE_MS :: Int
const UPDATE_RATE_MS = 15;

// COSTANT_AMOUNT :: Int
const CONSTANT_AMOUNT = 25

// PATH_AMOUNT :: Int
const PATH_AMOUNT = 250

// CONSTANT_INDICES :: [Int]
const CONSTANT_INDICES = range(2 * CONSTANT_AMOUNT + 1).map(i => Math.ceil(i / 2) * (i % 2 ? 1 : -1));



// closePath :: Point -> Point -> [Point]
const closePath = p => q => {
     const direction = sub(q)(p);
     const distance = hypot(direction);

     return range(max(0).compose(Math.floor)(distance / CLOSING_VECTOR_LENGTH))
                .map(apply.compose(scale(CLOSING_VECTOR_LENGTH))
                          .compose(invscale(distance))
                          (direction)
                          .compose(scale)
                    )
                .map(add(p))
                .insert(p);
};



// render :: Point -> [Point] -> [Point] -> [Point] -> [Point] -> IO ()
const render = cursor => points => constants => accumulativePaths => path =>
    start.clear().begin().done()
         .then(() => // -- Cursor and the curve
                   start.begin()
                        .setStrokeColor("black")
                        .setLineWidth(1)
                        .circle(CURSOR_SIZE)(cursor)
                        .stroke()

                        .begin()
                        .setLineWidth(5)
                        .lines(points)
                        .stroke()
                        .done()
              )
         .then(() => // -- Fourier Series and its path
                   constants.length ? requestDimensions
                                          .fmap(dimensions =>
                                                    start.begin()
                                                         .setStrokeColor("red")
                                                         .setLineWidth(4)
                                                         .lines(path)
                                                         .stroke()

                                                         .begin()
                                                         .setStrokeColor("rgb(255, 128, 128)")
                                                         .setLineWidth(3)
                                                         .lines(accumulativePaths.insert(origin).map(add.compose(scale(0.5))(dimensions)))
                                                         .stroke()
                                                         .done()
                                               )
                                          .join()
                                    : nil
              )

// loop :: Num a => Point -> [Point] -> [Point] -> [Point] -> [Point] -> Bool -> Bool -> Bool -> Clock -> IO ()
const loop = time => points => constants => accumulativePaths => path => cursor => down => pressed => released => clock =>
    send(loop)
        .give(clock.counter > UPDATE_RATE_MS ? time + 0.0025 : time)
        .give( // -- points
                  pressed  ? []
                : released ? concat(points)
                                 .compose(closePath.compose(head)(points))
                                 .compose(last)(points)
                : down     ? points.concat(cursor)
                : points
             )
        .pass( // -- constants
                  pressed  ? send([])
                : released ? requestDimensions
                                 .fmap((ps => CONSTANT_INDICES.map(n => invscale
                                                                            .compose(length)(ps)
                                                                            .compose(psum)
                                                                            .compose(map.compose(range).compose(length)(ps))
                                                                            (i => mul(ps[i]).compose(rotor)(-n * i / ps.length * TAU))
                                                                  )
                                       ).compose(map(points))
                                        .compose(add)
                                        .compose(scale(-0.5))
                                      )
                : send(constants)
             )
        .give( // -- accumulativePath
                  constants.length ? range.compose(length)(CONSTANT_INDICES)
                                          .map(i => mul(constants[i]).compose(rotor)(CONSTANT_INDICES[i] * time * TAU))
                                          .scanl1(add)
                                   : []
             )
        .pass( // -- path
                  accumulativePaths.length ? clock.counter > UPDATE_RATE_MS ? requestDimensions
                                                                                  .fmap(concat(path).compose(add.compose(last)(accumulativePaths)).compose(scale(0.5)))
                                                                                  .fmap(conditional(path.length > PATH_AMOUNT)(tail))
                                                                            : send(path)
                                           : send([])
             )
        .pass( // -- cursor
                  (clock.counter > UPDATE_RATE_MS
                      ? fmap(requestMousePosition).compose(derp(CURSOR_SMOOTHNESS))
                      : send
                  )(cursor)
             )
        .pass(requestMouseDown)
        .pass(requestMousePressed)
        .pass(requestMouseReleased)
        .pass(requestNow.fmap(tickClock(clock)(UPDATE_RATE_MS)))
        .bind(queueIO)
        .then(() => render(cursor)(points)(constants)(accumulativePaths)(path));

// main :: IO ()
const main =
    send(loop)
        .give(0)                                    // -- time
        .give([])                                   // -- points
        .give([])                                   // -- constants
        .give([])                                   // -- accumulativePath
        .give([])                                   // -- path
        .pass(requestDimensions.fmap(scale(0.5)))   // -- cursor
        .give(false)                                // -- down
        .give(false)                                // -- pressed
        .give(false)                                // -- released
        .pass(requestNow.fmap(Clock).give(0))       // -- clock
        .join()
        .then(() => start.setLineCap("round")
                         .setMiterLimit(2)
                         .done()
             )
        .done();