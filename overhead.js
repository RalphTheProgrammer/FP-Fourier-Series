// TAU :: Float
const TAU = 6.283185307179586;



// compose :: (b -> c) -> (a -> b) -> a -> b
Function.prototype.compose = function(f) {
    return x => this(f(x));
}

// scanl1 :: [a] -> (a -> a -> a) -> [a]
Array.prototype.scanl1 = function(f) {
    return tail(this).reduce((accumulator, value) => accumulator.concat(f(last(accumulator))(value)), [head(this)]);
}

// insert :: [a] -> a -> [a]
Array.prototype.insert = function(x) {
    return [x].concat(this);
}



// apply :: a -> (a -> b) -> b
const apply = x => f =>
    f(x);

// conditional :: Bool -> (a -> a) -> b
const conditional = b => f =>
    b ? f : x => x;

// list :: Int -> [()]
const list = n =>
    new Array(n).fill(null);

// range :: Int -> [Int]
const range = n =>
    list(n).map((_, i) => i);

// length :: [a] -> Int
const length = xs =>
    xs.length;

// fill :: a -> [b] -> [a]
const fill = x => l =>
    l.fill(x);

// map :: [a] -> (a -> b) -> [b]
const map = xs => f =>
    xs.map(f);

// max :: Num a => a -> a -> a
const max = x => y =>
    Math.max(x, y);

// head :: [a] -> a
const head = xs =>
    xs[0];

// last :: [a] -> a
const last = xs =>
    xs[xs.length - 1];

// tail :: [a] -> [a]
const tail = xs =>
    xs.slice(1);

// concat :: [a] -> a -> [a]
const concat = xs => x =>
    xs.concat(x);



class IO {
    constructor(f) {
        this._ = f;
    }

    // join :: IO (IO a) -> IO a
    join() {
        return new IO(() => this._()._());
    }

    // fmap :: IO a -> (a -> b) -> IO b
    fmap(f) {
        return new IO(() => f(this._()));
    }

    // bind :: IO a -> (a -> IO b) -> IO b
    bind(f) {
        return this.fmap(f).join();
    }

    // then :: IO a -> (a -> IO b) -> IO a
    then(f) {
        return this.bind(x => f(x).fmap(() => x));
    }

    // pass :: IO (a -> b) -> IO a -> IO b
    pass(io) {
        return this.bind(fmap(io));
    }

    // give :: IO (a -> b) -> a -> IO b
    give(x) {
        return this.fmap(f => f(x));
    }

    // done :: IO a -> IO ()
    done() {
        return this.fmap(() => null);
    }

    static EXTERNAL = {
        mouse: {
            x: 0,
            y: 0,
            down: false,
            pressed: false,
            released: false
        }
    }
}

class Draw {
    constructor(f) {
        this._ = f;
    }

    // done :: Draw a -> IO ()
    done() {
        return new IO(() => this._()).done();
    }

    // setStrokeColor :: Draw Context -> String -> Draw Context
    setStrokeColor(color) {
        return new Draw(() => {
            const context = this._();
            context.strokeStyle = color;
            return context;
        });
    }

    // setLineWidth :: Num a => Draw Context -> a -> Draw Context
    setLineWidth(width) {
        return new Draw(() => {
            const context = this._();
            context.lineWidth = width;
            return context;
        });
    }

    // setLineCap :: Draw Context -> String -> Draw Context
    setLineCap(cap) {
        return new Draw(() => {
            const context = this._();
            context.lineCap = cap;
            return context;
        });
    }

    // setMiterLimit :: Num a => Draw Context -> a -> Draw Context
    setMiterLimit(limit) {
        return new Draw(() => {
            const context = this._();
            context.miterLimit = limit;
            return context;
        });
    }

    // clear :: Draw Context -> Draw Context
    clear() {
        return new Draw(() => {
            const context = this._();
            context.clearRect(0, 0, context.canvas.width, context.canvas.height);
            return context;
        });
    }

    // begin :: Draw Context -> Draw Context
    begin() {
        return new Draw(() => {
            const context = this._();
            context.beginPath();
            return context;
        });
    }

    // stroke :: Draw Context -> Draw Context
    stroke() {
        return new Draw(() => {
            const context = this._();
            context.stroke();
            return context;
        });
    }

    // line :: Draw Context -> Point -> Point -> Draw Context
    line(p) {
        return q =>
            new Draw(() => {
                const context = this._();
                context.moveTo(p.x, p.y);
                context.lineTo(q.x, q.y);
                return context;
            });
    }

