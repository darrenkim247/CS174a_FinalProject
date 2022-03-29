
## Final Project - CS174A Winter 2022, Asish Law
### Darren Kim, Serena Song, Ryan Taylor

This is the source for our group final project for CS174A Computer Graphics, Winter 2022. This repository packages the static assets and scripts needed to run the project.

To run, clone the repo and execute the batch script in your command line:

    > host.bat
Then navigate to port 8000 on localhost to view & interact with the project.


#### Instructions on how to run and play the game: ####

The code should run normally without any further adjustments. A start screen with gamplay instructions at the bottom should load first. Click anywhere to start the game.

Click and hold to draw back your bow. Aim with your mouse, and release to fire.

You earn points for every apple you hit. The closer you are to the center of the apple, the more points you'll earn.

Any apple that hits your child will cause them to lose health. If 5 apples hit them during one level, the game will end. 
A game over will also be triggered if the child is hit since the player is meant to protect them.
A game over screen promting the player to restart should pop up afterwards.

Be on the lookout for special golden apples--if you hit one with an arrow, it will slow down the apples and make them easier to hit. You'll also get a big score bonus! (Note: Unlike regular apples, the child's health won't go down if you fail to hit this apple since it's meant to be a bonus.)

There are 3 levels in total, with the rate of apples spawing increasing with each level.

Press p to pause.
Press r to restart.
