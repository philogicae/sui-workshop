#!/bin/bash

MY_ADDRESS=$(sui client active-address)
CONTRACT="0xfb766a07897ba43eab52b852125078a05253986f200a2d811908be732726dc64"
GUESTBOOK_ID="0xc6aba638eacdd6cd5a05766d6d81a83f96b90b97df844599732306b977234095"

sui client ptb \
    --gas-budget 10000000 \
    --assign sender @$MY_ADDRESS \
    --move-call $CONTRACT::guestbook::create_message sender '"test message"' \
    --assign msg \
    --move-call $CONTRACT::guestbook::post_message @$GUESTBOOK_ID msg