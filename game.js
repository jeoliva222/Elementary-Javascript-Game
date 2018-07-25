// game.js for Perlenspiel 3.2

/*
Perlenspiel is a scheme by Professor Moriarty (bmoriarty@wpi.edu).
Perlenspiel is Copyright © 2009-15 Worcester Polytechnic Institute.
This file is part of Perlenspiel.

Perlenspiel is free software: you can redistribute it and/or modify
it under the terms of the GNU Lesser General Public License as published
by the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

Perlenspiel is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Lesser General Public License for more details.

You may have received a copy of the GNU Lesser General Public License
along with Perlenspiel. If not, see <http://www.gnu.org/licenses/>.

Perlenspiel uses dygraphs (Copyright © 2009 by Dan Vanderkam) under the MIT License for data visualization.
See dygraphs License.txt, <http://dygraphs.com> and <http://opensource.org/licenses/MIT> for more information.
*/

// The following comment lines are for JSLint. Don't remove them!

/*jslint nomen: true, white: true */
/*global PS */

// This is a template for creating new Perlenspiel games

// All of the functions below MUST exist, or the engine will complain!

//*******************
// Perlenspiel by Professor Moriarty
// Code by Jackson Oliva
// Music by Eirik Suhrke from the game "Spelunky"

// Global variable
var G;

