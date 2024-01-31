/*
game.js

    Author      :   Sheer Karny, Mark Steyvers
    University  :   University of California, Irvine
    Lab         :   Modeling and Decision-Making Lab (MADLAB)


Game Page JS file (metadata and functionality).

This file should contain all variables and functions needed for
the game.
*/


// //**************************FIREBASE FUNCTIONALITY****************************//
// /// Importing functions and variables from the Firebase Psych library
import { 
    writeRealtimeDatabase,writeURLParameters,readRealtimeDatabase,
    blockRandomization,finalizeBlockRandomization,firebaseUserId 
} from "./firebasepsych1.0.js";

// console.log("Firebase UserId=" + firebaseUserId);

function getDebugParams(){
    const urlParams = new URLSearchParams(window.location.search);
    let debugBoolean = Boolean(urlParams.get('debug'));

    // console.log(debugBoolean);

    return debugBoolean;
}

var DEBUG  = getDebugParams();   // Always start coding in DEBUG mode

let studyId = 'placeHolder';

if (DEBUG){
   studyId    = "uci-hri-experiment-2-pilot1-debug";
} else {
    studyId   = "uci-hri-experiment-2-pilot1";
}
// console.log("Study ID: " + studyId);    


// database write function
function writeGameDatabase(){
    console.log("Writing to database");
    let path1 = studyId + '/participantData/' + firebaseUserId + '/round' + currentRound + '/spawnData';
    let path2 = studyId + '/participantData/' + firebaseUserId + '/round' + currentRound + '/caughtTargets';
    let path3 = studyId + '/participantData/' + firebaseUserId + '/round' + currentRound + '/eventStream';
    let path4 = studyId + '/participantData/' + firebaseUserId + '/round' + currentRound + '/playerClicks';
    let path5 = studyId + '/participantData/' + firebaseUserId + '/round' + currentRound + '/playerLocation';
    let path6 = studyId + '/participantData/' + firebaseUserId + '/round' + currentRound + '/settings';
    let path7 = studyId + '/participantData/' + firebaseUserId + '/round' + currentRound + '/roundTime';

    let path8 = studyId + '/participantData/' + firebaseUserId + '/round' + currentRound + '/AIcaughtTargets';
    let path9 = studyId + '/participantData/' + firebaseUserId + '/round' + currentRound + '/AIplayerLocation';
    

    // AI and Player score
    let path10 = studyId + '/participantData/' + firebaseUserId + '/round' + currentRound + '/aiScore';
    let path11 = studyId + '/participantData/' + firebaseUserId + '/round' + currentRound + '/playerScore';

    writeRealtimeDatabase(path1, spawnData);
    writeRealtimeDatabase(path2, caughtTargets);
    writeRealtimeDatabase(path3, eventStream);
    writeRealtimeDatabase(path4, playerClicks);
    writeRealtimeDatabase(path5, playerLocation);
    writeRealtimeDatabase(path6, settings);
    writeRealtimeDatabase(path7, roundTime);

    writeRealtimeDatabase(path8, AIcaughtTargets);
    writeRealtimeDatabase(path9, AIplayerLocation);
    writeRealtimeDatabase(path10, aiScore);
    writeRealtimeDatabase(path11, score);   
}
// // Example: storing a numeric value
// // The result of this is stored on the path: "[studyId]/participantData/[firebaseUserId]/trialData/trial1/ResponseTime"


//**************************GAME INITIALIZATION*******************************//

// World Building Elements
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreCanvas = document.getElementById('scoreCanvas');
const scoreCtx = scoreCanvas.getContext('2d');
const world = { width: 800, height: 800 };
const center = { x: canvas.width / 2, y: canvas.height / 2 };
let observableRadius = 390; // Radius for positioning objects

let settings = {};

// change game to complete based on 2 minutes of frame counts at 60 fps

function getDifficultySettingsFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    let settings = {
        AIMode: parseInt(urlParams.get('maxTargets'), 10) || 1, // MS4: 0=no assistance; 1=always on; 2=adaptive
        planNumFramesAhead: parseInt(urlParams.get('maxTargets'), 10) || 5, // MS4: plan solution for display a certain number of frames ahead (to allow human response time) 
        AIDisplayMode: parseInt(urlParams.get('maxTargets'), 10) || 1, // MS4: 0=show movement path; 1=show where to click; 2=show which targets to intercept 
        AIMaxDisplayLength: parseInt(urlParams.get('maxTargets'), 10) || 3, // MS4: can be used to truncate the AI path length shown
        visualizeAIPlayer: parseInt(urlParams.get('maxTargets'), 10) || 0, // MS5: 0:default; 1=visualize AI player running in background
        maxTargets: parseInt(urlParams.get('maxTargets'), 10) || 8, // MS2: added this parameter to limit total number of targets
        spawnProbability: parseFloat(urlParams.get('spawnProbability')) || 1.0,
        spawnInterval: parseInt(urlParams.get('spawnInterval'), 10) || 10,
        // numSpawnLocations: parseInt(urlParams.get('numSpawnLocations'), 10) || 10,
        valueSkew: parseFloat(urlParams.get('valueSkew')) || 1,
        valueLow: parseFloat(urlParams.get('valueLow')) ||0,
        valueHigh: parseFloat(urlParams.get('valueHigh')) || 1,
        playerSpeed: parseFloat(urlParams.get('playerSpeed'),10) || 1.5,
        speedLow: parseFloat(urlParams.get('speedLow'),10) || 0.75, // lowest end of object speed distribution
        speedHigh: parseFloat(urlParams.get('speedHigh'),10) || 2.5, // highest end of object speed distribution
        randSeed: parseInt(urlParams.get('randSeed'), 10) || 12345
    };
    return settings;
}

// ***********************EXPERIMENTAL PARAMETERS***************************// 

// NOTE: AI MODE FOR EXPERIMENT 1 SHOULD BE === 0 (NO ASSISTANCE)

