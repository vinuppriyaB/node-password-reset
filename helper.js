import {createConnection} from "./index.js";
import {client} from "./index.js";
import bcrypt from "bcrypt";


async function genPassword(password)
{
  const salt = await bcrypt.genSalt(10);
  
  const hashedPassword= await bcrypt.hash(password,salt);
    return hashedPassword;
}
async function createUser(username,email,password) {
   
//    console.log(username,password)
    const user = await client
        .db("B27rwd")
        .collection("loginform")
        .insertMany([{username:username,email:email,password:password}]);
    console.log(user);
    return user;
}
async function checkAvailUser(email){
    const user = await client
        .db("B27rwd")
        .collection("loginform")
        .findOne({"email":email});
    console.log(user);
    return user;

}


export{
    genPassword,
    createUser,
    checkAvailUser,
};