const express = require('express');
const cors = require('cors');
const { default: mongoose } = require('mongoose');
const User = require('./models/user');
const jwt = require('jsonwebtoken');
const secret = 'sdgse45egsdgfs54sdsgsd45sdfs';


const bcrypt = require('bcryptjs');
const salt = bcrypt.genSaltSync(10);

const app = express();

app.use(cors())
app.use(express.json());

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
            res.cookie("token", token).json('ok : ' + token)

        });

    } else {
        res.status(400).json('wrong credentials');
    }

});

app.listen(4000, () => {
    console.log("Server listening on port 4000")
});


//mongodb+srv://ghwnsgkgk:tW1hhjpLx57NkUoB@cluster0.nt2e5j0.mongodb.net/?retryWrites=true&w=majority