let difficultySettings = {
    1: {experiment: 2, // SK: 1=Experiment 1 - no drawing ; 2=Experiments 2 & 3 drawing always on
        AIMode: 1, // MS4: 0=no assistance; 1=always on; 2=adaptive
        planNumFramesAhead: 1, // MS4: plan solution for display a certain number of frames ahead (to allow human response time)
        AIDisplayMode: 1, // MS4: 0=show movement path; 1=show where to click; 2=show which targets to intercept
        AIMaxDisplayLength: 3, // MS4: can be used to truncate the AI path length shown
        visualizeAIPlayer: 0, // MS5: 0:default; 1=visualize AI player running in background
        maxTargets: 3, // MS2: added this parameter to limit total number of targets
        spawnProbability:  1.0,
        spawnInterval: 10,
        valueSkew: 1,
        valueLow: 0,
        valueHigh:  1,
        playerSpeed: 3,
        speedLow:  1.5, // lowest end of object speed distribution
        speedHigh: 3, // highest end of object speed distribution
        randSeed: 12},
    2: {experiment: 2, // SK: 1=Experiment 1 - no drawing ; 2=Experiments 2 & 3 drawing always on
        AIMode: 1, // MS4: 0=no assistance; 1=always on; 2=adaptive
        planNumFramesAhead: 1, // MS4: plan solution for display a certain number of frames ahead (to allow human response time)
        AIDisplayMode: 1, // MS4: 0=show movement path; 1=show where to click; 2=show which targets to intercept
        AIMaxDisplayLength: 3, // MS4: can be used to truncate the AI path length shown
        visualizeAIPlayer: 0, // MS5: 0:default; 1=visualize AI player running in background
        maxTargets: 6, // MS2: added this parameter to limit total number of targets
        spawnProbability:  1,
        spawnInterval: 10,
        valueSkew: 1,
        valueLow: 0,
        valueHigh:  1,
        playerSpeed: 3,
        speedLow: 1.5, // lowest end of object speed distribution
        speedHigh: 3, // highest end of object speed distribution
        randSeed: 123},
    // Add more settings for each level
    3: {experiment: 2, // SK: 1=Experiment 1 - no drawing ; 2=Experiments 2 & 3 drawing always on
        AIMode: 1, // MS4: 0=no assistance; 1=always on; 2=adaptive
        planNumFramesAhead: 1, // MS4: plan solution for display a certain number of frames ahead (to allow human response time)
        AIDisplayMode: 1, // MS4: 0=show movement path; 1=show where to click; 2=show which targets to intercept
        AIMaxDisplayLength: 3, // MS4: can be used to truncate the AI path length shown
        visualizeAIPlayer: 0, // MS5: 0:default; 1=visualize AI player running in background
        maxTargets: 9, // MS2: added this parameter to limit total number of targets
        spawnProbability:  1,
        spawnInterval: 10,
        valueSkew: 1,
        valueLow: 0,
        valueHigh:  1,
        playerSpeed: 3,
        speedLow:  1.5, // lowest end of object speed distribution
        speedHigh: 3, // highest end of object speed distribution
        randSeed: 1234},
    4: {experiment: 2, // SK: 1=Experiment 1 - no drawing ; 2=Experiments 2 & 3 drawing always on
        AIMode: 1, // MS4: 0=no assistance; 1=always on; 2=adaptive
        planNumFramesAhead: 1, // MS4: plan solution for display a certain number of frames ahead (to allow human response time)
        AIDisplayMode: 1, // MS4: 0=show movement path; 1=show where to click; 2=show which targets to intercept
        AIMaxDisplayLength: 3, // MS4: can be used to truncate the AI path length shown
        visualizeAIPlayer: 0, // MS5: 0:default; 1=visualize AI player running in background
        maxTargets: 3, // MS2: added this parameter to limit total number of targets
        spawnProbability:  1.0,
        spawnInterval: 10,
        valueSkew: 1,
        valueLow: 0,
        valueHigh:  1,
        playerSpeed: 3,
        speedLow:  1.5, // lowest end of object speed distribution
        speedHigh: 3, // highest end of object speed distribution
        randSeed: 12345},
    5: {experiment: 2, // SK: 1=Experiment 1 - no drawing ; 2=Experiments 2 & 3 drawing always on
        AIMode: 1, // MS4: 0=no assistance; 1=always on; 2=adaptive
        planNumFramesAhead: 1, // MS4: plan solution for display a certain number of frames ahead (to allow human response time)
        AIDisplayMode: 1, // MS4: 0=show movement path; 1=show where to click; 2=show which targets to intercept
        AIMaxDisplayLength: 3, // MS4: can be used to truncate the AI path length shown
        visualizeAIPlayer: 0, // MS5: 0:default; 1=visualize AI player running in background
        maxTargets: 6, // MS2: added this parameter to limit total number of targets
        spawnProbability:  1,
        spawnInterval: 10,
        valueSkew: 1,
        valueLow: 0,
        valueHigh:  1,
        playerSpeed: 3,
        speedLow:  1.5, // lowest end of object speed distribution
        speedHigh: 3, // highest end of object speed distribution
        randSeed: 123456},
    // Add more settings for each level
    6: {experiment: 2, // SK: 1=Experiment 1 - no drawing ; 2=Experiments 2 & 3 drawing always on
        AIMode: 1, // MS4: 0=no assistance; 1=always on; 2=adaptive
        planNumFramesAhead: 1, // MS4: plan solution for display a certain number of frames ahead (to allow human response time)
        AIDisplayMode: 1, // MS4: 0=show movement path; 1=show where to click; 2=show which targets to intercept
        AIMaxDisplayLength: 3, // MS4: can be used to truncate the AI path length shown
        visualizeAIPlayer: 0, // MS5: 0:default; 1=visualize AI player running in background
        maxTargets: 9, // MS2: added this parameter to limit total number of targets
        spawnProbability:  1,
        spawnInterval: 10,
        valueSkew: 1,
        valueLow: 0,
        valueHigh:  1,
        playerSpeed: 3,
        speedLow:  1.5, // lowest end of object speed distribution
        speedHigh: 3, // highest end of object speed distribution
        randSeed: 1234567},
};

// Get the keys for randomization
let settingKeys = Object.keys(difficultySettings);

let currentRound = 1;
let maxRounds = Object.keys(difficultySettings).length;
let roundID = "round + " + currentRound;

// intitial firebase write.
let pathnow = studyId + '/participantData/' + firebaseUserId + '/participantInfo';
writeURLParameters(pathnow);

// Timing variables
let gameStartTime, elapsedTime;
let isPaused            = false; // flag for pausing the game
const gameTime          = 120000; // Two minutes in milliseconds

let isGameRunning       = false;
let frameCountGame      = 0; // MS: number of updates of the scene
let deltaFrameCount     = 0; // To limit the size of the Event Stream object; 
const fps               = 30; // Desired logic updates per second
const maxFrames         = 120 * fps;//120 * 60; // Two minutes in frames
const updateInterval    = 1000 / fps; // How many milliseconds per logic update
let firstRender         = 0;
let roundTime           = 0;

// Data collection variables
let objects         = [];
let spawnData       = [];
let caughtTargets   = [];
let missedTargets   = [];
let playerClicks    = [];
let playerLocation  = [];

const eventStreamSize = 720; // 2 minutes of 60 fps updates
let eventStream = Array.from({ length: eventStreamSize }, () => ({}));// preallocate the array


