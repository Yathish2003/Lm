require('dotenv').config();
const express = require('express');
const path = require('path');
const multer = require('multer');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const hbs = require('hbs');

const app = express();
const port = 3000;

const users = [
    { id: 1, username: 'yathi', password: '1234' }
];

passport.use(new LocalStrategy(
    (username, password, done) => {
        const user = users.find(u => u.username === username);
        if (!user) {
            return done(null, false, { message: 'Incorrect username.' });
        }
        if (user.password !== password) {
            return done(null, false, { message: 'Incorrect password.' });
        }
        return done(null, user);
    }
));

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser((id, done) => {
    const user = users.find(u => u.id === id);
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

app.post('/login', passport.authenticate('local', {
    successRedirect: '/dashboard',
    failureRedirect: '/login',
    failureFlash: true
}));

app.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/login');
});

app.get('/dashboard', (req, res) => {
    if (req.isAuthenticated()) {
        res.render('dashboard');
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
        res.send('Translation feature coming soon!');
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

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
