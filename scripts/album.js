// filterTimeCode(226);
// should return X:XX

var filterTimeCode = function(timeInSeconds) {
  timeInSeconds = parseFloat(timeInSeconds);

  // Prepend a 0 to the seconds, so single-digit seconds will format as 01, 02, etc.
  // This will also give two-digit seconds a 0 at the beginning which we fix using slice below
  var seconds = "0" + Math.floor(timeInSeconds % 60);
  var minutes = Math.floor(timeInSeconds / 60);

  // Remove the 0 in front of seconds with more than 2 characters, e.g. 010 but not 09
  return minutes + ":" + seconds.slice(-2);
}

var createSongRow = function(songNumber, songName, songLength) {
    var template =
        '<tr class="album-view-song-item">'
      + '<td class="song-item-number" data-song-number="' + songNumber + '">' + songNumber + '</td>'
      + '<td class="song-item-title">' + songName + '</td>'
      + '<td class="song-item-duration">' + filterTimeCode(songLength) + '</td>'
      + '</tr>'
    ;

    var $row = $(template);

    var clickHandler = function() {
        var songNumber = parseInt($(this).attr('data-song-number'));

      	if (currentlyPlayingSongNumber !== null) {
      		// Revert to song number for currently playing song because user started playing new song.
      		var currentlyPlayingCell = getSongNumberCell(currentlyPlayingSongNumber);
      		currentlyPlayingCell.html(currentlyPlayingSongNumber);
        }

	   if (currentlyPlayingSongNumber !== songNumber) {
		// Switch from Play -> Pause button to indicate new song is playing.
        setSong(songNumber);
        currentSoundFile.play();
        updateSeekBarWhileSongPlays();
        //currentSongFromAlbum = currentAlbum.songs[songNumber - 1];

        var $volumeFill = $('.volume .fill');
        var $volumeThumb = $('.volume .thumb');
        $volumeFill.width(currentVolume + '%');
        $volumeThumb.css({left: currentVolume + '%'});

        $(this).html(pauseButtonTemplate);
        updatePlayerBarSong();

  	    }
        else if (currentlyPlayingSongNumber === songNumber) {
    		  if (currentSoundFile.isPaused()) {
                $(this).html(pauseButtonTemplate);
                $('.main-controls .play-pause').html(playerBarPauseButton);
                currentSoundFile.play();
            } else {
                $(this).html(playButtonTemplate);
                $('.main-controls .play-pause').html(playerBarPlayButton);
                currentSoundFile.pause();
            }
  	    }
    };

    var onHover = function(event) {
        var songNumberCell = $(this).find('.song-item-number');
        var songNumber = parseInt(songNumberCell.attr('data-song-number'));

        if (songNumber !== currentlyPlayingSongNumber) {
            songNumberCell.html(playButtonTemplate);
        }
    };

    var offHover = function(event) {
        var songNumberCell = $(this).find('.song-item-number');
        var songNumber = parseInt(songNumberCell.attr('data-song-number'));

        if (songNumber !== currentlyPlayingSongNumber) {
            songNumberCell.html(songNumber);
        }

        console.log("songNumber type is " + typeof songNumber + "\n and currentlyPlayingSongNumber type is " + typeof currentlyPlayingSongNumber);
    };

    $row.find('.song-item-number').click(clickHandler);
    $row.hover(onHover, offHover);

    return $row;
};



var setSong = function(songNumber) {
    if (currentSoundFile){
        currentSoundFile.stop(); //stops previously playing song if true
    }

    currentlyPlayingSongNumber = songNumber;
    currentSongFromAlbum = currentAlbum.songs[songNumber - 1];

    currentSoundFile = new buzz.sound(currentSongFromAlbum.audioUrl, {
        formats: ['mp3'], //acceptable file formats
        preload: true     //loads files as soon as page loads
    });

    setVolume(currentVolume);
};

var seek = function(time) {
    if (currentSoundFile) {
        currentSoundFile.setTime(time);
    }
};

var setVolume = function(volume) {
    if (currentSoundFile) {
        currentSoundFile.setVolume(volume);
    }
};