//let eventStream     = [];
//let eventObject     = {time: 0, player: {}, objects:{}}; // edit this object to include all current data on each player and object in the environment

// Variables for cursor
let cursorSize = 40;
let mouseX = 0, mouseY = 0;

// Varaiables for HTML elements
let score = 0;
let aiScore = 0;

// Player and View Initialization (related to one another)
const playerSize = 50;
const player = {
    color:"red", 
    x: canvas.width/2 , //center the x,y in the center of the player.
    y: canvas.height/2 ,
    moving:false,
    targetX:canvas.width/2,
    targetY:canvas.height/2,
    velocity: 1.5,
    angle:0,
    speed: 1.5, 
    width:50, 
    height:50,
    score:0
};
const camera = {
    x: world.width / 2,
    y: world.height / 2,
    width: canvas.width,
    height: canvas.height
};

// MS: adding a random number generator
function lcg(seed) {
    const a = 1664525;
    const c = 1013904223;
    const m = Math.pow(2, 32);
    let current = seed;
  
    return function() {
      current = (a * current + c) % m;
      return current / m;
    };
  }
  
let randomGenerator;
// MS4: ******************************* AI PLANNER ************************************//
let sol; // MS4: global variable that contains planned path for current frame

const AIplayerSize = 50;
const AIplayer = {
    color:'rgba(255, 0, 0, 0.5)', 
    x: canvas.width/2 - playerSize/2, //center the x,y in the center of the player.
    y: canvas.height/2 - playerSize/2,
    moving:false,
    targetX:0,
    targetY:0,
    velocity: 1.5,
    angle:0,
    speed: 1.5, 
    width:50, 
    height:50,
    score:0
};
let AIcaughtTargets = [];
let AIplayerLocation = [];

// ****************************UPDATE FUNCTIONS***************************//

// Start Game function
function startGame(round) {
    currentRound = round || currentRound; // Start at the specified round, or the current round
    // settings = getDifficultySettingsFromURL();
    // settings = difficultySettings[currentRound];

    // if (settingKeys.length === 0){
    //     settingKeys = Object.keys(difficultySettings);
    // }

    if (!DEBUG){
        const randIndex = Math.floor(Math.random() * settingKeys.length);
        const randKey = settingKeys[randIndex];
        settings = difficultySettings[randKey];
        settingKeys.splice(randIndex, 1);
    
        console.log("Key " + randKey + " Settings ", settings);
    } else{
        settings = difficultySettings[currentRound];
    }

    // Initialize with a seed
    randomGenerator = lcg(settings.randSeed);

    // console.log("start game settings", settings);

    // Reset game canvas visibility
    const gameCanvas = document.getElementById('gameCanvas');
    gameCanvas.style.display = 'block';
    const scoreCanvas = document.getElementById('scoreCanvas');
    scoreCanvas.style.display = 'block';

    if (!isGameRunning) {
        setupCanvas();
        gameStartTime   = Date.now();
        frameCountGame  = 0;
        isGameRunning   = true;
        gameLoop();
        // console.log('Settings being passed into gameLoop', settings);
    }
}
startGame(currentRound);

// End Game function
async function endGame(advanceRound = false) {
    isGameRunning = false;
    // console.log(gameTime); // Add this line
    //console.log("Game Over!");

    // Additional end-game logic here
    // const gameCanvas = document.getElementById('gameCanvas');
    // gameCanvas.style.display = 'none';
    // scoreCanvas.style.display = 'none';
    // console.log("Successfully Spawned Objects", spawnData);
    // console.log("Intercepted Targets", caughtTargets);  
    // console.log("Player Clicks Location", playerClicks);
    // console.log("Player Locations During Movement", playerLocation);
    // console.log("Event Stream", eventStream);

    // $('#comprehension-quiz-main-content').load('html/integrity-pledge.html');
    // console.log("Moving on to the integrity pledge and then the full game");

    // using this to not block the main thread. 
    // requestIdleCallback(() => {
        
    // });
    writeGameDatabase();

    if (advanceRound) {
        // round = currentRound;
        
        currentRound++;
        if (currentRound <= maxRounds && currentRound > 1) {
            await runGameSequence("You've Completed a Round and earned " + score + " points. Click OK to continue.");
            // console.log("Starting next round", currentRound);

            // requestIdleCallback(() => {
                // first clear the heap
                // eventStream     = null;
                objects         = null;
                spawnData       = null;
                caughtTargets   = null;
                playerClicks    = null;
                playerLocation  = null;
                score           = null;
                aiScore         = null;
                player.score    = null;
                AIplayer.score  = null


                AIcaughtTargets = null;
                AIplayerLocation = null;

                // then reassign the variables
                eventStream = Array.from({ length: eventStreamSize }, () => ({}));// preallocate the array
                objects         = []; // Reset the objects array
                spawnData       = [];
                caughtTargets   = [];
                playerClicks    = [];
                playerLocation  = [];
                score           = 0;    
                aiScore         = 0;
                player.score    = 0;
                AIplayer.score  = 0


                AIcaughtTargets = [];
                AIplayerLocation = [];
                
                player.x        = canvas.width/2;
                player.y        = canvas.height/2;
                player.targetX  = canvas.width/2;
                player.targetY  = canvas.height/2;
                AIplayer.x, AIplayer.y = canvas.width/2 - playerSize/2; // MS5: Reset the player position
            // });
            
            startGame(currentRound); // Start the next round
        } else {
            await runGameSequence("Congratulations on Finishing the Main Experiment! Click OK to Continue to the Feedback Survey.");
            // Game complete, show results or restart
            // console.log("Game complete");
            // Hide Experiment
            $("#task-header").attr("hidden", true);
            $("#task-main-content").attr("hidden", true);

            // //Show the redirect page.
            // $("#exp-complete-header").attr("hidden", false);
            // $("#task-complete").attr("hidden", false);

            // // Experiment Completed
            // $('#task-complete').load('html/complete.html');
            $("#exp-survey-header").attr("hidden", false);
            $("#survey-main-content").attr("hidden", false);

            // Show Survey
            $('#survey-main-content').load('html/survey-workload.html');
            
            return;
        }
    }
}

function gameLoop(timestamp) {
    if (!isGameRunning) return;

    if (frameCountGame==0){
        firstRender = Date.now();
    }

    if (frameCountGame >= maxFrames) {
        endGame(true);
        // console.log("Game Over!", frameCountGame);
        return;
    }

    elapsedTime = Date.now() - gameStartTime;
    roundTime = Date.now() - firstRender;

    // console.log('Running game loop at frame count', frameCount);
    // console.log('Time since running:', now - gameStartTime);
    
    // Calculate time since last update
    var deltaTime = timestamp - lastUpdateTime;
    // Check if it's time for the next update
    if (deltaTime >= updateInterval) {
        lastUpdateTime = timestamp - (deltaTime % updateInterval);
        updateObjects(settings);
         // Update game logic
        // console.log("Game Loop Settings:", settings);
    }
    render(); 

    // Schedule the next frame
    requestAnimationFrame(gameLoop); 
}

