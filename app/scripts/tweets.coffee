window.socket = io.connect 'http://localhost:5200'

window.socket.on 'connect', -> $('body').addClass('connected')
window.socket.on 'disconnect', -> $('body').removeClass('connected')
window.socket.on 'tweet', (tweet) -> 
	# $('#tweet').text("#{tweet.text}")
	globe.addTweet tweet if (globe)