    // lines :: Draw Context -> Points -> Draw Context
    lines(ps) {
        return new Draw(() => {
            const context = this._();

            if (ps.length > 1) {
                context.moveTo(ps[0].x, ps[0].y);
                ps.slice(1).forEach(p => context.lineTo(p.x, p.y));
            }

            return context;
        });
    }

    // circle :: Num a => Draw Context -> a -> Point -> Draw Context
    circle(r) {
        return p =>
            new Draw(() => {
                const context = this._();
                context.moveTo(p.x + r, p.y);
                context.arc(p.x, p.y, r, 0, TAU);
                return context;
            });
    }
}



// fmap :: M a -> (a -> b) -> M b
const fmap = m => f =>
    new (m.constructor)(() => f(m._()));

// send :: a -> IO a
const send = x =>
    new IO(() => x);

// nil :: IO ()
const nil =
    send(null);

// start :: Draw Context
const start =
    new Draw(() => document.querySelector("canvas").getContext("2d"));



// Point :: Num a => a -> a -> Point
const Point = x => y => ({
    x, y
});

// add :: Point -> Point -> Point
const add = p => q =>
    Point(p.x + q.x)(p.y + q.y);

// sub :: Point -> Point -> Point
const sub = p =>
    add(p).compose(scale(-1));

// scale :: Num a => a -> Point -> Point
const scale = k => p =>
    Point(p.x * k)(p.y * k);

// invscale :: Num a => a -> Point -> Point
const invscale = k =>
    scale(1 / k);

// derp :: Num a => a -> Point -> Point -> Point
const derp = k => p =>
    add(scale(1 - k)(p)).compose(scale(k));

// hypot :: Point -> Float
const hypot = p =>
    Math.hypot(p.x, p.y);

// distance :: Point -> Point -> Float
const distance = p => q =>
    hypot(sub(q)(p));

// rotor :: Float -> Point
const rotor = x =>
    Point(Math.cos(x))(Math.sin(x));

// mul :: Point -> Point -> Point
const mul = p => q =>
    Point(p.x * q.x - p.y * q.y)(p.x * q.y + p.y * q.x);

// psum :: [Point] -> Point
const psum = ps =>
    ps.reduce((x, y) => add(x)(y));



// Clock :: Num a => a -> a -> Clock
const Clock = past => counter => ({
    past, counter
});

// tickClock :: Num a => Clock -> a -> a -> Clock
const tickClock = clock => subtrahend => now =>
    Clock(now)(now - clock.past + (clock.counter > subtrahend
                                       ? clock.counter - subtrahend
                                       : clock.counter)
              );

// origin :: Point
const origin =
    Point(0)(0);



// requestMousePosition :: IO Point
const requestMousePosition =
    new IO(() => Point(IO.EXTERNAL.mouse.x)(IO.EXTERNAL.mouse.y));

// requestMouseDown :: IO Bool
const requestMouseDown =
    new IO(() => IO.EXTERNAL.mouse.down);

// requestMousePressed :: IO Bool
const requestMousePressed =
    new IO(() => IO.EXTERNAL.mouse.pressed)
        .then(() => new IO(() => IO.EXTERNAL.mouse.pressed = false));

// requestMouseReleased :: IO Bool
const requestMouseReleased =
    new IO(() => IO.EXTERNAL.mouse.released)
        .then(() => new IO(() => IO.EXTERNAL.mouse.released = false));

// requestNow :: IO Int
const requestNow =
    new IO(() => performance.now());

// requestDimensions :: IO Point
const requestDimensions =
    new IO(() => Point(innerWidth)(innerHeight));



// queueIO :: IO a -> IO ()
const queueIO = io =>
    new IO(() => requestAnimationFrame(() => io._()))
        .done();



onload = () => {
    onmousedown = () => {
        IO.EXTERNAL.mouse.down = true;
        IO.EXTERNAL.mouse.pressed = true;
        IO.EXTERNAL.mouse.released = false;
    };

    onmouseup = () => {
        IO.EXTERNAL.mouse.down = false;
        IO.EXTERNAL.mouse.pressed = false;
        IO.EXTERNAL.mouse.released = true;
    };

    onmousemove = ({ x, y }) => {
        IO.EXTERNAL.mouse.x = x;
        IO.EXTERNAL.mouse.y = y;
    };

    (onresize = (canvas => () => {
        canvas.width = innerWidth;
        canvas.height = innerHeight;
    })(document.querySelector("canvas")))();

    main._();
};