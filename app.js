//jshint esversion:6
require('dotenv').config();
const express=require("express");
const ejs=require("ejs");
const multer=require("multer");
const mongoose=require("mongoose");
const bodyParser=require("body-parser");
const path=require("path");
const {check,validationResult}=require("express-validator");
const encrypt=require("mongoose-encryption");

const app=express();

app.set("view engine","ejs");

app.use(bodyParser.urlencoded({extended:true}));

app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/userDB",{useNewUrlParser:true,useUnifiedTopology: true, useCreateIndex:true});

var storage=multer.diskStorage({
  destination:"uploads",
  filename:(req,file,cb)=>{
    cb(null,file.fieldname+"_"+req.body.userName+path.extname(file.originalname));
  }
});

var upload=multer({storage:storage}).single('File');


const userSchema=new mongoose.Schema({
  name:{
    type:String,
    required:true
  },
  dateOfbirth:{
    type:Date,
    required:true
  },
  Age:{
    type:Number,
    min:20
      },
  Gender:{
    type:String,
    required:true
  },
  Address:String,
  mobNo:{
    type:Number,
    required:true
},
  email:{
    type:String,
    required:true,
    unique:true
   },
  password:{
    type:String,
    minLength:5,
    required:true
  },

  cnfpassword:{
    type:String,
    minLength:5,
    required:true
  },
  resume:{
    type:String,
    required:true
  }
});



userSchema.plugin(encrypt,{secret:process.env.SECRET,encryptedFields:["password","cnfpassword"]});

const User=new mongoose.model("User",userSchema);

app.get("/",function(req,res){
  res.render("home");
});

app.get("/login",function(req,res){
  res.render("login");
});

app.get("/register",function(req,res){
  res.render("register");
});

app.post("/register",upload,[
    check('userName',"Name must be 3+ long").isLength({min:3}),
    check('userEmail',"Invalid email").isEmail(),
    check('password','Password must be 5+ character long').isLength({min:5})
     ],
  function(req,res){

    const errors = validationResult(req);

          if(!errors.isEmpty()){
            const alert=errors.array()
            res.render("register", {alert});
          }
          else
          {
            User.findOne({email:req.body.userEmail},function(err,foundUser){
              if(err)
              {
                console.log(err);
              }
              else{
                    if(foundUser)
                    {
                      let alert=[];
                      alert=[{msg:"Email id is already registered!"}];
                      res.render("register",{alert:alert});
                    }
                    else{
                       if(req.body.password!==req.body.cnfpassword)
                       {
                         let alert=[];
                         alert=[{msg:"Password and Confirm password should be matched!"}];
                         res.render("register",{alert:alert});

                       }
                   else{
                     const user=new User({
                       name:req.body.userName,
                       dateOfbirth:req.body.dob,
                       Age:req.body.age,
                       Gender:req.body.Gender,
                       Address:req.body.Address,
                       mobNo:req.body.Mobile_no,
                       email:req.body.userEmail,
                       password:req.body.password,
                       cnfpassword:req.body.cnfpassword,
                       resume:req.file.filename
                     });

                     user.save(function(err){
                       if(err)
                       console.log(err);
                       else
                       res.send("File uploaded.");
                     });

                   }

                }
              }
            })

          }
        });



app.post("/login",function(req,res){

  var userName=req.body.username;
  var password=req.body.password;
  User.findOne({email:userName},function(err,foundUser){
    if(err)
    {
      console.log(err);
    }else{
      if(foundUser)
      {
        if(foundUser.password===password)
        {
          console.log(foundUser.password);
            res.render("secrets");
        }
        else
        {
          let alert=[];
          alert=[{msg:"Incorrect password!"}];
          res.render("login",{errors:alert});
        }
      }
      else{
        let alert=[];
        alert=[{msg:"User does not exist!"}];
        res.render("login",{errors:alert});
      }
    }
  });

});

app.listen(3000,function(){
  console.log("Server is running on port 3000...");
});
