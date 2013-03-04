# The Hand of God

## Disclaimer

Code released **as-is**. This is the result of two days of work at the [@arthackday] in 319 Scholes (feb 28-mar 2, 2013) so it is **not** the most stable/proper code ever. The files you're most probably interested in are located in `app/index.html` (I know, I should put the JS in a separate file), `app/scripts/globe.js` and `app/scripts/tweets.coffee`. I might be missing something from these instructions but I'm sure you'll figure it out on your own :)

## Dependencies

  * You need a [LEAP Motion sensor]
  * [npm] for server libraries `brew install node`
  * It is easier if you install [yeoman] which also installs [grunt] and [bower] to take care of all the grunt work (see what I did there?) `npm install -g yo grunt-cli bower`
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

[yeoman]: https://yeoman.io
[twitter-sample]: https://github.com/jedahan/twitter-sample
[@arthackday]: http://arthackday.net/god_mode
[Google Chrome Globe]: http://www.chromeexperiments.com/globe
[LEAP Motion sensor]: http://leapmotion.com
[319 Scholes]: http://319scholes.org/
[jedahan]: https://github.com/jedahan