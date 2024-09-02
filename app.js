require('dotenv').config();
const express = require('express');
const path = require('path');
const multer = require('multer');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const hbs = require('hbs');
const fs = require('fs');
const AWS = require('aws-sdk');

const app = express();
const port = 3000;

// Configure AWS S3
const s3 = new AWS.S3({
    apiVersion: '2006-03-01',
    signatureVersion: 'v4',
    region: process.env.AWS_REGION
});

// Configure Passport.js for Google authentication
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


const storage = multer.memoryStorage();
const upload = multer({ storage: storage });


app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));


app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());


const loadTranslations = (lang) => {
    const filePath = path.join(__dirname, 'locales', `${lang}.json`);
    if (fs.existsSync(filePath)) {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
    return {};
};

const translations = {
    en: loadTranslations('en'),
    de: loadTranslations('de')
};

// Routes
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
        res.render('translation', { languages: Object.keys(translations) });
    } else {
        res.redirect('/login');
    }
});

app.post('/upload', upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }

    const params = {
        Bucket: process.env.S3_BUCKET_NAME,
        Key: `images/${Date.now().toString()}${path.extname(req.file.originalname)}`, // Store in "images" folder
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
    //    ACL:'public-read',
    };

    s3.upload(params, (err, data) => {
        if (err) {
            console.error('Error uploading to S3:', err);
            return res.status(500).send('Failed to upload to S3.');
        }

        const imageUrl = data.Location;
        res.render('display', { imageUrl });
        console.log('Upload to S3 successful', imageUrl);
    });
});

app.get('/list-images', (req, res) => {
    if (req.isAuthenticated()) {
        const params = {
            Bucket: process.env.S3_BUCKET_NAME,
            Prefix: 'images/'
        };

        s3.listObjects(params, (err, data) => {
            if (err) {
                console.error('Error listing objects from S3:', err);
                return res.status(500).send('Failed to list images.');
            }

            const imageUrls = data.Contents.map(item => {
              
                return `http://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${item.Key}`;
            });

            res.render('list-images', { imageUrls });
        });
    } else {
        res.redirect('/login');
    }
});

app.get('/api/translation/:language/:key', (req, res) => {
    const { language, key } = req.params;
    const value = translations[language] ? translations[language][key] : '';
    res.json({ value });
});

app.get('/api/translation/:language', (req, res) => {
    const language = req.params.language;
    const translations = loadTranslations(language);
    res.json(translations);
});

app.post('/api/translation/update', (req, res) => {
    const { language, key, value } = req.body;

    if (!translations[language]) {
        translations[language] = {};
    }

    translations[language][key] = value;

    fs.writeFile(path.join(__dirname, `locales/${language}.json`), JSON.stringify(translations[language], null, 2));

    res.json({ success: true });
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
