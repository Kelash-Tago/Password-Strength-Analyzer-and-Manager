
const express=require('express');
const mongoose=require('mongoose');
const session=require('express-session');
const bcrypt=require('bcryptjs');
const User=require('./models/User');
const Account=require('./models/Account');

const app=express();
const atlasSrvUri = 'mongodb+srv://kelash:kelash2936@cluster0.sefxfvm.mongodb.net/passwordAnalyzer?retryWrites=true&w=majority&appName=Cluster0';
const atlasNonSrvUri = 'mongodb://kelash:kelash2936@ac-spiwulm-shard-00-00.sefxfvm.mongodb.net:27017,ac-spiwulm-shard-00-01.sefxfvm.mongodb.net:27017,ac-spiwulm-shard-00-02.sefxfvm.mongodb.net:27017/?ssl=true&replicaSet=atlas-x4mokn-shard-0&authSource=admin&appName=Cluster0';

mongoose.connect(atlasSrvUri)
  .then(() => console.log("MongoDB Connected (SRV)"))
  .catch(async (err) => {
    console.error('MongoDB SRV connection failed, falling back to non-SRV...', err.message);
    try {
      // NOTE: Replace <db_password> above with your real Atlas password.
      await mongoose.connect(atlasNonSrvUri);
      console.log('MongoDB Connected (non-SRV)');
    } catch (e) {
      console.error('MongoDB non-SRV connection failed:', e.message);
    }
  });

app.set('view engine','ejs');
app.use(express.urlencoded({extended:true}));
app.use(session({
  secret: 'secret',
  resave: false,
  saveUninitialized: false,
  cookie: { sameSite: 'lax' }
}));

function strength(p){
 if(p.length<8) return 'Weak';
 let s=0;
 if(/[a-z]/.test(p)) s++;
 if(/[A-Z]/.test(p)) s++;
 if(/[0-9]/.test(p)) s++;
 if(/[^A-Za-z0-9]/.test(p)) s++;
 return s>=4?'Strong':'Medium';
}

app.get('/',(req,res)=>res.redirect('/login'));

app.get('/register',(req,res)=>res.render('register'));
app.post('/register',async(req,res)=>{
 const hash=await bcrypt.hash(req.body.password,10);
 await User.create({name:req.body.name,email:req.body.email,password:hash});
 res.redirect('/login');
});

app.get('/login',(req,res)=>res.render('login'));
app.post('/login',async(req,res)=>{
 const u=await User.findOne({email:req.body.email});
 if(!u) return res.send('User not found');
 const ok=await bcrypt.compare(req.body.password,u.password);
 if(!ok) return res.send('Wrong password');
 req.session.uid=u._id;
 res.redirect('/dashboard');
});

app.get('/dashboard',async(req,res)=>{
 if(!req.session.uid) return res.redirect('/login');
 const accounts=await Account.find({userId:req.session.uid});
 res.render('dashboard',{accounts});
});

app.post('/account',async(req,res)=>{
 await Account.create({
 userId:req.session.uid,
 website:req.body.website,
 username:req.body.username,
 password:req.body.password,
 strength:strength(req.body.password)
 });
 res.redirect('/dashboard');
});

app.listen(3000,()=>console.log('Running on 3000'));