var lastUpdateTime = 0;

// Render function
function render() {
    // console.log('Rendering frame');
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas
    drawMask(ctx, player);
    drawGrid();                                      // Draw grid
    ctx.save();
    drawWorldBoundary();    // Draw boundaries
    drawPlayer();
    if (settings.visualizeAIPlayer==1) { // MS5
        drawAIPlayer();
    }
    if (player.moving) drawArrowDirection();   // Draw arrow direction  }
    // if (settings.experiment>1){
    //     // MS4: draw the path suggested by AI
    // }
    drawAISolution();
    drawTargetLocation();   // Draw target location
    // drawCursor(mouseX, mouseY); // Draw cursor
    drawObjects();          // Draw objects
    ctx.restore();
    drawScore();            // Draw score
}

// Update game objects
function updateObjects(settings) {
    //console.log("Current Objects", objects);
    if (isPaused){
        // console.log("Game is paused");
        return;
    } 
    if (frameCountGame == 0) {
        console.log("Starting Game");
        runGameSequence("This is Round " + currentRound + " of 6 of the Main Experiment. Click to Begin.");
    }
    if (deltaFrameCount == 10){
        deltaFrameCount = 0;
    }

    if (deltaFrameCount == 0){
        const index =  (frameCountGame)/10;
        if (index >= 0){
            let newEventObject      = {frame: frameCountGame, time: roundTime, player: {}, aiPlayer: {}, objects:{}}; 
            // append current game condition given the frame
            // write player data
            let curPlayerdata       = player;
            newEventObject.player   = JSON.parse(JSON.stringify(curPlayerdata));
            // write ai data
            let curAIdata           = AIplayer;
            newEventObject.aiPlayer = JSON.parse(JSON.stringify(curAIdata));
            // write all objects on screen
            let curObjs             = objects.filter(obj => obj.active);
            newEventObject.objects  = JSON.parse(JSON.stringify(curObjs));
            // console.log("Event Stream Index", index)
            eventStream[index] = newEventObject;
        }
    }
    
    frameCountGame++; // MS: increment scene update count
    deltaFrameCount++; // limit the amount of data pushes

    player.velocity = settings.playerSpeed;
 
    // Update player position if it is moving
    if (player.moving) {
        const deltaX = player.targetX - player.x;
        const deltaY = player.targetY - player.y;
        const distanceToTarget = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        if (distanceToTarget < player.velocity) {
            // Player has arrived at the target location
            player.x = player.targetX;
            player.y = player.targetY;
            player.moving = false;
        } else {
            // Move player towards the target
            player.angle = Math.atan2(deltaY, deltaX);
            player.x += player.velocity * Math.cos(player.angle);
            player.y += player.velocity * Math.sin(player.angle);

            // console.log("Player Speed", player.velocity);

            playerLocation.push({frame: frameCountGame, x: player.x, y: player.y});
        }
    }

    // Prevent player from moving off-screen
    player.x = Math.max(player.width / 2, Math.min(canvas.width - player.width / 2, player.x));
    player.y = Math.max(player.height / 2, Math.min(canvas.height - player.height / 2, player.y));

    // MS5: Update AI player position if it is moving
    AIplayer.velocity = settings.playerSpeed;
    //if (AIplayer.moving) {
    const deltaX = AIplayer.targetX - AIplayer.x;
    const deltaY = AIplayer.targetY - AIplayer.y;
    const distanceToTarget = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    if (distanceToTarget < AIplayer.velocity) {
        // AI Player has arrived at the target location
        AIplayer.x = AIplayer.targetX;
        AIplayer.y = AIplayer.targetY;
        AIplayer.moving = false;
    } else {
        // Move player towards the target
        AIplayer.angle = Math.atan2(deltaY, deltaX);
        AIplayer.x += AIplayer.velocity * Math.cos(AIplayer.angle);
        AIplayer.y += AIplayer.velocity * Math.sin(AIplayer.angle);
        AIplayer.moving = true;
        AIplayerLocation.push({time: frameCountGame, x: AIplayer.x, y: AIplayer.y});
    }

    // MS: and inserted the following code
    if (frameCountGame % settings.spawnInterval === 0) {
        spawnObject(settings);    
    }

    let toRemove = [];
    objects.forEach((obj, index) => {
        if (obj.active) {
            obj.x += obj.vx * obj.speed; // Update x position
            obj.y += obj.vy * obj.speed; // Update y position
            // console.log("Object Location", obj.x, obj.y);

            // Check if the object is outside the observable area
            let dx = obj.x - center.x;
            let dy = obj.y - center.y;
            let distanceFromCenter = Math.sqrt(dx * dx + dy * dy) - 10;

            if (distanceFromCenter > observableRadius) {
                // console.log("Object is outside observable area");
                obj.active = false; // Set the object to inactive
                toRemove.push( index );
                // objects.splice(index, 1); // Remove the object from the array
                //spawnObject(settings); // Spawn a new object
            }
            
            if (!obj.intercepted && checkCollision(player, obj)) { // MS2: added a condition
                // Collision detected
                //obj.active = false; // MS2: commented out this line
                //objects.splice(index, 1); // MS2: commented out this line
                obj.intercepted = true; // MS2: added this flag
                score += obj.value;
                player.score += obj.value;

                let caughtObj = {frame: frameCountGame, target: obj}
                
                // console.log("Collision detected!");
                caughtTargets.push(caughtObj);
            }

            if (!obj.AIintercepted && checkCollision(AIplayer, obj)) { // MS5: added a condition
                // Collision detected
                obj.AIintercepted = true; // MS2: added this flag             
                //console.log("AI Collision detected!");
                let caughtObj = {frame: frameCountGame, target: obj}   
                AIcaughtTargets.push(caughtObj);

                aiScore += obj.value;
                AIplayer.score += obj.value;
                // console.log("AI Score: ", aiScore);
            }
        }
        
        //spawnObject(settings); // MS: I don't understand why this function was called within this loop over targets; this be called outside of this loop???

        // Add to missed array iff : 1) Not Active, 2) Not Tagged, 3) Correct Target Shape.
        if (!obj.active && obj.objType === 'target') {
            // Log missed triangle
            missedTargets.push({ x: obj.x, y: obj.y, time:frameCountGame});

            // Calls a function cascade to display a message "Target Missed!"
            targetMissed();
        }
    });
    // MS4: Remove items starting from the end
    for (let i = toRemove.length - 1; i >= 0; i--) {
        objects.splice(toRemove[i], 1);
    }

    sol = runAIPlanner( objects, AIplayer , observableRadius , center, 0, 'AI' );

    // MS5: Run planner for the AI player
    AIplayer.targetX = sol.interceptLocations[0][0]; // Set target position for the AI player
    AIplayer.targetY = sol.interceptLocations[0][1]; 
    // MS4: Run AI planner
    if (settings.AIMode>0) {
        // MS4
        //console.time('functionExecutionTime');
        sol = runAIPlanner( objects, player , observableRadius , center, settings.planNumFramesAhead , 'human' ); 
        //console.timeEnd('functionExecutionTime');
        //console.log( 'Calculated AI path');   
    }

}

