const express = require('express');
const app = express();

const jwt = require("jsonwebtoken");
// const exjwt = require('express-jwt');
const { expressjwt: exjwt } = require('express-jwt');
const bodyParser = require('body-parser');
const path = require('path');

app.use((err, req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', `http://localhost:${port}/`);
    res.setHeader('Access-Control-Allow-Headers', 'Content-type,Authorization');
    next();
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const PORT = 3000;

const secretKey = 'My super secret key';
const jwtMW = exjwt({
    secret: secretKey,
    algorithms: ["HS256"],
    onExpired: async (req, err) => {
        if (new Date() - err.inner.expiredAt < 5000) {
          return;
        }
        err.isExpired = true;
        throw err;
      },
});

let users = [
    {
        id: 1,
        username: "sydney",
        password: "123",
    },
    {
        id: 2,
        username: "melech",
        password: "456",
    },
];

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    for (let user of users) {
        if (username == user.username && password == user.password) {
            let token = jwt.sign({ id: user.id, username: user.username }, secretKey, { expiresIn: '180000' });
            res.json({
                success: true,
                err: null,
                token,
            });
            break;
        }
        else {
            res.status(401).json({
                success: false,
                token: null,
                err: 'Username or password is incorrect',
            });
        }
    }
});

app.get("/api/dashboard", jwtMW, (req, res) => {
    res.json({
        success: true,
        myContent: 'Secret content that only logged in people can see!!!',
    });
});

app.get("/api/settings", jwtMW, (req, res) => {
    res.json({
      success: true,
      myContent: "Secret content on the settings page",
    });
  });

// app.get("/api/prices", jwtMW, (req, res) => {
//     res.json({
//         success: true,
//         myContent: 'This is the price $3.99',
//     });
// });

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// app.use(function (err, req, res, next) {
//     if (err.name === 'UnauthorizedError') {
//         res.status(401).json({
//             success: false,
//             officialError: err,
//             err: 'Username or password is incorrect 2'
//         });
//     }
//     else {
//         next(err);
//     }
// });

app.use((err, req, res, next) => {
    if (err.isExpired) {
      res.redirect("/");
    } else if (err.name === 'UnauthorizedError') {
      res.status(401).json({
        success: false,
        officialError: err,
        err: 'Username or password is incorrect 2',
      });
    } else {
      next(err);
    }
  });

app.listen(PORT, () => {
    console.log(`Serving on port ${PORT}`);
});