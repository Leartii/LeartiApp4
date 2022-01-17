const express = require('express')
const mongoose = require('mongoose');
const app = express()
const cors = require('cors')
require('dotenv').config()
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended : false}))
app.use(cors())
app.use(express.static('public'))

mongoose.connect(process.env.MONGO_URI,{ useNewUrlParser: true, useUnifiedTopology: true })
const Schema = mongoose.Schema;
const userSchema = new Schema({
  username : { type : String , unique : true, required : true, dropDups: true },
  logs : [{
    description : String,
    duration : Number,
    date : String 
  }]
});

const User = mongoose.model('User',userSchema);

app.get('/', (req, res) => {
  User.findById
  res.sendFile(__dirname + '/views/index.html')
});

app.post('/api/users', (req,res) => {
  user = new User({username : req.body.username});
  user.save((err,data)=>{
    if(err){
      console.log(err);
    } else{
      res.json({username : data.username, _id : data._id});
    }
  })
})

app.get('/api/users', (req,res) => {
    User.find((err,data)=>{
      if(err){
        console.log(err);
      } else{
        res.json(data.map(e => {
          return {
            username : e.username,
            _id : e.id
          }
        }));
      }
    })  
})

app.post('/api/users/:_id/exercises', (req,res) => {
   let exercise;
   console.log(typeof req.body.duration);
   console.log((new Date()).toDateString());
   if(req.body.date === '' || req.body.date === undefined){
      console.log("undefined")
      exercise = {description : req.body.description,
                                    duration : parseInt(req.body.duration),
                                    date : (new Date()).toDateString()}
    } else{
      console.log("defined");
      exercise = {description : req.body.description,
                                    duration : req.body.duration,
                                    date : (new Date(req.body.date)).toDateString()};
   } 
   
   User.findByIdAndUpdate(req.params._id,{$addToSet : { logs : new Object(exercise)}}, {new : true}, (err,data) => {
      if(err){
        console.log(err);
      } else{
        res.json({
          username : data.username, description : exercise.description, duration : exercise.duration, date : exercise.date, _id : data._id
        })
      }
   })

})

app.get('/api/users/:_id/logs', (req,res) => {
  console.log("Query parameters : "+req.query.from+" , "+req.query.to+" , "+req.query.limit)
  User.findById({_id : req.params._id}, (err,data) => {
    if(err){
      console.log(err);
    } else if(data === null || data === undefined){
      res.send("No data found");  
    }
    else{
      let arr = data.logs;
      let filtered = filter(arr, req.query.from, req.query.to, req.query.limit);
      filtered = filtered.map(e => {
        return{
          description : e.description,
          duration : e.duration,
          date : e.date
        }
      })
      res.json({username : data.username, count : filtered.length, _id : data._id, logs : filtered});
    }
  })
})

function filter(data,from,to,limit) {
  if(from && to && limit){
    console.log("here");
    data = data.filter(e => Date.parse(e.date) <= Date.parse(to) && Date.parse(e.date) >= Date.parse(from))
    return data.slice(0,limit);
  } else if(from && to) {
    return data.filter(e => Date.parse(e.date) <= Date.parse(to) && Date.parse(e.date) >= Date.parse(from))
  }
  else if(limit){
    return data.slice(0,limit);
  }
  else {
    return data;
  }

} 

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