function spawnObject(settings){

    let numObjectsTotal = objects.length; // MS2: count total number of objects (intercepted objects also count)
    
    let randomThreshold = randomGenerator();
    if (randomThreshold < settings.spawnProbability && numObjectsTotal < settings.maxTargets) { // MS2: added this condition
        // console.log("Spawn Threshold Met");
        let newObject = createComposite(settings);
        
        // MS: Generate a random angle between 0 and 2π (0 and 360 degrees)
        //let angle = Math.random() * 2 * Math.PI;
        let angle = randomGenerator() * 2 * Math.PI;

        // get x,y coordinates
        let curXLoc = center.x + observableRadius * Math.cos(angle); // - obj.width / 2;
        let curYLoc = center.y + observableRadius * Math.sin(angle); // - obj.height / 2;
        let location = {x:curXLoc, y:curYLoc, angle:angle, lastSpawnTime:0};

        // works good enough for now
        newObject.x = location.x ;
        newObject.y = location.y ;
        newObject.spawnX = location.x;
        newObject.spawnY = location.y;
        setVelocityTowardsObservableArea(newObject);

        // push to objects array in order to render and update
        objects.push(newObject);
        // console.log("New Object Spawned", newObject);
        spawnData.push(newObject)

    }
    location.lastSpawnTime = elapsedTime;
}

function createComposite(settings) {
    if (!settings) {
        console.error("Settings not provided to createComposite");
        return; // Or set default values for settings
    }
    let shapeType = 'circle';

    const shapeSize = 15;
    // minSize + Math.random() * (maxSize - minSize); // Random size within range

    // Sample u ~ Uniform(0,1)
    // adjust u by the skewFloor and skewCeiling
    var valueLow = settings.valueLow;
    var valueHigh = settings.valueHigh;
    var range = valueHigh - valueLow;
    
    //let u = Math.random() * range + valueLow;
    let u = randomGenerator() * range + valueLow;

    // Eta controls the skewness of the value distribution
    let eta = settings.valueSkew || 1; // Default to 1 if not provided
    // Apply the non-linear transformation
    let fillRadius = Math.pow(u, eta) * shapeSize;

     // sample from a distribution of speeds
     let speedRange = settings.speedHigh - settings.speedLow
     //let speedSample = Math.random() * speedRange + settings.speedLow;
     let speedSample = randomGenerator()  * speedRange + settings.speedLow;

    let newObj = {
        ID: frameCountGame ,
        type: 'composite',
        speed: speedSample, //(),
        x: 0,
        y: 0,
        vx: 0, // initial velocity is zero -->
        vy: 0,
        velAngle: 0, // initial velocity angle is zero --> reset in the setVelocityTowardsObservableArea
        size: shapeSize,
        outerColor: 'blue',
        innerColor: 'orange',
        shape: shapeType, // Add shape type here
        type: 'target',
        //angle: shapeRotation,
        fill: fillRadius,
        value: Math.floor(fillRadius),
        active: true,
        intercepted: false, // MS2: Added this flag
        AIintercepted: false, // MS5: Added this flag
        spawnX: 0,
        spawnY: 0
    };
    // console.log(newObj.speed);

    return newObj;
}

function setVelocityTowardsObservableArea(obj) {
    // Calculate angle towards the center
    let angleToCenter = Math.atan2(center.y - obj.y, center.x - obj.x);

    // Define the cone's range (22.5 degrees in radians)
    let coneAngle = 90 * (Math.PI / 180); // Convert degrees to radians

    // Randomly choose an angle within the cone
    //let randomAngleWithinCone = angleToCenter - coneAngle / 2 + Math.random() * coneAngle;
    let randomAngleWithinCone = angleToCenter - coneAngle / 2 + randomGenerator()  * coneAngle;

    // Set velocity based on the angle within the cone
    obj.vx = Math.cos(randomAngleWithinCone);
    obj.vy = Math.sin(randomAngleWithinCone);
    // console.log(`Initial Velocity for object: vx = ${obj.vx}, vy = ${obj.vy}`);
}

// Choose one function
function positionObjectsOnRim(obj) {
    if (!obj) {
        console.error("Invalid object passed to positionObjectsOnRim");
        return;
    }
    // Calculate a random angle
    //let angle = Math.random() * 2 * Math.PI;
    let angle = randomGenerator() * 2 * Math.PI;

    // Position the object on the rim of the camera
    obj.x = center.x + observableRadius * Math.cos(angle);
    obj.y = center.y + observableRadius * Math.sin(angle);

    // console.log(`Initial position for object: x = ${obj.x}, y = ${obj.y}`);

    // Set the object's velocity towards the observable area
    setVelocityTowardsObservableArea(obj);
}

function positionObjectAtAngle(obj, angle) {
    obj.x = center.x + observableRadius * Math.cos(angle) - obj.width / 2;
    obj.y = center.y + observableRadius * Math.sin(angle) - obj.height / 2;
    setVelocityTowardsObservableArea(obj);
}
// Helper function to determine if an object is within view ***currently not used***

function isWithinObservableArea(obj) {
    // Calculate the distance from the object to the player
    let dx = obj.x - player.x;
    let dy = obj.y - player.y;
    let distanceSquared = dx * dx + dy * dy;

    // Check if the object is within the observable radius
    return distanceSquared <= observableRadius * observableRadius;
}

function getObjectSpeed(){
    // return (Math.floor(Math.random() * 4) + 1) * 0.5;
    return 1; // making speed constant for now.
}