var getSongNumberCell = function(number) {
    return $('.song-item-number[data-song-number="' + number + '"]');
};

var setCurrentAlbum = function(album) {
    currentAlbum = album;
    var $ablumTitle = $('.album-view-title');

    //#1 select all HTML elements req to display album page, assign values to them
    var $albumTitle = $('.album-view-title');
    var $albumArtist = $('.album-view-artist');
    var $albumReleaseInfo = $('.album-view-release-info');
    var $albumImage = $('.album-cover-art');
    var $albumSongList = $('.album-view-song-list');

    //#2 sets value of text node
    $albumTitle.text(album.title);
    $albumArtist.text(album.artist);
    $albumReleaseInfo.text(album.year + ' ' + album.label);
    $albumImage.attr('src', album.albumArtUrl);

    //#3 set to empty string to clear sing list. clean slate. no interfering elements
    $albumSongList.empty();

    //#4 goes through all songs and inserts them into HTML using innerHTML
    for (var i = 0; i < album.songs.length; i++) {
        var $newRow = createSongRow(i + 1, album.songs[i].title, album.songs[i].duration);
        $albumSongList.append($newRow);
    }
};

/*
var filterTimeCode = function(timeInSeconds) {
    // 1)get seconds using parseFloat()
    // 2)store variables using Math.floor()
    // 3) return time in X:XX format

    return
};
*/

var setTotalTimeInPlayerBar = function(totalTime) {
    $('.total-time').text(totalTime);
};

var setCurrentTimeInPlayerBar = function(currentTime) {
    $('.current-time').text(currentTime);
};

var updateSeekBarWhileSongPlays = function() {
    if (currentSoundFile) {
        //custom Buzz event
        currentSoundFile.bind('timeupdate', function(event) {
            var seekBarFillRatio = this.getTime() / this.getDuration();
            var $seekBar = $('.seek-control .seek-bar');

            updateSeekPercentage($seekBar, seekBarFillRatio);
            setCurrentTimeInPlayerBar( filterTimeCode(this.getTime()) );
        });
    }
};

var updateSeekPercentage = function($seekBar, seekBarFillRatio) {
    var offsetXPercent = seekBarFillRatio * 100;

    //sets width of bar??
    offsetXPercent = Math.max(0, offsetXPercent);
    offsetXPercent = Math.min(100, offsetXPercent);

    //converts to percent?
    var percentageString = offsetXPercent + '%';
    $seekBar.find('.fill').width(percentageString);
    $seekBar.find('.thumb').css({left: percentageString});

};

var setupSeekBars = function() {
    //returns jQuery wrapped array
    var $seekBars = $('.player-bar .seek-bar');

    $seekBars.click(function(event) {

        var offsetX = event.pageX - $(this).offset().left;
        var barWidth = $(this).width();
        var seekBarFillRatio = offsetX / barWidth;

        if ($(this).parent().attr('class') == 'seek-control') {
            seek(seekBarFillRatio * currentSoundFile.getDuration());
        } else {
            setVolume(seekBarFillRatio * 100);
        }

        updateSeekPercentage($(this), seekBarFillRatio);
    });

    $seekBars.find('.thumb').mousedown(function(event) {

        var $seekBar = $(this).parent();

        $(document).bind('mousemove.thumb', function(event) {
            var offsetX = event.pageX - $seekBar.offset().left;
            var barWidth = $seekBar.width();
            var seekBarFillRatio = offsetX / barWidth;

            if ($(this).parent().attr('class') == 'seek-control') {
                seek(seekBarFillRatio * currentSoundFile.getDuration());
            } else {
                setVolume(seekBarFillRatio);
            }

            updateSeekPercentage($seekBar, seekBarFillRatio);
        });

        $(document).bind('mouseup.thumb', function() {
            $(document).unbind('mousemove.thumb');
            $(document).unbind('mouseup.thumb');
        });
    });
};

var trackIndex = function(album, song) {
    return album.songs.indexOf(song);
};

