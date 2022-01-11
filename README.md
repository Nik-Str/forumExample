<p align="center"><img src="Frontend/img/rsz_logo-header.png" alt="BearEdge"></p>
<p align="center"><i>Stock market forum for everyone!</i></p>

<h2>About</h2>
<p>During my first 6 month as a front end development student, I wanted to create a project that gave a good introduction to Javascript, NodeJS and also how to work with MYSQL database. Since I allready had some experience with html and css, that was really not my focus here as comes to design. Instead I wanted to build a forum with the feeling of an open chatt, without loading screens that just felt fast and responsive. So I ended up with this webbsite emphasising on swedish stock market with an easy to use and mobile friendly design. </p>

<h2>Features</h2>
<ul> 
<li>Bootstrap</li>
<li>Express</li>
<li>Express-Session</li>
<li>Express-Mysql-Session</li>
<li>Mysql</li>
<li>Crypto-JS</li>
<li>ESLint</li>
</ul>
<p>For the frontend i use Bootstrap library together with regular JS, html and css. Backend was built with NodeJS, using dependencies: Express, Express-Session, Express-Mysql-Session, Mysql, Crypto-JS and Body-Parser. Also I used ESLint as devDependencies. Further on, I used Yahoo Finance API to get market data for the header and chart. The chart also was built with ChartJs framework. Database was built
using Mysql and Sequel Pro as database management application.</p>

<h2>Result</h2>
<p>To summarize this project, I would say the website itself is a chat-alike forum, with a "all in one page" feeling, making it easy to use on mobiles and tablets. Visiters can search for subject in the forum(both by stock name and ticker symbol), registrate for membersship (no personal data needed), create there own threads, comments others and like content. If a was to come back to this project later on, I would probably work a litle bit more on the design (maybe add dark/light mode) and also as my knowledge grow for NodeJs and JS, add new functions for more interactions from the users. </p>

<h2>Knowledge</h2>
<p>As mentioned above, the purpose of this project was primarily to give myself an more in depth introduction to the javascript language and also how to work with NodeJS. Some off the technique I've come across and also implemented in this code is features like: Webb-Workes, Regular Expression, Arrow Functions, Modules, Async Await, Promises, Classes, Fetch, Object Constructors e.t.c. I also got a good introduction how to set up a express server and work with NodeJS, Npm packages, API, making queries to SQL server, e.t.c. I also learned how to work with and use ESLint together with VS-code extension Prettier for clean code. Truly a great way to debug and get structured code at once!</p>

<h2>Resources</h2>
<p>As most of us coder, I read and stumble open lots of good ideas how to address specific problems over the internet. Though, If I was to give credit too someone who has had a really good impact to my development, I would really say David Flanagan. Reading his book "JavaScript, The Definitive Guide" really gav me a good introduction and joy to the programming world and more specific into Javascript. I strongly recommend this book to anyone, both beginner and more senior programmers for a great overview off the language.</p>

<h2>Limitation</h2>
<p>Since i focused on the swedish stock market for this forum, I only uploaded stock info related to that in the DB. Though, since I used Sequel pro as DB management app, it would be relatively easy to import more global stocks to choose from as a user. Furthermore, as it is right now, the chart only show daily data from the "header" indices. This is due to the cost it would requiry if this site were to offer stock prices for each stock in real time. Even though the limitations in the chart data, the app is built with the ability to easy implement this function if cost was not a problem. Maybe a project for the future.</p>

```bash
├── Frontend
│   ├── css
│   │   └── forum.css
│   ├── img
│   │   ├── BearEdge.ico
│   │   └── rsz_logo-header.png
│   ├── index.html
│   └── js
│       ├── Module_Forum.js
│       ├── Worker_Chart.js
│       └── forum.js
├── Procfile
├── .eslintrc.json
├── gitignore
├── db.sql
├── favicon.ico
├── .env
├── node_modules
├── README.md
├── app.js
├── package-lock.json
└── package.json
```

<h2>Install</h2>
<p>Clone this repo to your desktop and run 'npm install' to install all the dependencies.
<br>
<br>
Setup your Database by add/use the code in the 'db.sql' file.
<br>
<br>
Add a '.env' file to the root directory and enter:</p>
<ul>
<li>DB_HOST='Host'</li>
<li>DB_USER='Username'</li>
<li>DB_PASS='Password'</li>
<li>DB_BASE='Base'</li>
<li>SESS_SECRET='Session Secret'</li>
<li>YAHOO_KEY='Yahoo Api Key for financial data' (account registration att yahoo required)</li>
</ul>
<p>
Maybe you want to install or/and set up ESLint. 
<br>
<br>
Once the above are all done, you can run 'Node app.js' to start the application. You will then be able to access it at localhost:3000</p>

<h2>Author</h2>
<a href="https://www.linkedin.com/in/niklas-str%C3%B6mberg-59b428169">Niklas Strömberg</a>
