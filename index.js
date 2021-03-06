import express from "express";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import cors from "cors";
import nodemailer from "nodemailer";
import {google} from "googleapis";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { genPassword,
   createUser,
   checkAvailUser
    
   } 
   from "./helper.js";
 import bodyParser from "body-parser";
 
 // import {client} from "../index.js";
 
 



import { urlshortenRouter } from "./routes/urlshorten.js";
import { userRouter } from "./routes/login.js";
// import { gmail } from "googleapis/build/src/apis/gmail";
// import { gmail } from "googleapis/build/src/apis/gmail";
dotenv.config();
const app = express();
const PORT = process.env.PORT || 8500;
const MONGO_URL = process.env.MONGO_URL;
// mongodb+srv://vinuppriya:<password>@cluster0.xu3bs.mongodb.net/myFirstDatabase?retryWrites=true&w=majority
app.use(express.json());
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));

const CLIENT_ID=process.env.CLIENT_ID;
const CLIENT_SECRET=process.env.CLIENT_SECRET;
const REDIRECT_URI=process.env.REDIRECT_URI;
const REFRESH_TOKEN=process.env.REFRESH_TOKEN;

const oAuth2Client = new google.auth.OAuth2(CLIENT_ID,CLIENT_SECRET,REDIRECT_URI)
oAuth2Client.setCredentials({refresh_token:REFRESH_TOKEN})

async function sendMail(email,link){
    try{
        const accessToken=await oAuth2Client.getAccessToken();
        const transport=nodemailer.createTransport({
            service:"gmail",
            auth:{
                type:"OAuth2",
                user:"vinuppriya.b@gmail.com",
                clientId:CLIENT_ID,
                clientSecret:CLIENT_SECRET,
                refreshToken:REFRESH_TOKEN,
                accessToken:accessToken

            }
            
        })

        const mailOptions={
            from:"this is vinuppriya <vinuppriya.b@gmail.com>",
            to:email,
            subject:" gmail api",
            text:"heloo to it from gmailapi",
            html:`<h1>${link}</h1>`
        };
        const result = await transport.sendMail(mailOptions)
        return result;



    }catch(error){
        return error;

    }

}

// sendMail().then(result=> console.log("emailsent...",result))
// .catch(error =>console.log(error.message))

let currentEmail="";

export async function createConnection() {
  const client = new MongoClient(MONGO_URL);
  await client.connect();
  console.log("Mongodb connected");
  
  return client;
}

export const client = await createConnection();

// async function checkAvailUser(email){
//     const user = await client
//         .db("B27rwd")
//         .collection("loginform")
//         .findOne({"email":email});
    
//     return user;

// }
// async function checkAvailUserId(id){
//     const user = await client
//         .db("B27rwd")
//         .collection("loginform")
//         .findOne({"_id":id});

//     return user;

// }
// async function addTokenInDb(email,token){
//     const result = await client
//     .db("B27rwd")
//     .collection("loginform")
//     .updateOne({ email:email }, { $set: {token:token} });
//    return result;

// }


app.post("/user/signup", async(request, response) => {
    const {firstName,lastName,password,email}=request.body;
    
    const isUserExist= await checkAvailUser(email);
    
    if(isUserExist)
    {
      response.status(400).send({message:"username already exist"});
      return;
    }
    if(password.length<8)
    {
      response.status(400).send({message:"password is must be longer"});
      return;
    }
    if(!/^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@!#%&]).{8,}$/g.test(password))
    {
      response.status(400).send({message:"password pattern doesn't match"});
      return;
    }
   
    const hashPassword = await genPassword(password);
    
    const userCreate = await createUser(firstName,lastName,email,hashPassword)

    const secret=process.env.SECRET_KEY ;
        const payload = {
            email:email
        }
        let token= jwt.sign(payload,secret,{expiresIn:"15m"});
        //  const addtoken= await addTokenInDb(email,token)
        const link = `https://login-proces.herokuapp.com/user/activatelink/${token}`;
        const result = await sendMail(email,link)
        response.send("user avail");
    
   
   
  });
  app.get("/user/activatelink/:token", async(request, response,next) => {
    
    try{
            
            let token=request.params.token;
            jwt.verify(token,
                process.env.SECRET_KEY,
                async(err,decode)=>{
                    if(decode!==undefined){
                      const document= await client.db("B27rwd").collection("loginform").findOneAndUpdate({email:decode.email},{$set:{activate:"activate"}}); 
                       response.json({message:"Account activated"})
                    }else{
                        response.status(401).json({message:"invalid token"});
                    }
                });
                
            }

            catch(error)
                {
                    console.log(error);
                    
                }
                    
 });
    
  



  app.post( "/user/login",async(request, response) => {

    const {email,password}=request.body;
    
    const userFromDB= await checkAvailUser(email);
    
    if(!userFromDB)
    {
      response.status(401).send({message:"invalide credential"});
      return;
    }
    if(userFromDB.activate=="none")
    {
      response.status(401).send({message:"accountnotactivated"});
      return;
    }
    const storedDbPassword=userFromDB.password
    const isPasswordMatch= await bcrypt.compare(password,storedDbPassword)
    if(isPasswordMatch){
     
      response.send({message:"successful login"});
    }
    else{
      response.status(401).send({message:"invalide credential"});
    }
    
  
  });
app.post("/forget-password", async(request, response) => {
    const {email}=request.body;
    currentEmail=email;
    const isUserAvail=await checkAvailUser(email)
    if(isUserAvail)
    {
        const secret=process.env.SECRET_KEY ;
        const payload = {
            email:email
        }
        let token= jwt.sign(payload,secret,{expiresIn:"15m"});
      
        const link = `https://login-proces.herokuapp.com/reset-password/${token}`;
        const result = await sendMail(email,link)
        response.send("user avail");
        
    }
    else {
        response.status(400).send({message:"user not available"});
        
    }
    
 });

 
//  app.get("/forget-password/id/token", async(request, response) => {
//      response.send({id:id,token:token})
//  });

 app.get("/reset-password/:token", async(request, response,next) => {
    
    try{
            
            let token=request.params.token;
            jwt.verify(token,
                process.env.SECRET_KEY,
                async(err,decode)=>{
                    if(decode!==undefined){
                      const document= await client.db("B27rwd").collection("loginform").findOneAndUpdate({email:decode.email},{$set:{password:token}}); 
                      console.log(document)
                        if(document)
                        {
                         
                            response.redirect("https://serene-knuth-34ed4f.netlify.app/resetpassword");

                        }          
                    }else{
                        response.status(401).json({message:"invalid token"});
                    }
                });
                
            }

            catch(error)
                {
                    console.log(error);
                    
                }
                    
 });
    




 app.post("/reset-password/user", async(request, response) => {
    //  const {id}=request.params;
    const {newpassword}=request.body;
    if(newpassword.length<8)
    {
      response.status(400).send({message:"password is must be longer"});
      return;
    }
    if(!/^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@!#%&]).{8,}$/g.test(newpassword))
    {
      response.status(400).send({message:"password pattern doesn't match"});
      return;
    }
    const hashPassword = await genPassword(newpassword); 
    const result = await client
        .db("B27rwd")
        .collection("loginform")
        .updateOne({email:currentEmail }, { $set: {password:hashPassword} });
        
        response.send(result);
 });
 
app.get("/", (request, response) => {
   response.send("hai")
});





// app.use("/user",userRouter);
app.use("/urlshorten",urlshortenRouter);

app.listen(PORT, () => console.log("the server is started in", PORT));