var nextSong = function() {
    var currentSongIndex = trackIndex(currentAlbum, currentSongFromAlbum);
    //we are incrementing song here
    currentSongIndex++;

    if (currentSongIndex >= currentAlbum.songs.length) {
        currentSongIndex = 0;
    }

    //save last song # before changing it
    var lastSongNumber = currentlyPlayingSongNumber;

    //set a new current song

    setSong(currentSongIndex + 1);
    currentSoundFile.play();
    updateSeekBarWhileSongPlays();

    // currentSongIndex = 0
    // we want to play song #1
    // setSong(currentSongIndex + 1)
    // setSong(1)

    //currentlyPlayingSongNumber = currentSongIndex + 1;
    //currentSongFromAlbum = currentAlbum.songs[currentSongIndex];

    //update the player bar info
    updatePlayerBarSong();

    var $nextSongNumberCell = getSongNumberCell(currentlyPlayingSongNumber);

    var $lastSongNumberCell = $('.song-item-number[data-song-number="' + lastSongNumber + '"]');

    $nextSongNumberCell.html(pauseButtonTemplate);
    $lastSongNumberCell.html(lastSongNumber);
};

var previousSong = function() {
    var currentSongIndex = trackIndex(currentAlbum, currentSongFromAlbum);
    //we are now decrementing the index
    currentSongIndex--;

    if (currentSongIndex < 0) {
        currentSongIndex = currentAlbum.songs.length - 1;
    }

    var lastSongNumber = currentlyPlayingSongNumber;

    setSong(currentSongIndex + 1);
    currentSoundFile.play();
    updateSeekBarWhileSongPlays();


    //currentlyPlayingSongNumber = currentSongIndex + 1;
    //currentSongFromAlbum = currentAlbum.songs[currentSongIndex];

    updatePlayerBarSong();

    $('main-controls .play-pause').html(playerBarPauseButton);

    var $previousSongNumberCell = $('.song-item-number[data-song-number="' + currentlyPlayingSongNumber + '"]');

    var $lastSongNumberCell = $('.song-item-number[data-song-number="' + lastSongNumber + '"]');

    $previousSongNumberCell.html(pauseButtonTemplate);
    $lastSongNumberCell.html(lastSongNumber);
};

var updatePlayerBarSong = function() {
    $('.currently-playing .song-name').text(currentSongFromAlbum.title);
    $('.currently-playing .artist-name').text(currentAlbum.artist);
    $('.currently-playing .artist-song-mobile').text(currentSongFromAlbum.title + " - " + currentAlbum.artist);

    $('.main-controls .play-pause').html(playerBarPauseButton);

    setTotalTimeInPlayerBar(filterTimeCode(currentSongFromAlbum.duration));
};

var togglePlayFromPlayerBar = function() {
    var $currentlyPlayingCell = getSongNumberCell(currentlyPlayingSongNumber);

    if (currentSoundFile.isPaused()) {
            $currentlyPlayingCell.html(pauseButtonTemplate);
            $(this).html(playerBarPauseButton);
            currentSoundFile.play();
        } else {
            $currentlyPlayingCell.html(playButtonTemplate);
            $(this).html(playerBarPlayButton);
            currentSoundFile.pause();
        }
};

var playButtonTemplate = '<a class="album-song-button"><span class="ion-play"></span></a>';
var pauseButtonTemplate = '<a class="album-song-button"><span class="ion-pause"></span></a>';
var playerBarPlayButton = '<span class="ion-play"></span>';
var playerBarPauseButton = '<span class="ion-pause"></span>';

//set to null so that no song is playing until we click one
var currentAlbum = null;
var currentlyPlayingSongNumber = null;
var currentSongFromAlbum = null;

var currentSoundFile = null;
//store sound object in this variable, but create in setSong() because it handles assignment of current song
var currentVolume = 80;

var $previousButton = $('.main-controls .previous');
var $nextButton = $('.main-controls .next');

$(document).ready(function() {
    var $mainPlay = $('.main-controls .play-pause');
    setCurrentAlbum(albumPicasso);
    setupSeekBars();
    $previousButton.click(previousSong);
    $nextButton.click(nextSong);

    $mainPlay.click(togglePlayFromPlayerBar);

});
