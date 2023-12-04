const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");

const app = express();
const PORT = 3000 || process.env.port;
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: 'your-secret-key', // Change this to a secure random string
    resave: false,
    saveUninitialized: true
}));
const isAuthenticated = (req, res, next) => {
    if (req.session.user) {
      next();
    } else {
      res.redirect('/');
    }
};
// connect to mongo db database locally
mongoose.connect(
    `mongodb://127.0.0.1:27017/BlogDB`
);

// Registration and login
const SignUpSchema = new mongoose.Schema({
    fname: String,
    lname: String,
    email: String,
    password: String,
});
const BlogSchema = new mongoose.Schema({
    heading: String,
    time: String,
    date: String,
    content: String,
});
const Users = new mongoose.model("SignUp", SignUpSchema);
const Blogs = new mongoose.model("Blogs", BlogSchema);

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/pages/loginPage.html");
});
app.get("/home", isAuthenticated, async (req, res) => {
    try {
        const fs = require("fs");
        let htmls = fs.readFileSync(__dirname + "/pages/mainPage.html", "utf8");
        const array = await Blogs.find();
        array.reverse();
        // let htmls="";
        // const array = [];
        let posts = "";
        array.forEach((element) => {
            posts += `<article class="flex max-w-xl flex-col items-start justify-between">
            <div class="flex items-center gap-x-4 text-xs">
              <time datetime="2020-03-16" class="text-gray-500">${element.date} ${element.time}</time>
            </div>
            <div class="group relative">
              <h3 class="mt-3 text-lg font-semibold leading-6 text-gray-900 group-hover:text-gray-600">
                <a href="/readmore/${element._id}" target="_blank">
                  <span class="absolute inset-0"></span>
                  ${element.heading}
                </a>
              </h3>
              <p class="mt-5 line-clamp-3 text-sm leading-6 text-gray-600">${element.content.substring(0, 250)}</p>
            </div>
            <div class="relative mt-8 flex items-center gap-x-4">
              <div class="text-sm leading-6">
                <p class="font-semibold text-gray-900">
                  <p href="#">
                    <span class="absolute inset-0"></span>
                    Michael Foster
                  </p>
                </p>
              </div>
            </div>
          </article>`
        });
        htmls = htmls.replace("{ blogs }", posts);
        res.send(htmls);
    } catch (error) {
        res.send(error);
    }
    // res.sendFile(__dirname+'/pages/mainPage.html');
});
app.get("/signup", (req, res) => {
    res.sendFile(__dirname + "/pages/signupPage.html");
});
app.get("/createBlog", isAuthenticated, (req, res) => {
    res.sendFile(__dirname + "/pages/createBlogPage.html");
});
app.get("/readmore/:id", async (req, res) => {
    try {
        const blogId = req.params.id;
        const blog = await Blogs.findById(blogId);
        if (!blog) {
            return res.status(404).send("Blog not found");
        }
        const fs=require("fs");
        let html=fs.readFileSync(__dirname + '/pages/selectedBlog.html', 'utf8');
        let x = `<article class="flex max-w-xl flex-col items-start justify-between">
        <div class="flex items-center gap-x-4 text-xs">
          <time datetime="2020-03-16" class="text-gray-500">${blog.date} ${blog.time}</time>
        </div>
        <div class="group relative">
          <h3 class="mt-3 text-lg font-semibold leading-6 text-gray-900 group-hover:text-gray-600">
            <a href="/readmore/${blog._id}">
              <span class="absolute inset-0"></span>
              ${blog.heading}
            </a>
          </h3>
          <p class="mt-5 text-sm leading-6 text-gray-600">${blog.content}</p>
        </div>
        <div class="relative mt-8 flex items-center gap-x-4">
          <div class="text-sm leading-6">
            <p class="font-semibold text-gray-900">
              <p href="#">
                <span class="absolute inset-0"></span>
                Michael Foster
              </p>
            </p>
          </div>
        </div>
      </article>`
        // console.log(html)
        html = html.replace('{ readmore }', x);
        html = html.replace('{ docname }', blog.heading);
        // console.log(html)
        res.send(html)
    } catch (error) {
        res.status(500).send(error);
    }
});
app.get('/logout', isAuthenticated, (req, res) => {
    req.session.destroy(err => {
      if (err) {
        console.error(err);
      }
      res.redirect('/');
    });
});
app.post("/signup", async (req, res) => {
    try {
        const { fname, lname, email, password } = req.body;
        const exists = await Users.findOne({ email: email });
        if (exists) {
            res.redirect("/");
        } else {
            const data = new Users({
                fname,
                lname,
                email,
                password,
            });
            await data.save();
            res.redirect("/home");
        }
    } catch (error) {
        res.redirect("/signup");
    }
});
app.post("/", async (req, res) => {
    try {
        const { email, password } = req.body;
        const exists = await Users.findOne({ email });

        if(!exists){
            res.redirect('/signup');
        }
        else if (exists && exists.password == password) {
            req.session.user = {userId: exists._id, email:exists.email};
            res.redirect("/home");
        } else {
            res.send("Invalid Password ans/or Email.");
        }
    } catch (error) {
        res.send(error);
    }
});
app.post("/createBlog",isAuthenticated, async (req, res) => {
    try {
        const { heading, content } = req.body;
        const currentDate = new Date();
        const time = currentDate.getHours() + ":" + currentDate.getMinutes();
        const date =
            currentDate.getDate() +
            "/" +
            (currentDate.getMonth() + 1) +
            "/" +
            currentDate.getFullYear();
        // console.log(heading+content);
        const data = new Blogs({
            heading,
            time,
            date,
            content,
        });
        await data.save();
        res.redirect("/home");
    } catch (error) {
        res.send("Could not add blog");
    }
});
app.listen(PORT, () => {
    console.log(`App live on port http://localhost:${PORT}`);
});