( function () {

	var levelPlane = 0;
	var actorPlane = 1;


	function update() {
        var x, y;
        var copy = G.currentLevel.level.slice();

        // Update counter
        G.updateCount += 1;

        // Safety check to make sure that counter doesn't ever crash the game
        if(G.updateCount >= 60000) {
            G.updateCount = 0;
        }

        // Copy level array over
        for(y = 0; y < G.height; y += 1) {
            for (x = 0; x < G.width; x += 1) {
                G.nextFrame[y][x] = copy[y][x];
            }
        }

        // Update Map elements
        //
        for(y = 0; y < G.height; y += 1) {
            for(x = 0; x < G.width; x += 1) {
                switch(G.currentLevel.level[y][x]) {
                    case "rp1" :
                        if((G.isAdjacent(x, y, "rp4")) ||
                            (G.isAdjacent(x, y, "mag")) ||
                            ((G.playerAdjacent(x, y)) && (G.player.form === "fir"))) {
                            G.nextFrame[y][x] = "rp2";
                        }
                        break;
                    case "rp2" :
                        G.nextFrame[y][x] = "rp3";
                        break;
                    case "rp3" :
                        G.nextFrame[y][x] = "rp4";
                        break;
                    case "rp4" :
                        G.nextFrame[y][x] = "emp";
                        break;
                    case "idl" :
                        // If secret already taken, don't generate it
                        if(G.secretFound) {
                            G.nextFrame[y][x] = "emp";
                        }
                        // If player touches idol, pick it up and register this event
                        if((G.player.xpos === x) && (G.player.ypos === y)) {
                            G.nextFrame[y][x] = "emp";
                            G.secretFound = true;
                            // Sound made by Robinhood76 - https://www.freesound.org/people/Robinhood76/sounds/331430/
                            PS.audioPlay("robinhood76-whoosh", { volume : 0.4, path : "./audio/", fileTypes : ["ogg", "mp3", "wav"]});
                        }
                        break;
                    default :
                        // Do nothing
                        break;

                }
            }
        }

        // Update player elements
        //

        // Player death check
        if(G.currentLevel.level[G.player.ypos][G.player.xpos] === "acd") {
            G.resetLevel();
            return;
        }

        // Check regular win condition
        // If you won the level, advance to the next one
        if ((G.player.xpos === G.currentLevel.exitX) && (G.player.ypos === G.currentLevel.exitY)) {
            // If completed secret level, return to next regular level and set thing back to normal
            if(G.index >= 22) {
                // Return to next regular level
                G.loadIndex(11);
                G.index = 11;

                // Stop special background music and start old background music
                PS.audioPause(G.musicChannel2);
                PS.audioPause(G.musicChannel);

                // Reset grid color and shadow. Also set status line color to black.
                PS.gridColor(PS.COLOR_GRAY_LIGHT);
                PS.gridShadow(true, 255, 255, 255);
                PS.statusColor(PS.COLOR_BLACK);

                PS.audioPlay("fx_coin1"); // Play regular victory sound
                return;
            } else {
                G.loadIndex(G.index + 1);
                G.index += 1;
                PS.audioPlay("fx_coin1"); // Play victory sound
                return;
            }
        }

        // Check special win condition
        if(G.currentLevel.level[G.player.ypos][G.player.xpos] === "sec") {
            G.loadIndex(18);
            G.index = 18;

            // Stop current music
            PS.audioPause(G.musicChannel);

            // Play new background sounds
            // Custom sound by Vosvoy  - https://www.freesound.org/people/Vosvoy/sounds/178932/
            var customMusic2 = {
                volume : 0.3,
                loop : true,
                path : "./audio/",
                fileTypes : ["ogg", "mp3", "wav"]
            };
            G.musicChannel2 = PS.audioPlay("vosvoy_heartbeat-loop", customMusic2);

            // Play special victory sound
            // Custom sound made by "dpoggioli"  - https://www.freesound.org/people/Dpoggioli/sounds/213608/
            PS.audioPlay("dpoggioli_laugh", { volume : 0.5, path : "./audio/", fileTypes : ["ogg", "mp3", "wav"]});

            // Set grid color and shadow. Also set status line color to black.
            PS.gridColor(PS.COLOR_BLACK);
            PS.gridShadow(true, 255, 0, 0);
            PS.statusColor(PS.COLOR_WHITE);
            return;
        }

        // Magma Tile
        if((G.isAdjacent(G.player.xpos, G.player.ypos, "mag")) && (!G.player.pendingSwitch)) {
            switch(G.player.form) {
                case "wat" :
                    G.player.form = "gas";
                    PS.audioPlay("fx_scratch", { volume : 0.5 });
                    G.player.pendingSwitch = true;
                    break;
                case "fir" :
                    // Do nothing
                    break;
                case "ice" :
                    G.player.form = "wat";
                    PS.audioPlay("fx_squish", { volume : 0.5 });
                    G.player.pendingSwitch = true;
                    break;
                case "gas" :
                   // Do nothing
                    break;
                default:
                    // Do nothing
                    break;
            }
        }

        // Ice tile
        if((G.isAdjacent(G.player.xpos, G.player.ypos, "cld")) && (!G.player.pendingSwitch)) {
            switch(G.player.form) {
                case "wat" :
                    G.player.form = "ice";
                    PS.audioPlay("fx_blast3", { volume : 0.5 });
                    G.player.pendingSwitch = true;
                    break;
                case "fir" :
                    // Do nothing
                    break;
                case "ice" :
                    // Do nothing
                    break;
                case "gas" :
                    G.player.form = "wat";
                    PS.audioPlay("fx_squish", { volume : 0.5 });
                    G.player.pendingSwitch = true;
                    // Do nothing
                    break;
                default:
                    // Do nothing
                    break;
            }
        }


        // Player falling check
        switch(G.player.form) {
            case "gas":
                // If falling out of the map, restart level
                if (G.player.ypos === 0) {
                    G.resetLevel();
                    return;
                    // If upper space is empty, fall upwards
                } else if((G.currentLevel.level[G.player.ypos - 1][G.player.xpos] === "emp") ||
                    (G.currentLevel.level[G.player.ypos - 1][G.player.xpos] === "sec") ||
                    (G.currentLevel.level[G.player.ypos - 1][G.player.xpos] === "acd") ||
                    (G.currentLevel.level[G.player.ypos - 1][G.player.xpos] === "idl")) {
                    G.player.isGrounded = false;
                    G.player.ypos += -1;
                    PS.spriteMove(G.player.sprite, G.player.xpos, G.player.ypos);
                    // Otherwise, character is on ground
                } else {
                    G.player.isGrounded = true;
                }
                break;
            case "god":
                // God form doesn't obey gravity
                G.player.isGrounded = true;
                break;
            default:
                // If falling out of the map, restart the level
                if (G.player.ypos === (G.height - 1)) {
                    G.resetLevel();
                    return;
                } else if((G.currentLevel.level[G.player.ypos + 1][G.player.xpos] === "emp") ||
                    (G.currentLevel.level[G.player.ypos + 1][G.player.xpos] === "sec") ||
                    (G.currentLevel.level[G.player.ypos + 1][G.player.xpos] === "acd") ||
                    (G.currentLevel.level[G.player.ypos + 1][G.player.xpos] === "idl")) {
                    G.player.isGrounded = false;
                    G.player.ypos += 1;
                    PS.spriteMove(G.player.sprite, G.player.xpos, G.player.ypos);
                } else {
                    G.player.isGrounded = true;
                }
                break;
        }

        // Reset Player Booleans
        G.player.pendingSwitch = false;
        G.player.hasMoved = false;

		// Update the visuals
        //
        G.currentLevel.level = G.nextFrame;
		G.drawMap();
		G.drawPlayer();
	}

	// Initialize variables of G
    // ****************
    // ****************
	G = {
		// Dimensions of grid
		width : 15,
		height : 15,

		// Information on the player
		player : {
			// Player sprite
			sprite : null,

			// X and Y positions
			xpos : null,
			ypos : null,

			// Element form
			// "wat" = water, "fir" = fire, "ice" = ice, "gas" = gas
			form : "wat",

            // Booleans
            isGrounded : true, // Checks whether player is touching ground
            pendingSwitch : false, // Checks whether player is pending phase transition
            hasMoved : false // Restricts player to move only once per tick

		},

        // Exit sprite
        exit : null,

        // Index number of current level
        index : 0,

        // Main Music channel
        musicChannel : null,
        // Secret Music channel
        musicChannel2 : null,

        // Boolean to signify whether secret idol has been found
        secretFound : false,

        // Trigger chance for God form equals (1 / godTrigger)
        // Only happens if secret idol has been found
        godTrigger : 50,

		// Grid of current level
        currentLevel : {
            level: [
                [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
                [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
                [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
                [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
                [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
                [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
                [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
                [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
                [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
                [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
                [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
                [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
                [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
                [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
                [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null]
            ],
            playerX : null,
            playerY : null,
            exitX : null,
            exitY : null,
            message : null
        },

        // Buffer frame when updating level
        nextFrame : [
            [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null]
        ],

		// LEVEL LISTING
		//**********
        levelList : [{
            level: [
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["ful", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "ful"],
                ["ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful"]
            ],
            playerX : 2,
            playerY : 13,
            exitX : 12,
            exitY : 13,
            message : "Use the arrow keys to move left and right.",
            startForm : "wat"
        }, {
            level: [
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "ful", "ful", "ful", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["ful", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "ful"],
                ["ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful"]
            ],
            playerX : 7,
            playerY : 3,
            exitX : 7,
            exitY : 13,
            message : "'Space' = Swap between fire/water forms",
            startForm : "wat"
        }, {
            level: [
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["ful", "emp", "emp", "emp", "emp", "emp", "ful", "ful", "ful", "emp", "emp", "emp", "emp", "emp", "ful"],
                ["ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful"]
            ],
            playerX : 7,
            playerY : 12,
            exitX : 1,
            exitY : 13,
            message : "'R' = Undo reckless mistakes",
            startForm : "wat"
        }, {
            level: [
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "ful", "ful", "ful", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["ful", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "ful"],
                ["ful", "ful", "ful", "ful", "ful", "ful", "ful", "mag", "ful", "ful", "ful", "ful", "ful", "ful", "ful"]
            ],
            playerX : 2,
            playerY : 13,
            exitX : 7,
            exitY : 5,
            message : "Flashy Stuff = Magma",
            startForm : "wat"
        }, {
            level: [
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "ful", "ful", "ful", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["ful", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "ful"],
                ["ful", "ful", "ful", "ful", "ful", "mag", "mag", "mag", "mag", "mag", "ful", "ful", "ful", "ful", "ful"]
            ],
            playerX : 2,
            playerY : 13,
            exitX : 7,
            exitY : 5,
            message : "It's hot.",
            startForm : "wat"
        }, {
            level: [
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "ful", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "ful", "ful", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "ful", "ful", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "ful", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["ful", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "ful"],
                ["ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful"]
            ],
            playerX : 7,
            playerY : 12,
            exitX : 8,
            exitY : 2,
            message : "Gas floats, by the way.",
            startForm : "gas"
        }, {
            level: [
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "ful", "ful", "cld", "ful", "ful", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["ful", "emp", "emp", "emp", "mag", "emp", "emp", "emp", "emp", "emp", "mag", "emp", "emp", "emp", "ful"],
                ["ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful"]
            ],
            playerX : 7,
            playerY : 13,
            exitX : 7,
            exitY : 11,
            message : "The cyan stuff is Ice.",
            startForm : "wat"
        }, {
            level: [
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "cld", "ful", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "cld", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "ful", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "ful", "ful", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "ful", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "mag", "emp", "emp", "ful", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "ful", "emp", "emp", "mag", "mag", "mag", "emp", "mag", "mag", "emp", "emp"],
                ["ful", "emp", "emp", "emp", "ful", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "ful"],
                ["ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful"]
            ],
            playerX : 7,
            playerY : 2,
            exitX : 13,
            exitY : 7,
            message : "You can become ice too.",
            startForm : "wat"
        }, {
            level: [
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "rp1", "rp1", "rp1", "rp1", "rp1", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "rp1", "emp", "emp", "emp", "rp1", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "rp1", "emp", "emp", "emp", "rp1", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "rp1", "emp", "emp", "emp", "rp1", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "rp1", "rp1", "rp1", "rp1", "rp1", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["ful", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "ful"],
                ["ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful"]
            ],
            playerX : 7,
            playerY : 7,
            exitX : 7,
            exitY : 13,
            message : "Highly flammable material.",
            startForm : "wat"
        }, {
            level: [
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1"],
                ["mag", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "cld"],
                ["rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"]
            ],
            playerX : 3,
            playerY : 6,
            exitX : 13,
            exitY : 6,
            message : "RUN",
            startForm : "wat"
        }, {
            level: [
                ["mag", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["rp1", "ful", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["rp1", "ful", "rp1", "rp1", "rp1", "rp1", "rp1", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["rp1", "ful", "rp1", "emp", "emp", "emp", "rp1", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["rp1", "ful", "rp1", "emp", "emp", "emp", "rp1", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["rp1", "ful", "rp1", "emp", "ful", "emp", "rp1", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["rp1", "ful", "rp1", "ful", "sec", "ful", "rp1", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["rp1", "ful", "rp1", "emp", "emp", "emp", "rp1", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["rp1", "ful", "rp1", "emp", "emp", "emp", "rp1", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["rp1", "ful", "rp1", "ful", "ful", "ful", "rp1", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["rp1", "rp1", "rp1", "ful", "emp", "emp", "rp1", "rp1", "ful", "ful", "ful", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "mag", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "ful", "cld", "emp", "emp", "emp", "emp", "mag", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"]
            ],
            playerX : 2,
            playerY : 1,
            exitX : 4,
            exitY : 8,
            message : "Use the elevator in fire emergencies.",
            startForm : "ice"
        }, {
            level: [
                ["emp", "emp", "emp", "emp", "emp", "cld", "ful", "ful", "emp", "emp", "emp", "cld", "ful", "ful", "ful"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "rp1", "rp1", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "rp1", "ful", "ful", "cld", "ful", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "rp1", "rp1", "emp", "ful", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "rp1", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "rp1", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "rp1", "rp1", "rp1", "emp", "emp", "mag", "mag", "ful", "ful", "ful", "ful", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "ful", "cld", "emp", "emp", "emp", "ful", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "ful", "ful", "mag", "ful", "ful", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "mag"],
                ["emp", "ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful", "mag", "ful", "ful", "ful"]
            ],
            playerX : 4,
            playerY : 2,
            exitX : 3,
            exitY : 4,
            message : "Proto-typical",
            startForm : "ice"
        }, {
            level: [
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "rp1", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "rp1", "emp", "emp", "emp", "emp"],
                ["ful", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "rp1", "emp", "emp", "emp", "ful"],
                ["ful", "mag", "mag", "mag", "ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful"]
            ],
            playerX : 7,
            playerY : 13,
            exitX : 12,
            exitY : 13,
            message : "Touch and go.",
            startForm : "ice"
        }, {
            level: [
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "cld", "ful", "ful", "ful", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "cld", "emp", "emp", "emp", "emp", "emp", "mag", "emp", "emp", "emp", "emp", "emp"],
                ["rp1", "rp1", "rp1", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "rp1", "emp", "emp"],
                ["rp1", "emp", "ful", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "ful", "rp1", "emp", "emp"],
                ["rp1", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "rp1", "emp", "emp"],
                ["rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "emp", "emp"]
            ],
            playerX : 6,
            playerY : 1,
            exitX : 1,
            exitY : 12,
            message : "Only you can stop fires.",
            startForm : "fir"
        }, {
            level: [
                ["emp", "emp", "emp", "emp", "emp", "ful", "emp", "emp", "ful", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "ful", "ful", "emp", "ful", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "ful", "emp", "ful", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "ful", "emp", "ful", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "rp1", "rp1", "emp", "ful", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "rp1", "ful", "emp", "ful", "rp1", "rp1", "rp1", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "rp1", "ful", "emp", "ful", "rp1", "emp", "rp1", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "rp1", "ful", "emp", "rp1", "rp1", "emp", "rp1", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "rp1", "ful", "emp", "ful", "emp", "emp", "rp1", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "rp1", "ful", "emp", "ful", "emp", "emp", "rp1", "rp1", "rp1", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "rp1", "rp1", "emp", "ful", "emp", "emp", "emp", "emp", "rp1", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "rp1", "ful", "emp", "ful", "emp", "emp", "emp", "emp", "rp1", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "rp1", "ful", "emp", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "rp1", "ful", "emp", "rp1", "emp", "emp", "emp", "emp", "emp", "ful"],
                ["emp", "emp", "emp", "emp", "emp", "rp1", "rp1", "rp1", "ful", "ful", "ful", "ful", "ful", "ful", "ful"]
            ],
            playerX : 6,
            playerY : 0,
            exitX : 12,
            exitY : 13,
            message : "Summer before the fall.",
            startForm : "fir"
        }, {
            level: [
                ["mag", "ful", "rp1", "rp1", "rp1", "ful", "rp1", "rp1", "rp1", "ful", "rp1", "rp1", "rp1", "ful", "ful"],
                ["rp1", "ful", "rp1", "ful", "rp1", "ful", "rp1", "ful", "rp1", "ful", "rp1", "ful", "rp1", "rp1", "rp1"],
                ["rp1", "rp1", "rp1", "ful", "rp1", "rp1", "rp1", "ful", "rp1", "rp1", "rp1", "ful", "ful", "ful", "rp1"],
                ["ful", "ful", "cld", "ful", "ful", "ful", "cld", "ful", "ful", "ful", "ful", "ful", "ful", "ful", "rp1"],
                ["emp", "emp", "emp", "emp", "emp", "ful", "rp1", "emp", "emp", "rp1", "rp1", "rp1", "emp", "emp", "rp1"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "rp1", "emp", "emp", "rp1", "ful", "rp1", "emp", "emp", "rp1"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "rp1", "emp", "emp", "rp1", "ful", "rp1", "emp", "emp", "rp1"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "rp1", "emp", "emp", "rp1", "ful", "rp1", "emp", "emp", "rp1"],
                ["emp", "ful", "ful", "mag", "cld", "emp", "rp1", "emp", "emp", "rp1", "rp1", "emp", "emp", "emp", "rp1"],
                ["emp", "ful", "emp", "emp", "emp", "emp", "rp1", "emp", "emp", "emp", "rp1", "rp1", "rp1", "emp", "rp1"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "rp1", "emp", "mag", "emp", "emp", "emp", "rp1", "emp", "rp1"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "rp1", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "rp1"],
                ["mag", "mag", "mag", "mag", "ful", "ful", "ful", "rp1", "rp1", "rp1", "rp1", "rp1", "ful", "rp1", "rp1"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1"]
            ],
            playerX : 5,
            playerY : 11,
            exitX : 13,
            exitY : 4,
            message : "Time moves quickly!",
            startForm : "ice"
        }, {
            level: [
                ["rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1"],
                ["rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1"],
                ["rp1", "rp1", "mag", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "mag", "rp1", "rp1"],
                ["rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1"],
                ["rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1"],
                ["rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1"],
                ["rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "emp", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1"],
                ["rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "emp", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1"],
                ["rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1"],
                ["rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1"],
                ["rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1"],
                ["rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1"],
                ["rp1", "rp1", "mag", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "mag", "rp1", "rp1"],
                ["rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1"],
                ["rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "ful", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1"]
            ],
            playerX : 7,
            playerY : 7,
            exitX : 7,
            exitY : 6,
            message : "You won!",
            startForm : "wat"
        }, {
            level: [
                ["ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful"],
                ["ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful"],
                ["ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful"],
                ["ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful"],
                ["ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful"],
                ["ful", "ful", "mag", "ful", "ful", "acd", "acd", "acd", "acd", "acd", "ful", "ful", "mag", "ful", "ful"],
                ["ful", "ful", "mag", "ful", "ful", "acd", "emp", "emp", "emp", "acd", "ful", "ful", "mag", "ful", "ful"],
                ["ful", "mag", "mag", "mag", "ful", "acd", "emp", "emp", "emp", "acd", "ful", "mag", "mag", "mag", "ful"],
                ["ful", "ful", "mag", "ful", "ful", "acd", "emp", "emp", "emp", "acd", "ful", "ful", "mag", "ful", "ful"],
                ["ful", "ful", "ful", "ful", "ful", "acd", "acd", "acd", "acd", "acd", "ful", "ful", "ful", "ful", "ful"],
                ["ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful"],
                ["ful", "ful", "ful", "ful", "ful", "ful", "ful", "emp", "ful", "ful", "ful", "ful", "ful", "ful", "ful"],
                ["ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful"],
                ["ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful"],
                ["ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful"]
            ],
            playerX : 7,
            playerY : 7,
            exitX : 7,
            exitY : 11,
            message : "Too curious. Now, YOU SUFFER.",
            startForm : "god"
        }, {
            level: [
                ["ful", "emp", "emp", "ful", "ful", "ful", "ful", "cld", "ful", "emp", "ful", "ful", "emp", "ful", "ful"],
                ["ful", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "ful", "emp", "ful", "emp", "emp", "emp", "ful"],
                ["mag", "emp", "emp", "emp", "ful", "ful", "ful", "emp", "ful", "emp", "mag", "emp", "emp", "rp1", "ful"],
                ["emp", "emp", "mag", "emp", "ful", "rp1", "rp1", "emp", "ful", "emp", "emp", "emp", "rp1", "rp1", "ful"],
                ["emp", "emp", "emp", "emp", "ful", "rp1", "rp1", "emp", "ful", "emp", "emp", "emp", "rp1", "emp", "ful"],
                ["emp", "emp", "emp", "emp", "ful", "rp1", "ful", "emp", "rp1", "rp1", "emp", "emp", "rp1", "rp1", "cld"],
                ["emp", "emp", "emp", "emp", "ful", "rp1", "rp1", "emp", "ful", "rp1", "rp1", "rp1", "emp", "rp1", "ful"],
                ["emp", "emp", "emp", "emp", "ful", "rp1", "rp1", "emp", "ful", "emp", "emp", "rp1", "emp", "rp1", "ful"],
                ["emp", "emp", "emp", "emp", "ful", "rp1", "ful", "emp", "rp1", "rp1", "rp1", "rp1", "emp", "rp1", "ful"],
                ["emp", "emp", "emp", "emp", "ful", "rp1", "rp1", "rp1", "ful", "ful", "ful", "ful", "emp", "rp1", "ful"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "rp1", "ful"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "ful", "rp1", "rp1", "rp1", "rp1", "ful"],
                ["mag", "emp", "emp", "emp", "emp", "ful", "acd", "acd", "acd", "ful", "emp", "emp", "emp", "emp", "ful"],
                ["ful", "emp", "emp", "emp", "emp", "ful", "ful", "ful", "ful", "ful", "emp", "emp", "ful", "emp", "ful"],
                ["ful", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "ful", "mag", "emp", "ful"]
            ],
            playerX : 2,
            playerY : 2,
            exitX : 13,
            exitY : 1,
            message : "YOU FOOL",
            startForm : "fir"
        }, {
            level: [
                ["emp", "ful", "ful", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "ful", "ful", "emp"],
                ["emp", "ful", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "ful", "emp"],
                ["emp", "ful", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "ful", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "ful", "ful", "ful", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "ful", "emp", "emp", "emp", "ful", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "ful", "emp", "emp", "mag", "emp", "emp", "ful", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "ful", "emp", "mag", "mag", "mag", "emp", "ful", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "ful", "emp", "emp", "mag", "emp", "emp", "ful", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "ful", "emp", "emp", "emp", "ful", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "ful", "ful", "ful", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "ful", "ful", "ful", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["mag", "emp", "emp", "emp", "emp", "emp", "ful", "emp", "ful", "emp", "emp", "emp", "emp", "emp", "mag"],
                ["ful", "emp", "emp", "emp", "emp", "emp", "rp1", "emp", "rp1", "emp", "emp", "emp", "emp", "emp", "ful"],
                ["ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful"]
            ],
            playerX : 7,
            playerY : 3,
            exitX : 7,
            exitY : 13,
            message : "...",
            startForm : "fir"
        }, {
            level: [
                ["emp", "emp", "emp", "emp", "cld", "emp", "emp", "emp", "rp1", "cld", "emp", "emp", "emp", "emp", "emp"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "emp", "emp", "emp", "rp1", "rp1", "rp1", "rp1", "emp", "emp"],
                ["rp1", "emp", "emp", "emp", "emp", "rp1", "emp", "emp", "emp", "emp", "emp", "emp", "rp1", "emp", "acd"],
                ["rp1", "acd", "acd", "acd", "rp1", "rp1", "emp", "emp", "emp", "emp", "emp", "emp", "rp1", "ful", "acd"],
                ["rp1", "rp1", "emp", "emp", "rp1", "acd", "acd", "acd", "emp", "emp", "emp", "emp", "rp1", "ful", "ful"],
                ["emp", "rp1", "emp", "emp", "rp1", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "rp1", "emp", "emp"],
                ["acd", "rp1", "rp1", "acd", "rp1", "rp1", "rp1", "rp1", "emp", "emp", "emp", "emp", "rp1", "emp", "emp"],
                ["emp", "emp", "rp1", "emp", "emp", "acd", "acd", "rp1", "emp", "emp", "emp", "emp", "rp1", "ful", "ful"],
                ["acd", "acd", "rp1", "emp", "emp", "emp", "emp", "rp1", "emp", "emp", "emp", "emp", "rp1", "ful", "acd"],
                ["rp1", "rp1", "rp1", "emp", "emp", "rp1", "rp1", "rp1", "emp", "emp", "emp", "emp", "rp1", "emp", "acd"],
                ["rp1", "emp", "emp", "emp", "emp", "rp1", "acd", "acd", "acd", "emp", "emp", "emp", "rp1", "emp", "acd"],
                ["mag", "emp", "emp", "emp", "emp", "rp1", "emp", "emp", "emp", "emp", "mag", "emp", "rp1", "emp", "acd"],
                ["ful", "emp", "emp", "emp", "emp", "rp1", "rp1", "rp1", "rp1", "ful", "ful", "emp", "rp1", "emp", "acd"],
                ["ful", "mag", "acd", "acd", "acd", "acd", "acd", "acd", "rp1", "rp1", "rp1", "rp1", "rp1", "acd", "acd"]
            ],
            playerX : 1,
            playerY : 13,
            exitX : 14,
            exitY : 7,
            message : "ACID KILLS",
            startForm : "fir"
        }, {
            level: [
                ["ful", "ful", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["ful", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["ful", "emp", "ful", "mag", "emp", "emp", "emp", "emp", "emp", "cld", "ful", "emp", "emp", "emp", "emp"],
                ["mag", "emp", "ful", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "ful", "emp", "emp", "emp", "emp"],
                ["rp1", "emp", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "emp", "emp", "emp", "mag"],
                ["rp1", "emp", "rp1", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "rp1", "emp", "emp", "emp", "ful"],
                ["rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "ful", "ful", "ful", "emp", "ful"],
                ["emp", "emp", "emp", "acd", "acd", "acd", "acd", "acd", "acd", "acd", "acd", "emp", "emp", "rp1", "rp1"],
                ["emp", "emp", "emp", "cld", "ful", "ful", "emp", "ful", "cld", "ful", "ful", "emp", "emp", "emp", "rp1"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "rp1"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "ful", "rp1"],
                ["ful", "rp1", "ful", "mag", "emp", "mag", "ful", "mag", "ful", "emp", "mag", "ful", "ful", "rp1", "rp1"],
                ["ful", "rp1", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "rp1", "ful"],
                ["ful", "rp1", "acd", "acd", "acd", "acd", "acd", "acd", "acd", "acd", "acd", "acd", "acd", "rp1", "ful"],
                ["ful", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "rp1", "ful"]
            ],
            playerX : 6,
            playerY : 3,
            exitX : 0,
            exitY : 10,
            message : "TURN BACK",
            startForm : "ice"
        }, {
            level: [
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "ful", "ful"],
                ["emp", "emp", "emp", "emp", "emp", "emp", "emp", "mag", "emp", "emp", "emp", "ful", "cld", "ful", "ful"],
                ["ful", "emp", "emp", "emp", "emp", "ful", "emp", "ful", "emp", "ful", "emp", "ful", "emp", "emp", "ful"],
                ["ful", "ful", "emp", "emp", "emp", "ful", "ful", "ful", "ful", "ful", "emp", "ful", "emp", "emp", "ful"],
                ["ful", "ful", "ful", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "ful"],
                ["emp", "emp", "ful", "ful", "ful", "ful", "ful", "rp1", "ful", "ful", "ful", "ful", "ful", "mag", "ful"],
                ["emp", "emp", "emp", "emp", "emp", "ful", "ful", "emp", "ful", "ful", "ful", "ful", "ful", "ful", "ful"],
                ["emp", "ful", "ful", "ful", "emp", "emp", "emp", "emp", "ful", "ful", "emp", "emp", "emp", "emp", "ful"],
                ["ful", "emp", "emp", "emp", "ful", "emp", "emp", "emp", "emp", "ful", "emp", "emp", "emp", "emp", "ful"],
                ["ful", "emp", "emp", "mag", "ful", "emp", "emp", "emp", "emp", "ful", "acd", "acd", "emp", "emp", "ful"],
                ["ful", "emp", "mag", "mag", "ful", "emp", "emp", "emp", "emp", "emp", "ful", "acd", "emp", "emp", "ful"],
                ["emp", "ful", "ful", "ful", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "ful", "ful", "ful", "ful"],
                ["ful", "ful", "ful", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["ful", "ful", "emp", "emp", "emp", "idl", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp", "emp"],
                ["ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful", "ful"]
            ],
            playerX : 0,
            playerY : 1,
            exitX : 14,
            exitY : 13,
            message : "",
            startForm : "ice"
        }],

        // COLOR LISTING
        //********
        // Map
        rp1Color : { r : 255, g : 235, b : 0},
        rp2Color : { r : 255, g : 215, b : 60},
        rp3Color : { r : 255, g : 215, b : 130},
        rp4Color : { r : 255, g : 225, b : 220},
        extColor : { r : 255, g : 119, b : 209},
        cldColor : { r : 130, g : 225, b : 255},
        magColor : { r : 255, g : 135, b : 55},
        magColor2 : { r : 255, g : 110, b : 60},
        magColor3 : { r : 255, g : 90, b : 60},
        acdColor : { r : 100, g : 255, b : 15},
        acdColor2 : { r : 140, g : 255, b : 15},
        acdColor3 : { r : 180, g : 255, b : 15},
        idlColor : { r : 120, g : 40, b : 255},
        idlColor2 : { r : 85, g : 40, b : 255},

        // Player
        watBordColor : {r : 90, g: 80, b : 255},
        watAltBordColor : {r : 40, g: 80, b : 255},
        firBordColor : {r : 255, g: 90, b : 70},
        firAltBordColor : {r : 255, g: 225, b : 20},
        iceBordColor : {r : 10, g: 200, b : 255},
        gasBordColor : {r : 130, g: 130, b : 130},
        gasAltBordColor : {r : 90, g: 90, b : 90},
        godColor : {r : 90, g: 90, b : 90},


		// Loads a level into the current level slot
		// Param: [level] is a level from the Level Listing
        loadLevel : function(lev) {
            var x, y;
            var copy = lev.level.slice();

            // Copy level array over
            for(y = 0; y < G.height; y += 1) {
                for (x = 0; x < G.width; x += 1) {
                    G.currentLevel.level[y][x] = copy[y][x];
                }
            }
            // Copy all other parameters over
            G.currentLevel.playerX = lev.playerX;
            G.currentLevel.playerY = lev.playerY;
            G.currentLevel.exitX = lev.exitX;
            G.currentLevel.exitY = lev.exitY;
            G.currentLevel.message = lev.message;
            G.currentLevel.startForm = lev.startForm;
        },


        // Resets the current level
        resetLevel : function() {
            // Load index of current level
            PS.audioPlay("fx_rip");
            G.loadIndex(G.index);
        },

        // Takes an index and loads that particular level from the list
        // [param] (Int) of the level you want to load
        loadIndex : function(index) {
            // Stop tick rate
            G.stopUpdate();

            G.loadLevel(G.levelList[index]);

            // Reset player position
            G.player.xpos = G.currentLevel.playerX;
            G.player.ypos = G.currentLevel.playerY;
            PS.spriteMove(G.player.sprite, G.player.xpos, G.player.ypos);

            // Reset player information
            G.player.isGrounded = true;
            G.player.pendingSwitch = false;
            G.player.hasMove = false;
            G.player.form = G.currentLevel.startForm;

            // Set status message
            PS.statusText(G.currentLevel.message);

            // Restart global update timer
            G.startUpdate();

            // Draw entities
            G.drawMap();
            G.drawPlayer();
            PS.spriteMove(G.exit, G.currentLevel.exitX, G.currentLevel.exitY);
        },

		// Updates the map according to the currentLevel array
		drawMap : function() {
			var x, y;

			PS.gridPlane(levelPlane);
			for(y = 0; y < G.height; y += 1) {
				for(x = 0; x < G.width; x += 1) {
					switch(G.currentLevel.level[y][x]) {
						case "emp":
							PS.color(x, y, PS.COLOR_WHITE);
							break;
						case "ful":
							PS.color(x, y, PS.COLOR_BLACK);
							break;
                        case "mag":
                            switch((G.updateCount % 4)) {
                                case 0 :
                                    PS.color(x, y, G.magColor);
                                    break;
                                case 1 :
                                    PS.color(x, y, G.magColor2);
                                    break;
                                case 2 :
                                    PS.color(x, y, G.magColor3);
                                    break;
                                case 3 :
                                    PS.color(x, y, G.magColor2);
                                    break;
                            }
                            break;
                        case "cld":
                            PS.color(x, y, G.cldColor);
                            break;
                        case "rp1":
                            PS.color(x, y, G.rp1Color);
                            break;
                        case "rp2":
                            PS.color(x, y, G.rp2Color);
                            break;
                        case "rp3":
                            PS.color(x, y, G.rp3Color);
                            break;
                        case "rp4":
                            PS.color(x, y, G.rp4Color);
                            break;
                        case "sec":
                            switch(PS.random(10)) {
                                case 1 :
                                case 2 :
                                case 3 :
                                case 4 :
                                case 5 :
                                case 6 :
                                case 7 :
                                    PS.color(x, y, PS.COLOR_WHITE);
                                    break;
                                case 8 :
                                    PS.color(x, y, PS.COLOR_VIOLET);
                                    break;
                                case 9 :
                                    PS.color(x, y, PS.COLOR_RED);
                                    break;
                                case 10 :
                                    PS.color(x, y, PS.COLOR_BLACK);
                                    break;
                                default :
                                    PS.color(x, y, PS.COLOR_WHITE);
                                    break;
                            }
                            break;
                        case "acd":
                            switch((G.updateCount % 4)) {
                                case 0 :
                                    PS.color(x, y, G.acdColor);
                                    break;
                                case 1 :
                                    PS.color(x, y, G.acdColor2);
                                    break;
                                case 2 :
                                    PS.color(x, y, G.acdColor3);
                                    break;
                                case 3 :
                                    PS.color(x, y, G.acdColor2);
                                    break;
                            }
                            break;
                        case "idl":
                            if(G.secretFound) {
                                PS.color(x, y, PS.COLOR_WHITE);
                            } else {
                                switch ((G.updateCount % 2)) {
                                    case 0 :
                                        PS.color(x, y, G.idlColor);
                                        break;
                                    case 1 :
                                        PS.color(x, y, G.idlColor2);
                                        break;
                                }
                            }
                            break;
						default :
							PS.color(x, y, PS.COLOR_INDIGO);
							break;

					}
				}
			}

		},

		// Draws the player
		drawPlayer : function() {
			var x = G.player.xpos;
			var y = G.player.ypos;

            // Adds border to the player
            PS.border(PS.ALL, PS.ALL, 0);
            PS.border(x, y, 3);

			switch(G.player.form) {
				case "wat" :
					PS.spriteSolidColor(G.player.sprite, PS.COLOR_BLUE);
                    if((G.updateCount % 2) === 0) {
                        PS.borderColor(x, y, G.watBordColor);
                    } else {
                        PS.borderColor(x, y, G.watAltBordColor);
                    }
					break;
				case "fir" :
					PS.spriteSolidColor(G.player.sprite, PS.COLOR_RED);
                    if((G.updateCount % 2) === 0) {
                        PS.borderColor(x, y, G.firBordColor);
                    } else {
                        PS.borderColor(x, y, G.firAltBordColor);
                    }
					break;
				case "ice" :
					PS.spriteSolidColor(G.player.sprite, PS.COLOR_CYAN);
                    PS.borderColor(x, y, G.iceBordColor);
					break;
				case "gas" :
					PS.spriteSolidColor(G.player.sprite, PS.COLOR_GRAY_LIGHT);
                    if((G.updateCount % 2) === 0) {
                        PS.borderColor(x, y, G.gasBordColor);
                    } else {
                        PS.borderColor(x, y, G.gasAltBordColor);
                    }
					break;
                case "god" :
                    switch(PS.random(10)) {
                        case 1 :
                        case 2 :
                        case 3 :
                        case 4 :
                        case 5 :
                        case 6 :
                        case 7 :
                            PS.spriteSolidColor(G.player.sprite, PS.COLOR_WHITE);
                            PS.borderColor(x, y, PS.COLOR_BLACK);
                            break;
                        case 8 :
                            PS.spriteSolidColor(G.player.sprite, PS.COLOR_VIOLET);
                            PS.borderColor(x, y, PS.COLOR_ORANGE);
                            break;
                        case 9 :
                            PS.spriteSolidColor(G.player.sprite, PS.COLOR_RED);
                            PS.borderColor(x, y, PS.COLOR_GREEN);
                            break;
                        case 10 :
                            PS.spriteSolidColor(G.player.sprite, PS.COLOR_BLACK);
                            PS.borderColor(x, y, PS.COLOR_GRAY_LIGHT);
                            break;
                        default :
                            PS.spriteSolidColor(G.player.sprite, PS.COLOR_WHITE);
                            PS.borderColor(x, y, PS.COLOR_BLACK);
                            break;
                    }
                    break;
				default:
					PS.spriteSolidColor(G.player.sprite, PS.COLOR_YELLOW);
                    PS.borderColor(x, y, PS.COLOR_VIOLET);
					break;
			}
		},



		// World timer and count that controls "tick" updates on game
		updateTimer : null,
		updateCount : 0,

		// Starts the world timer
		startUpdate : function() {
			G.updateCount = 0; // reset count
			if(!G.updateTimer) { // If timer is not running
				G.updateTimer = PS.timerStart(10, update); // start timer
			}
		},

		// Stops the world timer
		stopUpdate : function() {
			G.updateCount = 0; // reset count
			if(G.updateTimer != null) {
				PS.timerStop(G.updateTimer); // stop timer
				G.updateTimer = null; // Set timer as null
			}
		},

		// Check if position is adjacent to a particular material
        // [param] xpos = x position; ypos = y position; mat = string of material being checked for
        // Returns whether material was adjacent or not [true/false]
        isAdjacent : function(xpos, ypos, mat) {
            var up, down, left, right;

            if(xpos != 0) {
                left = (G.currentLevel.level[ypos][xpos - 1] === mat);
            }
            if(xpos != (G.width - 1)) {
                right = (G.currentLevel.level[ypos][xpos + 1] === mat);
            }
            if(ypos != 0) {
                up = (G.currentLevel.level[ypos - 1][xpos] === mat);
            }
            if(ypos != (G.height - 1)) {
                down = (G.currentLevel.level[ypos + 1][xpos] === mat);
            }

            return (up || down || left || right);
        },

        // Returns whether player is adjacent to a position
        // [param] xpos = x position; ypos = y position
        // Returns (true/false)
        playerAdjacent : function(xpos, ypos) {
            return (((xpos - 1) === G.player.xpos) && (ypos === G.player.ypos) ||
            ((xpos + 1) === G.player.xpos) && (ypos === G.player.ypos) ||
            (xpos === G.player.xpos) && ((ypos - 1) === G.player.ypos) ||
            (xpos === G.player.xpos) && ((ypos + 1) === G.player.ypos));
        }

	};

}() );

// PS.init( system, options )
// Initializes the game
// This function should normally begin with a call to PS.gridSize( x, y )
// where x and y are the desired initial dimensions of the grid
// [system] = an object containing engine and platform information; see documentation for details
// [options] = an object with optional parameters; see documentation for details

PS.init = function( system, options ) {
	"use strict";

	// Use PS.gridSize( x, y ) to set the grid to
	// the initial dimensions you want (32 x 32 maximum)
	// Do this FIRST to avoid problems!
	// Otherwise you will get the default 8x8 grid

	// Set grid size
	PS.gridSize(G.width, G.height);

	// No borders for beads
	PS.border(PS.ALL, PS.ALL, 0);

    // Set grid color and shadow. Also set status line color to black.
	PS.gridColor(PS.COLOR_GRAY_LIGHT);
    PS.gridShadow(true, 255, 255, 255);
    PS.statusColor(PS.COLOR_BLACK);

    // Set key delay to 1/6 of a second
    PS.keyRepeat(true, 30, 10);

    // Preload sounds
    PS.audioLoad("fx_coin1");
    PS.audioLoad("fx_rip");
    PS.audioLoad("fx_scratch");
    PS.audioLoad("fx_squink");
    PS.audioLoad("fx_blast3");
    PS.audioLoad("fx_squish");
    PS.audioLoad("l_piano_bb0");
    // Custom sound made by "dpoggioli"
    PS.audioLoad("dpoggioli_laugh", { volume : 0.5, lock : true, path : "./audio/", fileTypes : ["ogg", "mp3", "wav"]});
    // Sound made by Robinhood76 - https://www.freesound.org/people/Robinhood76/sounds/331430/
    PS.audioLoad("robinhood76-whoosh", { volume : 0.4, lock : true, path : "./audio/", fileTypes : ["ogg", "mp3", "wav"]});

    // Load music
    // Credits to composer Eirik Suhrke
    // Music is from the game Spelunky by Derek Yu
    // I do not own the rights to Spelunky or its music
    var customMusic = {
        autoplay : true,
        volume : 0.05,
        loop : true,
        path : "./audio/",
        fileTypes : ["ogg", "mp3", "wav"]
    };
    G.musicChannel = PS.audioLoad("A01_egg", customMusic);

    // Credits for heartbeat go to Vosvoy : https://www.freesound.org/people/Vosvoy/sounds/178932/
    var customMusic2 = {
        volume : 0.3,
        loop : true,
        lock : true,
        path : "./audio/",
        fileTypes : ["ogg", "mp3", "wav"]
    };
    PS.audioLoad("vosvoy_heartbeat-loop", customMusic2);


	// Load level and player info
	G.loadLevel(G.levelList[G.index]);
	G.player.xpos = G.currentLevel.playerX;
	G.player.ypos = G.currentLevel.playerY;
    G.player.form = G.currentLevel.startForm;

    // Set status message
    PS.statusText(G.currentLevel.message);

	// Initialize player sprite
	G.player.sprite = PS.spriteSolid(1, 1);
	PS.spritePlane(G.player.sprite, 1); // 1 = actorPlane
	PS.spriteMove(G.player.sprite, G.player.xpos, G.player.ypos);

    // Initialize exit sprite
    G.exit = PS.spriteSolid(1, 1);
    PS.spritePlane(G.exit, 2); // 2 = exitPlane
    PS.spriteMove(G.exit, G.currentLevel.exitX, G.currentLevel.exitY);
    PS.spriteSolidColor(G.exit, G.extColor);

	// Start global update timer
	G.startUpdate();

	// Draw entities
	G.drawMap();
	G.drawPlayer();

	// Add any other initialization code you need here
};

// PS.touch ( x, y, data, options )
// Called when the mouse button is clicked on a bead, or when a bead is touched
// It doesn't have to do anything
// [x] = zero-based x-position of the bead on the grid
// [y] = zero-based y-position of the bead on the grid
// [data] = the data value associated with this bead, 0 if none has been set
// [options] = an object with optional parameters; see documentation for details

PS.touch = function( x, y, data, options ) {
	"use strict";

	// Uncomment the following line to inspect parameters
	// PS.debug( "PS.touch() @ " + x + ", " + y + "\n" );

	// Add code here for mouse clicks/touches over a bead
};

// PS.release ( x, y, data, options )
// Called when the mouse button is released over a bead, or when a touch is lifted off a bead
// It doesn't have to do anything
// [x] = zero-based x-position of the bead on the grid
// [y] = zero-based y-position of the bead on the grid
// [data] = the data value associated with this bead, 0 if none has been set
// [options] = an object with optional parameters; see documentation for details

PS.release = function( x, y, data, options ) {
	"use strict";

	// Uncomment the following line to inspect parameters
	// PS.debug( "PS.release() @ " + x + ", " + y + "\n" );

	// Add code here for when the mouse button/touch is released over a bead
};

// PS.enter ( x, y, button, data, options )
// Called when the mouse/touch enters a bead
// It doesn't have to do anything
// [x] = zero-based x-position of the bead on the grid
// [y] = zero-based y-position of the bead on the grid
// [data] = the data value associated with this bead, 0 if none has been set
// [options] = an object with optional parameters; see documentation for details

PS.enter = function( x, y, data, options ) {
	"use strict";

	// Uncomment the following line to inspect parameters
	// PS.debug( "PS.enter() @ " + x + ", " + y + "\n" );

	// Add code here for when the mouse cursor/touch enters a bead
};

// PS.exit ( x, y, data, options )
// Called when the mouse cursor/touch exits a bead
// It doesn't have to do anything
// [x] = zero-based x-position of the bead on the grid
// [y] = zero-based y-position of the bead on the grid
// [data] = the data value associated with this bead, 0 if none has been set
// [options] = an object with optional parameters; see documentation for details

PS.exit = function( x, y, data, options ) {
	"use strict";

	// Uncomment the following line to inspect parameters
	// PS.debug( "PS.exit() @ " + x + ", " + y + "\n" );

	// Add code here for when the mouse cursor/touch exits a bead
};

// PS.exitGrid ( options )
// Called when the mouse cursor/touch exits the grid perimeter
// It doesn't have to do anything
// [options] = an object with optional parameters; see documentation for details

PS.exitGrid = function( options ) {
	"use strict";

	// Uncomment the following line to verify operation
	// PS.debug( "PS.exitGrid() called\n" );

	// Add code here for when the mouse cursor/touch moves off the grid
};

// PS.keyDown ( key, shift, ctrl, options )
// Called when a key on the keyboard is pressed
// It doesn't have to do anything
// [key] = ASCII code of the pressed key, or one of the following constants:
// Arrow keys = PS.ARROW_UP, PS.ARROW_DOWN, PS.ARROW_LEFT, PS.ARROW_RIGHT
// Function keys = PS.F1 through PS.F1
// [shift] = true if shift key is held down, else false
// [ctrl] = true if control key is held down, else false
// [options] = an object with optional parameters; see documentation for details

PS.keyDown = function( key, shift, ctrl, options ) {
	"use strict";

	// Uncomment the following line to inspect parameters
    // PS.debug( "DOWN: key = " + key + ", shift = " + shift + "\n" );

    // Only allow players to move one square per tick
    if(G.player.hasMoved) {
        // If we have moved this tick, do not move again
        return;
    }

	switch(key) {
        case 119:  // Up Key / W
        case 1006:
            // Only work if player is in god form
            if(G.player.form === "god") {
                // If on the top of the screen, don't move
                if ((G.player.ypos === 0)) {
                    // Do nothing
                    return;
                }
                // If next space is empty, move to it
                if (((G.currentLevel.level[G.player.ypos - 1][G.player.xpos] === "emp") ||
                    (G.currentLevel.level[G.player.ypos - 1][G.player.xpos] === "acd") ||
                    (G.currentLevel.level[G.player.ypos - 1][G.player.xpos] === "sec") ||
                    (G.currentLevel.level[G.player.ypos - 1][G.player.xpos] === "idl"))) {
                    G.player.ypos += -1;
                    PS.spriteMove(G.player.sprite, G.player.xpos, G.player.ypos);
                }
                G.player.hasMoved = true;
            }
            break;
        case 115:  // Down Key / S
        case 1008:
            if(G.player.form === "god") {
                // If on the top of the screen, don't move
                if ((G.player.ypos === (G.height - 1))) {
                    // Do nothing
                    return;
                }
                // If next space is empty, move to it
                if (((G.currentLevel.level[G.player.ypos + 1][G.player.xpos] === "emp") ||
                    (G.currentLevel.level[G.player.ypos + 1][G.player.xpos] === "acd") ||
                    (G.currentLevel.level[G.player.ypos + 1][G.player.xpos] === "sec") ||
                    (G.currentLevel.level[G.player.ypos + 1][G.player.xpos] === "idl"))) {
                    G.player.ypos += 1;
                    PS.spriteMove(G.player.sprite, G.player.xpos, G.player.ypos);
                }
                G.player.hasMoved = true;
            }
            break;
        case 97:  // Left Key / A
        case 1005:
		    // If trying to exit grid, do nothing
		    if((G.player.isGrounded) && (G.player.xpos === 0)) {
               // Do nothing
                return;
            }
            // If player is on ground and next space is empty, move to it
		    if((G.player.isGrounded) && ((G.currentLevel.level[G.player.ypos][G.player.xpos - 1] === "emp") ||
                (G.currentLevel.level[G.player.ypos][G.player.xpos - 1] === "acd") ||
                (G.currentLevel.level[G.player.ypos][G.player.xpos - 1] === "sec") ||
                (G.currentLevel.level[G.player.ypos][G.player.xpos - 1] === "idl"))) {
                G.player.xpos += -1;
                PS.spriteMove(G.player.sprite, G.player.xpos, G.player.ypos);
            }
            G.player.hasMoved = true;
			break;
        case 100:  // Right Key / D
        case 1007:
            // If trying to exit grid, do nothing
            if((G.player.isGrounded) && (G.player.xpos === G.width - 1)) {
               // Do nothing
                return;
            }
		    // If player is on ground and next space is empty, move to it
		    if((G.player.isGrounded) && ((G.currentLevel.level[G.player.ypos][G.player.xpos + 1] === "emp") ||
                (G.currentLevel.level[G.player.ypos][G.player.xpos + 1] === "acd") ||
                (G.currentLevel.level[G.player.ypos][G.player.xpos + 1] === "sec") ||
                (G.currentLevel.level[G.player.ypos][G.player.xpos + 1] === "idl"))) {
                G.player.xpos += 1;
                PS.spriteMove(G.player.sprite, G.player.xpos, G.player.ypos);
            }
            G.player.hasMoved = true;
			break;
		case 32:
			switch(G.player.form) {
				case "wat":
				    if((G.secretFound) && (PS.random(G.godTrigger) === G.godTrigger)) {
                        G.player.form = "god";
                        PS.audioPlay("l_piano_bb0", {volume : 0.5});
                    } else {
                        G.player.form = "fir";
                        PS.audioPlay("fx_squink", {volume: 0.5});
                    }
					break;
				case "fir":
                    if((G.secretFound) && (PS.random(G.godTrigger) === G.godTrigger)) {
                        G.player.form = "god";
                        PS.audioPlay("l_piano_bb0", {volume : 0.5});
                    } else {
                        G.player.form = "wat";
                        PS.audioPlay("fx_squish", {volume: 0.5});
                    }
					break;
				case "ice":
					break;
				case "gas":
					break;
                case "god":
                    G.player.form = "wat";
                    PS.audioPlay("fx_squish", {volume: 0.5});
                    break;
				default:
					break;
			}
			break;
        case 114:
            G.resetLevel();
		default:
			// Do nothing
			break;
	}

	G.drawPlayer();

	// Add code here for when a key is pressed
};

// PS.keyUp ( key, shift, ctrl, options )
// Called when a key on the keyboard is released
// It doesn't have to do anything
// [key] = ASCII code of the pressed key, or one of the following constants:
// Arrow keys = PS.ARROW_UP, PS.ARROW_DOWN, PS.ARROW_LEFT, PS.ARROW_RIGHT
// Function keys = PS.F1 through PS.F12
// [shift] = true if shift key is held down, false otherwise
// [ctrl] = true if control key is held down, false otherwise
// [options] = an object with optional parameters; see documentation for details

PS.keyUp = function( key, shift, ctrl, options ) {
	"use strict";

	// Uncomment the following line to inspect parameters
	// PS.debug( "PS.keyUp(): key = " + key + ", shift = " + shift + ", ctrl = " + ctrl + "\n" );

	// Add code here for when a key is released
};

// PS.swipe ( data, options )
// Called when a mouse/finger swipe across the grid is detected
// It doesn't have to do anything
// [data] = an object with swipe information; see documentation for details
// [options] = an object with optional parameters; see documentation for details

PS.swipe = function( data, options ) {
	"use strict";

	// Uncomment the following block to inspect parameters

	/*
	 var len, i, ev;
	 PS.debugClear();
	 PS.debug( "PS.swipe(): start = " + data.start + ", end = " + data.end + ", dur = " + data.duration + "\n" );
	 len = data.events.length;
	 for ( i = 0; i < len; i += 1 ) {
	 ev = data.events[ i ];
	 PS.debug( i + ": [x = " + ev.x + ", y = " + ev.y + ", start = " + ev.start + ", end = " + ev.end +
	 ", dur = " + ev.duration + "]\n");
	 }
	 */

	// Add code here for when an input event is detected
};

// PS.input ( sensors, options )
// Called when an input device event (other than mouse/touch/keyboard) is detected
// It doesn't have to do anything
// [sensors] = an object with sensor information; see documentation for details
// [options] = an object with optional parameters; see documentation for details

PS.input = function( sensors, options ) {
	"use strict";

	// Uncomment the following block to inspect parameters
	/*
	PS.debug( "PS.input() called\n" );
	var device = sensors.wheel; // check for scroll wheel
	if ( device )
	{
		PS.debug( "sensors.wheel = " + device + "\n" );
	}
	*/
	
	// Add code here for when an input event is detected
};

