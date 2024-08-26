 
require('dotenv').config();
const express = require('express');
const path = require('path');
const multer = require('multer');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const hbs = require('hbs');
const DeepL = require('deepl-node');

const app = express();
const port = 3000;
//const translator = new DeepL.Translator(process.env.DEEPL_API_KEY);


passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/callback",
    passReqToCallback: true,
}, function (request, accessToken, refreshToken, profile, done) {
    done(null, profile);
}));

passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((user, done) => {
    done(null, user);
});


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, 'public/uploads'));
    },
    filename: function (req, file, cb) {
        const fileName = Date.now() + path.extname(file.originalname);
        cb(null, fileName);
    }
});
const upload = multer({ storage: storage });


app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());


app.get('/', (req, res) => {
    if (req.isAuthenticated()) {
        res.redirect('/dashboard');
    } else {
        res.redirect('/login');
    }
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.get('/auth/google',
    passport.authenticate('google', {
        scope: ['profile'],
        prompt: 'select_account' 
    })
);

app.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/login' }),
    (req, res) => {
        res.redirect('/dashboard');
    }
);

app.get('/logout', (req, res) => {
    req.logout(() => {
        res.redirect('/login');
    });
});

app.get('/dashboard', (req, res) => {
    if (req.isAuthenticated()) {
        res.render('dashboard', { user: req.user });
    } else {
        res.redirect('/login');
    }
});

app.get('/images', (req, res) => {
    if (req.isAuthenticated()) {
        res.render('upload');
    } else {
        res.redirect('/login');
    }
});

app.get('/translation', (req, res) => {
    if (req.isAuthenticated()) {
        res.render('translation');
    } else {
        res.redirect('/login');
    }
});

app.post('/upload', upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }

    const imageUrl = `http://${req.headers.host}/uploads/${req.file.filename}`;
    res.render('display', { imageUrl });
    console.log('Upload successful');
});

app.post('/translate', async (req, res) => {
    if (req.isAuthenticated()) {
        const { text, targetLang } = req.body;

        try {
            const result = await translator.translateText(text, null, targetLang);
            res.render('translation', { translation: result.text });
        } catch (error) {
            console.error('Translation error:', error);
            res.status(500).send('Error occurred during translation.');
        }
    } else {
        res.redirect('/login');
    }
});


app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

