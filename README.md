# The Hand of God

## Disclaimer

Code released **as-is**. This is the result of two days of work at the [@arthackday] in 319 Scholes (feb 28-mar 2, 2013) so it is **not** the most stable/proper code ever. The files you're most probably interested in are located in `app/index.html` (I know, I should put the JS in a separate file), `app/scripts/globe.js` and `app/scripts/tweets.coffee`. I might be missing something from these instructions but I'm sure you'll figure it out on your own :)

## What is this?

This interactive artwork tracks tweets from across the globe using religious keywords in english and spanish (i.e. god, evil, love, hate, hell, good, bad, devil, pray), and allows the player (god) to punish or reward people, send them to heaven or hell, based on the content of those tweets.  It's controlled by hand gestures via the LEAP sensor. This project is a commentary on religious beliefs aiming to raise questions about divine agency.

## Dependencies

  * You need a [LEAP Motion sensor]
  * [npm] for server libraries `brew install node`
  * It is easier if you install [yeoman] which also installs Grunt and Bower to take care of all the grunt work (see what I did there?) `npm install -g yo grunt-cli bower`
  * [jedahan]'s [twitter-sample] for integration with Twitter (you need your own credentials which you can [request from them](http://dev.twitter.com))

## Installation

  * `npm install` will install node libraries
  * `bower install` will install client libraries (in case something is missing from this repo)

## Running

  * you need to run the twitter server on a separate instance
  * `grunt server` to run this app

## Kudos/Thanks

  * [319 Scholes] for organizing the [@arthackday]
  * globe code built on top of the [Google Chrome Globe]
  * Built with (an outdated version of) [THREE.js]
  * [IcoMoon] for their awesome [icon font creation app]
  * Some icons taken from [The Noun Project]

[yeoman]: https://yeoman.io
[twitter-sample]: https://github.com/jedahan/twitter-sample
[@arthackday]: http://arthackday.net/god_mode
[Google Chrome Globe]: http://www.chromeexperiments.com/globe
[LEAP Motion sensor]: http://leapmotion.com
[319 Scholes]: http://319scholes.org/
[jedahan]: https://github.com/jedahan
[THREE.js]: https://github.com/mrdoob/three.js/
[IcoMoon]: http://icomoon.io/
[icon font creation app]: http://icomoon.io/app/
[The Noun Project]: http://thenounproject.com/