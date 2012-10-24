
//
// STATE
//
var draw = game.draw;

function State(){
	this.init = function(){};
	this.onKeyDown = function(keyDown){};
	this.onTouch = function(x,y){};
	this.update = function(){};
	this.paint = function(){};
	this.destroy = function(){};
};

//
// STATE WAITING
//
var debug_text = "";
var card_on_table_text = "";
State.waiting = new State();

State.waiting.init = function(){
    debug_text = "";
    card_on_table_text = "";
};

State.waiting.paint = function(){
//    draw.text(debug_text, 10, 10);
//    draw.text(card_on_table_text, 10, 20);
};
	
State.waiting.update = function(){
};
	
State.waiting.destroy = function(){
};


//
// STATE DEAL IN HAND
//
State.deal_in_hand = new State();

State.deal_in_hand.init = function(){
};

State.deal_in_hand.paint = function(){
    draw.text(debug_text, 10, 10);
    draw.text(card_on_table_text, 10, 30);
};

State.deal_in_hand.update = function(){
};

State.deal_in_hand.destroy = function(){
};

//
// STATE THREE CARDS
//
State.three_cards = new State();

State.three_cards.init = function(){
};

State.three_cards.paint = function(){
    draw.text(debug_text, 10, 10);
    draw.text(card_on_table_text, 10, 30);
};

State.three_cards.update = function(){
};

State.three_cards.destroy = function(){
};

//
// STATE FOURTH CARD
//
State.fourth_card = new State();

State.fourth_card.init = function(){
};

State.fourth_card.paint = function(){
    draw.text(debug_text, 10, 10);
    draw.text(card_on_table_text, 10, 30);
};

State.fourth_card.update = function(){
};

State.fourth_card.destroy = function(){
};

//
// STATE DEAL IN HAND
//
State.fifth_card = new State();

State.fifth_card.init = function(){
};

State.fifth_card.paint = function(){
    draw.text(debug_text, 10, 10);
    draw.text(card_on_table_text, 10, 30);
};

State.fifth_card.update = function(){
};

State.fifth_card.destroy = function(){
};

//
// STATE SHOWDOWN
//
State.show_down = new State();

State.show_down.init = function(){
};

State.show_down.paint = function(){
};

State.show_down.update = function(){
};

State.show_down.destroy = function(){
};