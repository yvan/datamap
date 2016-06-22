datamap
=======

Maps various measured internet data onto a navigable world map.

Requires node.js install and npm.

## Usage

Just clone the repo and run:
```
npm install
```
then run
```
node index.js
```
inside the new repo directory. Then go to the url`http://localhost:5000` and you'll see the map.

You can also check out a working version online at <a href="https://datamap.herokuapp.com/">https://datamap.herokuapp.com/</a>. The heroku version is much slower than cloning the repo and running locally.

here is a screenshot:

![image of screen](https://github.com/yvan/datamap/tree/master/static/screen.png)

## Sources:

The CSS SideTab bar was appropriated from this <a href="http://blog.themearmada.com/off-canvas-slide-menu-for-bootstrap/">blog</a>. Then I stripped it down to get rid of all the weird icons they had and added my own buttons and corresponding JS actions on the map.

## Todo:

Add tooltips as we hover over countries.