function checkCollision(player, obj) {
    // Calculate the player's bounding box edges from its center
    let playerLeft = player.x - player.width / 2;
    let playerRight = player.x + player.width / 2;
    let playerTop = player.y - player.height / 2;
    let playerBottom = player.y + player.height / 2;

    // Calculate the distance from the center of the player to the center of the object
    let circleDistanceX = Math.abs(obj.x - player.x);
    let circleDistanceY = Math.abs(obj.y - player.y);

    // Check for collision
    if (circleDistanceX > (player.width / 2 + obj.size / 2)) { return false; }
    if (circleDistanceY > (player.height / 2 + obj.size / 2)) { return false; }

    if (circleDistanceX <= (player.width / 2)) { return true; } 
    if (circleDistanceY <= (player.height / 2)) { return true; }

    // Check corner collision
    let cornerDistance_sq = (circleDistanceX - player.width / 2) ** 2 + (circleDistanceY - player.height / 2) ** 2;

    return (cornerDistance_sq <= ((obj.size / 2) ** 2));
}

// Helper function to clamp a value between a minimum and maximum value
function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

//*************************DRAWING FUNCTIONS******************************//

function setupCanvas() {
    // Fill the background of the entire canvas with grey
    ctx.fillStyle = 'grey';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  
    // Define the game world area with a white rectangle (or any other color your game uses)
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, world.width, world.height);

    ctx.font = '20px Arial'; // MS4: Font size and style for the text
}

function drawWorldBoundary() {
    ctx.strokeStyle = 'grey';
    ctx.strokeRect(0, 0, world.width, world.height);
}

function drawPlayer() {
    let topLeftX = player.x - player.width / 2;
    let topLeftY = player.y - player.height / 2;

    ctx.fillStyle = player.color;
    ctx.fillRect(topLeftX, topLeftY, player.width, player.height);
}

// MS5
function drawAIPlayer() {
    let topLeftX = AIplayer.x - AIplayer.width / 2;
    let topLeftY = AIplayer.y - AIplayer.height / 2;

    ctx.fillStyle = AIplayer.color;
    //ctx.strokeStyle = player.color;
    ctx.fillRect(topLeftX, topLeftY, player.width, player.height);
}

// Function to draw objects
function drawObjects() {
    objects.forEach(obj => {
        if (obj.active) {
            if (!obj.intercepted) drawCompositeShape(obj); // MS2: added this condition
            // MS5: added this; can be removed once code is tested
            if ((obj.AIintercepted) && (settings.visualizeAIPlayer==1)) drawCompositeShapeAI(obj); 
            // if (obj.intercepted) drawCompositeShapeDEBUG(obj); // MS2: added this; can be removed once code is tested
            // //drawDebugBounds(obj);
        }
    });
}

// MS2: added this function just for debugging; it continues to draw the targets even when intercepted
function drawCompositeShapeDEBUG(obj) {
    // Draw the outer circle first
    drawCircle(obj.x, obj.y, obj.size, 'LightGrey' ); // Outer circle

    // Then draw the inner circle on top
    drawCircle(obj.x, obj.y, obj.fill, 'gray' ); // Inner circle, smaller radius
}

// MS5: added this function just for debugging; it shows when AI player has intercepted target
function drawCompositeShapeAI(obj) {
    // Draw the outer circle first
    drawCircle(obj.x, obj.y, obj.size, 'LightGrey' ); // Outer circle

    // Then draw the inner circle on top
    drawCircle(obj.x, obj.y, obj.fill, 'gray' ); // Inner circle, smaller radius
}


function drawCompositeShape(obj) {
    // Draw the outer circle first
    drawCircle(obj.x, obj.y, obj.size, obj.outerColor); // Outer circle

    // Then draw the inner circle on top
    drawCircle(obj.x, obj.y, obj.fill, obj.innerColor); // Inner circle, smaller radius
}

function drawCircle(centerX, centerY, radius, color) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();
}

function drawVelocityVector(obj) {
    if (isWithinCanvas(obj)) {
        const velocityScale = 1000; // Adjust this value to scale the velocity vector length
        const arrowSize = 5; // Size of the arrowhead

        // Calculate the end point of the velocity vector
        const endX = obj.x + obj.vx * obj.speed * velocityScale;
        const endY = obj.y + obj.vy * obj.speed * velocityScale;

        // Draw the line for the velocity vector
        ctx.beginPath();
        ctx.moveTo(obj.x, obj.y);
        ctx.lineTo(endX, endY);
        ctx.strokeStyle = 'blue'; // Color of the velocity vector
        ctx.stroke();

        // Optionally, draw an arrowhead at the end of the velocity vector
        ctx.beginPath();
        ctx.moveTo(endX, endY);
        ctx.lineTo(endX - arrowSize, endY + arrowSize);
        ctx.lineTo(endX + arrowSize, endY + arrowSize);
        ctx.lineTo(endX, endY);
        ctx.fillStyle = 'blue';
        ctx.fill();
    }
}

function isWithinCanvas(obj) {
    return obj.x >= 0 && obj.x <= canvas.width && obj.y >= 0 && obj.y <= canvas.height;
}

function drawDebugBounds(obj) {
    ctx.strokeStyle = 'red'; // Set the boundary color to red for visibility
    ctx.strokeRect(obj.x, obj.y, obj.size, obj.size); // Draw the boundary of the object
}

function drawScore() {
    scoreCtx.clearRect(0, 0, scoreCanvas.width, scoreCanvas.height); // Clear the score canvas
    scoreCtx.font = '16px Roboto';
    scoreCtx.fillStyle = 'black'; // Choose a color that will show on your canvas
    scoreCtx.fillText('Score: ' + score, 10, 20); // Adjust the positioning as needed
}

function drawCursor(x, y) {
    ctx.save(); // Save state
    ctx.fillStyle = 'rgba(100, 100, 100, 0.5)'; // Semi-transparent grey
    ctx.beginPath();
    ctx.arc(x, y, cursorSize, 0, 2 * Math.PI);
    ctx.fill();
    ctx.restore(); // Restore state
}

// drawing outer mask
function drawMask(ctx) {
    if (!ctx) {
        console.error('drawMask: No drawing context provided');
        return;
    }

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const maskRadius = 400; // Adjust as necessary

    ctx.save();

    // Draw a black rectangle covering the entire canvas
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Then cut out a circular area from the rectangle
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(centerX, centerY, maskRadius, 0, Math.PI * 2, false);
    ctx.fill();

    ctx.globalCompositeOperation = 'source-over';
    ctx.restore();
}

