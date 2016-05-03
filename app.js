/**
 * Created by Burhan ORKUN on 24.01.2016.
 */
'use strict'
var express = require("express");
var session = require("express-session");
var cookieParser = require("cookie-parser");
var app = express();
var path = require('path');
var bodyParser = require('body-parser');
var oracledb = require('oracledb');

app.use( bodyParser.json() );
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({secret:"express js"}));

app.set('views', path.join(__dirname+ '/views'));
app.engine('html', require('hogan-express'));
app.set('view engine', 'html');
app.use(express.static(path.join(__dirname,'/public')));

var router = express.Router();

app.use('/', router);

app.listen(8080, function(){
    console.log('Score Update Screen is working on Port 8080');
});

router.get('/', function (req, res, next) {
    res.render('index', {title: 'Welcome to Score Screen'});
});

router.get("/sonuc", function (req, res) {
    var customerNo = req.query.customerNo || 'Please fill correct number';
    var currentScore;
    oracledb.getConnection(
        {
            user          : "xxxxx",
            password      : "xxxxx",
            connectString : "xxxxx"
        },
        function(err, connection)
        {
            if (err) { console.error(err.message); res.render('sonuc', {result: 'Oracle error!'}); return; }

            connection.execute(
                "select score from bonus.account_score " +
                "where account_number=:0 ",
                customerNo.split(),  // for excample -> ['6820393'],  // bind value for :id
                function(err, result)
                {
                    if (err) {
                        console.error(err.message);
                        res.render('sonuc', {result: 'Oracle error!'});
                        return;
                    }
                    console.log(result.rows[0][0]);
                    currentScore = result.rows[0][0]||0;

                    res.render('sonuc', {result: currentScore, customerNo: customerNo});

                    doRelease(connection); //!!
                });
        });

});

router.get("/updateScore", function(req, res, next){
    var customerNo = req.query.customerNo;
    var nextScore = req.query.nextScore;

    oracledb.getConnection(
        {
            user          : "xxxxx",
            password      : "xxxxx",
            connectString : "xxxxx"
        },
        function(err, connection)
        {
            if (err) { console.error(err.message); res.render('sonuc', {result: 'Oracle error!'}); return; }

            connection.execute(
                "UPDATE bonus.account_score SET score = :score WHERE account_number = :accNo",
                {score: nextScore, accNo: customerNo},
                {autoCommit : true},
                function(err, result)
                {
                    if (err) {
                        console.error(err.message);
                    }
                    else {
                        console.log("Rows updated " + result.rowsAffected);

                        res.render('sonuc', {result: nextScore, customerNo: customerNo});

                        doRelease(connection);  //!!
                    }
                });
        });

});

// Release the connection
function doRelease(connection)
{
    connection.release(
        function(err) {
            if (err) {
                console.error(err.message);
            }
        });
}
