#!/bin/bash

MY_ADDRESS="0xfa99bbfb9fbba3330f69c43cc7bf1efcafb5cd45cd457d02b02689388772e2c1"
CONTRACT="0xfb766a07897ba43eab52b852125078a05253986f200a2d811908be732726dc64::guestbook"

sui client ptb \
    --gas-budget 10000000 \
    --move-call $CONTRACT::init \
    --assign guestbook
#    --assign guestbook \
#    --assign sender @$MY_ADDRESS \
#    --move-call $CONTRACT::create_message sender '"Hello World"' \
#    --assign msg \
#    --move-call $CONTRACT::post_message guestbook msg