// Function to where the player is heading
function drawArrowDirection() {
    // Define the radial distance from the player
    let radialDistance = 60; // Adjust this value as needed

    // Player dimensions (assuming square for simplicity)
    let playerWidth = 50; // Replace with actual player width
    let playerHeight = 50; // Replace with actual player height

  
    // Calculate the arrow's position around the player center
    let arrowCenterX = player.x + radialDistance * Math.cos(player.angle);
    let arrowCenterY = player.y + radialDistance * Math.sin(player.angle);

    // Define the size of the arrow
    let arrowLength = 20;
    let arrowWidth = 10;

    // Calculate the end point of the arrow
    let endX = arrowCenterX + arrowLength * Math.cos(player.angle);
    let endY = arrowCenterY + arrowLength * Math.sin(player.angle);

    // Calculate the points for the base of the arrow
    let baseX1 = arrowCenterX + arrowWidth * Math.cos(player.angle - Math.PI / 2);
    let baseY1 = arrowCenterY + arrowWidth * Math.sin(player.angle - Math.PI / 2);
    let baseX2 = arrowCenterX + arrowWidth * Math.cos(player.angle + Math.PI / 2);
    let baseY2 = arrowCenterY + arrowWidth * Math.sin(player.angle + Math.PI / 2);

    // Draw the arrow
    ctx.save();
    ctx.fillStyle = 'red';
    ctx.beginPath();
    ctx.moveTo(baseX1, baseY1);
    ctx.lineTo(endX, endY);
    ctx.lineTo(baseX2, baseY2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
}

function drawTargetLocation() {
    // draw an x where the player is aiming
    ctx.save();
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(player.targetX - 10, player.targetY - 10);
    ctx.lineTo(player.targetX + 10, player.targetY + 10);
    ctx.moveTo(player.targetX + 10, player.targetY - 10);
    ctx.lineTo(player.targetX - 10, player.targetY + 10);
    ctx.stroke();
    ctx.restore();
}

// AI Assistance...
function highlightAssist(obj) {
    // Assuming the highlight is a circle around the object
    ctx.save();
    ctx.strokeStyle = 'green'; // Color of highlight
    ctx.lineWidth = 2; // Thickness of highlight line
    ctx.beginPath();

    // Set the radius to be larger than the object's size to surround the object
    // The new radius is the object's size divided by the square root of 2 (approximately 1.414)
    // which is the diagonal of the square, plus some padding
    const radius = (obj.size / Math.sqrt(2)) + 5; // Adding 5 for padding

    // Draw an arc centered on the object
    ctx.arc(obj.x + obj.size / 2, obj.y + obj.size / 2, radius, 0, Math.PI * 2);
    
    ctx.stroke();
    ctx.restore();
}

// Draw Grid function
function drawGrid() {
    // Begin path for grid lines
    ctx.beginPath();
    ctx.strokeStyle = '#CCCCCC';
  
    // Calculate the start and end points for the grid lines
    const leftmostLine = camera.x - (camera.x % 100);
    const topmostLine = camera.y - (camera.y % 100);
  
    // Vertical lines
    for (let x = leftmostLine; x < camera.x + canvas.width; x += 100) {
      ctx.moveTo(x - camera.x, 0);
      ctx.lineTo(x - camera.x, canvas.height);
    }
  
    // Horizontal lines
    for (let y = topmostLine; y < camera.y + canvas.height; y += 100) {
      ctx.moveTo(0, y - camera.y);
      ctx.lineTo(canvas.width, y - camera.y);
    }
  
    // Stroke the grid lines
    ctx.stroke();
}

// MS4: draw the path suggested by AI planner
function drawAISolution() {
    if ((settings.AIMode>0) && (sol != null)) {
        // get the length of the suggested path
        let pathLength = Math.min( sol.interceptLocations.length, settings.AIMaxDisplayLength );
        if (pathLength > 0) {
            if (settings.AIDisplayMode==0) {
                // Show where to move with lines
                ctx.save();
                ctx.strokeStyle = 'rgba(255, 255, 0, 0.5)'; // Adjust the last number for transparency 
                ctx.lineWidth = 5;
                ctx.beginPath();
                ctx.moveTo(player.x, player.y );
                for (let i=0; i<pathLength; i++) {
                    let transp = (i+1)/3;
                    ctx.strokeStyle = 'rgba(255, 255, 0, ' + transp + ')'; // Adjust the last number for transparency
                    let toX = sol.interceptLocations[i][0];
                    let toY = sol.interceptLocations[i][1];
                    ctx.lineTo( toX, toY );
                }
                ctx.stroke();
                ctx.restore();
            }

            if (settings.AIDisplayMode==1) {
                // Show a cross on where to click next 
                ctx.save();
                ctx.fillStyle = 'yellow'; // Color of the text
                ctx.strokeStyle = 'rgba(255, 255, 0, 0.5)'; // Adjust the last number for transparency
                ctx.lineWidth = 5;
                ctx.beginPath();

                ctx.moveTo(player.x, player.y );

                let i = 0;
                //for (let i=0; i<pathLength; i++) {
                    let toX = sol.interceptLocations[i][0];
                    let toY = sol.interceptLocations[i][1];
                    ctx.lineTo( toX, toY ); 
                    ctx.moveTo(toX - 10, toY - 10);
                    ctx.lineTo(toX + 10, toY + 10);
                    ctx.moveTo(toX + 10, toY - 10);
                    ctx.lineTo(toX - 10, toY + 10); 

                    // Draw text
                    // Adjust the text position as needed. Here it's slightly offset from the cross.
                    //ctx.fillText(i+1, toX + 15, toY + 15); 
                //}
                ctx.stroke();
                ctx.restore();
            }
            
            if (settings.AIDisplayMode==2) {
                // Highlight the target interception sequence 
                ctx.save();
                ctx.fillStyle = 'black'; // Color of the text
                ctx.strokeStyle = 'rgba(255, 255, 0, 0.5)'; // Adjust the last number for transparency
                ctx.lineWidth = 5;
                ctx.beginPath();

                let i = 0;
                for (let i=0; i<pathLength; i++) {
                    let indexNow = sol.originalIndex[i];
                    if (indexNow != -1) {
                        let toX = objects[indexNow].x;
                        let toY = objects[indexNow].y;                      
                        // Draw text
                        //ctx.fillText(i+1, toX + 25, toY + 25); 

                        // Draw an arrow to the first one
                        if (i==0) {
                            drawFilledArrow(ctx, toX - 25 , toY, 10); 
                        }
                    }
                    
                }
                ctx.stroke();
                ctx.restore();
            }
        }
        
    }
}

// MS4: draw arrow
function drawFilledArrow(ctx, toX, toY, arrowWidth) {
    const arrowLength = arrowWidth * 4; // Adjust the length of the arrow as needed
    const headLength = arrowWidth * 0.6; // Length of the head of the arrow
    const headWidth = arrowWidth * 1.4; // Width of the head of the arrow

    // Starting points for the arrow (adjust as necessary)
    const fromX = toX - arrowLength;
    const fromY = toY;

    // Set the fill color
    //ctx.fillStyle = 'rgba(255, 255, 0, 0.5)';
    //ctx.strokeStyle = 'rgba(255, 255, 0, 0.5)'; // Adjust the last number for transparency
    ctx.fillStyle = 'yellow';
    //ctx.strokeStyle = 'rgba(255, 255, 0, 0.5)'; // Adjust the last number for transparency


    // Begin a new path for the arrow
    ctx.beginPath();

    // Draw the arrow body as a rectangle
    ctx.rect(fromX, fromY - arrowWidth / 2, arrowLength - headLength, arrowWidth);

    // Draw the arrow head as a triangle
    ctx.moveTo(toX - headLength, toY - headWidth / 2);
    ctx.lineTo(toX, toY);
    ctx.lineTo(toX - headLength, toY + headWidth / 2);

    // Close the path and fill the arrow with the set color
    ctx.closePath();
    ctx.fill();
}


function showTargetMessage(isCaught) {
    var messageBox = document.getElementById('messageBox');
    var gameMessage = document.getElementById('gameMessage');
  
    messageBox.style.display = 'block'; // Show the message box
    gameMessage.textContent = isCaught ? 'Target Caught!' : 'Target Missed!'; // Set the message
  
    // Optionally, hide the message after a delay
    setTimeout(function() {
      messageBox.style.display = 'none';
    }, 2000); // Hide the message after 2 seconds
}

//  CUSTOM ALERT MESSAGE IN ORDER TO PAUSE THE GAME AND DISPLAY TEXT
function showCustomAlert(message) {
    // document.getElementById('customAlertMessage').innerText = message;
    // document.getElementById('customAlert').style.display = 'flex';

    return new Promise((resolve, reject) => {
        // Display the custom alert with the message
        $('#customAlertMessage').text(message);
        $('#customAlert').show();
    
        // Set up the event handlers for the 'X' and 'OK' buttons
        $('#customAlert .custom-alert-close, #customAlert button').one('click', function() {
            $('#customAlert').hide();
            resolve(); // This resolves the Promise allowing code execution to continue
        });
    });
}

function closeCustomAlert() {
    document.getElementById('customAlert').style.display = 'none';
}

// *********************************EVENT LISTENERS********************************* //

$(document).ready( function(){
   // Event listener for player click locations
   canvas.addEventListener('click', function(event) {
    // Get the position of the click relative to the canvas
    // Check not first click so that initializing game doesn't leed to player movement
        //if (clickCount >= 1) {
            const rect   = canvas.getBoundingClientRect();
            const clickX = event.clientX - rect.left;
            const clickY = event.clientY - rect.top;
            player.targetX = clickX;
            player.targetY = clickY;

            // Calculate the angle from the player to the click position
            const deltaX = clickX - (player.x + player.width / 2);
            const deltaY = clickY - (player.y + player.height / 2);
            player.angle = Math.atan2(deltaY, deltaX);
            player.moving = true;

            playerClicks.push({frame: frameCountGame, targetX: clickX, targetY: clickY, curX: player.x, curY: player.y, angle:player.angle});
        //}
    });

    
    window.closeCustomAlert = closeCustomAlert; // Add closeCustomAlert to the global scope
});

async function runGameSequence(message) {
    isPaused = true;
    await showCustomAlert(message);
    isPaused = false;
}

// Function to handle cursor size change
function handleCursorSizeChange(event) {
    cursorSize = Number(event.target.value);
}

function handleTargetProbChange(event){
    targetProbability = Number(event.target.value);
}

function handleNumObjectsChange(event){
    const newNumObjects = Number(event.target.value);
    const difference = newNumObjects - objects.length;
    
    if (difference > 0) {
        // Add more objects if the new number is greater
        for (let i = 0; i < difference; i++) {
            let newObj = createComposite(settings);
            positionObjectsOnRim(newObj);
            objects.push(newObj);
        }
    } else {
        // Remove objects if the new number is smaller
        objects.splice(newNumObjects, -difference);
    }
    // No need to reinitialize or redraw all objects, just adjust the existing array
}

// Toggle AI assistance function
function toggleAIAssistance() {
    aiAssistanceOn = !aiAssistanceOn; // Toggle the state
    const robotImg = document.getElementById('aiAssistRobot');
    const button = document.getElementById('toggleAIAssistance');

    if (aiAssistanceOn) {
        button.style.backgroundColor = 'green';
        button.textContent = 'AI Assistance: ON';
        robotImg.style.filter = 'drop-shadow(0 0 10px green)'; // Add green glow effect
    } else {
        button.style.backgroundColor = 'red';
        button.textContent = 'AI Assistance: OFF';
        robotImg.style.filter = 'none'; // Remove glow effect
    }
    
    // Redraw the canvas to reflect the change in highlighting
    //render();
}

// // Function to initialize the starting page
// function initializeStartingPage() {
//     ctx.clearRect(0, 0, canvas.width, canvas.height);
//     ctx.fillStyle = 'black';
//     ctx.font = '30px Arial';
//     ctx.textAlign = 'center';
//     ctx.fillText('Start Game', canvas.width / 2, canvas.height / 2);
// }

// Function to handle canvas click
function handleStartCanvasClick(event) {
    const rect = canvas.getBoundingClientRect();
    const canvasX = event.clientX - rect.left;
    const canvasY = event.clientY - rect.top;
    if (isStartGameAreaClicked(canvasX, canvasY)) {
        startGame();
    }
}

// Function to check if the start game area is clicked
function isStartGameAreaClicked(x, y) {
    return x > canvas.width / 2 - 100 && x < canvas.width / 2 + 100 &&
           y > canvas.height / 2 - 20 && y < canvas.height / 2 + 20;
}

// Helper function to determine if the click is on the object
function isClickOnObject(obj, x, y) {
    // Calculate the center of the object
    const centerX = obj.x + obj.size / 2;
    const centerY = obj.y + obj.size / 2;

    // Calculate the distance between the click and the object's center
    const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);

    // Check if the distance is less than or equal to the cursor size
    return distance <= cursorSize;
}

//*****************************DATA COLLECTION***************************//
  
function targetMissed() {
    showTargetMessage(false);
}

function targetCaught(obj) {
    showTargetMessage(true);
    caughtTargets.push({ x: obj.x, y: obj.y, time: new Date()});
    console.log("Target was caught and pushed into array.")
}

function distractorCaught(obj){
    caughtDistractors.push({x: obj.x, y: obj.y, time: new Date()});
    console.log("Distractor pushed into array.");
}

// function preallocateEventStream(eventStreamSize){
//     // preallocate the array
//     for (let i = 0; i < eventStreamSize; i++) {
//         eventStream[i] = {frame: 0, time: 0, player: {}, objects:{}};
//     }
// }
