#!/bin/bash

cd io
as -arch arm64 -o script.o script.asm
ld script.o -o script -L/Library/Developer/CommandLineTools/SDKs/MacOSX.sdk/usr/lib -lSystem 
./script