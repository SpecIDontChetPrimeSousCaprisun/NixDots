#!/bin/sh
echo "WARINIG : I have never tested this so it might not work"
echo "This needs to run in the cloned repo folder in order to work"
echo "WARNING :"
echo "This will create a backup of /etc/nixos at ~/nixos.bak"
echo "and a backub of ~/.config at ~/.config.bak"
echo "DO NOT STOP WHILE THIS IS RUNNING"
echo "You can press ctrl + c to cancel before it starts"
sleep 1
echo "Starting in : 5..."
sleep 1
echo "4..."
sleep 1
echo "3..."
sleep 1
echo "2..."
sleep 1
echo "1..."

mv /etc/nixos ~/nixos.bak
mv ~/.config ~/.config.bak

ln -s ./Config ~/.config
ln -s ./nixos ~/etc/nixos

nixos-rebuild switch
