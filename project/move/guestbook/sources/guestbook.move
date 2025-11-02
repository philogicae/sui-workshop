module guestbook::guestbook;

use std::string::String;
use sui::event;

// Errors
const ErrorMessageEmpty: u64 = 1;
const ErrorMessageTooLong: u64 = 2;

// Constants
const MESSAGE_MAX_LENGTH: u64 = 100;

public struct GuestbookCreated has copy, drop {
    guestbook_id: ID,
}

public struct Message has copy, drop, store {
    sender: address,
    content: String,
}

public struct Guestbook has key {
    id: UID,
    total_messages: u64,
    messages: vector<Message>,
}

fun init(ctx: &mut TxContext) {
    let guestbook = Guestbook {
        id: object::new(ctx),
        total_messages: 0,
        messages: vector::empty<Message>(),
    };
    let guestbook_id = object::id(&guestbook);
    event::emit(GuestbookCreated {
        guestbook_id,
    });
    transfer::share_object(guestbook);
}

public fun create_message(sender: address, content: String): Message {
    let content_length = content.length();
    assert!(content_length > 0, ErrorMessageEmpty);
    assert!(content_length <= MESSAGE_MAX_LENGTH, ErrorMessageTooLong);
    Message {
        sender,
        content,
    }
}

public fun post_message(guestbook: &mut Guestbook, message: Message) {
    guestbook.total_messages = guestbook.total_messages + 1;
    vector::push_back(&mut guestbook.messages, message);
}

public fun get_messages(guestbook: &Guestbook): vector<Message> {
    guestbook.messages
}

public fun get_message_count(guestbook: &Guestbook): u64 {
    guestbook.total_messages
}

public fun get_message_sender(message: &Message): address {
    message.sender
}

public fun get_message_content(message: &Message): String {
    message.content
}
