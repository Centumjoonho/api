// Express server
const express = require('express');
// CORS
const cors = require('cors');
// DB
const { default: mongoose } = require('mongoose');
// Model <-DB
const User = require('./models/user');
const Post = require('./models/post');
// JWT
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser')
const bcrypt = require('bcryptjs');
const salt = bcrypt.genSaltSync(10);
// File UPLOAD
const multer = require('multer')
const uploadMiddleware = multer({ dest: 'uploads/' })
const fs = require('fs');
// Secret key
const secret = 'sdgse45egsdgfs54sdsgsd45sdfs';



const app = express();
app.use(cors({ credentials: true, origin: 'http://localhost:3000' }))
app.use(express.json());
app.use('/uploads', express.static(__dirname + '/uploads'));
app.use(cookieParser())

mongoose.connect('mongodb+srv://ghwnsgkgk:tW1hhjpLx57NkUoB@cluster0.nt2e5j0.mongodb.net/test?retryWrites=true&w=majority')
    .then(() => console.log('Connected to MongoDB'))
    .catch(error => console.error(error));



app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    const existingUser = await User.findOne({ username });
    if (existingUser) {
        return res.status(409).json({ error: 'Username already exists' });
    }
    try {
        const userDoc = await User.create({
            username,
            password: bcrypt.hashSync(password, salt),
        });
        res.json(userDoc);
    } catch (e) {
        console.log(e);
        res.status(400).json(e)
    }


});
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const userDoc = await User.findOne({ username });
    // Load hash from your password DB.
    const passOk = bcrypt.compareSync(password, userDoc.password)
    if (passOk) {
        //logged in
        jwt.sign({ username, id: userDoc._id }, secret, {}, (err, token) => {

            if (err) throw err;
            res.cookie("token", token).json({
                id: userDoc._id,
                username,
            });

        });

    } else {
        res.status(400).json('wrong credentials');
    }

});

app.get('/profile', (req, res) => {
    const { token } = req.cookies;
    // credentials id get
    jwt.verify(token, secret, {}, (err, info) => {
        if (err) throw err;
        res.json(info);
    });
});

app.post('/logout', (req, res) => {
    res.cookie('token', '').json('ok');
})


// createpost data.set 하고 맞춰야해 
app.post('/post', uploadMiddleware.single('file'), async (req, res) => {

    const { originalname, path } = req.file;
    const parts = originalname.split('.');
    const ext = parts[parts.length - 1];
    const newPath = path + '.' + ext
    fs.renameSync(path, newPath)

    const { token } = req.cookies;

    jwt.verify(token, secret, {}, async (err, info) => {
        if (err) throw err;
        const { title, summary, content } = req.body
        const postDoc = await Post.create({
            title: title,
            summary: summary,
            content: content,
            cover: newPath,
            author: info.id,
        });

        res.json(postDoc);
    });

});
app.get('/post', async (req, res) => {
    const posts = await Post.find()
        .populate('author', ['username'])
        .sort({ createdAt: -1 })
        .limit(10);
    res.json(posts)
})

app.get('/post/:id', async (req, res) => {
    const { id } = req.params

    const postDoc = await Post.findById(id).populate('author', ['username']);
    res.json(postDoc)
});

app.listen(4000, () => {
    console.log("Server listening on port 4000")
});


//mongodb+srv://ghwnsgkgk:tW1hhjpLx57NkUoB@cluster0.nt2e5j0.mongodb.net/?retryWrites=true&w=majority